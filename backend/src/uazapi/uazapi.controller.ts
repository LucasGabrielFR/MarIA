import { Controller, Post, Body, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { UazapiService } from './uazapi.service';
import { PromptService } from '../ai/prompt.service';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('webhook/uazapi')
export class UazapiController {
  private readonly logger = new Logger(UazapiController.name);

  // Per-user sequential lock: garante que mensagens do mesmo chatId
  // são processadas uma de cada vez, evitando race conditions em estado/DB.
  private readonly userLocks = new Map<string, Promise<void>>();

  constructor(
    private readonly aiService: AiService,
    private readonly uazapiService: UazapiService,
    private readonly supabaseService: SupabaseService,
    private readonly promptService: PromptService,
  ) {}

  @Post()
  async handleWebhook(@Body() payload: any) {
    const eventType = payload?.EventType || payload?.event || 'unknown';
    // Para depuração, apenas logs curtos ou baseados no tipo do evento
    this.logger.log(`Received Webhook event: ${eventType}`);

    // Salvar log no Supabase para análise futura
    try {
      await this.supabaseService.getClient().from('webhook_logs').insert({
        event_type: eventType,
        payload: payload,
      });
    } catch (logError) {
      this.logger.error(`Failed to save webhook log: ${logError.message}`);
    }

    // Suporte ao formato UAZAPI (EventType e objeto message direto)
    if (eventType === 'messages' || eventType === 'messages.upsert') {
      const messageData =
        payload.message ||
        (payload.data?.messages ? payload.data.messages[0] : null);

      if (!messageData) {
        return { status: 'no_message_data' };
      }

      // Ignorar mensagens enviadas pelo próprio bot
      const fromMe = messageData.fromMe ?? messageData.key?.fromMe ?? false;
      if (fromMe) return { status: 'ignored_from_me' };

      // Extrair o chatId
      const chatId =
        messageData.chatid ||
        messageData.remoteJid ||
        messageData.key?.remoteJid;

      // Ignorar grupos
      if (chatId && chatId.includes('@g.us'))
        return { status: 'ignored_group' };

      // Texto, clique em botão (buttonOrListid) ou resposta de lista/enquete
      const messageContent = (
        messageData.text ||
        messageData.buttonOrListid ||
        messageData.vote ||
        (typeof messageData.content === 'string' ? messageData.content : '') ||
        messageData.message?.conversation ||
        messageData.message?.extendedTextMessage?.text ||
        messageData.message?.buttonsResponseMessage?.selectedButtonId ||
        messageData.message?.listResponseMessage?.singleSelectReply
          ?.selectedRowId ||
        ''
      )
        .toString()
        .trim();

      // Extrair o chatId
      if (!chatId) return { status: 'missing_chatid' };

      // Detectar se é áudio
      const isAudio = !!(
        messageData.message?.audioMessage ||
        messageData.messageType === 'audioMessage' ||
        messageData.mimetype?.includes('audio')
      );

      if (isAudio) {
        this.logger.log(
          `Mensagem de áudio detectada de ${chatId}. Enviando recusa amigável.`,
        );
        const audioRefusal = this.promptService.getPrompt('audio_refusal');
        await this.uazapiService.sendMessage(chatId, audioRefusal);
        return { status: 'audio_refused' };
      }

      if (!messageContent) {
        return { status: 'missing_content' };
      }

      const pushName =
        messageData.senderName ||
        payload.chat?.wa_name ||
        payload.chat?.wa_contactName ||
        'Usuário';
      const rawPhoneNumber = payload.chat?.phone || chatId.split('@')[0];

      // Normalize Brazilian mobile phone number (ensures 9 prefix if missing)
      let phoneNumber = rawPhoneNumber.replace(/\D/g, '');
      if (phoneNumber.length === 10 || phoneNumber.length === 11) {
        phoneNumber = '55' + phoneNumber;
      }
      if (phoneNumber.startsWith('55') && phoneNumber.length >= 4) {
        const ddi = '55';
        const ddd = phoneNumber.slice(2, 4);
        const number = phoneNumber.slice(4);
        if (number.length === 8) {
          phoneNumber = ddi + ddd + '9' + number;
        }
      }

      // Responde ao webhook imediatamente; processa em background com lock por chatId
      // para garantir que mensagens do mesmo usuário sejam sequenciais.
      void this.enqueueForUser(chatId, () =>
        this.processMessageInBackground(chatId, messageContent, pushName, phoneNumber),
      );

      return { status: 'accepted' };
    }

    return { status: 'success' };
  }

  /**
   * Enfileira o processamento de uma mensagem por chatId.
   * Cada usuário tem sua própria fila: a próxima tarefa só inicia quando a anterior termina.
   * Usuários diferentes não se bloqueiam entre si.
   */
  private enqueueForUser(chatId: string, task: () => Promise<void>): Promise<void> {
    const previous = this.userLocks.get(chatId) ?? Promise.resolve();
    const next = previous.then(() => task()).catch(() => {/* erros tratados dentro de task */});
    this.userLocks.set(chatId, next);

    // Limpa o lock quando a tarefa terminar para não vazar memória em usuários inativos.
    next.finally(() => {
      if (this.userLocks.get(chatId) === next) {
        this.userLocks.delete(chatId);
      }
    });

    return next;
  }

  /**
   * Processa mensagem fora da resposta HTTP — várias requisições rodam em paralelo no Node.js.
   */
  private async processMessageInBackground(
    chatId: string,
    messageContent: string,
    pushName: string,
    phoneNumber: string,
  ): Promise<void> {
    try {
      this.logger.log(`Processing message from ${chatId}: "${messageContent}"`);

      await this.uazapiService.markRead(chatId);
      await this.uazapiService.sendPresence(chatId, 'composing');

      // Intercepta código de ativação
      const activationCodeMatch = messageContent.match(/MARIA-[A-Z0-9]{6,10}/i);
      if (activationCodeMatch) {
        const code = activationCodeMatch[0].toUpperCase();
        this.logger.log(
          `Tentativa de ativação de código recebida: ${code} de ${chatId}`,
        );

        const supabaseClient = this.supabaseService.getClient();

        // Buscar código de ativação
        const { data: actCode, error: actError } = await supabaseClient
          .from('activation_codes')
          .select('*')
          .eq('code', code)
          .maybeSingle();

        if (actError) {
          this.logger.error(
            `Erro ao buscar código de ativação ${code}: ${actError.message}`,
          );
          await this.uazapiService.sendMessage(
            chatId,
            `❌ Ocorreu um erro ao validar seu código de ativação. Por favor, tente novamente mais tarde ou fale com o suporte.`,
          );
          return;
        }

        if (!actCode) {
          await this.uazapiService.sendMessage(
            chatId,
            `❌ Código de ativação *${code}* inválido. Verifique se digitou corretamente ou entre em contato com nosso suporte técnico.`,
          );
          return;
        }

        if (actCode.status === 'used') {
          await this.uazapiService.sendMessage(
            chatId,
            `⚠️ O código de ativação *${code}* já foi utilizado anteriormente para ativar uma assinatura. Caso precise de ajuda, fale com o suporte.`,
          );
          return;
        }

        if (actCode.status === 'expired') {
          await this.uazapiService.sendMessage(
            chatId,
            `❌ O código de ativação *${code}* expirou (códigos são válidos por 1 hora após o pagamento). Por favor, fale com o suporte técnico para gerar um novo código.`,
          );
          return;
        }

        if (
          actCode.status === 'pending' &&
          actCode.expires_at &&
          new Date(actCode.expires_at) < new Date()
        ) {
          await supabaseClient
            .from('activation_codes')
            .update({ status: 'expired' })
            .eq('id', actCode.id);

          await this.uazapiService.sendMessage(
            chatId,
            `❌ O código de ativação *${code}* expirou (códigos são válidos por 1 hora após o pagamento). Por favor, fale com o suporte técnico para gerar um novo código.`,
          );
          return;
        }

        // Se o código é válido (status === 'pending')
        const planTier = actCode.plan_tier;
        const billingCycle = actCode.billing_cycle || 'monthly';
        const asaasSubscriptionId = actCode.asaas_subscription_id;
        const asaasCustomerId = actCode.asaas_customer_id;

        // Calcular a data de expiração
        const expiresAt = new Date();
        if (billingCycle === 'annual') {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        }
        expiresAt.setDate(expiresAt.getDate() + 1); // +1 dia de margem igual ao fluxo principal

        // Atualizar status do código de ativação para 'used'
        const { error: updateCodeError } = await supabaseClient
          .from('activation_codes')
          .update({
            status: 'used',
            used_at: new Date().toISOString(),
            wa_chatid: chatId,
          })
          .eq('code', code);

        if (updateCodeError) {
          this.logger.error(
            `Erro ao atualizar código de ativação ${code} para 'used': ${updateCodeError.message}`,
          );
          await this.uazapiService.sendMessage(
            chatId,
            `❌ Erro interno ao resgatar seu código. Fale com nosso suporte.`,
          );
          return;
        }

        // Buscar se o usuário já existe
        const { data: existingUser, error: findUserError } =
          (await supabaseClient
            .rpc('find_user_by_normalized_phone', { phone_query: phoneNumber })
            .maybeSingle()) as any;

        let userId = existingUser?.id;

        if (existingUser) {
          // Atualizar usuário existente
          const { error: updateUserError } = await supabaseClient
            .from('users')
            .update({
              asaas_subscription_id: asaasSubscriptionId,
              subscription_tier: planTier,
              plan_tier: planTier,
              asaas_customer_id: asaasCustomerId,
              subscription_expires_at: expiresAt.toISOString(),
              origin: 'web', // Marca a origem do faturamento como web
              wa_chatid: chatId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingUser.id);

          if (updateUserError) {
            this.logger.error(
              `Erro ao atualizar plano do usuário ${existingUser.id}: ${updateUserError.message}`,
            );
          }
        } else {
          // Criar novo usuário
          const { data: newUser, error: createUserError } =
            (await supabaseClient
              .from('users')
              .insert({
                phone: phoneNumber,
                wa_chatid: chatId,
                name: pushName || `Cliente MarIA`,
                subscription_tier: planTier,
                plan_tier: planTier,
                asaas_subscription_id: asaasSubscriptionId,
                asaas_customer_id: asaasCustomerId,
                subscription_expires_at: expiresAt.toISOString(),
                origin: 'web', // Marca a origem como web
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single()) as any;

          if (createUserError) {
            this.logger.error(
              `Erro ao criar novo usuário para ${phoneNumber}: ${createUserError.message}`,
            );
            await this.uazapiService.sendMessage(
              chatId,
              `❌ Ocorreu um problema ao criar seu cadastro. Por favor, fale com o suporte.`,
            );
            return;
          }

          userId = newUser.id;
        }

        // Criar registro da assinatura
        const amount =
          planTier === 'premium'
            ? billingCycle === 'annual'
              ? 322.8
              : 29.9
            : billingCycle === 'annual'
              ? 154.8
              : 14.9;

        const { error: insertSubError } = await supabaseClient
          .from('subscriptions')
          .insert({
            user_id: userId,
            tier: planTier,
            amount: amount,
            status: 'paid',
            provider: 'asaas',
            expires_at: expiresAt.toISOString(),
            origin: 'web', // Origem da assinatura
            created_at: new Date().toISOString(),
          });

        if (insertSubError) {
          this.logger.error(
            `Erro ao inserir assinatura para usuário ${userId}: ${insertSubError.message}`,
          );
        }

        // Enviar mensagem de boas-vindas / ativação concluída
        const welcomeText =
          planTier === 'premium'
            ? `🌟 *Sua assinatura Premium foi confirmada com sucesso!* \n\nSeja muito bem-vindo(a) à *MarIA Premium*, ${pushName}! Sua conta agora está ativa e com acesso ilimitado. Comece a interagir comigo agora mesmo! 🚀`
            : `🎉 *Sua assinatura Básica foi confirmada com sucesso!* \n\nSeja muito bem-vindo(a) à *MarIA*, ${pushName}! Sua conta agora está ativa e pronta para uso. Comece a interagir comigo agora mesmo! 🚀`;

        await this.uazapiService.sendMessage(chatId, welcomeText);
        this.logger.log(
          `Usuário ${userId} ativado com sucesso usando código ${code}`,
        );
        return;
      }

      const responseText = await this.aiService.processMessage(
        chatId,
        messageContent,
        pushName,
        phoneNumber,
      );

      if (!responseText) return;

      if (
        typeof responseText === 'object' &&
        !Array.isArray(responseText) &&
        responseText.type === 'interactive'
      ) {
        const interactive = responseText;
        const buttons = Array.isArray(interactive.buttons)
          ? interactive.buttons
          : [];
        await this.sleepForTyping(interactive.text);
        await this.uazapiService.sendInteractiveMessage(
          chatId,
          interactive.text,
          buttons,
        );
      } else if (Array.isArray(responseText)) {
        for (const text of responseText) {
          await this.sleepForTyping(text);
          await this.uazapiService.sendMessage(chatId, text);
        }
      } else {
        await this.sleepForTyping(responseText as string);
        await this.uazapiService.sendMessage(chatId, responseText as string);
      }

      this.logger.log(`Response sent to ${chatId}`);
    } catch (error) {
      this.logger.error(
        `Error processing message for ${chatId}: ${error.message}`,
      );
    }
  }

  /**
   * Simula o tempo de digitação humano com base no tamanho do texto.
   * Delay entre 2 e 10 segundos, com fator randômico.
   */
  private async sleepForTyping(text: string): Promise<void> {
    const charsPerSecond = 25; // Velocidade de digitação média-rápida
    const baseDelay = (text.length / charsPerSecond) * 1000;

    // Adicionar jitter randômico (+/- 15%)
    const jitter = 0.85 + Math.random() * 0.3;
    const finalDelay = Math.min(Math.max(baseDelay * jitter, 2000), 10000);

    this.logger.debug(
      `Simulating typing for ${finalDelay.toFixed(0)}ms (${text.length} chars)`,
    );
    await new Promise((resolve) => setTimeout(resolve, finalDelay));
  }
}

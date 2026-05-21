import { Controller, Post, Body, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { UazapiService } from './uazapi.service';
import { PromptService } from '../ai/prompt.service';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('webhook/uazapi')
export class UazapiController {
  private readonly logger = new Logger(UazapiController.name);

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
      await this.supabaseService.getClient()
        .from('webhook_logs')
        .insert({
          event_type: eventType,
          payload: payload,
        });
    } catch (logError) {
      this.logger.error(`Failed to save webhook log: ${logError.message}`);
    }

    // Suporte ao formato UAZAPI (EventType e objeto message direto)
    if (eventType === 'messages' || eventType === 'messages.upsert') {
      const messageData = payload.message || (payload.data?.messages ? payload.data.messages[0] : null);
      
      if (!messageData) {
        return { status: 'no_message_data' };
      }

      // Ignorar mensagens enviadas pelo próprio bot
      const fromMe = messageData.fromMe;
      if (fromMe) return { status: 'ignored_from_me' };

      // Extrair o chatId
      const chatId = messageData.chatid || messageData.remoteJid || messageData.key?.remoteJid;
      
      // Ignorar grupos
      if (chatId && chatId.includes('@g.us')) return { status: 'ignored_group' };

      // O texto no formato UAZAPI vem em 'text' ou 'content'
      const messageContent = messageData.text 
        || messageData.content 
        || messageData.message?.conversation 
        || messageData.message?.extendedTextMessage?.text 
        || '';

      // Extrair o chatId
      if (!chatId) return { status: 'missing_chatid' };

      // Detectar se é áudio
      const isAudio = !!(messageData.message?.audioMessage || messageData.messageType === 'audioMessage' || messageData.mimetype?.includes('audio'));
      
      if (isAudio) {
        this.logger.log(`Mensagem de áudio detectada de ${chatId}. Enviando recusa amigável.`);
        const audioRefusal = this.promptService.getPrompt('audio_refusal');
        await this.uazapiService.sendMessage(chatId, audioRefusal);
        return { status: 'audio_refused' };
      }

      if (!messageContent) {
        return { status: 'missing_content' }; 
      }

      this.logger.log(`Processing message from ${chatId}: "${messageContent}"`);

      // Marcar como lido e enviar estado de "digitando"
      await this.uazapiService.markRead(chatId);
      await this.uazapiService.sendPresence(chatId, 'composing');

      // Extrair nome e telefone para persistência se for novo usuário
      const pushName = messageData.senderName || payload.chat?.wa_name || payload.chat?.wa_contactName || 'Usuário';
      const phoneNumber = payload.chat?.phone || chatId.split('@')[0];

      try {
        const responseText = await this.aiService.processMessage(chatId, messageContent, pushName, phoneNumber);
        
        if (responseText) {
          if (typeof responseText === 'object' && !Array.isArray(responseText) && (responseText as any).type === 'interactive') {
            const interactive = responseText as any;
            await this.sleepForTyping(interactive.text);
            await this.uazapiService.sendInteractiveMessage(chatId, interactive.text, interactive.buttons);
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
        }
      } catch (error) {
        this.logger.error(`Error processing message for ${chatId}: ${error.message}`);
      }
    }

    return { status: 'success' };
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
    
    this.logger.debug(`Simulating typing for ${finalDelay.toFixed(0)}ms (${text.length} chars)`);
    await new Promise(resolve => setTimeout(resolve, finalDelay));
  }
}

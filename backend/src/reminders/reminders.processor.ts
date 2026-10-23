import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UazapiService } from '../uazapi/uazapi.service';
import { SystemLogsService } from '../system-logs/system-logs.service';
import { formatInTimeZone } from 'date-fns-tz';

@Processor('reminders-queue')
export class RemindersProcessor extends WorkerHost {
  private readonly logger = new Logger(RemindersProcessor.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly uazapiService: UazapiService,
    private readonly systemLogsService: SystemLogsService,
    @InjectQueue('reminders-queue') private readonly remindersQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { reminderId } = job.data;
    this.logger.log(
      `Processando job do lembrete ${reminderId} (Job ID: ${job.id})`,
    );

    const supabase = this.supabaseService.getClient();

    // Fetch the reminder and user
    const { data: reminder, error } = await supabase
      .from('reminders')
      .select(
        '*, users (wa_chatid, name), prayers (title, content, dynamic_ref)',
      )
      .eq('id', reminderId)
      .single();

    if (error || !reminder) {
      const errMsg = `Lembrete ${reminderId} não encontrado no Supabase: ${error?.message}`;
      this.logger.error(errMsg);
      await this.systemLogsService.logError(
        'RemindersProcessor',
        errMsg,
        error,
        {
          reminderId,
          jobId: job.id,
        },
      );
      return;
    }

    // Guard 1: Se o lembrete foi cancelado
    if (reminder.status === 'cancelled') {
      this.logger.log(`Lembrete ${reminderId} foi cancelado. Ignorando.`);
      return;
    }

    // Guard 2: Trava anti-duplicação (Idempotência)
    if (reminder.last_sent_at) {
      const lastSent = new Date(reminder.last_sent_at);
      const minutesSinceLastSend =
        (Date.now() - lastSent.getTime()) / (60 * 1000);
      if (minutesSinceLastSend < 10) {
        this.logger.warn(
          `[DEDUP] Lembrete "${reminder.title}" (${reminderId}) já foi enviado há ${minutesSinceLastSend.toFixed(1)} min. Ignorando job duplicado (Job ID: ${job.id}).`,
        );
        return;
      }
    }

    const user = reminder.users;
    const waChatId =
      user?.wa_chatid ||
      (user?.phone ? `${user.phone.replace(/\D/g, '')}@s.whatsapp.net` : null);

    if (!waChatId) {
      const errMsg = `Usuário do lembrete ${reminderId} não possui wa_chatid válido.`;
      this.logger.error(errMsg);
      await this.systemLogsService.logError(
        'RemindersProcessor',
        errMsg,
        null,
        {
          reminderId,
          userId: reminder.user_id,
        },
      );
      return;
    }

    // Se o usuário desativou a ponte com WhatsApp no App, não envia no WhatsApp
    if (
      user?.whatsapp_bridge_enabled === false ||
      reminder.send_whatsapp === false
    ) {
      this.logger.log(
        `Lembrete ${reminderId} ignorado no WhatsApp pois a ponte está desativada para o usuário ${reminder.user_id}.`,
      );
      // Reagenda para amanhã silenciosamente
      await this.rescheduleReminder(reminder, reminderId, supabase);
      return;
    }

    // Marca atomicamente last_sent_at AGORA para que qualquer job concorrente pare imediatamente no Guard 2
    await supabase
      .from('reminders')
      .update({
        last_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reminderId);

    const userName = user?.name || 'Fiel';
    const toolType = reminder.tool_type || 'custom';
    const todayStr = formatInTimeZone(
      new Date(),
      'America/Sao_Paulo',
      'yyyy-MM-dd',
    );

    let messageText = `⏰ *Lembrete*: ${reminder.title}`;
    let buttons = [
      { id: `cancel_reminder_${reminderId}`, text: '🔕 Cancelar Lembrete' },
    ];

    if (toolType === 'morning_prayer') {
      messageText =
        `☀️ *Oferecimento da Manhã* — Salve Maria, ${userName}!\n\n` +
        `Ó Jesus, por meio do Coração Imaculado de Maria, eu Vos ofereço as orações, trabalhos, alegrias e sofrimentos deste dia, em união com o Santo Sacrifício da Missa em todo o mundo.\n\n` +
        `Ofereço-os por todas as intenções do Vosso Sagrado Coração: pela salvação das almas, em reparação dos pecados, pela união de todos os cristãos e pelas intenções do Santo Padre para este mês.\n\n` +
        `Consagro a Vós, ó Mãe Maria, todas as minhas ações, pensamentos e trabalhos deste dia. Guardai-me e protegei-me sob o Vosso manto maternal. Amém! 🙏✨`;
    } else if (toolType === 'liturgy') {
      messageText = `📖 *Liturgia Diária da Santa Missa*\n\nSalve Maria, ${userName}! Eis a Palavra proclamada pela Santa Igreja para o dia de hoje:`;
      const { data: cacheData } = await supabase
        .from('daily_cache')
        .select('content')
        .eq('type', 'liturgy')
        .eq('cache_date', todayStr)
        .maybeSingle();

      if (cacheData?.content && cacheData.content.trim()) {
        messageText += `\n\n${cacheData.content.trim()}`;
      } else {
        messageText +=
          `\n\n_\"A Palavra do Senhor é lâmpada para os meus pés e luz para o meu caminho.\" (Sl 118, 105)_\n\n` +
          `Acesse o aplicativo MarIA para conferir as leituras e o Evangelho de hoje completo com reflexão meditativa! 🙏`;
      }
    } else if (toolType === 'saint') {
      messageText = `🕊️ *Santo do Dia & Virtude Prática*\n\nSalve Maria, ${userName}! Eis a memória litúrgica e a virtude inspiradora de hoje:`;
      const { data: saintCache } = await supabase
        .from('daily_cache')
        .select('content')
        .eq('type', 'saint')
        .eq('cache_date', todayStr)
        .maybeSingle();

      if (saintCache?.content && saintCache.content.trim()) {
        messageText += `\n\n${saintCache.content.trim()}`;
      } else {
        messageText += `\n\nQue o exemplo dos santos nos inspire a viver a virtude cristã neste dia com fidelidade, generosidade e amor a Deus. Amém! 🙏`;
      }
    } else if (toolType === 'angelus') {
      messageText =
        `🔔 *Oração do Ângelus*\n\n` +
        `Salve Maria, ${userName}!\n\n` +
        `℣. O Anjo do Senhor anunciou a Maria.\n` +
        `℟. E Ela concebeu do Espírito Santo.\n\n` +
        `_Ave Maria, cheia de graça, o Senhor é convosco, bendita sois Vós entre as mulheres e bendito é o fruto do Vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós, pecadores, agora e na hora da nossa morte. Amém._\n\n` +
        `℣. Eis aqui a serva do Senhor.\n` +
        `℟. Faça-se em mim segundo a Vossa Palavra.\n\n` +
        `_Ave Maria..._\n\n` +
        `℣. E o Verbo se fez Carne.\n` +
        `℟. E habitou entre nós.\n\n` +
        `_Ave Maria..._\n\n` +
        `℣. Rogai por nós, Santa Mãe de Deus.\n` +
        `℟. Para que sejamos dignos das promessas de Cristo.\n\n` +
        `*Oremos:* Infundi, Senhor, a Vossa graça em nossas almas, para que nós, que pela anunciação do Anjo conhecemos a encarnação de Jesus Cristo, Vosso Filho, cheguemos, por Sua paixão e cruz, à glória da ressurreição. Por Cristo, Nosso Senhor. Amém! 🙏`;
    } else if (toolType === 'divine_mercy') {
      messageText =
        `✝️ *Terço da Divina Misericórdia (Hora da Grande Misericórdia)*\n\n` +
        `Salve Maria, ${userName}!\n\n` +
        `_\"Às três horas da tarde, implora à Minha Misericórdia, especialmente pelos pecadores e, ao menos por um breve momento, reflete sobre a Minha Paixão.\"_\n\n` +
        `🩸 *Oração Inicial:*\n` +
        `Ó Sangue e Água que jorrastes do Coração de Jesus como fonte de misericórdia para nós, eu confio em Vós!\n\n` +
        `📿 *Nas contas do Pai-Nosso:*\n` +
        `_Eterno Pai, eu Vos ofereço o Corpo e o Sangue, a Alma e a Divindade de Vosso diletíssimo Filho, Nosso Senhor Jesus Cristo, em expiação dos nossos pecados e dos do mundo inteiro._\n\n` +
        `📿 *Nas contas das Ave-Marias (10x):*\n` +
        `_Pela Sua dolorosa Paixão, tende misericórdia de nós e do mundo inteiro._\n\n` +
        `🕊️ *Ao final (3x):*\n` +
        `_Deus Santo, Deus Forte, Deus Imortal, tende piedade de nós e do mundo inteiro. Amém!_ ❤️`;
    } else if (toolType === 'rosary') {
      const { data: rosaryCache } = await supabase
        .from('daily_cache')
        .select('content')
        .eq('type', 'rosary')
        .eq('cache_date', todayStr)
        .maybeSingle();

      if (rosaryCache?.content && rosaryCache.content.trim()) {
        messageText =
          `📿 *Santo Terço Mariano*\n\n` +
          `Salve Maria, ${userName}! Chegou o momento da contemplação dos mistérios do Santo Terço:\n\n` +
          `${rosaryCache.content.trim()}\n\n` +
          `_\"Não há problema, por mais difícil que seja, que não possa ser resolvido pela oração do Santo Terço.\" (Irmã Lúcia de Fátima)_ 🙏🌹`;
      } else {
        const dayOfWeek = new Date().getDay();
        const mysteryMap: Record<number, string> = {
          0: 'Gloriosos (Ressurreição e Glória)',
          1: 'Gozosos (Encarnação e Infância)',
          2: 'Dolorosos (Paixão e Morte)',
          3: 'Gloriosos (Ressurreição e Glória)',
          4: 'Luminosos (Vida Pública de Jesus)',
          5: 'Dolorosos (Paixão e Morte)',
          6: 'Gozosos (Encarnação e Infância)',
        };
        const mystery = mysteryMap[dayOfWeek] || 'do Dia';
        messageText =
          `📿 *Santo Terço — Mistérios ${mystery}*\n\n` +
          `Salve Maria, ${userName}! Chegou o momento do Santo Terço. Hoje meditamos os *Mistérios ${mystery}*.\n\n` +
          `_\"Não há problema, por mais difícil que seja, que não possa ser resolvido pela oração do Santo Terço.\" (Irmã Lúcia de Fátima)_\n\n` +
          `Una o seu coração ao da Santíssima Virgem e ofereça este terço pelas suas intenções particulares e pela Santa Igreja. 🙏🌹`;
      }
    } else if (toolType === 'night_prayer') {
      messageText =
        `🌙 *Oração da Noite & Repouso* — Salve Maria, ${userName}!\n\n` +
        `Senhor meu Deus, ao findar este dia, eu Vos agradeço por todas as graças recebidas, pelo pão de cada dia, pelos livramentos e por Vosso amor constante.\n\n` +
        `Perdoai as minhas faltas, dai-me um repouso tranquilo e guardai os meus entes queridos sob a Vossa santa paz.\n\n` +
        `Santa Mãe de Deus, protegei o nosso sono e conduzi o nosso amanhecer.\n\n` +
        `_\"Em paz me deito e logo adormeço, porque só Vós, Senhor, me fazeis repousar seguro.\" (Sl 4, 9)_ Amém! 🙏✨`;
    } else if (toolType === 'conscience_exam') {
      messageText =
        `🌙 *Exame de Consciência Noturno*\n\n` +
        `Boa noite, ${userName}! Antes do descanso, façamos nossa pausa de recolhimento diante de Deus para rever o dia vivido, agradecer e pedir a graça do perdão.\n\n` +
        `Escolha como deseja fazer seu exame esta noite:`;
      buttons = [
        { id: 'start_guided_exam', text: '✨ Exame Guiado' },
        { id: 'start_full_exam', text: '📖 Exame Completo' },
        { id: `cancel_reminder_${reminderId}`, text: '🔕 Cancelar Lembrete' },
      ];
    } else if (reminder.custom_text && reminder.custom_text.trim()) {
      messageText = `⏰ *Lembrete*: ${reminder.title}\n\n${reminder.custom_text.trim()}`;
    } else if (reminder.is_prayer && reminder.prayers) {
      messageText += `\n\n${reminder.prayers.content}`;
    }

    // Envio seguro em UMA ÚNICA MENSAGEM:
    // Se o texto for longo (> 1000 caracteres, ex: Terço, Liturgia, Santo) ou sem botões,
    // envia diretamente via sendMessage para não truncar nem quebrar limites de botões do WhatsApp.
    let success = false;
    try {
      if (messageText.length > 1000 || !buttons?.length) {
        success = await this.uazapiService.sendMessage(waChatId, messageText);
      } else {
        // Envio interativo unificado para orações concisas com botão
        success = await this.uazapiService.sendInteractiveMessage(
          waChatId,
          messageText,
          buttons,
          { type: 'button' },
        );
      }
    } catch (uazapiError: any) {
      const sendErr = `Exceção ao disparar lembrete ${reminderId} via Uazapi: ${uazapiError?.message}`;
      this.logger.error(sendErr);
      await this.systemLogsService.logError(
        'RemindersProcessor',
        sendErr,
        uazapiError,
        { reminderId, waChatId, title: reminder.title },
      );
      throw uazapiError;
    }

    if (success) {
      await this.rescheduleReminder(reminder, reminderId, supabase, waChatId);
    } else {
      const failMsg = `Falha na entrega do lembrete "${reminder.title}" (${reminderId}) via Uazapi (retorno não-sucesso).`;
      this.logger.error(failMsg);
      await this.systemLogsService.logError(
        'RemindersProcessor',
        failMsg,
        null,
        {
          reminderId,
          waChatId,
          title: reminder.title,
        },
      );
      throw new Error(`Failed to send reminder via Uazapi`);
    }
  }

  private async rescheduleReminder(
    reminder: any,
    reminderId: string,
    supabase: any,
    waChatId?: string,
  ) {
    const now = new Date();
    const [hStr, mStr] = (reminder.reminder_time || '07:00').split(':');
    const hour = parseInt(hStr || '7', 10);
    const minute = parseInt(mStr || '0', 10);

    // Próximo disparo diário no fuso de Brasília
    const todayDateSp = formatInTimeZone(
      now,
      'America/Sao_Paulo',
      'yyyy-MM-dd',
    );
    let nextScheduled = new Date(
      `${todayDateSp}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00-03:00`,
    );

    // Garantir que a próxima execução esteja sempre no futuro (amanhã no horário programado)
    while (nextScheduled.getTime() <= now.getTime()) {
      nextScheduled = new Date(nextScheduled.getTime() + 24 * 60 * 60 * 1000);
    }

    const nextDelay = Math.max(0, nextScheduled.getTime() - now.getTime());

    // Mantém o status como 'pending' para o próximo ciclo diário e atualiza last_sent_at
    await supabase
      .from('reminders')
      .update({
        status: 'pending',
        scheduled_time: nextScheduled.toISOString(),
        last_sent_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', reminderId);

    // Reagenda na fila BullMQ com delay e jobId único
    await this.remindersQueue.add(
      'send-reminder',
      { reminderId: reminder.id, userId: reminder.user_id },
      {
        delay: nextDelay,
        jobId: `${reminder.id}_${nextScheduled.getTime()}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 15000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    );

    const successLog = `Lembrete "${reminder.title}" (${reminderId}) processado com sucesso! Próximo agendado para ${nextScheduled.toISOString()} (em ${Math.round(nextDelay / 60000)} min).`;
    this.logger.log(successLog);

    if (waChatId) {
      await this.systemLogsService.logInfo('RemindersProcessor', successLog, {
        reminderId,
        userId: reminder.user_id,
        waChatId,
        nextScheduled: nextScheduled.toISOString(),
      });
    }
  }
}

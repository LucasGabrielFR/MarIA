import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UazapiService } from '../uazapi/uazapi.service';
import { formatInTimeZone } from 'date-fns-tz';

@Processor('reminders-queue')
export class RemindersProcessor extends WorkerHost {
  private readonly logger = new Logger(RemindersProcessor.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly uazapiService: UazapiService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { reminderId } = job.data;
    this.logger.log(`Processando job do lembrete ${reminderId}`);

    const supabase = this.supabaseService.getClient();

    // Fetch the reminder and user
    const { data: reminder, error } = await supabase
      .from('reminders')
      .select('*, users (wa_chatid), prayers (title, content, dynamic_ref)')
      .eq('id', reminderId)
      .single();

    if (error || !reminder) {
      this.logger.error(`Lembrete não encontrado: ${error?.message}`);
      return;
    }

    if (reminder.status === 'cancelled') {
      this.logger.log(`Lembrete ${reminderId} foi cancelado. Ignorando.`);
      return;
    }

    const waChatId = reminder.users?.wa_chatid;
    if (!waChatId) {
      this.logger.error(`User wa_chatid not found for reminder ${reminderId}`);
      return;
    }

    let messageText = `⏰ *Lembrete*: ${reminder.title}`;

    if (reminder.is_prayer && reminder.prayers) {
      if (reminder.prayers.dynamic_ref === 'santo_do_dia' || reminder.prayers.dynamic_ref === 'terco_diario') {
        const typeMap: Record<string, string> = {
          'santo_do_dia': 'saint',
          'terco_diario': 'rosary',
        };
        const cacheType = typeMap[reminder.prayers.dynamic_ref];
        
        // Pega data atual de Brasília para o cache
        const todayStr = formatInTimeZone(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd');
        
        const { data: cacheData } = await supabase
          .from('daily_cache')
          .select('content')
          .eq('type', cacheType)
          .eq('cache_date', todayStr)
          .maybeSingle();

        if (cacheData && cacheData.content) {
          messageText += `\n\n${cacheData.content}`;
        } else {
          messageText += `\n\nNão consegui obter o conteúdo diário para esta oração no momento.`;
        }
      } else {
        messageText += `\n\n${reminder.prayers.content}`;
      }
    }

    // Send the message via WhatsApp
    const success = await this.uazapiService.sendMessage(waChatId, messageText);

    if (success) {
      // Mark as sent
      await supabase
        .from('reminders')
        .update({ status: 'sent' })
        .eq('id', reminderId);
      this.logger.log(`Lembrete ${reminderId} enviado com sucesso!`);
    } else {
      this.logger.error(`Falha ao enviar lembrete ${reminderId} via Uazapi`);
      throw new Error(`Failed to send reminder via Uazapi`);
    }
  }
}

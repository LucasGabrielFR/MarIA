import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';
import { UazapiService } from '../uazapi/uazapi.service';
import { SystemLogsService } from '../system-logs/system-logs.service';
import { formatInTimeZone } from 'date-fns-tz';

@Injectable()
export class NovenasSchedulerService {
  private readonly logger = new Logger(NovenasSchedulerService.name);
  private isProcessing = false;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly uazapiService: UazapiService,
    private readonly systemLogsService: SystemLogsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkNovenaReminders() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date();
      const currentTime = formatInTimeZone(now, 'America/Sao_Paulo', 'HH:mm');
      const todayDateStr = formatInTimeZone(now, 'America/Sao_Paulo', 'yyyy-MM-dd');
      const supabase = this.supabaseService.getClient();

      // Busca novenas ativas com lembrete no WhatsApp configurado para este minuto
      const { data: novenasToRemind, error } = await supabase
        .from('user_novenas')
        .select(`
          id,
          user_id,
          novena_id,
          current_day,
          status,
          personal_intention,
          reminder_time,
          notify_whatsapp,
          last_whatsapp_sent_at,
          users (
            id,
            name,
            phone,
            wa_chatid,
            whatsapp_bridge_enabled
          ),
          novenas (
            id,
            title,
            subtitle
          )
        `)
        .eq('status', 'in_progress')
        .eq('notify_whatsapp', true)
        .eq('reminder_time', currentTime);

      if (error) {
        this.logger.error(`[NovenasScheduler] Erro ao buscar novenas ativas: ${error.message}`);
        return;
      }

      if (!novenasToRemind || novenasToRemind.length === 0) return;

      for (const item of novenasToRemind) {
        const user: any = item.users;
        if (!user) continue;

        // Se o usuário desativou a ponte com o WhatsApp no app, ignora
        if (user.whatsapp_bridge_enabled === false) continue;

        // Se já enviou hoje no fuso de Brasília, ignora para evitar duplicidade
        if (item.last_whatsapp_sent_at) {
          const lastSentDateStr = formatInTimeZone(
            new Date(item.last_whatsapp_sent_at),
            'America/Sao_Paulo',
            'yyyy-MM-dd',
          );
          if (lastSentDateStr === todayDateStr) {
            continue;
          }
        }

        const waChatId =
          user.wa_chatid ||
          (user.phone ? `${user.phone.replace(/\D/g, '')}@s.whatsapp.net` : null);

        if (!waChatId) continue;

        const userName = user.name || 'Fiel';
        const novenaTitle = (item.novenas as any)?.title || 'Novena';
        const currentDay = item.current_day || 1;

        // Opção B aprovada: Mensagem curta carinhosa de lembrete com botões de escolha
        let messageText = `📿 *Novena a ${novenaTitle}*\n`;
        messageText += `*Dia ${currentDay} de 9* • Hora da Oração\n\n`;
        messageText += `Salve Maria, ${userName}! Chegou o momento sagrado da sua novena de hoje.\n\n`;

        if (item.personal_intention && item.personal_intention.trim()) {
          messageText += `🎯 *Sua Intenção Consagrada:*\n_"${item.personal_intention.trim()}"_\n\n`;
        }

        messageText += `Como você deseja rezar neste momento?`;

        const buttons = [
          { id: `novena_read_${item.id}_${currentDay}`, text: '📖 Rezar no WhatsApp' },
          { id: `novena_app_${item.id}`, text: '📱 Abrir no Aplicativo' },
          { id: `novena_cancel_${item.id}`, text: '🔕 Cancelar Lembrete' },
        ];

        try {
          const sent = await this.uazapiService.sendInteractiveMessage(
            waChatId,
            messageText,
            buttons,
            { type: 'button' },
          );

          if (sent) {
            await supabase
              .from('user_novenas')
              .update({
                last_whatsapp_sent_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.id);

            const logMsg = `Lembrete da novena "${novenaTitle}" (Dia ${currentDay}/9) enviado para ${userName} (${waChatId}).`;
            this.logger.log(`[NovenasScheduler] ${logMsg}`);

            await this.systemLogsService.logInfo('NovenasScheduler', logMsg, {
              userNovenaId: item.id,
              waChatId,
              currentDay,
            });
          }
        } catch (sendErr: any) {
          this.logger.error(
            `[NovenasScheduler] Erro ao disparar lembrete da novena para ${waChatId}: ${sendErr.message}`,
          );
        }
      }
    } catch (err: any) {
      this.logger.error(`[NovenasScheduler] Exceção no cron de novenas: ${err.message}`, err.stack);
    } finally {
      this.isProcessing = false;
    }
  }
}

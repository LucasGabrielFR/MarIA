import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class RemindersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly systemLogsService: SystemLogsService,
    @InjectQueue('reminders-queue') private readonly remindersQueue: Queue,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Inicializando reconciliação de lembretes pendentes...');
    await this.reconcilePendingReminders();
  }

  /**
   * Watchdog a cada 5 minutos: garante que nenhum lembrete pendente
   * se perca por reinicialização de contêiner ou falha temporária do Redis.
   */
  @Cron('*/5 * * * *', { timeZone: 'America/Sao_Paulo' })
  async handleWatchdogCron() {
    await this.reconcilePendingReminders();
  }

  async reconcilePendingReminders(): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();
      const now = new Date();

      const { data: reminders, error } = await supabase
        .from('reminders')
        .select('id, user_id, title, scheduled_time, status, scheduled_period')
        .eq('status', 'pending');

      if (error) {
        await this.systemLogsService.logError(
          'RemindersService',
          `Erro ao buscar lembretes pendentes para reconciliação: ${error.message}`,
          error,
        );
        return;
      }

      if (!reminders || reminders.length === 0) {
        return;
      }

      this.logger.log(
        `Reconciliando ${reminders.length} lembrete(s) com status 'pending'...`,
      );

      for (const reminder of reminders) {
        const scheduledTime = new Date(reminder.scheduled_time);
        const timeDiffMs = scheduledTime.getTime() - now.getTime();

        if (timeDiffMs > 0) {
          // No futuro: verificar se o job existe no BullMQ
          const jobId = `${reminder.id}_${scheduledTime.getTime()}`;
          const existingJob = await this.remindersQueue.getJob(jobId);

          if (!existingJob) {
            await this.remindersQueue.add(
              'send-reminder',
              { reminderId: reminder.id, userId: reminder.user_id },
              {
                delay: timeDiffMs,
                jobId,
                attempts: 3,
                backoff: { type: 'exponential', delay: 15000 },
                removeOnComplete: 100,
                removeOnFail: 200,
              },
            );

            this.logger.log(
              `Job re-enfileirado no BullMQ para lembrete "${reminder.title}" (${reminder.id}) com delay de ${Math.round(timeDiffMs / 60000)} min.`,
            );

            await this.systemLogsService.logInfo(
              'RemindersService',
              `Re-enfileirado lembrete futuro "${reminder.title}" pós-reinicialização.`,
              { reminderId: reminder.id, scheduled_time: reminder.scheduled_time },
            );
          }
        } else {
          // No passado (vencido ou não disparado enquanto o servidor estava fora)
          const lateMinutes = Math.abs(timeDiffMs) / (60 * 1000);

          if (lateMinutes <= 60) {
            // Atraso de até 1 hora: disparar imediatamente
            const immediateJobId = `${reminder.id}_immediate_${now.getTime()}`;
            await this.remindersQueue.add(
              'send-reminder',
              { reminderId: reminder.id, userId: reminder.user_id },
              {
                delay: 0,
                jobId: immediateJobId,
                attempts: 3,
                backoff: { type: 'exponential', delay: 15000 },
                removeOnComplete: 100,
                removeOnFail: 200,
              },
            );

            await this.systemLogsService.logWarn(
              'RemindersService',
              `Lembrete "${reminder.title}" estava atrasado em ${Math.round(lateMinutes)} min. Disparando imediatamente via fila.`,
              { reminderId: reminder.id, scheduled_time: reminder.scheduled_time },
            );
          } else {
            // Atraso de mais de 1 hora (ex: servidor desligado durante o dia/noite)
            // Avança para o próximo ciclo diário no mesmo horário
            let nextScheduled = new Date(scheduledTime.getTime() + 24 * 60 * 60 * 1000);
            while (nextScheduled.getTime() <= now.getTime()) {
              nextScheduled.setDate(nextScheduled.getDate() + 1);
            }

            const nextDelay = Math.max(0, nextScheduled.getTime() - now.getTime());

            await supabase
              .from('reminders')
              .update({
                scheduled_time: nextScheduled.toISOString(),
                updated_at: now.toISOString(),
              })
              .eq('id', reminder.id);

            const nextJobId = `${reminder.id}_${nextScheduled.getTime()}`;
            await this.remindersQueue.add(
              'send-reminder',
              { reminderId: reminder.id, userId: reminder.user_id },
              {
                delay: nextDelay,
                jobId: nextJobId,
                attempts: 3,
                backoff: { type: 'exponential', delay: 15000 },
                removeOnComplete: 100,
                removeOnFail: 200,
              },
            );

            await this.systemLogsService.logWarn(
              'RemindersService',
              `Lembrete "${reminder.title}" estava com horário no passado (${reminder.scheduled_time}). Reajustado para o próximo ciclo: ${nextScheduled.toISOString()}.`,
              {
                reminderId: reminder.id,
                oldScheduled: reminder.scheduled_time,
                newScheduled: nextScheduled.toISOString(),
              },
            );
          }
        }
      }
    } catch (err: any) {
      await this.systemLogsService.logError(
        'RemindersService',
        `Exceção não tratada na reconciliação de lembretes: ${err?.message || err}`,
        err,
      );
    }
  }
}

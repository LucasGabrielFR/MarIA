import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron } from '@nestjs/schedule';
import { formatInTimeZone } from 'date-fns-tz';
import { SupabaseService } from '../supabase/supabase.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

export interface MobileReminderInput {
  id: string; // external_id (ex: 'rem_morning_prayer', 'rem_liturgy', 'custom_1234')
  title: string;
  subtitle?: string;
  time: string; // "HH:mm"
  isEnabled: boolean;
  sendOnWhatsApp: boolean;
  ringOnDevice?: boolean;
  soundType?: string;
  toolType?: string;
  customText?: string;
  isCustom?: boolean;
}

export interface SyncMobileRemindersDto {
  userId?: string;
  phone?: string;
  reminders: MobileReminderInput[];
}

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
        .select('id, user_id, title, scheduled_time, status, scheduled_period, last_sent_at, reminder_time')
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

          // 1. Se já foi enviado nas últimas 12 horas (ex: hoje mesmo), já foi cumprido! Avança para o próximo dia.
          const wasSentRecently =
            reminder.last_sent_at &&
            now.getTime() - new Date(reminder.last_sent_at).getTime() < 12 * 60 * 60 * 1000;

          if (wasSentRecently) {
            this.logger.log(
              `Lembrete "${reminder.title}" já foi disparado hoje. Atualizando próximo ciclo diário.`,
            );
            await this.advanceToNextCycle(reminder, scheduledTime, supabase, now);
            continue;
          }

          // 2. Se o atraso for menor que 2 minutos, o job pontual do BullMQ está em execução neste instante. NÃO duplicar!
          if (lateMinutes < 2) {
            continue;
          }

          // 3. Se o atraso for entre 2 e 60 minutos (recuperação de servidor que caiu)
          if (lateMinutes <= 60) {
            const recoveryJobId = `${reminder.id}_recovery_${now.getTime()}`;
            await this.remindersQueue.add(
              'send-reminder',
              { reminderId: reminder.id, userId: reminder.user_id },
              {
                delay: 0,
                jobId: recoveryJobId,
                attempts: 3,
                backoff: { type: 'exponential', delay: 15000 },
                removeOnComplete: 100,
                removeOnFail: 200,
              },
            );

            await this.systemLogsService.logWarn(
              'RemindersService',
              `Lembrete "${reminder.title}" recuperado pós-queda (${Math.round(lateMinutes)} min atrasado). Disparando via fila.`,
              { reminderId: reminder.id, scheduled_time: reminder.scheduled_time },
            );

            // Já atualiza no banco para o próximo dia para evitar re-enfileiramento na próxima checagem do watchdog
            await this.advanceToNextCycle(reminder, scheduledTime, supabase, now);
          } else {
            // Atraso de mais de 1 hora: avança silenciosamente para o próximo ciclo
            await this.advanceToNextCycle(reminder, scheduledTime, supabase, now);
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

  private async advanceToNextCycle(
    reminder: any,
    baseTime: Date,
    supabase: any,
    now: Date,
  ): Promise<void> {
    const [hStr, mStr] = (reminder.reminder_time || '07:00').split(':');
    const hour = parseInt(hStr || '7', 10);
    const minute = parseInt(mStr || '0', 10);

    const todayDateSp = formatInTimeZone(now, 'America/Sao_Paulo', 'yyyy-MM-dd');
    let nextScheduled = new Date(
      `${todayDateSp}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00-03:00`,
    );

    while (nextScheduled.getTime() <= now.getTime()) {
      nextScheduled = new Date(nextScheduled.getTime() + 24 * 60 * 60 * 1000);
    }

    const nextDelay = Math.max(0, nextScheduled.getTime() - now.getTime());

    await supabase
      .from('reminders')
      .update({
        scheduled_time: nextScheduled.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', reminder.id);

    // Remove quaisquer jobs pendentes antigos deste lembrete antes de agendar o novo
    await this.removeQueuedJobsForReminder(reminder.id);

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

    this.logger.log(
      `Lembrete "${reminder.title}" avançado para o próximo ciclo: ${nextScheduled.toISOString()} (delay: ${Math.round(nextDelay / 60000)} min).`,
    );
  }

  /**
   * Remove com segurança quaisquer jobs nas filas 'delayed' ou 'waiting' associados ao reminderId.
   */
  async removeQueuedJobsForReminder(reminderId: string): Promise<void> {
    try {
      const jobs = await this.remindersQueue.getJobs(['delayed', 'waiting']);
      for (const job of jobs) {
        if (job?.data?.reminderId === reminderId) {
          await job.remove();
          this.logger.log(`[RemindersQueue] Job pendente ${job.id} removido para reminder ${reminderId}`);
        }
      }
    } catch (err: any) {
      this.logger.warn(`Erro ao limpar jobs da fila para reminder ${reminderId}: ${err?.message}`);
    }
  }

  /**
   * Sincroniza a lista de lembretes configurados no aplicativo móvel com a tabela reminders e fila BullMQ.
   */
  async syncMobileReminders(dto: SyncMobileRemindersDto) {
    const supabase = this.supabaseService.getClient();
    const cleanPhone = dto.phone ? dto.phone.replace(/\D/g, '') : undefined;

    let user: any = null;
    if (dto.userId) {
      const { data } = await supabase
        .from('users')
        .select('id, phone, wa_chatid, name')
        .eq('id', dto.userId)
        .maybeSingle();
      user = data;
    }

    if (!user && cleanPhone) {
      const { data } = await supabase
        .from('users')
        .select('id, phone, wa_chatid, name')
        .or(`phone.eq.${cleanPhone},phone.eq.+${cleanPhone},phone.eq.55${cleanPhone},wa_chatid.ilike.%${cleanPhone}%`)
        .limit(1)
        .maybeSingle();
      user = data;
    }

    if (!user) {
      this.logger.warn(
        `[RemindersSync] Usuário não encontrado para sincronizar lembretes (userId: ${dto.userId}, phone: ${dto.phone})`,
      );
      return { success: false, message: 'Usuário não encontrado' };
    }

    const nowUtc = new Date();
    const incomingReminders = dto.reminders || [];
    const activeExternalIds = incomingReminders
      .filter((r) => r.isEnabled && r.sendOnWhatsApp)
      .map((r) => r.id);

    // 1. Desativa qualquer lembrete anterior do usuário que não esteja mais ativo ou não seja mais enviado no WhatsApp
    if (activeExternalIds.length > 0) {
      await supabase
        .from('reminders')
        .update({ status: 'cancelled', updated_at: nowUtc.toISOString() })
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .not('external_id', 'in', `(${activeExternalIds.map((id) => `"${id}"`).join(',')})`);
    } else {
      await supabase
        .from('reminders')
        .update({ status: 'cancelled', updated_at: nowUtc.toISOString() })
        .eq('user_id', user.id)
        .eq('status', 'pending');
    }

    // 2. Processa cada lembrete recebido do app
    for (const rem of incomingReminders) {
      if (!rem.isEnabled || !rem.sendOnWhatsApp) {
        // Se desativado ou desligou WhatsApp, marca como cancelado e limpa fila
        const { data: existingInactive } = await supabase
          .from('reminders')
          .select('id')
          .eq('user_id', user.id)
          .eq('external_id', rem.id)
          .maybeSingle();

        if (existingInactive) {
          await supabase
            .from('reminders')
            .update({
              send_whatsapp: false,
              status: 'cancelled',
              updated_at: nowUtc.toISOString(),
            })
            .eq('id', existingInactive.id);

          await this.removeQueuedJobsForReminder(existingInactive.id);
        }
        continue;
      }

      // Calcula próximo horário no fuso de Brasília
      const [hStr, mStr] = (rem.time || '07:00').split(':');
      const hour = parseInt(hStr || '7', 10);
      const minute = parseInt(mStr || '0', 10);

      const todayDateSp = formatInTimeZone(nowUtc, 'America/Sao_Paulo', 'yyyy-MM-dd');
      let targetSp = new Date(
        `${todayDateSp}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00-03:00`,
      );

      if (targetSp.getTime() <= nowUtc.getTime()) {
        // Se já passou o horário hoje, agenda para amanhã
        targetSp = new Date(targetSp.getTime() + 24 * 60 * 60 * 1000);
      }

      const delay = Math.max(0, targetSp.getTime() - nowUtc.getTime());

      // Verifica se já existe registro desse external_id para o usuário
      const { data: existing } = await supabase
        .from('reminders')
        .select('id')
        .eq('user_id', user.id)
        .eq('external_id', rem.id)
        .maybeSingle();

      let reminderId: string;

      const payload = {
        user_id: user.id,
        external_id: rem.id,
        title: rem.title,
        tool_type: rem.toolType || 'custom',
        custom_text: rem.customText || null,
        reminder_time: rem.time,
        send_whatsapp: true,
        is_prayer: true,
        status: 'pending',
        scheduled_time: targetSp.toISOString(),
        scheduled_period: this.getPeriodFromHour(hour),
        updated_at: nowUtc.toISOString(),
      };

      if (existing) {
        reminderId = existing.id;
        await supabase.from('reminders').update(payload).eq('id', reminderId);
        // Remove jobs anteriores na fila para não acumular nem duplicar
        await this.removeQueuedJobsForReminder(reminderId);
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from('reminders')
          .insert(payload)
          .select('id')
          .single();
        if (insErr || !inserted) {
          this.logger.error(`Erro ao inserir lembrete ${rem.id}: ${insErr?.message}`);
          continue;
        }
        reminderId = inserted.id;
      }

      // Agenda no BullMQ com jobId único
      const jobId = `${reminderId}_${targetSp.getTime()}`;
      try {
        await this.remindersQueue.add(
          'send-reminder',
          { reminderId, userId: user.id },
          {
            delay,
            jobId,
            attempts: 3,
            backoff: { type: 'exponential', delay: 15000 },
            removeOnComplete: 100,
            removeOnFail: 200,
          },
        );
      } catch (queueErr: any) {
        this.logger.error(`Erro ao enfileirar lembrete ${reminderId}: ${queueErr.message}`);
      }
    }

    this.logger.log(
      `[RemindersSync] Sincronizados ${incomingReminders.length} lembretes para usuário ${user.id} (${activeExternalIds.length} ativos no WhatsApp)`,
    );
    return {
      success: true,
      count: incomingReminders.length,
      activeCount: activeExternalIds.length,
    };
  }

  /**
   * Obtém a lista de lembretes ativos salvos para o usuário.
   */
  async getUserReminders(userId?: string, phone?: string) {
    const supabase = this.supabaseService.getClient();
    let effectiveUserId = userId;

    if (!effectiveUserId && phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .or(`phone.eq.${cleanPhone},phone.eq.+${cleanPhone},phone.eq.55${cleanPhone},wa_chatid.ilike.%${cleanPhone}%`)
        .limit(1)
        .maybeSingle();
      effectiveUserId = user?.id;
    }

    if (!effectiveUserId) {
      return [];
    }

    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', effectiveUserId)
      .neq('status', 'cancelled')
      .order('reminder_time', { ascending: true });

    if (error) {
      this.logger.error(`Erro ao buscar lembretes do usuário: ${error.message}`);
      return [];
    }

    return data || [];
  }

  private getPeriodFromHour(hour: number): string {
    if (hour < 12) return 'Manhã';
    if (hour < 14) return 'Meio-dia';
    if (hour < 18) return 'Tarde';
    return 'Noite';
  }
}


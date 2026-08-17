import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class ScheduledMessagesService {
  private readonly logger = new Logger(ScheduledMessagesService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly adminService: AdminService,
  ) {}


  @Cron(CronExpression.EVERY_MINUTE)
  async checkScheduledMessages() {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      
      let currentTime = formatter.format(now);
      if (currentTime.startsWith('24:')) {
        currentTime = '00:' + currentTime.substring(3);
      }

      const supabase = this.supabaseService.getClient();
      const { data: campaigns, error } = await supabase
        .from('scheduled_messages')
        .select('*')
        .eq('time', currentTime)
        .eq('is_active', true);

      if (error) {
        this.logger.error('Erro ao buscar mensagens agendadas', error);
        return;
      }

      if (!campaigns || campaigns.length === 0) return;

      for (const campaign of campaigns) {
        await this.queueBroadcast(campaign);
      }
    } catch (error) {
      this.logger.error('Erro ao checar mensagens agendadas', error);
    }
  }

  private async queueBroadcast(campaign: any) {
    this.logger.log(`Iniciando enfileiramento de broadcast agendado: ${campaign.name}`);
    const supabase = this.supabaseService.getClient();

    const { data: allUsers, error } = await supabase
      .from('users')
      .select('id, wa_chatid, subscription_tier, receive_daily_liturgy')
      .not('wa_chatid', 'is', null);

    if (error) {
      this.logger.error('Erro ao buscar usuários para broadcast agendado', error);
      return;
    }

    if (!allUsers) return;

    const eligibleUsers = allUsers.filter(u => {
      const plan = u.subscription_tier || 'free';
      const audienceMatch = campaign.audience && campaign.audience.includes(plan);

      let isLiturgyOnly = false;
      const hasPrompt = campaign.prompt && campaign.prompt.trim().length > 0;
      
      if (!hasPrompt && campaign.tools && Array.isArray(campaign.tools)) {
        isLiturgyOnly = campaign.tools.some((t: any) => t.type === 'liturgy');
      }

      if (isLiturgyOnly) {
        return audienceMatch && u.receive_daily_liturgy === true;
      }

      return audienceMatch;
    });

    if (eligibleUsers.length === 0) {
      this.logger.log(`Nenhum usuário elegível para a campanha ${campaign.name}.`);
      return;
    }

    const jobName = `[ai_sched|${campaign.id}] ${campaign.name}`;
    
    // Verificamos se já não existe um job para hoje com esse nome para evitar duplicidade
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data: existingJob } = await supabase
      .from('broadcast_jobs')
      .select('id')
      .eq('name', jobName)
      .gte('created_at', startOfDay.toISOString())
      .limit(1)
      .maybeSingle();

    if (existingJob) {
      this.logger.log(`Job ${jobName} já foi criado hoje. Ignorando.`);
      return;
    }

    // Criar o Job
    // Nós guardaremos o prompt_template no message_text para o serviço de broadcast acessar depois
    const { data: job, error: jobError } = await supabase
      .from('broadcast_jobs')
      .insert({
        name: jobName,
        message_text: JSON.stringify(campaign), 
        status: 'pending',
        total_recipients: eligibleUsers.length,
      })
      .select('id')
      .single();

    if (jobError || !job) {
      this.logger.error('Erro ao criar broadcast_job', jobError);
      return;
    }

    const messagesToInsert = eligibleUsers.map((u) => ({
      job_id: job.id,
      user_id: u.id,
      wa_chatid: u.wa_chatid,
      status: 'pending',
    }));

    const chunkSize = 1000;
    for (let i = 0; i < messagesToInsert.length; i += chunkSize) {
      const chunk = messagesToInsert.slice(i, i + chunkSize);
      await supabase.from('broadcast_messages').insert(chunk);
    }

    this.logger.log(`Broadcast ${jobName} criado com ${eligibleUsers.length} destinatários.`);
  }
}

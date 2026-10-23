import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';
import { AdminService } from '../admin/admin.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class ScheduledMessagesService {
  private readonly logger = new Logger(ScheduledMessagesService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly adminService: AdminService,
    private readonly systemLogsService: SystemLogsService,
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
    this.logger.log(
      `Iniciando enfileiramento de broadcast agendado: ${campaign.name}`,
    );
    const supabase = this.supabaseService.getClient();

    const { data: allUsers, error } = await supabase
      .from('users')
      .select(
        'id, wa_chatid, subscription_tier, receive_daily_liturgy, receive_daily_exam, receive_daily_saint, whatsapp_bridge_enabled',
      )
      .not('wa_chatid', 'is', null);

    if (error) {
      this.logger.error(
        'Erro ao buscar usuários para broadcast agendado',
        error,
      );
      return;
    }

    if (!allUsers || allUsers.length === 0) return;

    // Busca usuários que possuem Plano de Vida configurado no app
    const { data: spiritualPlans } = await supabase
      .from('user_spiritual_plans')
      .select('user_id');
    const usersWithSpiritualPlan = new Set(
      (spiritualPlans || []).map((p) => p.user_id),
    );

    // Busca lembretes personalizados ativos do app para não duplicar com campanhas gerais
    const { data: userReminders } = await supabase
      .from('reminders')
      .select('user_id, tool_type')
      .eq('status', 'pending')
      .eq('send_whatsapp', true);

    const activeUserTools = new Set(
      (userReminders || []).map((r) => `${r.user_id}_${r.tool_type}`),
    );

    const eligibleUsers = allUsers.filter((u) => {
      // 1. Se o usuário desativou a ponte WhatsApp no app, não recebe mensagens
      if (u.whatsapp_bridge_enabled === false) {
        return false;
      }

      // 2. Se o usuário possui Plano de Vida Espiritual no app, todas as suas orações e lembretes
      // são geridos unificadamente pelo seu plano personalizado (reminders).
      // Disparos em massa antigos de IA são suprimidos para evitar duplicações e mensagens conflitantes!
      if (usersWithSpiritualPlan.has(u.id)) {
        return false;
      }

      // 2. Filtro de audiência (plano)
      const plan = u.subscription_tier || 'free';
      const audienceMatch =
        campaign.audience && campaign.audience.includes(plan);
      if (!audienceMatch) return false;

      // 3. Detecção do tipo de ferramenta da campanha
      const tools = Array.isArray(campaign.tools) ? campaign.tools : [];
      const campName = (campaign.name || '').toLowerCase();

      const isLiturgy =
        tools.some((t: any) => t.type === 'liturgy') ||
        campName.includes('liturgia');
      const isExam =
        tools.some((t: any) => t.type === 'conscience_exam') ||
        campName.includes('exame');
      const isSaint =
        tools.some((t: any) => t.type === 'saint') ||
        campName.includes('santo');

      // Se for Liturgia: respeita toggle do app e prevalece horário próprio se configurado
      if (isLiturgy) {
        if (u.receive_daily_liturgy === false) return false;
        if (activeUserTools.has(`${u.id}_liturgy`)) return false; // Prevalece o horário do usuário
      }

      // Se for Exame: respeita toggle do app e prevalece horário próprio
      if (isExam) {
        if (u.receive_daily_exam === false) return false;
        if (activeUserTools.has(`${u.id}_conscience_exam`)) return false;
      }

      // Se for Santo do Dia: respeita toggle do app e prevalece horário próprio
      if (isSaint) {
        if (u.receive_daily_saint === false) return false;
        if (activeUserTools.has(`${u.id}_saint`)) return false;
      }

      return true;
    });

    if (eligibleUsers.length === 0) {
      this.logger.log(
        `Nenhum usuário elegível para a campanha ${campaign.name}.`,
      );
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

    this.logger.log(
      `Broadcast ${jobName} criado com ${eligibleUsers.length} destinatários.`,
    );
    await this.systemLogsService.logInfo(
      'ScheduledMessages',
      `Campanha agendada enfileirada: "${campaign.name}" (${eligibleUsers.length} destinatários)`,
      {
        campaignId: campaign.id,
        name: campaign.name,
        recipientsCount: eligibleUsers.length,
      },
    );
  }
}

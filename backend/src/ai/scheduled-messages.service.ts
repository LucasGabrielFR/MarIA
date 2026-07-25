import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class ScheduledMessagesService implements OnModuleInit {
  private readonly logger = new Logger(ScheduledMessagesService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly adminService: AdminService,
  ) {}

  async onModuleInit() {
    await this.ensureSettingsExist();
  }

  private async ensureSettingsExist() {
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'scheduled_ai_messages')
      .single();

    let parsedValue: any = null;
    if (data && data.value) {
      try {
        parsedValue = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      } catch (e) {}
    }

    if (!parsedValue || !Array.isArray(parsedValue)) {
      const defaultSettings = [
        {
          id: 'morning-default',
          name: 'Bom Dia',
          time: '08:00',
          prompt: 'Esta é uma mensagem matinal. Deseje um ótimo dia para o usuário usando o nome dele. Diga que Deus o abençoe e que você (Eu, Nossa Senhora) estará sempre com ele ao longo de hoje.\nFaça um convite amoroso para que ele se lembre de Deus no meio das atividades, propondo um pequeno desafio para hoje: rezar um terço, uma Ave Maria ou fazer um pequeno ato de amor ao próximo, fique livre para decidir o desafio diário.\nPor fim, informe que a liturgia de hoje será enviada logo abaixo para que ele possa meditar.',
          audience: ['basic', 'premium', 'unlimited'],
          tools: [{ id: 'liturgy', option: 'menu' }]
        }
      ];

      await supabase.from('system_settings').upsert({
        key: 'scheduled_ai_messages',
        value: JSON.stringify(defaultSettings),
        description: 'Configurações de horário e prompt para envio agendado de IA',
      }, { onConflict: 'key' });
      this.logger.log('Configurações default de scheduled_ai_messages criadas.');
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkScheduledMessages() {
    try {
      const supabase = this.supabaseService.getClient();
      const { data: settingsRow } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'scheduled_ai_messages')
        .single();

      if (!settingsRow || !settingsRow.value) return;

      const settings = Array.isArray(settingsRow.value) ? settingsRow.value : [];
      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMinute = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHour}:${currentMinute}`;

      for (const campaign of settings) {
        if (campaign.time === currentTime) {
          await this.queueBroadcast(campaign);
        }
      }
    } catch (error) {
      this.logger.error('Erro ao checar mensagens agendadas', error);
    }
  }

  private async queueBroadcast(campaign: any) {
    this.logger.log(`Iniciando enfileiramento de broadcast agendado: ${campaign.name}`);
    const supabase = this.supabaseService.getClient();

    const { data: allUsers } = await supabase
      .from('users')
      .select('id, wa_chatid, user_contexts(plan)')
      .not('wa_chatid', 'is', null);

    if (!allUsers) return;

    const eligibleUsers = allUsers.filter(u => {
      const contexts = Array.isArray(u.user_contexts) ? u.user_contexts : [u.user_contexts];
      const plan = contexts[0]?.plan || 'free';
      return campaign.audience && campaign.audience.includes(plan);
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

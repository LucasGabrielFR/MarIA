import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AiService } from './ai.service';
import { AdminService } from '../admin/admin.service';
import { LiturgyService } from './liturgy.service';
import { SaintService } from './saint.service';
import { MagisteriumService } from './magisterium.service';
import { PromptService } from './prompt.service';
import { SupabaseService } from '../supabase/supabase.service';
import { SystemLogsService } from '../system-logs/system-logs.service';
import { CanonicalHoursService } from '../canonical-hours/canonical-hours.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly adminService: AdminService,
    private readonly liturgyService: LiturgyService,
    private readonly saintService: SaintService,
    private readonly magisteriumService: MagisteriumService,
    private readonly promptService: PromptService,
    private readonly supabaseService: SupabaseService,
    private readonly systemLogsService: SystemLogsService,
    private readonly canonicalHoursService: CanonicalHoursService,
  ) {}

  @Cron('5 0 * * *', { timeZone: 'America/Sao_Paulo' }) // Todo dia 00:05
  async syncExchangeRate() {
    this.logger.log('Sincronizando taxa de câmbio (USD/BRL)...');
    try {
      const result = await this.adminService.syncExchangeRate();
      await this.systemLogsService.logInfo(
        'CronService',
        'Rotina diária: Sincronização de taxa de câmbio (USD/BRL) concluída.',
        { result },
      );
    } catch (err: any) {
      await this.systemLogsService.logError(
        'CronService',
        `Falha na sincronização diária de taxa de câmbio: ${err?.message}`,
        err,
      );
    }
  }

  @Cron('1 0 * * 0', { timeZone: 'America/Sao_Paulo' }) // Todo domingo 00:01
  async handleWeeklyGenerations() {
    this.logger.log('Iniciando gerações semanais...');

    // Sincroniza Liturgia das Horas da semana (sem IA)
    try {
      this.logger.log('Sincronizando Liturgia das Horas da semana...');
      const today = new Date().toLocaleDateString('sv-SE', {
        timeZone: 'America/Sao_Paulo',
      });
      const syncResult = await this.canonicalHoursService.syncWeekRange(today);
      await this.systemLogsService.logInfo(
        'CronService',
        `Sincronização da Liturgia das Horas concluída: ${syncResult.syncedCount} horas processadas.`,
      );
    } catch (error) {
      this.logger.error('Erro ao sincronizar Liturgia das Horas', error);
    }

    // Gera para os próximos 7 dias
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);
      const dateStr = targetDate.toLocaleDateString('sv-SE', {
        timeZone: 'America/Sao_Paulo',
      });

      this.logger.log(`Processando dia: ${dateStr}`);
      try {
        await this.generateAllForDay(dateStr, false);
      } catch (error) {
        this.logger.error(`Erro ao gerar para o dia ${dateStr}`, error);
      }
    }

    this.logger.log('Gerações semanais concluídas.');
  }

  async generateAllForDay(date: string, forceOverride: boolean = false) {
    const tasks: Array<{ name: string; fn: () => Promise<void> }> = [
      { name: 'liturgy', fn: () => this.generateLiturgy(date, forceOverride) },
      { name: 'saint', fn: () => this.generateSaint(date, forceOverride) },
      { name: 'rosary', fn: () => this.generateRosary(date, forceOverride) },
    ];
    for (const task of tasks) {
      try {
        await task.fn();
      } catch (err) {
        this.logger.error(`Falha ao gerar ${task.name} para ${date}: ${err.message}`);
      }
    }
  }

  async generateLiturgy(date: string, forceOverride: boolean) {
    if (!forceOverride && (await this.checkExists('liturgy', date))) return;

    this.logger.log(`Gerando liturgia para ${date}...`);
    const rawLiturgy = await this.liturgyService.getDailyLiturgy(date);
    if (rawLiturgy === 'Não foi possível obter a liturgia no momento.') {
      this.logger.warn(`API de liturgia falhou para ${date}. Abortando geração com IA.`);
      return;
    }

    const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString(
      'pt-BR',
    );
    const promptTemplate = this.promptService.getPrompt('generator_liturgy');
    const prompt =
      promptTemplate.replace(/{{formattedDate}}/g, formattedDate) +
      '\n\n' +
      rawLiturgy;

    const result = await this.aiService.callOpenRouter(
      prompt,
      `Gere o roteiro litúrgico formatado do dia ${date}.`,
      false,
      [],
      'openai/gpt-4o',
    );
    if (result.usage) {
      await this.aiService.logUsage(null, result.usage, 'openai/gpt-4o');
    }
    await this.saveToCache('liturgy', date, result.content);
  }

  async generateSaint(date: string, forceOverride: boolean) {
    if (!forceOverride && (await this.checkExists('saint', date))) return;

    this.logger.log(`Gerando santo do dia para ${date} via Vatican News...`);

    // Busca dados brutos do Vatican News (pode retornar múltiplos santos)
    const saints = await this.saintService.getSaintOfDay(date);
    const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString(
      'pt-BR',
    );

    const promptTemplate = this.promptService.getPrompt('generator_saint');
    const rawData = saints
      .map((s) => `SANTO: ${s.title}\nBIOGRAFIA: ${s.content}`)
      .join('\n\n---\n\n');
    const prompt =
      promptTemplate.replace(/{{formattedDate}}/g, formattedDate) +
      '\n\n' +
      rawData;

    const result = await this.aiService.callOpenRouter(
      prompt,
      `Gere a hagiografia formatada do dia ${date}.`,
      false,
      [],
      'openai/gpt-4o',
    );
    if (result.usage) {
      await this.aiService.logUsage(null, result.usage, 'openai/gpt-4o');
    }
    await this.saveToCache('saint', date, result.content);
  }

  async generateRosary(date: string, forceOverride: boolean) {
    if (!forceOverride && (await this.checkExists('rosary', date))) return;

    this.logger.log(`Gerando mistérios do terço para ${date}...`);

    const targetDate = new Date(date + 'T12:00:00');
    const dayOfWeek = targetDate.getDay();
    let mysteryType = '';

    switch (dayOfWeek) {
      case 1:
      case 6:
        mysteryType = 'Gozosos';
        break;
      case 2:
      case 5:
        mysteryType = 'Dolorosos';
        break;
      case 3:
      case 0:
        mysteryType = 'Gloriosos';
        break;
      case 4:
        mysteryType = 'Luminosos';
        break;
    }

    const formattedDate = targetDate.toLocaleDateString('pt-BR');

    let prompt = this.promptService.getPrompt('generator_rosary');
    prompt = prompt
      .replace(/{{mysteryType}}/g, mysteryType)
      .replace(/{{formattedDate}}/g, formattedDate);

    const result = await this.aiService.callOpenRouter(
      prompt,
      `Gere os Mistérios ${mysteryType} do dia ${date}.`,
      false,
      [],
      'openai/gpt-4o',
    );
    if (result.usage) {
      await this.aiService.logUsage(null, result.usage, 'openai/gpt-4o');
    }
    await this.saveToCache('rosary', date, result.content);
  }

  private async checkExists(type: string, date: string): Promise<boolean> {
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase
      .from('daily_cache')
      .select('id')
      .eq('type', type)
      .eq('cache_date', date)
      .maybeSingle();

    return !!data;
  }

  private async saveToCache(type: string, date: string, content: string) {
    const supabase = this.supabaseService.getClient();
    this.logger.log(
      `Tentando salvar no banco: [${type}] para a data [${date}]...`,
    );

    const { data, error } = await supabase
      .from('daily_cache')
      .upsert(
        {
          type,
          cache_date: date,
          content,
        },
        { onConflict: 'type, cache_date' },
      )
      .select();

    if (error) {
      this.logger.error(
        `ERRO NO SUPABASE AO SALVAR ${type}: ${JSON.stringify(error)}`,
      );
    } else {
      this.logger.log(
        `SUCESSO AO SALVAR ${type}: ${data?.[0]?.id || 'Registro atualizado'}`,
      );
    }
  }

  @Cron('0 0 * * 0', { timeZone: 'America/Sao_Paulo' }) // Todo domingo 00:00
  async handleWeeklyAffiliateInsights() {
    this.logger.log('Iniciando geração de insights para afiliados...');
    await this.processAffiliatesInsights();
  }

  async processAffiliatesInsights() {
    const supabase = this.supabaseService.getClient();
    
    // 1. Obter todos os afiliados
    const { data: affiliates, error: affError } = await supabase
      .from('affiliates')
      .select('id, code, is_active')
      .eq('is_active', true);
      
    if (affError || !affiliates) {
      this.logger.error('Erro ao buscar afiliados para insights', affError);
      return;
    }

    for (const affiliate of affiliates) {
      try {
        // 2. Obter usuários deste afiliado
        const { data: users } = await supabase
          .from('users')
          .select('id')
          .eq('affiliate_code', affiliate.code);
          
        if (!users || users.length === 0) continue;
        const userIds = users.map(u => u.id);

        // 3. Obter mensagens da última semana
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: messages } = await supabase
          .from('messages')
          .select('content')
          .in('user_id', userIds)
          .eq('role', 'user')
          .gte('created_at', sevenDaysAgo.toISOString())
          .limit(200);

        if (messages && messages.length > 0) {
          const contents = messages.map(m => m.content);
          // 4. Resumir interesses
          const summary = await this.aiService.summarizeCommunityInterests(contents);
          
          // 5. Salvar no afiliado
          await supabase
            .from('affiliates')
            .update({ 
              community_insights: summary,
              community_insights_updated_at: new Date().toISOString()
            })
            .eq('id', affiliate.id);
            
          this.logger.log(`Insights atualizados para afiliado ${affiliate.code}`);
        }
      } catch (err) {
        this.logger.error(`Erro ao processar insights para afiliado ${affiliate.code}`, err);
      }
    }
  }

  /**
   * Limpeza de lembretes cancelados (soft delete) há mais de 30 dias.
   * Executa diariamente às 03:00 da madrugada (horário de Brasília).
   */
  @Cron('0 3 * * *', { timeZone: 'America/Sao_Paulo' })
  async cleanupOldCancelledReminders() {
    this.logger.log('Iniciando rotina de limpeza de lembretes cancelados há mais de 30 dias...');
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase
        .from('reminders')
        .delete()
        .eq('status', 'cancelled')
        .lt('updated_at', thirtyDaysAgo.toISOString())
        .select('id');

      if (error) {
        const errMsg = `Erro ao expurgar lembretes cancelados antigos: ${error.message}`;
        this.logger.error(errMsg);
        await this.systemLogsService.logError('CronService', errMsg, error);
      } else {
        const infoMsg = `Limpeza de lembretes cancelados concluída. Registros removidos: ${data?.length || 0}`;
        this.logger.log(infoMsg);
        await this.systemLogsService.logInfo('CronService', infoMsg, {
          removedCount: data?.length || 0,
        });
      }
    } catch (e: any) {
      const errMsg = `Exceção durante limpeza de lembretes cancelados: ${e.message}`;
      this.logger.error(errMsg);
      await this.systemLogsService.logError('CronService', errMsg, e);
    }
  }

  /**
   * Limpeza de fluxos interativos inativos (lembretes, exame de consciência, fluxos dinâmicos).
   * Executa a cada 2 minutos para liberar silenciosamente usuários que abandonaram o fluxo.
   */
  @Cron('*/2 * * * *', { timeZone: 'America/Sao_Paulo' })
  async cleanupInactiveFlows() {
    try {
      const supabase = this.supabaseService.getClient();

      let timeoutMinutes = 15;
      const { data: setting } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'flow_inactivity_timeout_minutes')
        .maybeSingle();

      if (setting?.value) {
        const parsed = parseInt(setting.value, 10);
        if (!isNaN(parsed) && parsed > 0) {
          timeoutMinutes = parsed;
        }
      }

      // Busca usuários em fluxos interativos ativos
      const { data: activeFlowUsers, error: queryError } = await supabase
        .from('users')
        .select('id, reminder_state, exam_state, status, flow_updated_at, updated_at')
        .or('reminder_state.neq.idle,exam_state.neq.idle,status.like.flow:%');

      if (queryError) {
        this.logger.error(`Erro ao buscar usuários em fluxos ativos: ${queryError.message}`);
        return;
      }

      if (!activeFlowUsers || activeFlowUsers.length === 0) {
        return;
      }

      const now = Date.now();
      const expiredUsers: any[] = [];

      for (const u of activeFlowUsers) {
        let lastActivity = u.flow_updated_at ? new Date(u.flow_updated_at).getTime() : null;

        if (!lastActivity && u.updated_at) {
          lastActivity = new Date(u.updated_at).getTime();
        }

        // Se ainda não tiver timestamp, busca última mensagem no chat
        if (!lastActivity) {
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('created_at')
            .eq('user_id', u.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (lastMsg?.created_at) {
            lastActivity = new Date(lastMsg.created_at).getTime();
          }
        }

        // Se não houver registro de atividade ou se excedeu o limite de inatividade
        if (!lastActivity || (now - lastActivity) >= timeoutMinutes * 60 * 1000) {
          expiredUsers.push(u);
        }
      }

      if (expiredUsers.length === 0) {
        return;
      }

      for (const u of expiredUsers) {
        const updatePayload: any = {
          reminder_state: 'idle',
          reminder_context: {},
          exam_state: 'idle',
          exam_context: {},
          flow_updated_at: null,
        };

        if (u.status && u.status.startsWith('flow:')) {
          updatePayload.status = 'active';
        }

        await supabase.from('users').update(updatePayload).eq('id', u.id);
      }

      const infoMsg = `Limpeza automática de fluxos inativos: ${expiredUsers.length} usuário(s) liberado(s) silenciosamente após ${timeoutMinutes} min.`;
      this.logger.log(infoMsg);
      await this.systemLogsService.logInfo('CronService', infoMsg, {
        resetCount: expiredUsers.length,
        userIds: expiredUsers.map((u) => u.id),
        timeoutMinutes,
      });
    } catch (e: any) {
      this.logger.error(`Exceção durante limpeza de fluxos inativos: ${e.message}`);
    }
  }
}

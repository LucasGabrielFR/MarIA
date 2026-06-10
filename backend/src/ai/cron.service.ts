import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AiService } from './ai.service';
import { AdminService } from '../admin/admin.service';
import { LiturgyService } from './liturgy.service';
import { SaintService } from './saint.service';
import { MagisteriumService } from './magisterium.service';
import { PromptService } from './prompt.service';
import { SupabaseService } from '../supabase/supabase.service';

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
  ) {}

  @Cron('5 0 * * *', { timeZone: 'America/Sao_Paulo' }) // Todo dia 00:05
  async syncExchangeRate() {
    this.logger.log('Sincronizando taxa de câmbio (USD/BRL)...');
    await this.adminService.syncExchangeRate();
  }

  @Cron('1 0 * * 0', { timeZone: 'America/Sao_Paulo' }) // Todo domingo 00:01
  async handleWeeklyGenerations() {
    this.logger.log('Iniciando gerações semanais...');

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
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AiService } from './ai.service';
import { LiturgyService } from './liturgy.service';
import { MagisteriumService } from './magisterium.service';
import { PromptService } from './prompt.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly liturgyService: LiturgyService,
    private readonly magisteriumService: MagisteriumService,
    private readonly promptService: PromptService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Cron('1 0 * * *', { timeZone: 'America/Sao_Paulo' })
  async handleDailyGenerations() {
    this.logger.log('Iniciando gerações diárias...');
    const today = new Date().toISOString().split('T')[0];

    try {
      await Promise.all([
        this.generateLiturgy(today),
        this.generateSaint(today),
        this.generateReflection(today),
      ]);
      this.logger.log('Gerações diárias concluídas com sucesso.');
    } catch (error) {
      this.logger.error('Erro nas gerações diárias', error);
    }
  }

  private async generateLiturgy(date: string) {
    this.logger.log(`Gerando liturgia para ${date}...`);
    const rawLiturgy = await this.liturgyService.getDailyLiturgy();
    const prompt = this.promptService.getCorePersona() + '\n\n' + 
      'Você deve gerar uma reflexão profunda sobre a liturgia abaixo. ' +
      'Inclua as referências bíblicas e uma oração final.\n\n' +
      'LITURGIA CRUA:\n' + rawLiturgy;

    const content = await this.aiService.callOpenRouter(prompt, 'Gere a reflexão da liturgia de hoje.', false, [], 'openai/gpt-4o');
    await this.saveToCache('liturgy', date, content);
  }

  private async generateSaint(date: string) {
    this.logger.log(`Gerando santo do dia para ${date}...`);
    const prompt = this.promptService.getPrompt('intent_saint');
    const magisteriumContext = await this.magisteriumService.query(`Quem é o santo do dia ${date}?`, prompt);
    const finalPrompt = this.promptService.getCorePersona() + '\n\n' + prompt + '\n\nCONTEÚDO OFICIAL:\n' + magisteriumContext;

    const content = await this.aiService.callOpenRouter(finalPrompt, `Fale sobre o santo do dia ${date}.`, false, [], 'openai/gpt-4o');
    await this.saveToCache('saint', date, content);
  }

  private async generateReflection(date: string) {
    this.logger.log(`Gerando reflexão espiritual para ${date}...`);
    const prompt = this.promptService.getCorePersona() + '\n\n' +
      'Gere uma pequena mensagem de bom dia espiritual e acolhedora de Nossa Senhora para os seus filhos hoje.';

    const content = await this.aiService.callOpenRouter(prompt, 'Gere a mensagem do dia.', false, [], 'openai/gpt-4o');
    await this.saveToCache('reflection', date, content);
  }

  private async saveToCache(type: string, date: string, content: string) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase.from('daily_cache').upsert({
      type,
      cache_date: date,
      content,
      created_at: new Date().toISOString(),
    }, { onConflict: 'type, cache_date' });

    if (error) {
      this.logger.error(`Erro ao salvar cache ${type}: ${error.message}`);
    }
  }
}

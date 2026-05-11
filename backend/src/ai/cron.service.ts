import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AiService } from './ai.service';
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
    private readonly liturgyService: LiturgyService,
    private readonly saintService: SaintService,
    private readonly magisteriumService: MagisteriumService,
    private readonly promptService: PromptService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Cron('1 0 * * 0', { timeZone: 'America/Sao_Paulo' }) // Todo domingo 00:01
  async handleWeeklyGenerations() {
    this.logger.log('Iniciando gerações semanais...');
    
    // Gera para os próximos 7 dias
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);
      const dateStr = targetDate.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
      
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
    await Promise.all([
      this.generateLiturgy(date, forceOverride),
      this.generateSaint(date, forceOverride),
      this.generateReflection(date, forceOverride),
    ]);
  }

  private async generateLiturgy(date: string, forceOverride: boolean) {
    if (!forceOverride && await this.checkExists('liturgy', date)) return;

    this.logger.log(`Gerando liturgia para ${date}...`);
    const rawLiturgy = await this.liturgyService.getDailyLiturgy(date);
    const prompt = this.promptService.getCorePersona() + '\n\n' + 
      'Você é um especialista em liturgia católica. Com base na liturgia bruta abaixo, gere um conteúdo estruturado:\n' +
      '1. **Resumo Teológico**: Uma síntese de 2 parágrafos sobre a mensagem central do dia.\n' +
      '2. **Leituras**: Liste as referências (1ª Leitura, Salmo, Evangelho).\n' +
      '3. **Reflexão**: Uma exegese espiritual profunda e pastoral.\n' +
      '4. **Minha Oração Diária**: Escreva uma oração fervorosa EM PRIMEIRA PESSOA (como se fosse o fiel rezando), baseada no Evangelho do dia. Use um tom de conversa íntima com Deus.\n\n' +
      'LITURGIA CRUA:\n' + rawLiturgy;

    const content = await this.aiService.callOpenRouter(prompt, `Gere o roteiro litúrgico do dia ${date}.`, false, [], 'openai/gpt-4o');
    await this.saveToCache('liturgy', date, content);
  }

  private async generateSaint(date: string, forceOverride: boolean) {
    if (!forceOverride && await this.checkExists('saint', date)) return;

    this.logger.log(`Gerando santo do dia para ${date} via Vatican News...`);
    
    // Busca dados brutos do Vatican News (pode retornar múltiplos santos)
    const saints = await this.saintService.getSaintOfDay(date);
    
    const prompt = this.promptService.getCorePersona() + '\n\n' + 
      'Você é um hagiógrafo (especialista em vida de santos). Abaixo você receberá dados brutos de um ou mais santos do dia do Vatican News.\n' +
      'Para CADA santo listado, você deve:\n' +
      '1. **Título**: Nome completo do santo e o título dado pela Igreja.\n' +
      '2. **A Vida do Santo**: Um resumo profundo, rico e espiritual (3-5 parágrafos) cobrindo sua origem, missão e martírio/legado.\n' +
      '3. **Oração em Primeira Pessoa**: Escreva uma oração fervorosa onde o fiel conversa com o santo e com Deus, pedindo intercessão específica baseada na vida desse santo.\n\n' +
      'Separe os santos com uma linha horizontal (---).\n\n' +
      'FONTES BRUTAS:\n' +
      saints.map(s => `SANTO: ${s.title}\nBIOGRAFIA COMPLETA: ${s.content}`).join('\n\n---\n\n');

    const content = await this.aiService.callOpenRouter(prompt, `Fale sobre o santo do dia ${date}.`, false, [], 'openai/gpt-4o');
    await this.saveToCache('saint', date, content);
  }

  private async generateReflection(date: string, forceOverride: boolean) {
    if (!forceOverride && await this.checkExists('reflection', date)) return;

    this.logger.log(`Gerando reflexão espiritual para ${date}...`);
    const prompt = this.promptService.getCorePersona() + '\n\n' +
      'Gere uma pequena mensagem de bom dia espiritual e acolhedora de Nossa Senhora para os seus filhos hoje. Use a data ' + date;

    const content = await this.aiService.callOpenRouter(prompt, `Gere a mensagem do dia ${date}.`, false, [], 'openai/gpt-4o');
    await this.saveToCache('reflection', date, content);
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
    this.logger.log(`Tentando salvar no banco: [${type}] para a data [${date}]...`);
    
    const { data, error } = await supabase.from('daily_cache').upsert({
      type,
      cache_date: date,
      content,
    }, { onConflict: 'type, cache_date' }).select();

    if (error) {
      this.logger.error(`ERRO NO SUPABASE AO SALVAR ${type}: ${JSON.stringify(error)}`);
    } else {
      this.logger.log(`SUCESSO AO SALVAR ${type}: ${data?.[0]?.id || 'Registro atualizado'}`);
    }
  }
}

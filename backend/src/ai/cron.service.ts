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
  ) { }

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
    ]);
  }

  private async generateLiturgy(date: string, forceOverride: boolean) {
    if (!forceOverride && await this.checkExists('liturgy', date)) return;

    this.logger.log(`Gerando liturgia para ${date}...`);
    const rawLiturgy = await this.liturgyService.getDailyLiturgy(date);
    const prompt = 'Você é um especialista em liturgia católica. Com base na liturgia bruta abaixo, gere um conteúdo estruturado e formatado para WhatsApp:\n\n' +
      'REGRAS DE FORMATAÇÃO:\n' +
      '- Use negritos e emojis nos títulos (ex: 📖 *Leituras do Dia:*, ✨ *Mensagem do Dia:*, etc).\n' +
      '- NÃO inclua saudações como "Meu querido filho" ou "A paz de meu Filho". O conteúdo deve ser direto e informativo.\n' +
      '- Mantenha um tom solene e espiritual, mas focado no conteúdo.\n\n' +
      'ESTRUTURA:\n' +
      '1. ✨ *Mensagem do Dia:* Uma síntese de 2 parágrafos sobre a mensagem central do dia.\n' +
      '2. 📖 *Leituras do Dia:* Liste as referências e um BREVE resumo (2-3 linhas) de cada uma (1ª Leitura, 2ª Leitura(se houver), Salmo, Evangelho).\n' +
      '3. 🕊️ *Reflexão:* Uma exegese espiritual profunda e pastoral sobre o conjunto das leituras.\n' +
      '4. 🙏 *Minha Oração Diária:* Uma oração fervorosa EM PRIMEIRA PESSOA, baseada no Evangelho, formatada em itálico.\n\n' +
      'LITURGIA CRUA:\n' + rawLiturgy;

    const result = await this.aiService.callOpenRouter(prompt, `Gere o roteiro litúrgico formatado do dia ${date}.`, false, [], 'openai/gpt-4o');
    if (result.usage) {
      await this.aiService.logUsage(null, result.usage, 'openai/gpt-4o');
    }
    await this.saveToCache('liturgy', date, result.content);
  }

  private async generateSaint(date: string, forceOverride: boolean) {
    if (!forceOverride && await this.checkExists('saint', date)) return;

    this.logger.log(`Gerando santo do dia para ${date} via Vatican News...`);

    // Busca dados brutos do Vatican News (pode retornar múltiplos santos)
    const saints = await this.saintService.getSaintOfDay(date);

    const prompt = 'Você é um hagiógrafo especialista. Abaixo você receberá dados brutos de santos do dia.\n' +
      'Gere um conteúdo formatado para WhatsApp com emojis e negritos.\n\n' +
      'REGRAS:\n' +
      '- NÃO inclua saudações como "Meu querido filho".\n' +
      '- Use emojis temáticos para cada seção.\n\n' +
      'Para CADA santo listado, você deve:\n' +
      '1. ⚜️ *[Nome do Santo]*: Nome e títulos em negrito.\n' +
      '2. 📜 *A Vida do Santo*: Um resumo profundo e espiritual (3-5 parágrafos).\n' +
      '3. 🙏 *Oração e Intercessão*: Uma oração fervorosa em primeira pessoa pedindo a intercessão.\n\n' +
      'DADOS BRUTOS:\n' +
      saints.map(s => `SANTO: ${s.title}\nBIOGRAFIA: ${s.content}`).join('\n\n---\n\n');

    const result = await this.aiService.callOpenRouter(prompt, `Gere a hagiografia formatada do dia ${date}.`, false, [], 'openai/gpt-4o');
    if (result.usage) {
      await this.aiService.logUsage(null, result.usage, 'openai/gpt-4o');
    }
    await this.saveToCache('saint', date, result.content);
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

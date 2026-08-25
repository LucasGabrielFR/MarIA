import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PromptService, AiPrompt } from './prompt.service';
import { SupabaseService } from '../supabase/supabase.service';
import { AiService } from './ai.service';
import { CronService } from './cron.service';

@Controller('ai/prompts')
export class AiController {
  constructor(
    private readonly promptService: PromptService,
    private readonly supabaseService: SupabaseService,
    private readonly aiService: AiService,
    private readonly cronService: CronService,
  ) {}

  @Get()
  async getAllPrompts() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('ai_prompts')
      .select('*')
      .order('key', { ascending: true });

    if (error) throw error;
    return data;
  }

  @Put(':key')
  async updatePrompt(
    @Param('key') key: string,
    @Body()
    updateData: { content: string; description?: string; is_active?: boolean },
  ) {
    const supabase = this.supabaseService.getClient();

    // Update in database
    const { data, error } = await supabase
      .from('ai_prompts')
      .update({
        content: updateData.content,
        ...(updateData.description && { description: updateData.description }),
        ...(updateData.is_active !== undefined && {
          is_active: updateData.is_active,
        }),
        updated_at: new Date().toISOString(),
      })
      .eq('key', key)
      .select()
      .single();

    if (error) throw error;

    // Refresh memory cache in the backend
    await this.promptService.refreshCache();

    return data;
  }
  @Post('generate')
  async generatePrompt(
    @Body() data: { key: string; description: string; currentContent?: string },
  ) {
    // Garante que o cache está atualizado para pegar novos geradores ou mudanças neles
    await this.promptService.refreshCache();

    // Decide qual prompt gerador usar baseado na chave
    const isGuide = data.key.startsWith('guide_');
    const generatorKey = isGuide
      ? 'generator_prayer_guide'
      : 'generator_system_prompt';

    // Busca a instrução do gerador no banco (via service)
    const systemPrompt = this.promptService.getPrompt(generatorKey);

    let userMessage = `Gere o conteúdo solicitado para a MarIA:
Chave (Identificador): ${data.key}
Descrição: ${data.description}`;

    if (data.currentContent) {
      userMessage += `\n\nConteúdo atual (use como base para melhorar ou expandir):\n${data.currentContent}`;
    }

    try {
      const response = await this.aiService.callOpenRouter(
        systemPrompt,
        userMessage,
        false,
        [],
        'openai/gpt-4o',
      );
      return { content: response.content.trim() };
    } catch (error) {
      throw error;
    }
  }

  @Get('automatic-flows')
  async getAutomaticFlows() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('automatic_flows')
      .select('*')
      .order('key', { ascending: true });

    if (error) throw error;
    return data;
  }

  @Put('automatic-flows/:key')
  async updateAutomaticFlow(
    @Param('key') key: string,
    @Body() updateData: { steps: any; name?: string },
  ) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('automatic_flows')
      .update({
        steps: updateData.steps,
        ...(updateData.name && { name: updateData.name }),
        updated_at: new Date().toISOString(),
      })
      .eq('key', key)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  @Post('process-affiliate-insights')
  async processAffiliateInsights() {
    await this.cronService.processAffiliatesInsights();
    return { success: true, message: 'Insights processing started in background' };
  }
}

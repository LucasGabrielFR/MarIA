import { Controller, Get, Put, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PromptService, AiPrompt } from './prompt.service';
import { SupabaseService } from '../supabase/supabase.service';
import { AiService } from './ai.service';

@Controller('ai/prompts')
export class AiController {
  constructor(
    private readonly promptService: PromptService,
    private readonly supabaseService: SupabaseService,
    private readonly aiService: AiService
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
    @Body() updateData: { content: string; description?: string; is_active?: boolean }
  ) {
    const supabase = this.supabaseService.getClient();
    
    // Update in database
    const { data, error } = await supabase
      .from('ai_prompts')
      .update({
        content: updateData.content,
        ...(updateData.description && { description: updateData.description }),
        ...(updateData.is_active !== undefined && { is_active: updateData.is_active }),
        updated_at: new Date().toISOString()
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
  async generatePrompt(@Body() data: { key: string; description: string; currentContent?: string }) {
    const systemPrompt = `Você é um engenheiro de prompt especialista. Sua tarefa é criar instruções detalhadas (system prompt) para uma IA baseada na chave e descrição informadas. O resultado deve ser direto e não deve conter markdown no inicio nem no fim, ou seja, retorne APENAS o texto do prompt e nada mais.`;
    
    let userMessage = `Gere as regras de comportamento para a IA.
Chave (Identificador): ${data.key}
Descrição: ${data.description}`;

    if (data.currentContent) {
      userMessage += `\n\nConteúdo atual (use como base se for bom, apenas melhore ou expanda):\n${data.currentContent}`;
    }

    try {
      const response = await this.aiService.callOpenRouter(systemPrompt, userMessage, false, [], 'openai/gpt-4o');
      return { content: response.content.trim() };
    } catch (error) {
      throw error;
    }
  }
}

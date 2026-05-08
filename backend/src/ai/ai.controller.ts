import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { PromptService, AiPrompt } from './prompt.service';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('ai/prompts')
export class AiController {
  constructor(
    private readonly promptService: PromptService,
    private readonly supabaseService: SupabaseService
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
}

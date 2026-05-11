import { Controller, Get, Put, Body, Param, Query } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('ai/daily-cache')
export class DailyCacheController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get()
  async getDailyCache(@Query('date') date?: string) {
    const supabase = this.supabaseService.getClient();
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_cache')
      .select('*')
      .eq('cache_date', targetDate);

    if (error) throw error;
    return data;
  }

  @Put(':id')
  async updateDailyCache(
    @Param('id') id: string,
    @Body() updateData: { content: string }
  ) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('daily_cache')
      .update({
        content: updateData.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

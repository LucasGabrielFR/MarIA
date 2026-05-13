import { Controller, Get, Put, Post, Body, Param, Query } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CronService } from './cron.service';

@Controller('ai/daily-cache')
export class DailyCacheController {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly cronService: CronService
  ) {}

  @Get()
  async getDailyCache(@Query('date') date?: string) {
    const supabase = this.supabaseService.getClient();
    const targetDate = date || new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });

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

  @Post('generate')
  async generateForDay(@Body() body: { date: string, force?: boolean, type?: 'liturgy' | 'saint' }) {
    try {
      const { date, force, type } = body;
      const isForce = force || false;

      if (type === 'liturgy') {
        await this.cronService.generateLiturgy(date, isForce);
      } else if (type === 'saint') {
        await this.cronService.generateSaint(date, isForce);
      } else {
        await this.cronService.generateAllForDay(date, isForce);
      }

      return { message: `Geração de ${type || 'tudo'} para ${date} concluída com sucesso.` };
    } catch (error) {
      console.error('ERRO CRÍTICO NA GERAÇÃO:', error);
      throw error;
    }
  }
}

import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CanonicalHoursService } from './canonical-hours.service';
import { CanonicalHourType } from './canonical-hours.types';

@Controller('canonical-hours')
export class CanonicalHoursController {
  constructor(private readonly canonicalHoursService: CanonicalHoursService) {}

  @Get('today')
  async getTodayHours() {
    const today = new Date().toLocaleDateString('sv-SE', {
      timeZone: 'America/Sao_Paulo',
    });
    return this.canonicalHoursService.getDailyHours(today);
  }

  @Get('day')
  async getHoursByDate(@Query('date') date?: string) {
    const targetDate =
      date ||
      new Date().toLocaleDateString('sv-SE', {
        timeZone: 'America/Sao_Paulo',
      });
    return this.canonicalHoursService.getDailyHours(targetDate);
  }

  @Get('hour')
  async getSpecificHour(
    @Query('date') date: string,
    @Query('type') type: string,
  ) {
    const targetDate =
      date ||
      new Date().toLocaleDateString('sv-SE', {
        timeZone: 'America/Sao_Paulo',
      });
    return this.canonicalHoursService.getHour(
      targetDate,
      type as CanonicalHourType,
    );
  }

  @Post('sync')
  async triggerSync(@Query('date') date?: string) {
    return this.canonicalHoursService.syncFromWordPress(date);
  }

  @Post('sync-day')
  async syncDay(@Query('date') date?: string) {
    const targetDate =
      date ||
      new Date().toLocaleDateString('sv-SE', {
        timeZone: 'America/Sao_Paulo',
      });
    return this.canonicalHoursService.syncFromWordPress(targetDate);
  }

  @Post('sync-week')
  async syncWeek(@Query('date') date?: string) {
    const targetDate =
      date ||
      new Date().toLocaleDateString('sv-SE', {
        timeZone: 'America/Sao_Paulo',
      });
    return this.canonicalHoursService.syncWeekRange(targetDate);
  }

  @Post('update/:id')
  async updateHourPost(
    @Param('id') id: string,
    @Body() body: { celebration_title?: string; rawCleanText?: string; content?: any },
  ) {
    return this.canonicalHoursService.updateHour(id, body);
  }
}

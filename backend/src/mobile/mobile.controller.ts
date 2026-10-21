import { Controller, Post, Body, Get, Put, Query, HttpCode, HttpStatus } from '@nestjs/common';
import {
  MobileService,
  MobileChatRequestDto,
  UpdatePreferencesDto,
  UpdateSpiritualPlanDto,
} from './mobile.service';

@Controller('mobile')
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      service: 'MarIA Mobile Gateway',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body() dto: MobileChatRequestDto) {
    if (!dto.message || !dto.message.trim()) {
      return {
        response: 'Salve Maria! Em que posso ajudar suas orações hoje?',
        timestamp: new Date().toISOString(),
      };
    }
    return this.mobileService.processChat(dto);
  }

  @Get('preferences')
  async getPreferences(
    @Query('phone') phone?: string,
    @Query('userId') userId?: string,
  ) {
    return this.mobileService.getPreferences(phone, userId);
  }

  @Put('preferences')
  @HttpCode(HttpStatus.OK)
  async updatePreferences(@Body() dto: UpdatePreferencesDto) {
    return this.mobileService.updatePreferences(dto);
  }

  @Get('spiritual-plan')
  async getSpiritualPlan(
    @Query('phone') phone?: string,
    @Query('userId') userId?: string,
  ) {
    return this.mobileService.getSpiritualPlan(phone, userId);
  }

  @Put('spiritual-plan')
  @HttpCode(HttpStatus.OK)
  async updateSpiritualPlan(@Body() dto: UpdateSpiritualPlanDto) {
    return this.mobileService.updateSpiritualPlan(dto);
  }

  @Get('reminders')
  async getReminders(
    @Query('phone') phone?: string,
    @Query('userId') userId?: string,
  ) {
    return this.mobileService.getReminders(userId, phone);
  }

  @Post('reminders/sync')
  @HttpCode(HttpStatus.OK)
  async syncReminders(@Body() dto: any) {
    return this.mobileService.syncReminders(dto);
  }

  @Get('daily-content')
  async getDailyContent(@Query('date') date?: string) {
    return this.mobileService.getDailyContent(date);
  }
}



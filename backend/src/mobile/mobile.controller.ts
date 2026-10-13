import { Controller, Post, Body, Get, Put, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { MobileService, MobileChatRequestDto, UpdatePreferencesDto } from './mobile.service';

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
}

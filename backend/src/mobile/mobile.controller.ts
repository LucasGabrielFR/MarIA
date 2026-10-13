import { Controller, Post, Body, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { MobileService, MobileChatRequestDto } from './mobile.service';

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
}

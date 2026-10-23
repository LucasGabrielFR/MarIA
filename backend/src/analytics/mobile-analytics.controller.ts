import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  MobileAnalyticsService,
  MobileAnalyticsEventDto,
} from './mobile-analytics.service';

@Controller('mobile/analytics')
export class MobileAnalyticsController {
  constructor(private readonly analyticsService: MobileAnalyticsService) {}

  @Post('events')
  @HttpCode(HttpStatus.ACCEPTED)
  async registerEvents(
    @Headers('authorization') authorization: string | undefined,
    @Body('events') events: MobileAnalyticsEventDto[],
  ) {
    return this.analyticsService.registerEvents(authorization, events);
  }
}

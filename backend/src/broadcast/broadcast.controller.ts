import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { BroadcastService } from './broadcast.service';

@Controller('broadcast')
export class BroadcastController {
  constructor(private readonly broadcastService: BroadcastService) {}

  @Post('jobs')
  async createJob(
    @Body('name') name: string,
    @Body('message_text') messageText: string,
    @Body('user_ids') userIds: string[],
  ) {
    if (!name || !messageText || !userIds || userIds.length === 0) {
      return { success: false, message: 'Dados inválidos.' };
    }
    return await this.broadcastService.createJob(name, messageText, userIds);
  }

  @Get('jobs')
  async getJobs(@Query('limit') limit: number = 20) {
    return await this.broadcastService.getJobs(limit);
  }
}

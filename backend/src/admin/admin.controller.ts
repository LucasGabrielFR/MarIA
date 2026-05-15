import { Controller, Get, Param, Query, Patch, Body, Post } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  async findAll() {
    return this.adminService.findAll();
  }

  @Get('wa-users')
  async findWaUsers() {
    return this.adminService.findWaUsers();
  }

  @Get('wa-users/:id/messages')
  async findUserMessages(@Param('id') id: string) {
    return this.adminService.getUserMessages(id);
  }

  @Get('stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('stats/daily')
  async getDailyStats() {
    return this.adminService.getDailyStats();
  }

  @Get('logs/usage')
  async getUsageLogs(@Query('page') page: number, @Query('limit') limit: number) {
    return this.adminService.getUsageLogs(Number(page) || 1, Number(limit) || 50);
  }

  @Get('logs/webhooks')
  async getWebhookLogs(@Query('page') page: number, @Query('limit') limit: number) {
    return this.adminService.getWebhookLogs(Number(page) || 1, Number(limit) || 50);
  }

  @Get('settings')
  async getSystemSettings() {
    return this.adminService.getSystemSettings();
  }

  @Patch('settings/:key')
  async updateSystemSetting(@Param('key') key: string, @Body('value') value: string) {
    return this.adminService.updateSystemSetting(key, value);
  }

  @Post('settings/sync-exchange')
  async syncExchange() {
    return this.adminService.syncExchangeRate();
  }

  @Get('ai-models')
  async getAiModels() {
    return this.adminService.getAiModels();
  }

  @Post('settings/clear-cache')
  async clearCache() {
    return this.adminService.clearSemanticCache();
  }

  @Post('settings/toggle-maintenance')
  async toggleMaintenance() {
    return this.adminService.toggleMaintenanceMode();
  }

  @Post('wa-users/:id/clear-data')
  async clearUserData(@Param('id') id: string) {
    return this.adminService.clearUserData(id);
  }
}

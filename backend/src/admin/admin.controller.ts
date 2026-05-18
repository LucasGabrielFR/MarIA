import { Controller, Get, Param, Query, Patch, Body, Post, Headers, Delete } from '@nestjs/common';
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
  async updateSystemSetting(
    @Param('key') key: string, 
    @Body('value') value: string,
    @Headers('x-admin-id') adminId: string
  ) {
    return this.adminService.updateSystemSetting(adminId, key, value);
  }

  @Post('settings/sync-exchange')
  async syncExchange(@Headers('x-admin-id') adminId: string) {
    return this.adminService.syncExchangeRate(adminId);
  }

  @Get('ai-models')
  async getAiModels() {
    return this.adminService.getAiModels();
  }

  @Post('settings/clear-cache')
  async clearCache(@Headers('x-admin-id') adminId: string) {
    return this.adminService.clearSemanticCache(adminId);
  }

  @Post('settings/toggle-maintenance')
  async toggleMaintenance(@Headers('x-admin-id') adminId: string) {
    return this.adminService.toggleMaintenanceMode(adminId);
  }

  @Post('wa-users/:id/clear-data')
  async clearUserData(
    @Param('id') id: string,
    @Headers('x-admin-id') adminId: string
  ) {
    return this.adminService.clearUserData(adminId, id);
  }

  @Post('wa-users/:id/subscription')
  async updateSubscription(
    @Param('id') id: string,
    @Body('tier') tier: string,
    @Body('expiresAt') expiresAt: string | null,
    @Headers('x-admin-id') adminId: string
  ) {
    return this.adminService.updateUserSubscription(adminId, id, tier, expiresAt);
  }

  @Post('wa-users/:id/settings')
  async updateSettings(
    @Param('id') id: string,
    @Body('isPaused') isPaused: boolean,
    @Body('monthlyLimitBrl') monthlyLimitBrl: number | null,
    @Headers('x-admin-id') adminId: string
  ) {
    return this.adminService.updateUserSettings(adminId, id, isPaused, monthlyLimitBrl);
  }

  // Admins CRUD & Activity logs
  @Post('admins')
  async createAdmin(
    @Headers('x-admin-id') adminId: string,
    @Body() body: { email: string; name: string; role: string }
  ) {
    return this.adminService.createAdmin(adminId, body.email, body.name, body.role);
  }

  @Patch('admins/:id')
  async updateAdmin(
    @Headers('x-admin-id') adminId: string,
    @Param('id') id: string,
    @Body() body: { name: string; role: string; password?: string }
  ) {
    return this.adminService.updateAdmin(adminId, id, body.name, body.role, body.password);
  }

  @Delete('admins/:id')
  async deleteAdmin(
    @Headers('x-admin-id') adminId: string,
    @Param('id') id: string
  ) {
    return this.adminService.deleteAdmin(adminId, id);
  }

  @Get('activities')
  async getAdminActivities(
    @Headers('x-admin-id') adminId: string,
    @Query('targetId') targetId?: string
  ) {
    return this.adminService.getAdminActivities(adminId, targetId);
  }
}

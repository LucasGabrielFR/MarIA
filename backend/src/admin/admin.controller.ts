import { Controller, Get, Param } from '@nestjs/common';
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
}

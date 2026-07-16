import { Controller, Get, Post, Body, Put, Param } from '@nestjs/common';
import { PlansService, PlanConfig } from './plans.service';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  // Endpoint público para a Landing Page
  @Get()
  async getAllPlans(): Promise<PlanConfig[]> {
    return this.plansService.getAllPlans();
  }

  // Admin endpoint
  @Put(':id')
  async updatePlan(@Param('id') id: string, @Body() updates: Partial<PlanConfig>) {
    return this.plansService.updatePlan(id, updates);
  }
}

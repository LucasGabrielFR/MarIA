import { Controller, Post, Body, Req, BadRequestException } from '@nestjs/common';
import { AsaasService } from './asaas.service';
import { Request } from 'express';

@Controller('payment/asaas')
export class AsaasController {
  constructor(private readonly asaasService: AsaasService) {}

  @Post('checkout')
  async createCheckoutLink(
    @Body('planId') planId: string,
    @Body('cycle') cycle: string,
    @Body('phone') phone: string
  ) {
    if (!planId || !cycle || !phone) {
      throw new BadRequestException('planId, cycle and phone are required');
    }
    return this.asaasService.createCheckoutUrl(planId, cycle, phone);
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    // Asaas webhooks usually authenticate via a token in headers or IP whitelisting.
    // For simplicity in this integration, we parse the body directly.
    if (!body || !body.event) {
      throw new BadRequestException('Invalid webhook payload');
    }
    return this.asaasService.handleWebhook(body);
  }
}

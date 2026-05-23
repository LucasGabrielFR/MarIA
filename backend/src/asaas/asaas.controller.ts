import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AsaasService } from './asaas.service';
import type { Request } from 'express';

@Controller('payment/asaas')
export class AsaasController {
  private readonly logger = new Logger(AsaasController.name);

  constructor(private readonly asaasService: AsaasService) {}

  /**
   * Asaas envia o token configurado no painel no header `asaas-access-token`.
   * @see https://docs.asaas.com/docs/receive-asaas-events-at-your-webhook-endpoint
   */
  private validateWebhookToken(req: Request): void {
    const expectedToken =
      process.env.ASAAS_AUTH_TOKEN ||
      process.env.ASSAS_AUTH_TOKEN ||
      process.env.ASAAS_WEBHOOK_AUTH_TOKEN;

    if (!expectedToken) {
      this.logger.warn(
        'ASAAS_AUTH_TOKEN / ASSAS_AUTH_TOKEN não configurado — webhook aceito sem validação.',
      );
      return;
    }

    const received =
      (req.headers['asaas-access-token'] as string) ||
      (req.headers['Asaas-Access-Token'] as string);

    if (!received || received !== expectedToken) {
      this.logger.warn(
        'Webhook Asaas rejeitado: token de autorização inválido ou ausente.',
      );
      throw new UnauthorizedException(
        'Token de autorização do webhook inválido',
      );
    }
  }

  @Post('checkout')
  async createCheckoutLink(
    @Body('planId') planId: string,
    @Body('cycle') cycle: string,
    @Body('phone') phone: string,
  ) {
    if (!planId || !cycle || !phone) {
      throw new BadRequestException('planId, cycle and phone are required');
    }
    return this.asaasService.createCheckoutUrl(planId, cycle, phone);
  }

  @Post('checkout-web')
  async createWebCheckout(
    @Body('planId') planId: string,
    @Body('cycle') cycle: string,
  ) {
    if (!planId || !cycle) {
      throw new BadRequestException('planId and cycle are required');
    }
    return this.asaasService.createWebCheckoutSession(planId, cycle);
  }

  @Get('status/:sessionId')
  async checkWebActivationStatus(@Param('sessionId') sessionId: string) {
    if (!sessionId) {
      throw new BadRequestException('sessionId is required');
    }
    return this.asaasService.checkWebActivationStatus(sessionId);
  }

  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Body() body: any) {
    this.validateWebhookToken(req);

    if (!body || !body.event) {
      throw new BadRequestException('Invalid webhook payload');
    }

    return this.asaasService.handleWebhook(body);
  }
}

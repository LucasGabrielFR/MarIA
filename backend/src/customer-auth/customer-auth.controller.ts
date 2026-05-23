import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseGuards,
  Get,
  Query,
  Headers,
} from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

@Controller('customer')
export class CustomerAuthController {
  constructor(private readonly customerAuthService: CustomerAuthService) {}

  // --- LEGACY ENDPOINTS (Preserved for backwards compatibility) ---
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // Max 3 requests per minute per IP
  @Post('auth/magic-link')
  async requestMagicLink(@Body('phone') phone: string) {
    if (!phone) {
      throw new BadRequestException('O número de telefone é obrigatório.');
    }

    const sanitizedPhone = phone.replace(/\D/g, '');
    if (sanitizedPhone.length < 10) {
      throw new BadRequestException('Número de telefone inválido.');
    }

    return this.customerAuthService.requestMagicLink(sanitizedPhone);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Max 5 verification attempts per minute
  @Post('auth/verify')
  async verifyMagicLink(@Body('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token é obrigatório.');
    }
    return this.customerAuthService.verifyMagicLinkAndGetPortal(token);
  }

  // --- NEW WHATSAPP CODE & CUSTOMER PORTAL ENDPOINTS ---
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // Max 3 requests per minute per IP
  @Post('auth/send-code')
  async sendVerificationCode(@Body('phone') phone: string) {
    if (!phone) {
      throw new BadRequestException('O número de telefone é obrigatório.');
    }
    return this.customerAuthService.requestVerificationCode(phone);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Max 5 verification attempts per minute
  @Post('auth/verify-code')
  async verifyCode(@Body('phone') phone: string, @Body('code') code: string) {
    if (!phone || !code) {
      throw new BadRequestException('Telefone e código são obrigatórios.');
    }
    return this.customerAuthService.verifyCodeAndGetPortalData(phone, code);
  }

  @Get('subscription/status')
  async getSubscriptionStatus(@Headers('authorization') authHeader: string) {
    const sessionToken = this.extractToken(authHeader);
    return this.customerAuthService.getCustomerPortalData(sessionToken);
  }

  @Post('subscription/cancel')
  async cancelSubscription(@Headers('authorization') authHeader: string) {
    const sessionToken = this.extractToken(authHeader);
    return this.customerAuthService.cancelSubscription(sessionToken);
  }

  @Post('subscription/change-plan')
  async changePlan(
    @Headers('authorization') authHeader: string,
    @Body('planId') planId: string,
    @Body('cycle') cycle: string,
  ) {
    const sessionToken = this.extractToken(authHeader);
    if (!planId || !cycle) {
      throw new BadRequestException('Plano e ciclo são obrigatórios.');
    }
    return this.customerAuthService.changePlan(sessionToken, planId, cycle);
  }

  private extractToken(authHeader: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BadRequestException(
        'Sessão expirada ou não autenticada. Faça login novamente.',
      );
    }
    return authHeader.substring(7).trim();
  }
}

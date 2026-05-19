import { Controller, Post, Body, BadRequestException, UseGuards, Get, Query } from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

@Controller('customer/auth')
export class CustomerAuthController {
  constructor(private readonly customerAuthService: CustomerAuthService) {}

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // Max 3 requests per minute per IP
  @Post('magic-link')
  async requestMagicLink(@Body('phone') phone: string) {
    if (!phone) {
      throw new BadRequestException('O número de telefone é obrigatório.');
    }
    
    // Basic phone sanitization (remove non-digits)
    const sanitizedPhone = phone.replace(/\D/g, '');
    if (sanitizedPhone.length < 10) {
      throw new BadRequestException('Número de telefone inválido.');
    }

    return this.customerAuthService.requestMagicLink(sanitizedPhone);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Max 5 verification attempts per minute
  @Post('verify')
  async verifyMagicLink(@Body('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token é obrigatório.');
    }
    return this.customerAuthService.verifyMagicLinkAndGetPortal(token);
  }
}

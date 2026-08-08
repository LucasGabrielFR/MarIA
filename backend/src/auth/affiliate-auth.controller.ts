import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AffiliateAuthService } from './affiliate-auth.service';

@Controller('auth/affiliate')
export class AffiliateAuthController {
  constructor(private affiliateAuthService: AffiliateAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { username: string; pass: string }) {
    return this.affiliateAuthService.login(body.username, body.pass);
  }
}

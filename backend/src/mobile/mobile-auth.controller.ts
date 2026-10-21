import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  MobileAuthService,
  MobileSignUpDto,
  MobileLoginDto,
} from './mobile-auth.service';

@Controller('mobile/auth')
export class MobileAuthController {
  constructor(private readonly mobileAuthService: MobileAuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() dto: MobileSignUpDto) {
    return this.mobileAuthService.signUp(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: MobileLoginDto) {
    return this.mobileAuthService.login(dto);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async loginWithGoogle(
    @Body('idToken') idToken: string,
    @Body('accessToken') accessToken?: string,
  ) {
    return this.mobileAuthService.loginWithGoogle({ idToken, accessToken });
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    return this.mobileAuthService.forgotPassword(email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body('email') email: string,
    @Body('code') code: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.mobileAuthService.resetPasswordWithOtp({
      email,
      code,
      newPassword,
    });
  }

  @Post('supabase-session')
  @HttpCode(HttpStatus.OK)
  async loginWithSupabaseSession(@Body('accessToken') accessToken: string) {
    return this.mobileAuthService.loginWithSupabaseSession({ accessToken });
  }

  @Get('me')
  async getMe(@Headers('authorization') authHeader?: string) {
    return this.mobileAuthService.getMe(authHeader);
  }

  @Post('whatsapp/send-code')
  @HttpCode(HttpStatus.OK)
  async sendWhatsAppCode(
    @Body('userId') userId: string,
    @Body('phone') phone: string,
  ) {
    return this.mobileAuthService.sendWhatsAppCode(userId, phone);
  }

  @Post('whatsapp/verify-code')
  @HttpCode(HttpStatus.OK)
  async verifyWhatsAppCode(
    @Body('userId') userId: string,
    @Body('phone') phone: string,
    @Body('code') code: string,
  ) {
    return this.mobileAuthService.verifyWhatsAppCode(userId, phone, code);
  }
}

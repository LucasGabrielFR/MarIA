import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; pass: string }) {
    return this.authService.login(body.email, body.pass);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Body() body: { email: string; pass: string; newPass: string }) {
    return this.authService.changePassword(body.email, body.pass, body.newPass);
  }
}

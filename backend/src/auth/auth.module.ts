import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { AffiliateAuthService } from './affiliate-auth.service';
import { AffiliateAuthController } from './affiliate-auth.controller';

@Module({
  imports: [SupabaseModule],
  providers: [AuthService, AffiliateAuthService],
  controllers: [AuthController, AffiliateAuthController],
  exports: [AuthService, AffiliateAuthService],
})
export class AuthModule {}

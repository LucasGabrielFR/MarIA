import { Module } from '@nestjs/common';
import { MobileController } from './mobile.controller';
import { MobileService } from './mobile.service';
import { MobileAuthController } from './mobile-auth.controller';
import { MobileAuthService } from './mobile-auth.service';
import { AiModule } from '../ai/ai.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { UazapiModule } from '../uazapi/uazapi.module';

@Module({
  imports: [AiModule, SupabaseModule, UazapiModule],
  controllers: [MobileController, MobileAuthController],
  providers: [MobileService, MobileAuthService],
  exports: [MobileService, MobileAuthService],
})
export class MobileModule {}


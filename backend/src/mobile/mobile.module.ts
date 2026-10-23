import { Module } from '@nestjs/common';
import { MobileController } from './mobile.controller';
import { MobileService } from './mobile.service';
import { MobileAuthController } from './mobile-auth.controller';
import { MobileAuthService } from './mobile-auth.service';
import { AiModule } from '../ai/ai.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { UazapiModule } from '../uazapi/uazapi.module';
import { RemindersModule } from '../reminders/reminders.module';
import { AdminModule } from '../admin/admin.module';
import {
  MobileCurationAdminController,
  MobilePushController,
} from './mobile-curation.controller';
import { MobileCurationService } from './mobile-curation.service';

@Module({
  imports: [
    AiModule,
    SupabaseModule,
    UazapiModule,
    RemindersModule,
    AdminModule,
  ],
  controllers: [
    MobileController,
    MobileAuthController,
    MobileCurationAdminController,
    MobilePushController,
  ],
  providers: [MobileService, MobileAuthService, MobileCurationService],
  exports: [MobileService, MobileAuthService],
})
export class MobileModule {}

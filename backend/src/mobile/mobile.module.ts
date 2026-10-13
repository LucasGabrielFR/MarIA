import { Module } from '@nestjs/common';
import { MobileController } from './mobile.controller';
import { MobileService } from './mobile.service';
import { AiModule } from '../ai/ai.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [AiModule, SupabaseModule],
  controllers: [MobileController],
  providers: [MobileService],
  exports: [MobileService],
})
export class MobileModule {}

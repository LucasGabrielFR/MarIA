import { Module } from '@nestjs/common';
import { BroadcastController } from './broadcast.controller';
import { BroadcastService } from './broadcast.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { UazapiModule } from '../uazapi/uazapi.module';

@Module({
  imports: [SupabaseModule, UazapiModule],
  controllers: [BroadcastController],
  providers: [BroadcastService],
})
export class BroadcastModule {}

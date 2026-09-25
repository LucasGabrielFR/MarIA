import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RemindersProcessor } from './reminders.processor';
import { RemindersService } from './reminders.service';
import { UazapiModule } from '../uazapi/uazapi.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'reminders-queue',
    }),
    UazapiModule,
    SupabaseModule,
    AiModule,
  ],
  providers: [RemindersProcessor, RemindersService],
  exports: [BullModule, RemindersService],
})
export class RemindersModule {}


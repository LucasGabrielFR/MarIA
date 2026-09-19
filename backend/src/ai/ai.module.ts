import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AiService } from './ai.service';
import { PromptService } from './prompt.service';
import { MagisteriumService } from './magisterium.service';
import { LiturgyService } from './liturgy.service';
import { SaintService } from './saint.service';
import { CronService } from './cron.service';
import { EmbeddingService } from './embedding.service';
import { AiController } from './ai.controller';
import { DailyCacheController } from './daily-cache.controller';
import { ScheduledMessagesService } from './scheduled-messages.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AdminModule } from '../admin/admin.module';
import { PlansModule } from '../plans/plans.module';
import { AffiliatesModule } from '../affiliates/affiliates.module';
import { FlowInterpreterService } from './flow-interpreter.service';

@Module({
  imports: [
    ConfigModule,
    SupabaseModule,
    AdminModule,
    PlansModule,
    AffiliatesModule,
    BullModule.registerQueue({ name: 'reminders-queue' }),
  ],
  controllers: [AiController, DailyCacheController],
  providers: [
    AiService,
    PromptService,
    MagisteriumService,
    LiturgyService,
    SaintService,
    CronService,
    EmbeddingService,
    ScheduledMessagesService,
    FlowInterpreterService,
  ],
  exports: [
    AiService,
    PromptService,
    MagisteriumService,
    LiturgyService,
    SaintService,
    CronService,
    EmbeddingService,
    ScheduledMessagesService,
    FlowInterpreterService,
  ],
})
export class AiModule {}

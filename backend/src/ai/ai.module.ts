import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { PromptService } from './prompt.service';
import { MagisteriumService } from './magisterium.service';
import { LiturgyService } from './liturgy.service';
import { SaintService } from './saint.service';
import { CronService } from './cron.service';
import { EmbeddingService } from './embedding.service';
import { AiController } from './ai.controller';
import { DailyCacheController } from './daily-cache.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [ConfigModule, SupabaseModule, AdminModule],
  controllers: [AiController, DailyCacheController],
  providers: [
    AiService,
    PromptService,
    MagisteriumService,
    LiturgyService,
    SaintService,
    CronService,
    EmbeddingService,
  ],
  exports: [
    AiService,
    PromptService,
    MagisteriumService,
    LiturgyService,
    SaintService,
    CronService,
    EmbeddingService,
  ],
})
export class AiModule {}

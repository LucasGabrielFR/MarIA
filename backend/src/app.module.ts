import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { UazapiModule } from './uazapi/uazapi.module';
import { FinanceModule } from './finance/finance.module';
import { AsaasModule } from './asaas/asaas.module';
import { CustomerAuthModule } from './customer-auth/customer-auth.module';
import { MailModule } from './mail/mail.module';
import { PlansModule } from './plans/plans.module';
import { BroadcastModule } from './broadcast/broadcast.module';
import { AffiliatesModule } from './affiliates/affiliates.module';

import { BullModule } from '@nestjs/bullmq';
import { RemindersModule } from './reminders/reminders.module';
import { SystemLogsModule } from './system-logs/system-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        },
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    SystemLogsModule,
    SupabaseModule,
    AuthModule,
    AdminModule,
    AiModule,
    UazapiModule,
    FinanceModule,
    AsaasModule,
    CustomerAuthModule,
    MailModule,
    PlansModule,
    BroadcastModule,
    AffiliatesModule,
    RemindersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

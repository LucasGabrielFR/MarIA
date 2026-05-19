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
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    SupabaseModule,
    AuthModule,
    AdminModule,
    AiModule,
    UazapiModule,
    FinanceModule,
    AsaasModule,
    CustomerAuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

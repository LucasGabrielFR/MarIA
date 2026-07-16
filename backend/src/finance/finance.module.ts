import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { AsaasModule } from '../asaas/asaas.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [SupabaseModule, AsaasModule, PlansModule],
  providers: [FinanceService],
  controllers: [FinanceController],
  exports: [FinanceService],
})
export class FinanceModule {}

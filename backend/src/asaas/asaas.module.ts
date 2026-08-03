import { Module } from '@nestjs/common';
import { AsaasService } from './asaas.service';
import { AsaasController } from './asaas.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { UazapiModule } from '../uazapi/uazapi.module';
import { PlansModule } from '../plans/plans.module';
import { AffiliatesModule } from '../affiliates/affiliates.module';

@Module({
  imports: [SupabaseModule, UazapiModule, PlansModule, AffiliatesModule],
  controllers: [AsaasController],
  providers: [AsaasService],
  exports: [AsaasService],
})
export class AsaasModule {}

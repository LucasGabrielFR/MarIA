import { Module } from '@nestjs/common';
import { AsaasService } from './asaas.service';
import { AsaasController } from './asaas.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [AsaasController],
  providers: [AsaasService],
  exports: [AsaasService],
})
export class AsaasModule {}

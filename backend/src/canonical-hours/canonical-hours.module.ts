import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { CanonicalHoursService } from './canonical-hours.service';
import { CanonicalHoursController } from './canonical-hours.controller';

@Module({
  imports: [SupabaseModule],
  controllers: [CanonicalHoursController],
  providers: [CanonicalHoursService],
  exports: [CanonicalHoursService],
})
export class CanonicalHoursModule {}

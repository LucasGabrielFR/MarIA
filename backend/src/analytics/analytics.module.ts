import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { MobileAnalyticsController } from './mobile-analytics.controller';
import { MobileAnalyticsService } from './mobile-analytics.service';

@Module({
  imports: [SupabaseModule],
  controllers: [MobileAnalyticsController],
  providers: [MobileAnalyticsService],
  exports: [MobileAnalyticsService],
})
export class AnalyticsModule {}

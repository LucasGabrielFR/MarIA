import { Module } from '@nestjs/common';
import { NovenasService } from './novenas.service';
import { NovenasSchedulerService } from './novenas-scheduler.service';
import {
  PanelNovenasController,
  MobileNovenasController,
} from './novenas.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { UazapiModule } from '../uazapi/uazapi.module';
import { SystemLogsModule } from '../system-logs/system-logs.module';

@Module({
  imports: [SupabaseModule, UazapiModule, SystemLogsModule],
  controllers: [PanelNovenasController, MobileNovenasController],
  providers: [NovenasService, NovenasSchedulerService],
  exports: [NovenasService, NovenasSchedulerService],
})
export class NovenasModule {}

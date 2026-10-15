import { Module } from '@nestjs/common';
import { NovenasService } from './novenas.service';
import { PanelNovenasController, MobileNovenasController } from './novenas.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [PanelNovenasController, MobileNovenasController],
  providers: [NovenasService],
  exports: [NovenasService],
})
export class NovenasModule {}

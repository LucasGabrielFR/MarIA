import { Module } from '@nestjs/common';
import { UazapiService } from './uazapi.service';
import { UazapiController } from './uazapi.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [UazapiController],
  providers: [UazapiService],
  exports: [UazapiService],
})
export class UazapiModule {}

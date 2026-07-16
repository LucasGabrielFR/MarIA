import { Module } from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerAuthController } from './customer-auth.controller';
import { UazapiModule } from '../uazapi/uazapi.module';
import { StripeModule } from '../stripe/stripe.module';
import { AsaasModule } from '../asaas/asaas.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [UazapiModule, StripeModule, AsaasModule, PlansModule],
  providers: [CustomerAuthService],
  controllers: [CustomerAuthController],
})
export class CustomerAuthModule {}

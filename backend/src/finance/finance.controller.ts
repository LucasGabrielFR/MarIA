import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Headers,
  Param,
} from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('admin/finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  getSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getFinanceSummary(startDate, endDate);
  }

  @Get('subscriptions')
  getSubscriptions(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getSubscriptions(
      limit,
      offset,
      startDate,
      endDate,
    );
  }

  @Post('record-manual')
  recordManualPayment(
    @Body() body: { userId: string; tier: string; amount: number },
  ) {
    return this.financeService.recordManualPayment(
      body.userId,
      body.tier,
      body.amount,
    );
  }

  @Post('subscriptions/:id/cancel')
  cancelSubscription(
    @Param('id') id: string,
    @Headers('x-admin-email') adminEmail: string,
  ) {
    return this.financeService.cancelSubscription(id, adminEmail);
  }

  @Delete('subscriptions/:id')
  deleteSubscription(
    @Param('id') id: string,
    @Headers('x-admin-email') adminEmail: string,
  ) {
    return this.financeService.deleteSubscription(id, adminEmail);
  }

  @Post('sync-asaas')
  syncWithAsaas(@Headers('x-admin-email') adminEmail: string) {
    return this.financeService.syncWithAsaas(adminEmail);
  }

  @Post('subscriptions/:id/update')
  updateSubscription(
    @Param('id') id: string,
    @Body() body: { tier: string; cycle: string },
    @Headers('x-admin-email') adminEmail: string,
  ) {
    return this.financeService.updateSubscriptionInAsaas(
      id,
      body.tier,
      body.cycle,
      adminEmail,
    );
  }
}

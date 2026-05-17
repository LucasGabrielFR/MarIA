import { Controller, Get, Post, Delete, Body, Query, Headers, Param } from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('admin/finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  getSummary() {
    return this.financeService.getFinanceSummary();
  }

  @Get('subscriptions')
  getSubscriptions(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.financeService.getSubscriptions(limit, offset);
  }

  @Post('record-manual')
  recordManualPayment(
    @Body() body: { userId: string; tier: string; amount: number },
  ) {
    return this.financeService.recordManualPayment(body.userId, body.tier, body.amount);
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
}


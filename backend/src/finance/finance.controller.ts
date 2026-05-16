import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
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
}

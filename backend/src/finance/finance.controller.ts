import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/finance')
@UseGuards(JwtAuthGuard)
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

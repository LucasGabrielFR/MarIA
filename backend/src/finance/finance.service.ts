import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getFinanceSummary() {
    const { data, error } = await this.supabaseService.getClient()
      .from('finance_summary')
      .select('*')
      .single();

    if (error) {
      this.logger.error(`Erro ao buscar sumário financeiro: ${error.message}`);
      return { total_revenue: 0, total_cost: 0, net_profit: 0, margin_percentage: 0 };
    }

    return data;
  }

  async getSubscriptions(limit = 20, offset = 0) {
    const { data, error, count } = await this.supabaseService.getClient()
      .from('subscriptions')
      .select('*, users(name, phone)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error(`Erro ao buscar assinaturas: ${error.message}`);
      throw error;
    }
    return { data, count };
  }

  async recordManualPayment(userId: string, tier: string, amount: number) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data, error } = await this.supabaseService.getClient()
      .from('subscriptions')
      .insert({
        user_id: userId,
        tier,
        amount,
        status: 'paid',
        provider: 'manual',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Erro ao registrar pagamento manual: ${error.message}`);
      throw error;
    }

    // Atualizar o usuário
    await this.supabaseService.getClient()
      .from('users')
      .update({
        subscription_tier: tier,
        subscription_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    return data;
  }
}

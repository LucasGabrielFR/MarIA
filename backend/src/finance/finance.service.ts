import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getFinanceSummary(startDate?: string, endDate?: string) {
    const client = this.supabaseService.getClient();

    if (!startDate && !endDate) {
      const { data, error } = await client
        .from('finance_summary')
        .select('*')
        .single();

      if (error) {
        this.logger.error(`Erro ao buscar sumário financeiro: ${error.message}`);
        return { total_revenue: 0, total_cost: 0, net_profit: 0, margin_percentage: 0 };
      }

      return data;
    }

    // Agregação dinâmica sob demanda para períodos selecionados
    let querySub = client
      .from('subscriptions')
      .select('amount')
      .eq('status', 'paid');

    let queryLogs = client
      .from('usage_logs')
      .select('cost');

    if (startDate) {
      querySub = querySub.gte('created_at', startDate);
      queryLogs = queryLogs.gte('created_at', startDate);
    }
    if (endDate) {
      querySub = querySub.lte('created_at', endDate);
      queryLogs = queryLogs.lte('created_at', endDate);
    }

    const [subRes, logsRes] = await Promise.all([querySub, queryLogs]);

    if (subRes.error) {
      this.logger.error(`Erro ao agregar faturamento no período: ${subRes.error.message}`);
    }
    if (logsRes.error) {
      this.logger.error(`Erro ao agregar custos de IA no período: ${logsRes.error.message}`);
    }

    const total_revenue = (subRes.data || []).reduce((acc, sub) => acc + Number(sub.amount), 0);
    const total_cost = (logsRes.data || []).reduce((acc, log) => acc + Number(log.cost), 0);
    const net_profit = total_revenue - total_cost;
    const margin_percentage = total_revenue > 0 ? (net_profit / total_revenue) * 100 : 0;

    return {
      total_revenue,
      total_cost,
      net_profit,
      margin_percentage,
    };
  }

  async getSubscriptions(limit = 20, offset = 0, startDate?: string, endDate?: string) {
    let query = this.supabaseService.getClient()
      .from('subscriptions')
      .select('*, users(name, phone)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

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

  private async validateSuperAdmin(adminEmail: string) {
    if (!adminEmail) {
      throw new ForbiddenException('Acesso negado: Administrador não identificado.');
    }

    // Permitir o e-mail de superadmin padrão diretamente para resiliência extra
    if (adminEmail === 'lucasgabriel@acutistech.com.br') {
      return;
    }

    const { data: admin, error } = await this.supabaseService.getClient()
      .from('admins')
      .select('role')
      .eq('email', adminEmail)
      .single();

    if (error || !admin || admin.role !== 'superadmin') {
      this.logger.warn(`Tentativa de acesso não autorizado por ${adminEmail}`);
      throw new ForbiddenException('Apenas superadministradores podem realizar esta ação.');
    }
  }

  async cancelSubscription(subscriptionId: string, adminEmail: string) {
    await this.validateSuperAdmin(adminEmail);

    const { data: sub, error: subError } = await this.supabaseService.getClient()
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('id', subscriptionId)
      .select('*, user_id')
      .single();

    if (subError) {
      this.logger.error(`Erro ao cancelar assinatura ${subscriptionId}: ${subError.message}`);
      throw subError;
    }

    if (sub && sub.user_id) {
      const { error: userError } = await this.supabaseService.getClient()
        .from('users')
        .update({
          subscription_tier: 'free',
          subscription_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', sub.user_id);

      if (userError) {
        this.logger.error(`Erro ao revogar assinatura do usuário ${sub.user_id}: ${userError.message}`);
        throw userError;
      }
    }

    return sub;
  }

  async deleteSubscription(subscriptionId: string, adminEmail: string) {
    await this.validateSuperAdmin(adminEmail);

    // 1. Obter o user_id antes de deletar
    const { data: sub, error: fetchError } = await this.supabaseService.getClient()
      .from('subscriptions')
      .select('user_id')
      .eq('id', subscriptionId)
      .single();

    if (fetchError) {
      this.logger.error(`Erro ao buscar assinatura ${subscriptionId} para deleção: ${fetchError.message}`);
      throw fetchError;
    }

    // 2. Deletar a assinatura
    const { error: deleteError } = await this.supabaseService.getClient()
      .from('subscriptions')
      .delete()
      .eq('id', subscriptionId);

    if (deleteError) {
      this.logger.error(`Erro ao deletar assinatura ${subscriptionId}: ${deleteError.message}`);
      throw deleteError;
    }

    // 3. Atualizar o usuário
    if (sub && sub.user_id) {
      const { error: userError } = await this.supabaseService.getClient()
        .from('users')
        .update({
          subscription_tier: 'free',
          subscription_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', sub.user_id);

      if (userError) {
        this.logger.error(`Erro ao revogar assinatura do usuário ${sub.user_id} após deleção: ${userError.message}`);
        throw userError;
      }
    }

    return { success: true };
  }
}


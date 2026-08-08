import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as bcrypt from 'bcryptjs';

export interface Affiliate {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  commission_type?: 'fixed' | 'percentage';
  commission_value?: number;
  commission_duration_months?: number;
  can_view_insights?: boolean;
  admin_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AffiliatePromotion {
  id: string;
  affiliate_id: string;
  plan_tier: string;
  plan_cycle: string;
  discount_percentage: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable()
export class AffiliatesService {
  private readonly logger = new Logger(AffiliatesService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  private mapPromotion(data: any): AffiliatePromotion {
    if (!data) return data;
    const { promotional_price, ...rest } = data;
    return {
      ...rest,
      discount_percentage: promotional_price,
    };
  }

  // Affiliates

  async getAllAffiliates(): Promise<any[]> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('affiliates').select('*');
    if (error) {
      this.logger.error('Error fetching affiliates:', error.message);
      throw error;
    }
    return (data || []).map(aff => {
      const { admins, ...rest } = aff;
      return {
        ...rest,
        email: admins?.email || '',
      };
    });
  }

  async getAffiliateByCode(code: string): Promise<any | null> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('affiliates').select('*, admins(email)').eq('code', code).single();
    if (error) {
      if (error.code !== 'PGRST116') { // PGRST116 is for not found
        this.logger.error('Error fetching affiliate by code:', error.message);
      }
      return null;
    }
    const { admins, ...rest } = data;
    return {
      ...rest,
      email: admins?.email || '',
    };
  }

  async createAffiliate(payload: Partial<Affiliate> & { email?: string; password?: string; username?: string }): Promise<Affiliate> {
    const supabase = this.supabaseService.getClient();
    
    const { email, password, username, ...affiliateData } = payload;
    let adminId = affiliateData.admin_id || null;

    let finalUsername = username || email;
    if (finalUsername && finalUsername.includes('@acutistech.com.br')) {
      finalUsername = finalUsername.split('@')[0];
    }

    let passwordHash: string | null = null;
    if (password) {
      passwordHash = password; // Armazenando em texto puro conforme solicitado para visualização
    }

    const insertData: any = {
      ...affiliateData,
      admin_id: adminId,
    };

    if (finalUsername) insertData.username = finalUsername;
    if (passwordHash) insertData.password_hash = passwordHash;

    const { data, error } = await supabase.from('affiliates').insert(insertData).select().single();
    
    if (error) {
      this.logger.error('Error creating affiliate:', error.message);
      throw error;
    }
    return { ...data, username: finalUsername || '', email: email || finalUsername || '' };
  }

  async updateAffiliate(id: string, payload: Partial<Affiliate> & { email?: string; password?: string; username?: string }): Promise<Affiliate> {
    const supabase = this.supabaseService.getClient();
    const { email, password, username, ...updates } = payload;
    
    let finalUsername = username || email;
    if (finalUsername && finalUsername.includes('@acutistech.com.br')) {
      finalUsername = finalUsername.split('@')[0];
    }

    if (finalUsername) {
      (updates as any).username = finalUsername;
    }

    if (password) {
      (updates as any).password_hash = password; // Armazenando em texto puro
    }
    
    const { data: currentAffiliate } = await supabase.from('affiliates').select('admin_id').eq('id', id).single();
    const { data, error } = await supabase.from('affiliates').update(updates).eq('id', id).select().single();
    if (error) {
      this.logger.error('Error updating affiliate:', error.message);
      throw error;
    }
    
    // Se o email foi atualizado, retornar o novo, caso contrário, tentar buscar o atual
    let finalEmail = email;
    if (!finalEmail && currentAffiliate?.admin_id) {
       const { data: adminData } = await supabase.from('admins').select('email').eq('id', currentAffiliate.admin_id).single();
       finalEmail = adminData?.email;
    }
    
    return { ...data, username: finalUsername || '', email: finalEmail || '' };
  }

  // Affiliate Dashboard

  async getDashboardStats(affiliateId: string): Promise<any> {
    const supabase = this.supabaseService.getClient();
    
    // Buscar detalhes do afiliado
    const { data: affiliate, error: affError } = await supabase
      .from('affiliates')
      .select('*')
      .eq('id', affiliateId)
      .single();
      
    if (affError || !affiliate) {
      throw new Error('Afiliado não encontrado');
    }

    // Buscar usuários vinculados a esse afiliado
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, subscription_tier, subscription_expires_at, created_at')
      .eq('affiliate_code', affiliate.code);
      
    if (usersError) throw usersError;

    let totalSubscribers = 0;
    let estimatedMonthlyEarnings = 0;

    if (users && users.length > 0) {
      const activeUsers = users.filter(u => u.subscription_tier !== 'free' && u.subscription_tier != null);
      
      for (const user of activeUsers) {
        // Verificar duração da comissão
        let eligibleForCommission = true;
        if (affiliate.commission_duration_months) {
          const userCreatedAt = new Date(user.created_at);
          const now = new Date();
          const monthsDiff = (now.getFullYear() - userCreatedAt.getFullYear()) * 12 + (now.getMonth() - userCreatedAt.getMonth());
          if (monthsDiff >= affiliate.commission_duration_months) {
            eligibleForCommission = false;
          }
        }

        if (eligibleForCommission) {
          totalSubscribers++;
          // Calcular estimativa baseado nas inscrições atuais do banco (amount na tabela subscriptions)
          // Como precisamos do valor exato, vamos buscar a assinatura ativa deste usuário
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('status', 'paid')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const amount = sub?.amount || 0;
          if (amount > 0) {
            if (affiliate.commission_type === 'fixed') {
              estimatedMonthlyEarnings += Number(affiliate.commission_value || 0);
            } else {
              estimatedMonthlyEarnings += (amount * (Number(affiliate.commission_value || 0) / 100));
            }
          }
        }
      }
    }

    return {
      total_signups: users?.length || 0,
      active_subscribers: totalSubscribers,
      estimated_monthly_earnings: estimatedMonthlyEarnings
    };
  }

  async getAffiliateInsights(affiliateId: string): Promise<any> {
    const supabase = this.supabaseService.getClient();
    
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('code, can_view_insights')
      .eq('id', affiliateId)
      .single();
      
    if (!affiliate || !affiliate.can_view_insights) {
      return { error: 'Sem permissão para visualizar insights' };
    }

    // Busca os interesses gerais sem expor PII
    const { data: contexts } = await supabase
      .from('users')
      .select('user_contexts(interests)')
      .eq('affiliate_code', affiliate.code);
      
    const allInterests: string[] = [];
    if (contexts) {
      contexts.forEach((c: any) => {
        if (c.user_contexts && Array.isArray(c.user_contexts.interests)) {
          allInterests.push(...c.user_contexts.interests);
        } else if (c.user_contexts && Array.isArray(c.user_contexts)) {
           // Em caso de relacionamento hasMany
           c.user_contexts.forEach(ctx => {
             if (Array.isArray(ctx.interests)) {
               allInterests.push(...ctx.interests);
             }
           });
        }
      });
    }

    // Contar a frequência dos interesses
    const interestCounts = allInterests.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {});

    const sortedInterests = Object.entries(interestCounts)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return {
      top_interests: sortedInterests
    };
  }

  // Affiliate Promotions

  async getPromotionsByAffiliate(affiliateId: string): Promise<AffiliatePromotion[]> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('affiliate_promotions').select('*').eq('affiliate_id', affiliateId);
    if (error) {
      this.logger.error('Error fetching promotions:', error.message);
      throw error;
    }
    return (data || []).map(p => this.mapPromotion(p));
  }

  async getPromotionForAffiliateAndPlan(affiliateId: string, planTier: string, planCycle: string): Promise<AffiliatePromotion | null> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('affiliate_promotions')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .eq('plan_tier', planTier)
      .eq('plan_cycle', planCycle)
      .single();
    if (error) {
      return null;
    }
    return this.mapPromotion(data);
  }

  async setPromotion(promotion: Partial<AffiliatePromotion>): Promise<AffiliatePromotion> {
    const supabase = this.supabaseService.getClient();
    
    if (!promotion.affiliate_id || !promotion.plan_tier || !promotion.plan_cycle) {
      throw new Error('affiliate_id, plan_tier and plan_cycle are required');
    }

    // Check if exists
    const existing = await this.getPromotionForAffiliateAndPlan(
      promotion.affiliate_id, 
      promotion.plan_tier, 
      promotion.plan_cycle
    );

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('affiliate_promotions')
        .update({ promotional_price: promotion.discount_percentage, is_active: promotion.is_active })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const insertData = {
        affiliate_id: promotion.affiliate_id,
        plan_tier: promotion.plan_tier,
        plan_cycle: promotion.plan_cycle,
        promotional_price: promotion.discount_percentage,
        is_active: promotion.is_active !== undefined ? promotion.is_active : true,
      };
      
      const { data, error } = await supabase
        .from('affiliate_promotions')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      result = data;
    }
    return this.mapPromotion(result);
  }
}

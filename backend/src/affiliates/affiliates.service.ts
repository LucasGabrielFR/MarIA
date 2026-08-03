import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface Affiliate {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AffiliatePromotion {
  id: string;
  affiliate_id: string;
  plan_tier: string;
  plan_cycle: string;
  promotional_price: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable()
export class AffiliatesService {
  private readonly logger = new Logger(AffiliatesService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  // Affiliates

  async getAllAffiliates(): Promise<Affiliate[]> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('affiliates').select('*');
    if (error) {
      this.logger.error('Error fetching affiliates:', error.message);
      throw error;
    }
    return data || [];
  }

  async getAffiliateByCode(code: string): Promise<Affiliate | null> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('affiliates').select('*').eq('code', code).single();
    if (error) {
      if (error.code !== 'PGRST116') { // PGRST116 is for not found
        this.logger.error('Error fetching affiliate by code:', error.message);
      }
      return null;
    }
    return data;
  }

  async createAffiliate(affiliate: Partial<Affiliate>): Promise<Affiliate> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('affiliates').insert(affiliate).select().single();
    if (error) {
      this.logger.error('Error creating affiliate:', error.message);
      throw error;
    }
    return data;
  }

  async updateAffiliate(id: string, updates: Partial<Affiliate>): Promise<Affiliate> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('affiliates').update(updates).eq('id', id).select().single();
    if (error) {
      this.logger.error('Error updating affiliate:', error.message);
      throw error;
    }
    return data;
  }

  // Affiliate Promotions

  async getPromotionsByAffiliate(affiliateId: string): Promise<AffiliatePromotion[]> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('affiliate_promotions').select('*').eq('affiliate_id', affiliateId);
    if (error) {
      this.logger.error('Error fetching promotions:', error.message);
      throw error;
    }
    return data || [];
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
    return data;
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
        .update({ promotional_price: promotion.promotional_price, is_active: promotion.is_active })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('affiliate_promotions')
        .insert(promotion)
        .select()
        .single();
      if (error) throw error;
      result = data;
    }
    return result;
  }
}

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface PlanConfig {
  id: string;
  tier: string;
  cycle: string;
  name: string;
  price: number;
  messages_limit: number;
  description: string;
}

@Injectable()
export class PlansService implements OnModuleInit {
  private readonly logger = new Logger(PlansService.name);
  private plansCache: PlanConfig[] = [];
  private lastFetch = 0;
  private readonly CACHE_TTL = 1000 * 60 * 5; // 5 minutos

  constructor(private readonly supabaseService: SupabaseService) {}

  async onModuleInit() {
    await this.refreshPlans();
  }

  async refreshPlans(): Promise<PlanConfig[]> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('plans').select('*');

    if (error) {
      this.logger.error('Erro ao buscar planos do Supabase:', error.message);
      // Se falhar e o cache estiver vazio, inicializa com valores hardcoded (fallback de segurança)
      if (this.plansCache.length === 0) {
        this.logger.warn('Usando valores hardcoded de fallback para os planos.');
        this.plansCache = this.getFallbackPlans();
      }
      return this.plansCache;
    }

    if (data && data.length > 0) {
      this.plansCache = data.map(p => ({
        ...p,
        price: Number(p.price)
      }));
      this.lastFetch = Date.now();
      this.logger.log(`Planos recarregados: ${this.plansCache.length} encontrados.`);
    }

    return this.plansCache;
  }

  async getAllPlans(): Promise<PlanConfig[]> {
    if (Date.now() - this.lastFetch > this.CACHE_TTL) {
      await this.refreshPlans();
    }
    return this.plansCache;
  }

  async getPlan(tier: string, cycle: string): Promise<PlanConfig | null> {
    const plans = await this.getAllPlans();
    return plans.find((p) => p.tier === tier && p.cycle === cycle) || null;
  }

  // Usado no módulo do Asaas
  async getPlanConfigByTierAndCycle(tier: string, cycle: string) {
    const plan = await this.getPlan(tier, cycle);
    if (!plan) return null;

    return {
      value: plan.price,
      cycleAsaas: cycle === 'annual' ? 'YEARLY' : 'MONTHLY',
      description: plan.description,
      linkName: `MarIA - ${plan.name}`,
      itemName: plan.name,
    };
  }

  async updatePlan(id: string, updates: Partial<PlanConfig>): Promise<PlanConfig | null> {
    const supabase = this.supabaseService.getClient();
    
    this.logger.log(`updatePlan chamado para id: ${id} com updates: ${JSON.stringify(updates)}`);
    
    // Filtra apenas campos válidos
    const allowedUpdates = {
      name: updates.name,
      price: updates.price,
      description: updates.description,
      messages_limit: updates.messages_limit,
      updated_at: new Date().toISOString()
    };
    
    // Remove undefined
    Object.keys(allowedUpdates).forEach(key => allowedUpdates[key as keyof typeof allowedUpdates] === undefined && delete allowedUpdates[key as keyof typeof allowedUpdates]);

    const { data, error } = await supabase
      .from('plans')
      .update(allowedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Erro do Supabase ao atualizar plano ${id}:`, error);
      throw new Error('Falha ao atualizar plano');
    }

    await this.refreshPlans();
    return data;
  }

  private getFallbackPlans(): PlanConfig[] {
    return [
      {
        id: 'fallback-basic-monthly',
        tier: 'basic',
        cycle: 'monthly',
        name: 'Plano Básico Mensal',
        price: 14.9,
        messages_limit: 300,
        description: 'Plano Básico Mensal - MarIA'
      },
      {
        id: 'fallback-basic-annual',
        tier: 'basic',
        cycle: 'annual',
        name: 'Plano Básico Anual',
        price: 154.8,
        messages_limit: 300,
        description: 'Plano Básico Anual - MarIA'
      },
      {
        id: 'fallback-premium-monthly',
        tier: 'premium',
        cycle: 'monthly',
        name: 'Plano Premium Mensal',
        price: 29.9,
        messages_limit: 600,
        description: 'Plano Premium Mensal - MarIA'
      },
      {
        id: 'fallback-premium-annual',
        tier: 'premium',
        cycle: 'annual',
        name: 'Plano Premium Anual',
        price: 322.8,
        messages_limit: 600,
        description: 'Plano Premium Anual - MarIA'
      }
    ];
  }
}

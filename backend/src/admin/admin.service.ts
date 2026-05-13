import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AdminService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll() {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('admins')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data;
  }

  async findWaUsers() {
    const supabase = this.supabaseService.getClient();

    // Busca usuários com seus contextos
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        *,
        user_contexts (
          general_summary,
          interests,
          updated_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Busca agregação de tokens por usuário
    const { data: usageData } = await supabase
      .from('usage_logs')
      .select('user_id, model, total_tokens, prompt_tokens, completion_tokens, created_at');

    // Busca mensagens dos últimos 30 dias para calcular frequência
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('user_id, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Mapeia os dados de uso para cada usuário
    const usersWithMetrics = await Promise.all(users.map(async (user) => {
      const userUsage = usageData?.filter(u => u.user_id === user.id) || [];
      const tokenMetrics: Record<string, { total: number, prompt: number, completion: number }> = {};
      
      userUsage.forEach((curr: any) => {
        const model = curr.model || 'unknown';
        if (!tokenMetrics[model]) {
          tokenMetrics[model] = { total: 0, prompt: 0, completion: 0 };
        }
        tokenMetrics[model].total += curr.total_tokens || 0;
        tokenMetrics[model].prompt += curr.prompt_tokens || 0;
        tokenMetrics[model].completion += curr.completion_tokens || 0;
      });

      // Cálculo de custos por usuário (estimado)
      const modelPrices: Record<string, number> = {
        'openai/gpt-4o-mini': 0.0000006, // Média aproximada por token
        'google/gemini-2.5-flash-lite': 0.0000002,
        'magisterium-expert': 0.000001,
      };

      const userCostUsd = userUsage.reduce((acc: number, curr: any) => {
        const price = modelPrices[curr.model || ''] || modelPrices['openai/gpt-4o-mini'];
        return acc + (curr.total_tokens * price);
      }, 0);

      const userBreakdown = Object.entries(tokenMetrics).map(([model, data]) => ({
        model,
        tokens: data.total,
        promptTokens: data.prompt,
        completionTokens: data.completion,
        costUsd: Number((data.total * (modelPrices[model] || modelPrices['openai/gpt-4o-mini'])).toFixed(4))
      }));

      // Contagem de Mensagens Enviadas (Total histórico do usuário)
      const { count: totalMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('role', 'user');

      // Determinação de Perfil de Engajamento (Mantendo lógica baseada em atividade recente)
      const userMessages = recentMessages?.filter(m => m.user_id === user.id) || [];
      const uniqueDays = new Set(userMessages.map(m => new Date(m.created_at).toDateString())).size;
      const frequency = Math.round((uniqueDays / 30) * 100);

      let engagement = 'Inativo';
      if (frequency >= 70) engagement = 'Super Engajado';
      else if (frequency >= 30) engagement = 'Engajado';
      else if (frequency >= 5) engagement = 'Ocasional';

      return {
        ...user,
        context: Array.isArray(user.user_contexts) ? user.user_contexts[0] : (user.user_contexts || null),
        metrics: {
          total_tokens: Object.values(tokenMetrics).reduce((a: any, b: any) => a + b.total, 0),
          total_cost_usd: Number(userCostUsd.toFixed(4)),
          breakdown: userBreakdown,
          total_messages: totalMessages || 0,
          engagement
        }
      };
    }));

    return usersWithMetrics;
  }

  async getUserMessages(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data;
  }

  async getDashboardStats() {
    const supabase = this.supabaseService.getClient();

    // 1. Total de Usuários
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // 2. Total de Mensagens (role = user)
    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user');

    // 3. Consumo de Tokens e Custos
    const { data: usageLogs } = await supabase
      .from('usage_logs')
      .select('model, prompt_tokens, completion_tokens, total_tokens');

    // 4. Conversas Recentes (Agrupadas por Usuário Único)
    const { data: recentMessagesRaw } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        role,
        created_at,
        user_id,
        users (name, status)
      `)
      .order('created_at', { ascending: false })
      .limit(50); // Pegamos mais para garantir diversidade após o filtro

    // Filtrar para manter apenas a última mensagem de cada usuário único
    const uniqueUsersMap = new Map();
    recentMessagesRaw?.forEach((m: any) => {
      if (!uniqueUsersMap.has(m.user_id) && uniqueUsersMap.size < 6) {
        uniqueUsersMap.set(m.user_id, {
          id: m.id,
          user: m.users?.name || 'Desconhecido',
          status: m.users?.status === 'active' ? 'Ativo' : 'Triagem',
          content: m.content,
          time: m.created_at,
          role: m.role
        });
      }
    });

    const recentConversations = Array.from(uniqueUsersMap.values());

    // 5. Saúde do Sistema (Simples)
    const { data: activePrompts } = await supabase
      .from('ai_prompts')
      .select('id')
      .eq('is_active', true);

    // Preços por 1M tokens (USD)
    const modelPrices: Record<string, { input: number, output: number, label: string }> = {
      'openai/gpt-4o-mini': { input: 0.15, output: 0.60, label: 'GPT-4o Mini' },
      'openai/gpt-4o': { input: 5.00, output: 15.00, label: 'GPT-4o (Standard/Cron)' },
      'google/gemini-2.5-flash-lite': { input: 0.10, output: 0.40, label: 'Gemini Flash' },
      'magisterium-expert': { input: 1.00, output: 1.00, label: 'Magisterium' },
    };

    let totalTokens = 0;
    let totalCostUsd = 0;
    const breakdown: Record<string, any> = {};

    usageLogs?.forEach(log => {
      const modelKey = log.model || 'openai/gpt-4o-mini';
      totalTokens += log.total_tokens || 0;
      
      const prices = modelPrices[modelKey] || modelPrices['openai/gpt-4o-mini'];
      const cost = (
        (log.prompt_tokens || 0) * (prices.input / 1000000) +
        (log.completion_tokens || 0) * (prices.output / 1000000)
      );
      totalCostUsd += cost;

      if (!breakdown[modelKey]) {
        breakdown[modelKey] = {
          label: prices.label,
          tokens: 0,
          promptTokens: 0,
          completionTokens: 0,
          costUsd: 0,
        };
      }
      breakdown[modelKey].tokens += log.total_tokens || 0;
      breakdown[modelKey].promptTokens += log.prompt_tokens || 0;
      breakdown[modelKey].completionTokens += log.completion_tokens || 0;
      breakdown[modelKey].costUsd += cost;
    });

    const brlRate = 5.50;
    
    // Formatar breakdown para array
    const formattedBreakdown = Object.entries(breakdown).map(([key, val]) => ({
      model: key,
      name: val.label,
      tokens: val.tokens,
      promptTokens: val.promptTokens,
      completionTokens: val.completionTokens,
      costUsd: Number(val.costUsd.toFixed(4)),
      costBrl: Number((val.costUsd * brlRate).toFixed(2)),
    }));

    return {
      totalUsers: totalUsers || 0,
      totalMessages: totalMessages || 0,
      totalTokens,
      totalCostUsd: Number(totalCostUsd.toFixed(2)),
      totalCostBrl: Number((totalCostUsd * brlRate).toFixed(2)),
      recentConversations,
      modelBreakdown: formattedBreakdown,
      health: {
        database: 'Connected',
        prompts: `${activePrompts?.length || 0} ativos`,
        status: 'Healthy'
      }
    };
  }
}

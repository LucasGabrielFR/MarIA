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
      .select('user_id, model, total_tokens, created_at');

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
      const tokenMetrics = userUsage.reduce((acc: any, curr: any) => {
        const model = curr.model || 'unknown';
        if (!acc[model]) acc[model] = 0;
        acc[model] += curr.total_tokens || 0;
        return acc;
      }, {});

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
          total_tokens: Object.values(tokenMetrics).reduce((a: any, b: any) => Number(a) + Number(b), 0),
          breakdown: tokenMetrics,
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
}

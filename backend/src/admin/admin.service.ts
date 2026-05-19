import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) { }

  async getRequesterAdmin(adminId: string) {
    if (!adminId) {
      throw new UnauthorizedException('Identificação do administrador ausente nas requisições.');
    }
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('admins')
      .select('id, name, email, role')
      .eq('id', adminId)
      .single();
    if (error || !data) {
      throw new UnauthorizedException('Administrador não autenticado ou inexistente.');
    }
    return data;
  }

  async logActivity(adminId: string, email: string, name: string, action: string, details: any = {}) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase.from('activity_logs').insert({
      admin_id: adminId,
      admin_email: email,
      admin_name: name,
      action,
      details,
      created_at: new Date().toISOString(),
    });
    if (error) {
      console.error('Erro ao salvar log de atividade:', error);
    }
  }

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
        'openai/gpt-4o-mini': 0.0000006,
        'openai/gpt-4o': 0.000010,
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

      // Contagem de Mensagens (Separação por Role)
      const { count: userMsgCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('role', 'user');

      const { count: assistantMsgCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('role', 'assistant');

      const totalMessages = (userMsgCount || 0) + (assistantMsgCount || 0);

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
          total_user_messages: userMsgCount || 0,
          total_assistant_messages: assistantMsgCount || 0,
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

    // 2. Total de Mensagens (Total de Interações)
    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

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
          userId: m.user_id,
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
      'openai/gpt-4o': { input: 2.50, output: 10.00, label: 'GPT-4o (Cron)' },
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

    const { data: brlRateSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'brl_rate')
      .single();

    const brlRate = parseFloat(brlRateSetting?.value || '5.50');

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

  async getDailyStats(startDate?: string, endDate?: string) {
    const supabase = this.supabaseService.getClient();
    
    let query = supabase
      .from('usage_logs')
      .select('created_at, total_tokens, cost, model');

    if (startDate) {
      query = query.gte('created_at', startDate);
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.gte('created_at', thirtyDaysAgo.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;

    const { data: brlRateSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'brl_rate')
      .single();

    const brlRate = parseFloat(brlRateSetting?.value || '5.50');

    const dailyStats = data.reduce((acc: any, curr: any) => {
      const date = new Date(curr.created_at).toLocaleDateString('pt-BR');
      if (!acc[date]) {
        acc[date] = { date, tokens: 0, costUsd: 0, costBrl: 0 };
      }
      acc[date].tokens += curr.total_tokens || 0;
      acc[date].costUsd += Number(curr.cost) || 0;
      acc[date].costBrl += (Number(curr.cost) || 0) * brlRate;
      return acc;
    }, {});

    return Object.values(dailyStats);
  }

  async getUsageLogs(page: number = 1, limit: number = 50, startDate?: string, endDate?: string) {
    const supabase = this.supabaseService.getClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('usage_logs')
      .select(`
        *,
        users (name, wa_chatid)
      `, { count: 'exact' });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data, count, page, limit };
  }

  async getWebhookLogs(page: number = 1, limit: number = 50, startDate?: string, endDate?: string) {
    const supabase = this.supabaseService.getClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('webhook_logs')
      .select('*', { count: 'exact' });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data, count, page, limit };
  }

  async getSystemSettings() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('key', { ascending: true });

    if (error) throw error;
    return data;
  }

  async getPublicSystemSetting(key: string) {
    const allowedKeys = ['terms_of_use', 'privacy_policy'];
    if (!allowedKeys.includes(key)) {
      throw new Error(`Acesso negado: a configuração '${key}' não é pública.`);
    }

    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value, description, updated_at')
      .eq('key', key)
      .single();

    if (error) throw error;
    return data;
  }

  async updateSystemSetting(adminId: string, key: string, value: string) {
    const requester = await this.getRequesterAdmin(adminId);
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('system_settings')
      .update({ value, updated_at: new Date() })
      .eq('key', key)
      .select()
      .single();

    if (error) throw error;

    await this.logActivity(
      requester.id,
      requester.email,
      requester.name,
      'update_setting',
      { key, value, description: `Alterou a configuração do sistema "${key}" para "${value}".` }
    );

    return data;
  }

  async syncExchangeRate(adminId?: string) {
    try {
      const token = this.configService.get<string>('AWESOME_API_TOKEN');
      const url = `https://economia.awesomeapi.com.br/json/last/USD-BRL${token ? `?token=${token}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 403 || response.status === 429) {
          console.warn('AwesomeAPI: Quota exceeded ou Rate limited. Mantendo taxa atual.');
          return { success: false, error: 'Quota exceeded' };
        }
        throw new Error(`AwesomeAPI error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.USDBRL || !data.USDBRL.bid) {
        throw new Error('Dados de câmbio inválidos recebidos');
      }

      const bid = data.USDBRL.bid;
      const supabase = this.supabaseService.getClient();
      
      const { data: updateData, error } = await supabase
        .from('system_settings')
        .update({ value: bid, updated_at: new Date() })
        .eq('key', 'brl_rate')
        .select()
        .single();

      if (error) throw error;

      if (adminId) {
        const requester = await this.getRequesterAdmin(adminId);
        await this.logActivity(
          requester.id,
          requester.email,
          requester.name,
          'sync_exchange',
          { rate: bid, description: `Sincronizou a taxa de câmbio USD-BRL manualmente para R$ ${bid}.` }
        );
      }

      return { success: true, rate: bid };
    } catch (error) {
      console.error('Erro ao sincronizar taxa de câmbio:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getAiModels() {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models');
      const json = await response.json();

      // Filtrar apenas modelos que suportam texto como entrada e saída
      // E remover modelos que são apenas para imagens ou áudio
      const textModels = json.data.filter((model: any) => {
        const modalities = model.architecture?.modality || '';
        const inputModalities = model.architecture?.input_modalities || [];
        const outputModalities = model.architecture?.output_modalities || [];

        return (
          modalities.includes('text->text') ||
          (inputModalities.includes('text') && outputModalities.includes('text'))
        );
      });

      return textModels.map((model: any) => ({
        id: model.id,
        name: model.name,
        description: model.description,
        context_length: model.context_length,
        pricing: {
          prompt: model.pricing?.prompt || "0",
          completion: model.pricing?.completion || "0"
        }
      }));
    } catch (error) {
      console.error('Erro ao buscar modelos do OpenRouter:', error);
      return [];
    }
  }

  async clearSemanticCache(adminId: string) {
    const requester = await this.getRequesterAdmin(adminId);
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase
      .from('magisterium_cache')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) throw error;

    await this.logActivity(
      requester.id,
      requester.email,
      requester.name,
      'clear_cache',
      { description: 'Limpou o cache semântico de respostas de IA (Magistério).' }
    );

    return { success: true };
  }

  async toggleMaintenanceMode(adminId: string) {
    const requester = await this.getRequesterAdmin(adminId);
    const supabase = this.supabaseService.getClient();

    // Get current status
    const { data: current } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();

    const isEnabled = current?.value === 'true';
    const newValue = !isEnabled;

    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key: 'maintenance_mode',
        value: String(newValue),
        updated_at: new Date()
      }, { onConflict: 'key' });

    if (error) throw error;

    await this.logActivity(
      requester.id,
      requester.email,
      requester.name,
      'toggle_maintenance',
      { 
        enabled: newValue, 
        description: `${newValue ? 'Ativou' : 'Desativou'} o Modo de Manutenção do sistema.` 
      }
    );

    return { success: true, enabled: newValue };
  }

  async clearUserData(adminId: string, userId: string) {
    const requester = await this.getRequesterAdmin(adminId);
    const supabase = this.supabaseService.getClient();

    // Busca usuário alvo
    const { data: targetUser } = await supabase
      .from('users')
      .select('phone, name')
      .eq('id', userId)
      .single();

    // 1. Deletar mensagens (Histórico)
    const { error: msgError } = await supabase
      .from('messages')
      .delete()
      .eq('user_id', userId);

    if (msgError) throw msgError;

    // 2. Deletar contextos (Análise Pastoral / Resumo / Interesses)
    const { error: ctxError } = await supabase
      .from('user_contexts')
      .delete()
      .eq('user_id', userId);

    if (ctxError) throw ctxError;

    // 3. Resetar status do usuário para 'disabled'
    const { error: userError } = await supabase
      .from('users')
      .update({ 
        status: 'disabled',
        expectations: null
      })
      .eq('id', userId);

    if (userError) throw userError;

    await this.logActivity(
      requester.id,
      requester.email,
      requester.name,
      'clear_user_data',
      { 
        target_user_id: userId,
        target_user_name: targetUser?.name || 'Desconhecido',
        target_user_phone: targetUser?.phone || 'Desconhecido',
        description: `Excluiu permanentemente o histórico e análise pastoral do fiel ${targetUser?.name || 'Desconhecido'} (${targetUser?.phone || 'Desconhecido'}).` 
      }
    );

    return { success: true };
  }

  async updateUserSubscription(adminId: string, userId: string, tier: string, expiresAt: string | null) {
    const requester = await this.getRequesterAdmin(adminId);
    const supabase = this.supabaseService.getClient();

    // Busca usuário alvo
    const { data: targetUser } = await supabase
      .from('users')
      .select('name, phone, subscription_tier')
      .eq('id', userId)
      .single();

    const updateData: any = {
      subscription_tier: tier,
      subscription_expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      updated_at: new Date()
    };

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    await this.logActivity(
      requester.id,
      requester.email,
      requester.name,
      'update_subscription',
      { 
        target_user_id: userId,
        target_user_name: targetUser?.name || 'Desconhecido',
        old_tier: targetUser?.subscription_tier,
        new_tier: tier,
        expires_at: expiresAt,
        description: `Alterou a assinatura do fiel ${targetUser?.name || 'Desconhecido'} para o plano ${tier.toUpperCase()}${expiresAt ? ` (Expira em: ${new Date(expiresAt).toLocaleDateString('pt-BR')})` : ''}.` 
      }
    );

    return { success: true, data };
  }

  async updateUserSettings(adminId: string, userId: string, isPaused: boolean, monthlyLimitBrl: number | null) {
    const requester = await this.getRequesterAdmin(adminId);
    const supabase = this.supabaseService.getClient();

    // Busca usuário alvo
    const { data: targetUser } = await supabase
      .from('users')
      .select('name, phone, is_paused, monthly_limit_brl')
      .eq('id', userId)
      .single();

    const updateData: any = {
      is_paused: isPaused,
      monthly_limit_brl: monthlyLimitBrl,
      updated_at: new Date()
    };

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    await this.logActivity(
      requester.id,
      requester.email,
      requester.name,
      'update_user_settings',
      { 
        target_user_id: userId,
        target_user_name: targetUser?.name || 'Desconhecido',
        is_paused: isPaused,
        monthly_limit_brl: monthlyLimitBrl,
        description: `Atualizou configurações do fiel ${targetUser?.name || 'Desconhecido'}: ${isPaused ? 'Pausou o bot' : 'Ativou o bot'}, Limite de Bônus: ${monthlyLimitBrl !== null ? `R$ ${monthlyLimitBrl}` : 'Sem limite'}.` 
      }
    );

    return { success: true, data };
  }

  async createAdmin(requesterId: string, email: string, name: string, role: string) {
    const requester = await this.getRequesterAdmin(requesterId);
    if (requester.role !== 'superadmin') {
      throw new UnauthorizedException('Apenas superadministradores podem convidar novos administradores.');
    }

    const supabase = this.supabaseService.getClient();

    // 1. Cria usuário no Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'MarIA123',
      email_confirm: true,
    });

    if (authError) {
      throw new BadRequestException(`Erro ao criar usuário no Supabase Auth: ${authError.message}`);
    }

    // 2. Insere na tabela public.admins
    const { error: dbError } = await supabase.from('admins').insert({
      id: authUser.user.id,
      email,
      name,
      role,
      requires_password_change: true,
    });

    if (dbError) {
      // Rollback se falhar
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw new BadRequestException(`Erro ao salvar perfil do administrador no banco: ${dbError.message}`);
    }

    // 3. Grava log de atividade
    await this.logActivity(
      requester.id,
      requester.email,
      requester.name,
      'create_admin',
      {
        target_email: email,
        target_name: name,
        target_role: role,
        description: `Convidou o administrador ${name} (${email}) com o cargo ${role}.`
      }
    );

    return { success: true, user: { id: authUser.user.id, email, name, role } };
  }

  async updateAdmin(requesterId: string, targetId: string, name: string, role: string, password?: string) {
    const requester = await this.getRequesterAdmin(requesterId);
    if (requester.role !== 'superadmin') {
      throw new UnauthorizedException('Apenas superadministradores podem editar administradores.');
    }

    const supabase = this.supabaseService.getClient();

    // 1. Busca admin alvo
    const { data: targetAdmin, error: targetError } = await supabase
      .from('admins')
      .select('email, name, role')
      .eq('id', targetId)
      .single();

    if (targetError || !targetAdmin) {
      throw new BadRequestException('Administrador alvo não encontrado.');
    }

    // 2. Atualiza no Supabase Auth (se senha informada)
    if (password && password.trim() !== '') {
      const { error: authError } = await supabase.auth.admin.updateUserById(targetId, {
        password: password,
      });
      if (authError) {
        throw new BadRequestException(`Erro ao redefinir senha no Supabase Auth: ${authError.message}`);
      }
    }

    // 3. Atualiza na tabela public.admins
    const { error: dbError } = await supabase
      .from('admins')
      .update({
        name,
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetId);

    if (dbError) {
      throw new BadRequestException(`Erro ao atualizar perfil do administrador: ${dbError.message}`);
    }

    // 4. Grava log de auditoria
    const changes: any = {
      target_email: targetAdmin.email,
      target_name: name,
      target_role: role,
      description: `Editou o administrador ${name} (${targetAdmin.email}).`
    };
    if (password) {
      changes.password_changed = true;
      changes.description += ' (Senha alterada)';
    }

    await this.logActivity(
      requester.id,
      requester.email,
      requester.name,
      'edit_admin',
      changes
    );

    return { success: true };
  }

  async deleteAdmin(requesterId: string, targetId: string) {
    const requester = await this.getRequesterAdmin(requesterId);
    if (requester.role !== 'superadmin') {
      throw new UnauthorizedException('Apenas superadministradores podem excluir administradores.');
    }

    if (requester.id === targetId) {
      throw new BadRequestException('Você não pode excluir o seu próprio usuário administrador.');
    }

    const supabase = this.supabaseService.getClient();

    // 1. Busca admin alvo para logs
    const { data: targetAdmin, error: targetError } = await supabase
      .from('admins')
      .select('email, name')
      .eq('id', targetId)
      .single();

    if (targetError || !targetAdmin) {
      throw new BadRequestException('Administrador alvo não encontrado.');
    }

    // 2. Exclui no Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(targetId);
    if (authError) {
      throw new BadRequestException(`Erro ao remover do Supabase Auth: ${authError.message}`);
    }

    // 3. Exclui da tabela public.admins
    const { error: dbError } = await supabase
      .from('admins')
      .delete()
      .eq('id', targetId);

    if (dbError) {
      throw new BadRequestException(`Erro ao excluir perfil do banco de dados: ${dbError.message}`);
    }

    // 4. Grava log
    await this.logActivity(
      requester.id,
      requester.email,
      requester.name,
      'delete_admin',
      {
        target_email: targetAdmin.email,
        target_name: targetAdmin.name,
        description: `Excluiu permanentemente o acesso do administrador ${targetAdmin.name} (${targetAdmin.email}).`
      }
    );

    return { success: true };
  }

  async getAdminActivities(requesterId: string, targetId?: string) {
    const requester = await this.getRequesterAdmin(requesterId);
    if (requester.role !== 'superadmin') {
      throw new UnauthorizedException('Apenas superadministradores podem visualizar logs de auditoria.');
    }

    const supabase = this.supabaseService.getClient();
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (targetId) {
      query = query.eq('admin_id', targetId);
    }

    const { data, error } = await query.limit(200);
    if (error) throw error;
    return data;
  }
}

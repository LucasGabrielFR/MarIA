import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PromptService } from './prompt.service';
import { MagisteriumService } from './magisterium.service';
import { LiturgyService } from './liturgy.service';
import { SupabaseService } from '../supabase/supabase.service';
import { EmbeddingService } from './embedding.service';
import { ModuleRef } from '@nestjs/core';
import { AsaasService } from '../asaas/asaas.service';
import { PlansService } from '../plans/plans.service';

const MAGISTERIUM_INSTRUCTION =
  '\n\nOBRIGATÓRIO: Ao final da sua resposta, você deve listar as referências exatas de onde a informação foi extraída. ' +
  'RETIRE as citações numéricas no texto (ex: [^1]) e crie uma seção "*Referências:*" ao final com a lista completa formatada para WhatsApp. ' +
  'ATENÇÃO: As fontes informadas devem ser OBRIGATORIAMENTE traduzidas para o português sempre que possível (exceto nomes oficiais de documentos em latim). É essencial que você forneça TODAS as fontes.';

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private readonly openRouterApiKey: string;
  private model: string = 'openai/gpt-4o-mini';
  private bridgeModel: string = 'google/gemini-2.5-flash-lite';

  private asaasService: AsaasService;
  private plansService: PlansService;

  constructor(
    private readonly promptService: PromptService,
    private readonly magisteriumService: MagisteriumService,
    private readonly liturgyService: LiturgyService,
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly embeddingService: EmbeddingService,
    private readonly moduleRef: ModuleRef,
  ) {
    this.openRouterApiKey =
      this.configService.get<string>('OPENROUTER_API_KEY') || '';
    // Inicializar com variáveis de ambiente se disponíveis, caso contrário usar defaults
    this.model =
      this.configService.get<string>('OPENROUTER_GPT_MODEL') || 'openai/gpt-4o-mini';
    this.bridgeModel =
      this.configService.get<string>('OPENROUTER_BRIDGE_MODEL') ||
      'google/gemini-2.5-flash-lite';
  }

  async onModuleInit() {
    this.logger.log('Inicializando configurações de modelo da IA...');
    try {
      const [main, bridge] = await Promise.all([
        this.getSystemSetting('main_model', this.model),
        this.getSystemSetting('bridge_model', this.bridgeModel),
      ]);
      this.model = main;
      this.bridgeModel = bridge;
      this.logger.log(
        `Modelos configurados: Principal=${this.model}, Bridge=${this.bridgeModel}`,
      );
    } catch (error) {
      this.logger.warn(
        'Falha ao carregar modelos do banco, usando defaults.',
        error,
      );
    }
  }

  /**
   * Obtém uma configuração do sistema do banco de dados.
   */
  private async getSystemSetting(
    key: string,
    defaultValue: string,
  ): Promise<string> {
    try {
      const supabase = this.supabaseService.getClient();
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', key)
        .single();
      return data?.value || defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  /**
   * Helper function to call OpenRouter API
   */
  async callOpenRouter(
    systemPrompt: string,
    userMessage: string,
    isJsonMode = false,
    history: any[] = [],
    modelOverride?: string,
    temperatureOverride?: number,
  ): Promise<{
    content: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }> {
    try {
      const messagesPayload = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage },
      ];

      const model = modelOverride || this.model || 'openai/gpt-4o-mini';

      // Configuração para ferramentas (DuckDuckGo Search)
      // Só ativamos ferramentas em certas condições (ex: não json, chat normal, não utilitário)
      // Aqui vamos ativar para o model default e flash, e evitar em json mode
      const useTools = !isJsonMode && (model.includes('gpt') || model.includes('gemini'));
      const tools = useTools ? [
        {
          type: 'function',
          function: {
            name: 'search_web',
            description: 'Pesquisa informações recentes, notícias ou fatos atuais na internet.',
            parameters: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'O termo de busca otimizado para o buscador' }
              },
              required: ['query']
            }
          }
        }
      ] : undefined;

      const headers = {
        Authorization: `Bearer ${this.openRouterApiKey}`,
        'HTTP-Referer': 'https://maria.acutistech.com.br',
        'X-Title': 'MarIA Assistant',
        'Content-Type': 'application/json',
      };

      const defaultTemp = isJsonMode ? 0.1 : 0.7;
      const temperature = temperatureOverride !== undefined ? temperatureOverride : defaultTemp;

      let response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model,
            messages: messagesPayload,
            response_format: isJsonMode ? { type: 'json_object' } : undefined,
            temperature: temperature,
            tools,
          }),
          signal: AbortSignal.timeout(30_000),
        },
      );

      let data = await response.json();
      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${JSON.stringify(data)}`);
      }

      // Check for tool calls
      if (data.choices?.[0]?.message?.tool_calls && data.choices[0].message.tool_calls.length > 0) {
        const toolCall = data.choices[0].message.tool_calls[0];
        if (toolCall.function.name === 'search_web') {
          const args = JSON.parse(toolCall.function.arguments || '{}');
          
          this.logger.debug(`Executando busca na web (DuckDuckGo): ${args.query}`);
          const searchResult = await this.searchWeb(args.query);

          messagesPayload.push(data.choices[0].message);
          messagesPayload.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: 'search_web',
            content: searchResult
          });

          // Second call
          response = await fetch(
            'https://openrouter.ai/api/v1/chat/completions',
            {
              method: 'POST',
              headers,
              body: JSON.stringify({
                model,
                messages: messagesPayload,
                temperature: 0.7,
              }),
              signal: AbortSignal.timeout(30_000),
            }
          );
          data = await response.json();
        }
      }

      let content = data.choices?.[0]?.message?.content;
      if (typeof content !== 'string') {
        throw new Error(
          `OpenRouter retornou resposta inválida (sem choices): ${JSON.stringify(data)}`,
        );
      }

      // Filtrar qualquer resquício de link indesejado caso a IA teime em criar
      content = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

      return {
        content,
        usage: data.usage,
      };
    } catch (error) {
      this.logger.error('Erro ao chamar OpenRouter', error);
      throw error;
    }
  }

  /**
   * Executa busca limpa no DuckDuckGo para fornecer contexto de notícias (Sem links)
   */
  private async searchWeb(query: string): Promise<string> {
    try {
      if (!query) return "Termo de busca vazio.";
      // Import dinâmico para não falhar se o pacote não tiver sido buildado ainda
      const duckduckgo = await import('duck-duck-scrape');
      
      // Para evitar dados defasados, adicionamos o ano e mês atual na query
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1; // 1-12
      const enhancedQuery = `${query} ${currentMonth}/${currentYear}`;
      
      this.logger.debug(`Busca melhorada com contexto temporal: ${enhancedQuery}`);
      
      // Tenta usar a busca de notícias primeiro (searchNews) se existir, senão usa a busca normal com tempo restrito
      let results;
      if (typeof duckduckgo.searchNews === 'function') {
        try {
          results = await duckduckgo.searchNews(enhancedQuery);
        } catch (e) {
          results = await duckduckgo.search(enhancedQuery, { time: 'y' });
        }
      } else {
        results = await duckduckgo.search(enhancedQuery, { time: 'y' });
      }

      if (!results || !results.results || results.results.length === 0) {
        return "Nenhum resultado de busca encontrado na internet para esse termo no momento atual.";
      }
      
      // Retorna apenas títulos e resumos para evitar links na resposta da IA
      return results.results
        .slice(0, 3)
        .map(r => `Fonte: ${r.title}\nResumo: ${r.description || r.excerpt || r.body || 'Sem resumo'}`)
        .join('\n\n---\n\n');
    } catch (error) {
      this.logger.error('Erro ao buscar no DuckDuckGo', error);
      return "Ocorreu um erro ao buscar informações atuais. Continue respondendo com o que você já sabe.";
    }
  }

  /**
   * Descobre a intenção do usuário e quais regras de contexto aplicar.
   */
  async determineIntent(
    message: string,
  ): Promise<{ intent: string; rules: string[] }> {
    const bridgeModel = await this.getSystemSetting(
      'bridge_model',
      this.configService.get<string>('OPENROUTER_BRIDGE_MODEL') || 'google/gemini-2.5-flash-lite',
    );
    const routerPrompt = this.promptService.getPrompt('intent_router');
    if (!routerPrompt) return { intent: 'CASUAL', rules: [] };

    try {
      const { content, usage } = await this.callOpenRouter(
        routerPrompt,
        message,
        true,
        [],
        bridgeModel,
      );

      // Logs intent routing usage (internal)
      this.logger.debug(`Intent Router usage: ${JSON.stringify(usage)}`);

      const result = JSON.parse(content);
      return {
        intent: result.intent || 'CASUAL',
        rules: result.rules || [],
      };
    } catch (error) {
      this.logger.warn(
        'Falha ao determinar intent/rules, usando fallback',
        error,
      );
      return { intent: 'CASUAL', rules: [] };
    }
  }

  /**
   * Obtém ou cria o usuário baseado no wa_chatid.
   */
  private async getOrCreateUser(
    waChatId: string,
    pushName?: string,
    phone?: string,
    affiliateCode?: string | null,
  ): Promise<any> {
    const supabase = this.supabaseService.getClient();
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('wa_chatid', waChatId)
      .single();

    if (!user) {
      const insertData: any = {
        wa_chatid: waChatId,
        status: 'triage_intro', // Novo fluxo começa em triage_intro
        subscription_tier: 'free',
      };
      if (phone) insertData.phone = phone;
      if (affiliateCode) insertData.affiliate_code = affiliateCode;

      const { data: newUser, error } = await supabase
        .from('users')
        .insert(insertData)
        .select('*')
        .single();
      if (error) throw new Error(`Falha ao criar usuário: ${error.message}`);
      user = newUser;
    } else if (affiliateCode && user.affiliate_code !== affiliateCode) {
      // Atualiza o código se for diferente
      await supabase.from('users').update({ affiliate_code: affiliateCode }).eq('id', user.id);
      user.affiliate_code = affiliateCode;
    }
    return user;
  }

  private async checkSubscriptionLimits(
    user: any,
  ): Promise<{ allowed: boolean; reason?: string }> {
    // 1. Verificar expiração
    if (user.subscription_expires_at) {
      const expiration = new Date(user.subscription_expires_at);
      if (expiration < new Date()) {
        // Se expirou, volta para o plano free
        const supabase = this.supabaseService.getClient();
        await supabase
          .from('users')
          .update({ subscription_tier: 'free', subscription_expires_at: null })
          .eq('id', user.id);
        user.subscription_tier = 'free';
      }
    }

    // 2. Verificar limite personalizado de bônus em reais (BRL)
    if (
      user.monthly_limit_brl !== null &&
      user.monthly_limit_brl !== undefined
    ) {
      const brlCost = await this.calculateMonthlyBrlCost(user.id);
      if (brlCost >= Number(user.monthly_limit_brl)) {
        return {
          allowed: false,
          reason: `Você atingiu seu limite de bônus de R$ ${Number(user.monthly_limit_brl).toFixed(2)}. Entre em contato com o administrador para mais informações.`,
        };
      }
    }

    // Admins e usuários ilimitados não têm restrições de tier
    if (
      user.subscription_tier === 'unlimited' ||
      user.subscription_tier === 'admin'
    ) {
      return { allowed: true };
    }

    // Limites por tier
    const limits = {
      free: 20,
      basic: 100,
      premium: 300,
    };

    const monthlyLimit =
      limits[user.subscription_tier as keyof typeof limits] ?? 0;

    const isFree = user.subscription_tier === 'free';
    const count = isFree
      ? await this.countTotalMessages(user.id)
      : await this.countMonthlyMessages(user.id);

    if (count >= monthlyLimit) {
      const planName = isFree ? 'Gratuito' : user.subscription_tier === 'basic' ? 'Básico' : 'Premium';
      
      let reasonText = '';
      if (isFree) {
        const customPrompt = this.promptService.getPrompt('free_tier_block');
        reasonText = customPrompt 
          ? customPrompt.replace('{monthlyLimit}', monthlyLimit.toString()) 
          : `Você atingiu seu limite de ${monthlyLimit} mensagens gratuitas. Seu apoio é fundamental para mantermos a MarIA ativa! Gostaria de fazer uma assinatura e continuar conversando?`;
      } else {
        const customPrompt = this.promptService.getPrompt('usage_limit_reached');
        reasonText = customPrompt
          ? customPrompt.replace('{monthlyLimit}', monthlyLimit.toString()).replace('{planName}', planName)
          : `Você atingiu seu limite mensal de ${monthlyLimit} mensagens no plano ${planName}. Seu apoio é fundamental para mantermos a MarIA ativa! Gostaria de fazer um upgrade ou renovar seu plano?`;
      }
      
      return {
        allowed: false,
        reason: reasonText,
      };
    }

    return { allowed: true };
  }

  private async countMonthlyMessages(userId: string): Promise<number> {
    const supabase = this.supabaseService.getClient();
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('role', 'user')
      .eq('is_llm', true) // Apenas conta interações com IA
      .gte('created_at', firstDayOfMonth.toISOString());

    if (error) {
      this.logger.error(`Erro ao contar mensagens mensais: ${error.message}`);
      return 0;
    }

    return count || 0;
  }

  private async countTotalMessages(userId: string): Promise<number> {
    const supabase = this.supabaseService.getClient();

    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('role', 'user')
      .eq('is_llm', true); // Apenas conta interações com IA

    if (error) {
      this.logger.error(`Erro ao contar mensagens totais: ${error.message}`);
      return 0;
    }

    return count || 0;
  }

  private async calculateMonthlyBrlCost(userId: string): Promise<number> {
    const supabase = this.supabaseService.getClient();
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const { data: usageLogs, error } = await supabase
      .from('usage_logs')
      .select('model, prompt_tokens, completion_tokens, total_tokens')
      .eq('user_id', userId)
      .gte('created_at', firstDayOfMonth.toISOString());

    if (error || !usageLogs) {
      this.logger.error(
        `Erro ao buscar usage logs para custo BRL: ${error?.message}`,
      );
      return 0;
    }

    const { data: brlRateSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'brl_rate')
      .single();

    const brlRate = parseFloat(brlRateSetting?.value || '5.50');

    // Preços por token (USD)
    const modelPrices: Record<string, { input: number; output: number }> = {
      'openai/gpt-4o-mini': { input: 0.15 / 1000000, output: 0.6 / 1000000 },
      'openai/gpt-4o': { input: 2.5 / 1000000, output: 10.0 / 1000000 },
      'google/gemini-2.5-flash-lite': {
        input: 0.1 / 1000000,
        output: 0.4 / 1000000,
      },
      'magisterium-expert': { input: 1.0 / 1000000, output: 1.0 / 1000000 },
    };

    let totalCostUsd = 0;
    for (const log of usageLogs) {
      const modelKey = log.model || 'openai/gpt-4o-mini';
      const prices = modelPrices[modelKey] || modelPrices['openai/gpt-4o-mini'];

      const cost =
        (log.prompt_tokens || 0) * prices.input +
        (log.completion_tokens || 0) * prices.output;
      totalCostUsd += cost;
    }

    return totalCostUsd * brlRate;
  }

  /**
   * Busca as últimas N mensagens do histórico.
   */
  private async getChatHistory(userId: string, limit = 15): Promise<any[]> {
    const supabase = this.supabaseService.getClient();
    const { data: messages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!messages) return [];

    // Inverter para a ordem cronológica
    return messages
      .reverse()
      .map((m) => ({ role: m.role, content: m.content }));
  }

  /**
   * Salva uma mensagem no banco de dados.
   * Lança exceção se o insert falhar — evita que userMessageId fique undefined
   * e subsequentes .eq('id', undefined) atualizem registros errados.
   */
  private async saveMessage(
    userId: string,
    role: string,
    content: string,
    isLlm = false,
  ): Promise<string> {
    const supabase = this.supabaseService.getClient();
    const { data: msg, error } = await supabase
      .from('messages')
      .insert({ user_id: userId, role, content, is_llm: isLlm })
      .select('id')
      .single();

    if (error || !msg?.id) {
      throw new Error(
        `Falha ao salvar mensagem no banco: ${error?.message ?? 'id não retornado'}`,
      );
    }

    return msg.id;
  }

  /**
   * Condensa o contexto do usuário a cada 10 novas mensagens.
   */
  private async updateContextIfNeeded(userId: string, lastMessageId: string) {
    const supabase = this.supabaseService.getClient();

    // 1. Busca contexto atual
    const { data: context } = await supabase
      .from('user_contexts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // 2. Conta mensagens desde o último processamento
    let query = supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    if (context?.last_processed_message_id) {
      // Busca a data da última mensagem processada para contar apenas as novas
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('created_at')
        .eq('id', context.last_processed_message_id)
        .maybeSingle();

      if (lastMsg) {
        query = query.gt('created_at', lastMsg.created_at);
      }
    }

    const { count } = await query;

    // 3. Se tivermos 10 ou mais novas mensagens, atualizar resumo
    if (count && count >= 10) {
      this.logger.log(
        `Atingido limite de 10 mensagens para o usuário ${userId}. Iniciando condensação de contexto...`,
      );

      // Busca as últimas 10 mensagens exatas para o processamento
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      const conversationText =
        recentMessages
          ?.reverse()
          .map(
            (m) => `${m.role === 'user' ? 'Usuário' : 'MarIA'}: ${m.content}`,
          )
          .join('\n') || '';

      // Prompt aprimorado: Contexto Anterior + 10 Últimas Mensagens
      const summarizationPrompt = (
        this.promptService.getPrompt('memory_summarization') || ''
      )
        .replace(
          '{{previous_summary}}',
          context?.general_summary || 'Nenhum histórico disponível ainda.',
        )
        .replace('{{recent_messages}}', conversationText);

      const mainModel = await this.getSystemSetting(
        'main_model',
        'openai/gpt-4o-mini',
      );
      const { content: newSummary, usage } = await this.callOpenRouter(
        summarizationPrompt,
        'Gere o resumo consolidado.',
        false,
        [],
        mainModel,
      );

      if (usage) await this.logUsage(userId, usage, mainModel);

      // Extração de Interesses (Badges) - Também usando apenas as 10 mensagens
      const interestExtractorPrompt = (
        this.promptService.getPrompt('interest_extractor') || ''
      ).replace(
        '{{previous_interests}}',
        JSON.stringify(context?.interests || []),
      );

      const { content: interestsJson } = await this.callOpenRouter(
        interestExtractorPrompt,
        conversationText,
        true,
        [],
        mainModel,
      );
      let interests = context?.interests || [];
      try {
        const extracted = JSON.parse(interestsJson);
        if (Array.isArray(extracted)) interests = extracted;
      } catch (e) {
        this.logger.warn(
          `Falha ao extrair interesses para o usuário ${userId}`,
        );
      }

      // 4. Atualizar ou Criar no banco
      const updateData = {
        general_summary: newSummary,
        interests: interests,
        last_processed_message_id: lastMessageId,
        updated_at: new Date().toISOString(),
      };

      if (context) {
        await supabase
          .from('user_contexts')
          .update(updateData)
          .eq('user_id', userId);
      } else {
        await supabase.from('user_contexts').insert({
          user_id: userId,
          ...updateData,
        });
      }
      this.logger.log(
        `Contexto e interesses atualizados com sucesso para o usuário ${userId}.`,
      );
    }
  }

  /**
   * Processa a mensagem do usuário baseada no seu status atual.
   * Representa a Máquina de Estados da Conversa.
   */
  async processMessage(
    waChatId: string,
    message: string,
    pushName?: string,
    phone?: string,
    affiliateCode?: string | null,
  ): Promise<any> {
    const supabase = this.supabaseService.getClient();

    // 1. Verificar Modo de Manutenção
    const { data: maintenanceSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();

    if (maintenanceSetting?.value === 'true') {
      return this.promptService.getPrompt('maintenance_message');
    }

    const user = await this.getOrCreateUser(waChatId, pushName, phone, affiliateCode);
    const userId = user.id;

    // 2. Verificar se o bot está pausado para este fiel (Pausa Pastoral)
    if (user.is_paused) {
      this.logger.log(
        `Pausa Pastoral ativa para o usuário ${userId}. Nenhuma resposta da IA será gerada.`,
      );
      await this.saveMessage(userId, 'user', message, false);
      return null;
    }

    let userStatus = user.status || 'active';

    if (userStatus.startsWith('flow:')) {
      await this.saveMessage(userId, 'user', message, false);
      const flowResponse = await this.handleFlowStep(user, userStatus, message);
      if (typeof flowResponse === 'string') {
        await this.saveMessage(userId, 'assistant', flowResponse, false);
      } else if (flowResponse && flowResponse.type === 'interactive') {
        await this.saveMessage(userId, 'assistant', flowResponse.text, false);
      }
      return flowResponse;
    }

    // Se o usuário estava 'disabled', resetar para triagem
    if (userStatus === 'disabled') {
      this.logger.log(
        `Usuário ${userId} (disabled) entrou em contato. Resetando para triagem.`,
      );
      await supabase
        .from('users')
        .update({ status: 'triage_intro', name: null })
        .eq('id', userId);
      userStatus = 'triage_intro';
      user.status = 'triage_intro';
      user.name = null;
    }

    // Limites de assinatura foram movidos para depois da triagem e detecção de utilitários

    // Salvar a mensagem do usuário (inicialmente is_llm: false)
    const userMessageId = await this.saveMessage(
      userId,
      'user',
      message,
      false,
    );

    const corePersona = this.promptService.getCorePersona();

    // --- MÁQUINA DE ESTADOS (TRIAGEM) ---

    // 1. Triagem Inicial (Nome)
    if (userStatus === 'triage_intro' || userStatus === 'triage_name') {
      // Removido update de is_llm = true para não consumir cotas na triagem

      const extractionNamePrompt = (
        this.promptService.getPrompt('extractor_name') || ''
      ).replace('{{message}}', message);
      const { content: extractedName } = await this.callOpenRouter(
        extractionNamePrompt,
        `Mensagem do usuário: ${message}`,
        false,
      );

      const updateData: any = {};
      let nameFound = false;

      if (extractedName && extractedName.toLowerCase() !== 'null') {
        updateData.name = extractedName.replace(/[".]/g, '').trim();
        nameFound = true;
      }

      if (nameFound) {
        updateData.gender = await this.extractGenderFromName(updateData.name);

        await supabase
          .from('users')
          .update({ ...updateData, status: 'triage_presentation_subscription' })
          .eq('id', userId);
        userStatus = 'triage_presentation_subscription';
        user.name = updateData.name; // <--- Atualiza na memória para o próximo bloco!
        user.gender = updateData.gender;

      } else {
        const { data: flowData } = await supabase
          .from('automatic_flows')
          .select('steps')
          .eq('key', 'welcome_flow')
          .single();
          
        const response = flowData?.steps?.['ask_name']?.text || 'Olá! Como você se chama?';

        if (userStatus === 'triage_intro') {
          await supabase
            .from('users')
            .update({ status: 'triage_name' })
            .eq('id', userId);
        }

        await this.saveMessage(userId, 'assistant', response, false);
        return response;
      }
    }

    // 2. Apresentação Detalhada
    if (userStatus === 'triage_presentation_subscription') {
      const { data: flowData } = await supabase
        .from('automatic_flows')
        .select('steps')
        .eq('key', 'welcome_flow')
        .single();
        
      let presentationPrompt = flowData?.steps?.['presentation']?.text || 'Seja bem-vindo(a), {nome}!';

      const userName = user.name || 'amigo(a)';
      const response = presentationPrompt
        .replace(/{{nome}}/gi, userName)
        .replace(/{nome}/gi, userName);

      await Promise.all([
        supabase.from('users').update({ status: 'active' }).eq('id', userId),
        this.saveMessage(userId, 'assistant', response, false),
      ]);
      return response;
    }

    // --- FLUXO ATIVO ---
    const isFree = user.subscription_tier === 'free';
    let { intent, rules } = await this.determineIntent(message);

    // Interceptar intenção de LITURGY explícita
    const lowerMsg = message.toLowerCase().trim();
    if (
      lowerMsg.includes('evangelho do dia') ||
      lowerMsg.includes('evangelho de hoje') ||
      lowerMsg.includes('leituras do dia') ||
      lowerMsg.includes('leitura de hoje') ||
      lowerMsg.includes('liturgia do dia') ||
      lowerMsg.includes('liturgia de hoje') ||
      lowerMsg.includes('liturgia diaria')
    ) {
      intent = 'LITURGY';
    } else if (lowerMsg === 'liturgy_short') {
      intent = 'LITURGY_SHORT';
    } else if (lowerMsg === 'liturgy_full') {
      intent = 'LITURGY_FULL';
    }
    
    // Interceptar intenção de TERÇO
    if (
      lowerMsg === 'como rezar o terço' ||
      lowerMsg === 'como rezar o terço?' ||
      lowerMsg === 'como se reza o terço' ||
      lowerMsg === 'como rezar o rosário' ||
      lowerMsg === 'como rezar o rosario' ||
      lowerMsg === 'roteiro do terço' ||
      lowerMsg.includes('ensina a rezar o terço') ||
      lowerMsg.includes('passo a passo do terço')
    ) {
      intent = 'ROSARY_GUIDE';
    } else if (
      lowerMsg.includes('quais os mistérios') ||
      lowerMsg.includes('quais os misterios') ||
      lowerMsg.includes('mistérios de hoje') ||
      lowerMsg.includes('misterios de hoje') ||
      lowerMsg.includes('mistérios do terço') ||
      lowerMsg.includes('misterios do terco')
    ) {
      intent = 'ROSARY_MYSTERIES';
    }

    // Interceptar intenção de assinatura / upgrade
    const isManagementQuery =
      lowerMsg.includes('cancelar') ||
      lowerMsg.includes('minha assinatura') ||
      lowerMsg.includes('meu plano') ||
      lowerMsg.includes('gerenciar') ||
      lowerMsg.includes('portal') ||
      lowerMsg.includes('renovar') ||
      lowerMsg.includes('vencimento') ||
      lowerMsg.includes('fatura') ||
      lowerMsg.includes('cobrança');
    const isSubscribeRequest =
      !isManagementQuery &&
      (lowerMsg.includes('assinar') ||
        lowerMsg.includes('assinatura') ||
        lowerMsg.includes('planos') ||
        lowerMsg.includes('mudar plano') ||
        lowerMsg.includes('upgrade') ||
        lowerMsg === 'quero assinar' ||
        intent === 'SUBSCRIBE');

    if (isSubscribeRequest) {
      const userTier = user.subscription_tier || 'free';

      if (userTier === 'premium') {
        const activeWarning =
          'Você já possui o *Plano Premium* ativo, que é o nosso plano máximo! Não é necessário assinar novamente ou fazer upgrade. Caso precise gerenciar sua assinatura, entre em contato com nosso suporte. Que Deus te abençoe! 🙏';
        await this.saveMessage(userId, 'assistant', activeWarning, false);
        return activeWarning;
      }

      // Se for Básico, avisa sobre upgrade e inicia
      let upgradeIntro = '';
      if (userTier === 'basic') {
        upgradeIntro =
          'Identificamos que você possui o *Plano Básico* ativo. Você pode fazer um upgrade para o *Plano Premium* a qualquer momento!\n\nAo assinar o Plano Premium, sua assinatura anterior será cancelada no Asaas assim que o novo pagamento for confirmado para evitar cobranças duplicadas. 👍\n\n';
      }

      // Inicia fluxo
      await supabase
        .from('users')
        .update({
          status: 'flow:subscription_flow:select_plan',
        })
        .eq('id', user.id);

      // Busca mensagens do select_plan do banco
      const { data: flowData } = await supabase
        .from('automatic_flows')
        .select('*')
        .eq('key', 'subscription_flow')
        .single();

      const selectStep = flowData?.steps?.select_plan || {
        text: 'Escolha seu plano:',
        buttons: [],
      };
      const responseText = upgradeIntro + this.formatFlowText(selectStep.text);

      const interactiveResponse = {
        type: 'interactive',
        text: responseText,
        buttons: selectStep.buttons,
      };

      await this.saveMessage(userId, 'assistant', responseText, false);
      return interactiveResponse;
    }

    // Lista de intenções de utilidade (cacheáveis e gratuitas)
    const utilityIntents = [
      'LITURGY',
      'LITURGY_SHORT',
      'LITURGY_FULL',
      'SAINT_OF_DAY',
      'ROSARY_MYSTERIES',
      'ROSARY_GUIDE',
    ];
    const isUtility = utilityIntents.includes(intent);

    // Verificação de Limites: utilitários são isentos, chat normal verifica o limite (incluindo plano gratuito)
    if (!isUtility) {
      const { allowed, reason } = await this.checkSubscriptionLimits(user);
      if (!allowed) {
        return reason || this.promptService.getPrompt('usage_limit_reached');
      }
    }

    let intentContext = '';
    let cachedResponse: string | null = null;
    const mainModel = await this.getSystemSetting(
      'main_model',
      this.configService.get<string>('OPENROUTER_GPT_MODEL') || 'openai/gpt-4o-mini',
    );
    const bridgeModel = await this.getSystemSetting(
      'bridge_model',
      this.configService.get<string>('OPENROUTER_BRIDGE_MODEL') || 'google/gemini-2.5-flash-lite',
    );
    const targetDate = await this.extractTargetDate(message, bridgeModel);

    // Lógica de Contexto por Intenção
    switch (intent) {
      case 'LITURGY':
        // Tenta buscar o fluxo automático para liturgia
        const { data: liturgyFlow } = await supabase
          .from('automatic_flows')
          .select('steps')
          .eq('key', 'liturgy_flow')
          .maybeSingle();

        if (liturgyFlow && liturgyFlow.steps?.choose_format) {
          // Atualiza status do usuário para não prender no fluxo, pois é só uma escolha simples
          // Retornamos logo a mensagem interativa.
          return {
            type: 'interactive',
            text: liturgyFlow.steps.choose_format.text,
            buttons: liturgyFlow.steps.choose_format.buttons,
          };
        }
        
        // Fallback: Se não houver fluxo configurado, retorna a resumida (cache)
        cachedResponse = await this.getDailyCache('liturgy', targetDate);
        if (!cachedResponse) {
          cachedResponse = await this.liturgyService.getDailyLiturgy(targetDate);
        }
        intentContext = `CONTEÚDO DA LITURGIA (${targetDate}):\n${cachedResponse}`;
        break;

      case 'LITURGY_SHORT':
        cachedResponse = await this.getDailyCache('liturgy', targetDate);
        if (!cachedResponse) {
          cachedResponse = await this.liturgyService.getDailyLiturgy(targetDate);
        }
        intentContext = `CONTEÚDO DA LITURGIA (${targetDate}):\n${cachedResponse}`;
        break;

      case 'LITURGY_FULL':
        const fullLiturgy = await this.liturgyService.getDailyLiturgy(targetDate);
        cachedResponse = fullLiturgy;
        intentContext = `CONTEÚDO DA LITURGIA COMPLETA (${targetDate}):\n${cachedResponse}`;
        break;
      case 'SAINT_OF_DAY':
        cachedResponse = await this.getDailyCache('saint', targetDate);
        intentContext = `CONTEÚDO DO SANTO DO DIA (${targetDate}):\n${cachedResponse || 'Informação sobre o santo do dia.'}`;
        break;
      case 'ROSARY_MYSTERIES':
        cachedResponse = await this.getDailyCache('rosary', targetDate);
        intentContext = `MISTÉRIOS DO TERÇO DE HOJE:\n${cachedResponse || 'Mistérios não disponíveis.'}`;
        break;
      case 'ROSARY_GUIDE':
        cachedResponse = this.promptService.getPrompt('guide_terco');
        intentContext = `ROTEIRO DE COMO REZAR O TERÇO:\n${cachedResponse || 'Guia não disponível.'}`;
        break;
      case 'SAINT': // Busca por um santo específico (EXIGE LLM/MAGISTERIUM)
      case 'THEOLOGY':
      case 'PRAYER':
      case 'BIBLE':
      case 'ADVICE':
        // Intenções GENERATIVAS -> Marcar como is_llm: true e processar com LLM
        await supabase
          .from('messages')
          .update({ is_llm: true })
          .eq('id', userMessageId);
        const promptKey = `intent_${intent.toLowerCase()}`;
        const intentPrompt = this.promptService.getPrompt(promptKey);

        if (user.subscription_tier !== 'free') {
          // 1. Consulta o Magisterium passando a dúvida do usuário
          const { content: magisteriumRes, usage: magUsage } =
            await this.magisteriumService.query(
              message,
              'Responda com base no Magistério da Igreja Católica.' // O Magisterium só precisa de uma diretriz técnica, não de persona.
            );
          if (magUsage) await this.logUsage(userId, magUsage, 'magisterium-expert');
          
          // 2. Passa o resultado E a diretriz de persona (intentPrompt) para a MarIA traduzir
          intentContext = `DIRETRIZ DE POSTURA E TRADUÇÃO:\n${intentPrompt}\n\nCONTEÚDO DO MAGISTERIUM (Baseie sua resposta fielmente nisto):\n${magisteriumRes}`;
        } else {
          // Usuário gratuito: responde com a LLM padrão baseando-se nas diretrizes do prompt sem gastar Magisterium
          intentContext = `DIRETRIZ DE POSTURA:\n${intentPrompt}\n\nNota: Responda usando seu próprio conhecimento e treinamento, mantendo a precisão doutrinária e o acolhimento maternal.`;
        }
        break;
      default:
        // Caso padrão também usa LLM para conversa casual
        await supabase
          .from('messages')
          .update({ is_llm: true })
          .eq('id', userMessageId);
        intentContext = this.promptService.getPrompt('intent_casual');
    }

    // Decisão de Resposta: Cache Direto vs LLM
    const { data: msgStatus } = await supabase
      .from('messages')
      .select('is_llm')
      .eq('id', userMessageId)
      .single();
    const isLlmConfirmed = msgStatus?.is_llm || false;

    if (!isLlmConfirmed && cachedResponse) {
      // Conteúdo utilitário e cacheado -> Enviar direto sem gastar quota/LLM
      this.logger.log(`Servindo cache direto para intent ${intent}.`);

      let response = cachedResponse.trim();
      const lowerResponse = response.toLowerCase();

      // Se o conteúdo em cache NÃO possuir cabeçalho padrão, adicionamos um cabeçalho formatado
      if (
        !lowerResponse.startsWith('*liturgia do dia') &&
        !lowerResponse.startsWith('*santo do dia') &&
        !lowerResponse.startsWith('*mistérios') &&
        !lowerResponse.startsWith('*conteúdo do dia')
      ) {
        this.logger.log(
          'Cache sem cabeçalho padrão. Prependendo cabeçalho formatado.',
        );
        let formattedTargetDate = targetDate;
        if (targetDate && targetDate.includes('-')) {
          const parts = targetDate.split('-');
          if (parts.length === 3) {
            formattedTargetDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
        }
        response = `*${intent === 'LITURGY' ? 'Liturgia' : 'Conteúdo'} do Dia (${formattedTargetDate})*\n\n${response}`;
      }

      await this.saveMessage(userId, 'assistant', response, false);
      return response;
    }

    // Se não serviu cache direto, usa o LLM (Interesses, Resumo, Persona)
    // Marcar mensagem do usuário como LLM para contagem de quota
    await supabase
      .from('messages')
      .update({ is_llm: true })
      .eq('id', userMessageId);

    const history = await this.getChatHistory(userId);
    const summary = user.general_summary || 'Sem resumo.';
    const userNameContext = user.name ? `O nome do usuário com quem você está falando é: ${user.name}. Use esse nome se for natural no diálogo.` : '';
    let genderContext = '';
    if (user.gender === 'M') {
      genderContext = `O gênero do usuário é MASCULINO. Trate-o por pronomes masculinos (ex: "meu querido filho", "amigo").`;
    } else if (user.gender === 'F') {
      genderContext = `O gênero do usuário é FEMININO. Trate-a por pronomes femininos (ex: "minha querida filha", "amiga").`;
    } else {
      genderContext = `O gênero do usuário é DESCONHECIDO. Use uma linguagem neutra ou acolhedora sem especificar gênero.`;
    }

    const todayStr = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const fullSystemPrompt = `${corePersona}\n\nData atual: Hoje é ${todayStr}.\n\nCONTEXTO:\n${summary}\n${userNameContext}\n${genderContext}\n\nINTENÇÃO:\n${intentContext}\n\nResponda com amor maternal.`;

    const { content: response, usage } = await this.callOpenRouter(
      fullSystemPrompt,
      message,
      false,
      history,
      mainModel,
    );
    if (usage) await this.logUsage(userId, usage, mainModel);

    // Verificar se avisamos sobre expiração
    let finalResponse = response;
    if (user.subscription_expires_at) {
      const diff = Math.ceil(
        (new Date(user.subscription_expires_at).getTime() -
          new Date().getTime()) /
          86400000,
      );
      if (diff > 0 && diff <= 3) {
        finalResponse += `\n\n_Sua assinatura expira em ${diff} ${diff === 1 ? 'dia' : 'dias'}. Considere renovar para manter seu acesso completo!_`;
      }
    }

    await this.saveMessage(userId, 'assistant', finalResponse, true);
    this.updateContextIfNeeded(userId, userMessageId).catch((e) =>
      this.logger.error(e),
    );

    return finalResponse;
  }

  private async getDailyCache(
    type: string,
    date: string,
  ): Promise<string | null> {
    const { data } = await this.supabaseService
      .getClient()
      .from('daily_cache')
      .select('content')
      .eq('type', type)
      .eq('cache_date', date)
      .maybeSingle();
    return data?.content;
  }

  /**
   * Busca no cache semântico usando similaridade de cosseno.
   */
  private async findInSemanticCache(
    message: string,
    intent: string,
  ): Promise<string | null> {
    try {
      const embedding = await this.embeddingService.generate(message);
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase.rpc('match_magisterium_cache', {
        query_embedding: embedding,
        match_threshold: 0.92,
        match_count: 1,
        p_intent: intent,
      });

      if (error) throw error;
      return data && data.length > 0 ? data[0].answer : null;
    } catch (error) {
      this.logger.warn('Erro ao buscar no cache semântico', error);
      return null;
    }
  }

  /**
   * Salva uma resposta no cache semântico.
   */
  private async saveToSemanticCache(
    question: string,
    answer: string,
    intent: string,
  ) {
    try {
      const embedding = await this.embeddingService.generate(question);
      const supabase = this.supabaseService.getClient();

      await supabase.from('magisterium_cache').insert({
        question,
        answer,
        intent,
        embedding,
      });
    } catch (error) {
      this.logger.warn('Erro ao salvar no cache semântico', error);
    }
  }

  /**
   * Extrai a data alvo da mensagem do usuário usando IA se necessário.
   */
  private async extractTargetDate(
    message: string,
    model: string,
  ): Promise<string> {
    const today = new Date().toLocaleDateString('sv-SE', {
      timeZone: 'America/Sao_Paulo',
    });
    const lowerMessage = message.toLowerCase();

    // Atalhos rápidos para evitar chamadas de IA desnecessárias
    if (
      lowerMessage === 'liturgia de hoje' ||
      lowerMessage === 'santo de hoje' ||
      lowerMessage === 'hoje' ||
      lowerMessage.includes('evangelho de hoje') ||
      lowerMessage.includes('evangelho do dia') ||
      lowerMessage.includes('leituras do dia') ||
      lowerMessage.includes('leitura de hoje') ||
      lowerMessage.includes('liturgia do dia') ||
      lowerMessage.includes('liturgia de hoje') ||
      lowerMessage.includes('liturgia diária') ||
      lowerMessage.includes('liturgia diaria')
    )
      return today;

    const temporalKeywords = [
      'ontem',
      'amanhã',
      'amanha',
      'domingo',
      'segunda',
      'terça',
      'quarta',
      'quinta',
      'sexta',
      'sábado',
      'dia',
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ];

    const hasTemporalReference =
      temporalKeywords.some((kw) => lowerMessage.includes(kw)) ||
      /\d+/.test(message);

    if (!hasTemporalReference) return today;

    const prompt = (this.promptService.getPrompt('extractor_date') || '')
      .replace('{{today}}', today)
      .replace(
        '{{weekday}}',
        new Date().toLocaleDateString('pt-BR', {
          weekday: 'long',
          timeZone: 'America/Sao_Paulo',
        }),
      )
      .replace('{{message}}', message);

    try {
      const { content } = await this.callOpenRouter(
        prompt,
        '',
        false,
        [],
        model,
      );
      const match = content.trim().match(/\d{4}-\d{2}-\d{2}/);
      return match ? match[0] : today;
    } catch (e) {
      this.logger.error('Erro ao extrair data alvo', e);
      return today;
    }
  }

  /**
   * Salva o log de uso de tokens no banco de dados.
   */
  async logUsage(userId: string | null, usage: any, model: string) {
    try {
      const promptTokens = usage.prompt_tokens || 0;
      const completionTokens = usage.completion_tokens || 0;
      const totalTokens = usage.total_tokens || 0;

      // Preços por 1M tokens (USD)
      const modelPrices: Record<string, { input: number; output: number }> = {
        'openai/gpt-4o-mini': { input: 0.15, output: 0.6 },
        'openai/gpt-4o': { input: 2.5, output: 10.0 },
        'google/gemini-2.5-flash-lite': { input: 0.1, output: 0.4 },
        'magisterium-expert': { input: 1.0, output: 1.0 },
      };

      const prices = modelPrices[model] || modelPrices['openai/gpt-4o-mini'];
      const cost =
        promptTokens * (prices.input / 1000000) +
        completionTokens * (prices.output / 1000000);

      const supabase = this.supabaseService.getClient();
      await supabase.from('usage_logs').insert({
        user_id: userId,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        model: model,
        cost: Number(cost.toFixed(6)),
      });
    } catch (error) {
      this.logger.warn(
        `Falha ao salvar usage log para ${userId || 'SYSTEM/CRON'}`,
        error,
      );
    }
  }

  private getAsaasService(): AsaasService {
    if (!this.asaasService) {
      this.asaasService = this.moduleRef.get(AsaasService, { strict: false });
    }
    return this.asaasService;
  }

  private formatFlowText(text: string): string {
    return (text || '').replace(/\\n/g, '\n');
  }

  private matchesFlowOption(
    cleanMsg: string,
    buttonId: string,
    buttonText: string,
    keywords: string[],
  ): boolean {
    const btn = buttonText.toLowerCase();
    if (cleanMsg === buttonId) return true;
    if (
      btn &&
      (cleanMsg === btn || cleanMsg.includes(btn) || btn.includes(cleanMsg))
    )
      return true;
    return keywords.some((k) => cleanMsg.includes(k));
  }

  private async buildCycleStepMessage(
    cycleStep: { text?: string; buttons?: any[] },
    tier: 'basic' | 'premium',
    previousTier: string,
  ) {
    const tierLabel = tier === 'basic' ? 'Básico' : 'Premium';
    
    const monthlyPlan = await this.plansService.getPlan(tier, 'monthly');
    const annualPlan = await this.plansService.getPlan(tier, 'annual');
    
    const mPrice = monthlyPlan ? monthlyPlan.price.toFixed(2).replace('.', ',') : '0,00';
    const aPrice = annualPlan ? annualPlan.price.toFixed(2).replace('.', ',') : '0,00';
    const aPriceMonthly = annualPlan ? (annualPlan.price / 12).toFixed(2).replace('.', ',') : '0,00';

    const planOptions = `• *Mensal* — R$ ${mPrice}/mês\n• *Anual* — 12x R$ ${aPriceMonthly} (R$ ${aPrice}/ano)`;

    let upgradeWarning = '';
    if (previousTier === 'basic' && tier === 'premium') {
      upgradeWarning =
        '⚠️ *Atenção:* Você já tem o Plano Básico ativo. Ao assinar o Premium, a assinatura anterior será cancelada no Asaas quando o novo pagamento for confirmado.\n\n';
    }

    const text = this.formatFlowText(cycleStep.text || '')
      .replace('{tier_label}', tierLabel)
      .replace('{plan_options}', planOptions)
      .replace('{upgrade_warning}', upgradeWarning);

    return {
      type: 'interactive',
      text,
      buttons: cycleStep.buttons || [],
    };
  }

  async handleFlowStep(
    user: any,
    userStatus: string,
    message: string,
  ): Promise<any> {
    const supabase = this.supabaseService.getClient();

    // Format: "flow:subscription_flow:step_id:{json_context}"
    // We cannot use plain split(':') because the JSON context contains colons.
    // Instead, we parse the first 3 segments by position.
    const flowPrefix = 'flow:';
    const withoutFlow = userStatus.slice(flowPrefix.length); // "subscription_flow:step_id:{...}"
    const firstColon = withoutFlow.indexOf(':'); // index of ':' after flow key
    const secondColon = withoutFlow.indexOf(':', firstColon + 1); // index of ':' after step_id

    // stepId is the segment between firstColon and secondColon
    const stepId = withoutFlow.slice(
      firstColon + 1,
      secondColon === -1 ? undefined : secondColon,
    );

    let contextData: any = {};
    if (secondColon !== -1) {
      const jsonStr = withoutFlow.slice(secondColon + 1);
      try {
        contextData = JSON.parse(jsonStr);
      } catch (e) {
        this.logger.error('Error parsing flow context JSON', e);
      }
    }

    const { data: flowData } = await supabase
      .from('automatic_flows')
      .select('*')
      .eq('key', 'subscription_flow')
      .single();

    if (!flowData) {
      this.logger.error(
        'Fluxo automatic_flows "subscription_flow" não encontrado.',
      );
      await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', user.id);
      return 'Desculpe, ocorreu um erro ao carregar o fluxo de pagamento. Por favor, tente novamente mais tarde.';
    }

    const steps = flowData.steps;
    const cleanMsg = message.trim().toLowerCase();

    if (stepId === 'select_plan') {
      const selectStep = steps.select_plan || { text: '', buttons: [] };
      const getBtnText = (id: string) =>
        selectStep.buttons
          ?.find((b: any) => b.id === id)
          ?.text?.toLowerCase() || '';

      const isCancel = this.matchesFlowOption(cleanMsg, '3', getBtnText('3'), [
        'cancelar',
        'sair',
      ]);
      if (isCancel) {
        await supabase
          .from('users')
          .update({ status: 'active' })
          .eq('id', user.id);
        return 'Fluxo de assinatura cancelado com sucesso. Se precisar de algo mais, estou aqui! Que Deus te abençoe! 🙏';
      }

      const isBasic = this.matchesFlowOption(cleanMsg, '1', getBtnText('1'), [
        'básico',
        'basico',
        'basic',
      ]);
      const isPremium = this.matchesFlowOption(cleanMsg, '2', getBtnText('2'), [
        'premium',
      ]);

      let tier: 'basic' | 'premium' | '' = '';
      if (isBasic && !isPremium) tier = 'basic';
      else if (isPremium && !isBasic) tier = 'premium';
      else if (isBasic && isPremium) tier = 'premium';

      if (!tier) {
        return {
          type: 'interactive',
          text: `⚠️ Opção inválida. Por favor, escolha uma das opções abaixo:\n\n${this.formatFlowText(selectStep.text)}`,
          buttons: selectStep.buttons,
        };
      }

      const userTier = user.subscription_tier || 'free';

      if (userTier === 'premium' && tier === 'premium') {
        await supabase
          .from('users')
          .update({ status: 'active' })
          .eq('id', user.id);
        return 'Você já possui o *Plano Premium* ativo, que é o nosso plano máximo! Não é necessário assinar novamente ou fazer upgrade. Que Deus te abençoe! 🙏';
      }

      if (userTier === 'basic' && tier === 'basic') {
        return {
          type: 'interactive',
          text:
            'Você já possui o *Plano Básico* ativo! Não é necessário assinar novamente o mesmo plano. Se quiser ter acesso ilimitado, escolha o *Plano Premium*. 😊\n\n' +
            this.formatFlowText(selectStep.text),
          buttons: selectStep.buttons,
        };
      }

      const nextContext = { tier, previous_tier: userTier };
      await supabase
        .from('users')
        .update({
          status: `flow:subscription_flow:select_cycle:${JSON.stringify(nextContext)}`,
        })
        .eq('id', user.id);

      const cycleStep = steps.select_cycle ||
        steps.confirm_plan || { text: '', buttons: [] };
      return await this.buildCycleStepMessage(cycleStep, tier, userTier);
    }

    if (stepId === 'select_cycle' || stepId === 'confirm_plan') {
      const cycleStep = steps.select_cycle ||
        steps.confirm_plan || { text: '', buttons: [] };
      const getBtnText = (id: string) =>
        cycleStep.buttons?.find((b: any) => b.id === id)?.text?.toLowerCase() ||
        '';

      // Compatibilidade com fluxo antigo (confirmação Sim/Não + plan 1–4)
      if (stepId === 'confirm_plan' && contextData.plan) {
        const getConfirmBtnText = (id: string) => getBtnText(id);
        const isYes =
          this.matchesFlowOption(cleanMsg, '1', getConfirmBtnText('1'), [
            'sim',
            'confirmar',
          ]) || cleanMsg.includes('confirmar');
        const isNo =
          this.matchesFlowOption(cleanMsg, '2', getConfirmBtnText('2'), [
            'não',
            'nao',
            'voltar',
          ]) || cleanMsg.includes('voltar');
        const isCancel = this.matchesFlowOption(
          cleanMsg,
          '3',
          getConfirmBtnText('3'),
          ['cancelar', 'sair'],
        );

        if (isCancel) {
          await supabase
            .from('users')
            .update({ status: 'active' })
            .eq('id', user.id);
          return 'Fluxo de assinatura cancelado com sucesso. Se precisar de algo mais, estou aqui! Que Deus te abençoe! 🙏';
        }
        if (isNo) {
          await supabase
            .from('users')
            .update({ status: 'flow:subscription_flow:select_plan' })
            .eq('id', user.id);
          const selectStep = steps.select_plan;
          return {
            type: 'interactive',
            text: this.formatFlowText(selectStep.text),
            buttons: selectStep.buttons,
          };
        }
        if (!isYes) {
          const bMonthly = await this.plansService.getPlan('basic', 'monthly');
          const bAnnual = await this.plansService.getPlan('basic', 'annual');
          const pMonthly = await this.plansService.getPlan('premium', 'monthly');
          const pAnnual = await this.plansService.getPlan('premium', 'annual');
          
          const formatPrice = (p: number) => p.toFixed(2).replace('.', ',');

          const planNames: Record<string, string> = {
            '1': `Plano Básico Mensal (R$ ${bMonthly ? formatPrice(bMonthly.price) : '14,90'}/mês)`,
            '2': `Plano Básico Anual (R$ ${bAnnual ? formatPrice(bAnnual.price) : '154,80'}/ano)`,
            '3': `Plano Premium Mensal (R$ ${pMonthly ? formatPrice(pMonthly.price) : '29,90'}/mês)`,
            '4': `Plano Premium Anual (R$ ${pAnnual ? formatPrice(pAnnual.price) : '322,80'}/ano)`,
          };
          const planName = planNames[contextData.plan] || 'Plano';
          let upgradeWarning = '';
          if (
            contextData.previous_tier === 'basic' &&
            (contextData.plan === '3' || contextData.plan === '4')
          ) {
            upgradeWarning =
              '⚠️ *Atenção:* Identificamos que você possui o Plano Básico ativo. Ao assinar o Plano Premium, sua assinatura anterior será cancelada no Asaas assim que o novo pagamento for confirmado.\n\n';
          }
          const formattedText =
            '⚠️ Opção inválida. Confirma a assinatura?\n\n' +
            this.formatFlowText(cycleStep.text)
              .replace('{plan_name}', planName)
              .replace('{upgrade_warning}', upgradeWarning);
          return {
            type: 'interactive',
            text: formattedText,
            buttons: cycleStep.buttons,
          };
        }

        const plan = contextData.plan;
        let planId = 'basic';
        let cycle = 'monthly';
        if (plan === '1') {
          planId = 'basic';
          cycle = 'monthly';
        } else if (plan === '2') {
          planId = 'basic';
          cycle = 'annual';
        } else if (plan === '3') {
          planId = 'premium';
          cycle = 'monthly';
        } else if (plan === '4') {
          planId = 'premium';
          cycle = 'annual';
        }
        await supabase
          .from('users')
          .update({ status: 'active' })
          .eq('id', user.id);
        try {
          const asaas = this.getAsaasService();
          const checkout = await asaas.createCheckoutUrl(
            planId,
            cycle,
            user.phone,
            user.id,
            user.affiliate_code,
          );
          return (
            `Perfeito! Aqui está o seu link de pagamento:\n\n` +
            `🔗 ${checkout.url}\n\n` +
            `O pagamento é 100% seguro pelo Asaas. Assim que for confirmado, sua assinatura será ativada automaticamente e eu te aviso por aqui! 🙏✨`
          );
        } catch (err) {
          this.logger.error(
            `Error generating checkout link for user ${user.id}`,
            err,
          );
          return `Desculpe, não consegui gerar o seu link de pagamento agora. Por favor, tente novamente mais tarde ou entre em contato com nosso suporte técnico.`;
        }
      }

      if (cleanMsg.includes('cancelar') || cleanMsg.includes('sair')) {
        await supabase
          .from('users')
          .update({ status: 'active' })
          .eq('id', user.id);
        return 'Fluxo de assinatura cancelado com sucesso. Se precisar de algo mais, estou aqui! Que Deus te abençoe! 🙏';
      }

      const isBack = this.matchesFlowOption(cleanMsg, '3', getBtnText('3'), [
        'voltar',
        'anterior',
      ]);
      if (isBack) {
        await supabase
          .from('users')
          .update({ status: 'flow:subscription_flow:select_plan' })
          .eq('id', user.id);
        const selectStep = steps.select_plan;
        return {
          type: 'interactive',
          text: this.formatFlowText(selectStep.text),
          buttons: selectStep.buttons,
        };
      }

      const isMonthly = this.matchesFlowOption(cleanMsg, '1', getBtnText('1'), [
        'mensal',
        'mês',
        'mes',
      ]);
      const isAnnual = this.matchesFlowOption(cleanMsg, '2', getBtnText('2'), [
        'anual',
        'ano',
      ]);

      if (!isMonthly && !isAnnual) {
        const tier = (contextData.tier || 'basic') as 'basic' | 'premium';
        const invalid = await this.buildCycleStepMessage(
          cycleStep,
          tier,
          contextData.previous_tier || 'free',
        );
        return {
          type: 'interactive',
          text: `⚠️ Opção inválida. Escolha a forma de pagamento:\n\n${invalid.text}`,
          buttons: invalid.buttons,
        };
      }

      const tier = (contextData.tier || 'basic') as 'basic' | 'premium';
      const cycle = isMonthly ? 'monthly' : 'annual';

      await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', user.id);

      try {
        const asaas = this.getAsaasService();
        if (!asaas) {
          throw new Error('AsaasService not available');
        }

        const checkout = await asaas.createCheckoutUrl(
          tier,
          cycle,
          user.phone,
          user.id,
        );
        const tierLabel = tier === 'basic' ? 'Básico' : 'Premium';
        const cycleLabel = isMonthly ? 'Mensal' : 'Anual';

        return (
          `Perfeito! *Plano ${tierLabel} ${cycleLabel}* selecionado.\n\n` +
          `Aqui está o seu link de pagamento:\n\n` +
          `🔗 ${checkout.url}\n\n` +
          `O pagamento é 100% seguro pelo Asaas. Assim que for confirmado, sua assinatura será ativada automaticamente e eu te aviso por aqui! 🙏✨`
        );
      } catch (err) {
        this.logger.error(
          `Error generating checkout link for user ${user.id}`,
          err,
        );
        return `Desculpe, não consegui gerar o seu link de pagamento agora. Por favor, tente novamente mais tarde ou entre em contato com nosso suporte técnico.`;
      }
    }

    // Default fallback
    await supabase.from('users').update({ status: 'active' }).eq('id', user.id);
    return 'Desculpe, ocorreu um erro inesperado no fluxo de assinatura. O fluxo foi reiniciado.';
  }

  /**
   * Extrai o gênero a partir do nome usando LLM.
   */
  async extractGenderFromName(name: string): Promise<'M' | 'F' | 'N'> {
    if (!name || name.trim() === '') return 'N';
    const prompt = `Analise o seguinte nome: "${name}". Responda APENAS com a letra "M" se for tipicamente masculino, "F" se for tipicamente feminino, ou "N" se não for possível determinar (ex: unissex, sobrenome apenas, apelido ambíguo). Não escreva mais nada além da letra.`;
    try {
      const { content } = await this.callOpenRouter(
        'Você é um assistente especialista em identificar gênero por nomes. Responda APENAS com uma letra maiúscula.',
        prompt,
        false
      );
      const res = content.trim().toUpperCase();
      if (res === 'M' || res === 'F' || res === 'N') return res;
      return 'N';
    } catch (e) {
      this.logger.error(`Error extracting gender for name ${name}`, e);
      return 'N';
    }
  }
}

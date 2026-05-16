import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PromptService } from './prompt.service';
import { MagisteriumService } from './magisterium.service';
import { LiturgyService } from './liturgy.service';
import { SupabaseService } from '../supabase/supabase.service';
import { EmbeddingService } from './embedding.service';

const MAGISTERIUM_INSTRUCTION = '\n\nOBRIGATÓRIO: Ao final da sua resposta, você deve listar as referências exatas de onde a informação foi extraída. ' +
  'RETIRE as citações numéricas no texto (ex: [^1]) e crie uma seção "*Referências:*" ao final com a lista completa formatada para WhatsApp. ' +
  'ATENÇÃO: As fontes informadas devem ser OBRIGATORIAMENTE traduzidas para o português sempre que possível (exceto nomes oficiais de documentos em latim). É essencial que você forneça TODAS as fontes.';

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private readonly openRouterApiKey: string;
  private model: string = 'openai/gpt-4o-mini';
  private bridgeModel: string = 'google/gemini-2.0-flash-lite-001';

  constructor(
    private readonly promptService: PromptService,
    private readonly magisteriumService: MagisteriumService,
    private readonly liturgyService: LiturgyService,
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly embeddingService: EmbeddingService,
  ) {
    this.openRouterApiKey = this.configService.get<string>('OPENROUTER_API_KEY') || '';
    // Inicializar com variáveis de ambiente se disponíveis, caso contrário usar defaults
    this.model = this.configService.get<string>('MAIN_MODEL') || 'openai/gpt-4o-mini';
    this.bridgeModel = this.configService.get<string>('BRIDGE_MODEL') || 'google/gemini-2.0-flash-lite-001';
  }

  async onModuleInit() {
    this.logger.log('Inicializando configurações de modelo da IA...');
    try {
      const [main, bridge] = await Promise.all([
        this.getSystemSetting('main_model', this.model),
        this.getSystemSetting('bridge_model', this.bridgeModel)
      ]);
      this.model = main;
      this.bridgeModel = bridge;
      this.logger.log(`Modelos configurados: Principal=${this.model}, Bridge=${this.bridgeModel}`);
    } catch (error) {
      this.logger.warn('Falha ao carregar modelos do banco, usando defaults.', error);
    }
  }

  /**
   * Obtém uma configuração do sistema do banco de dados.
   */
  private async getSystemSetting(key: string, defaultValue: string): Promise<string> {
    try {
      const supabase = this.supabaseService.getClient();
      const { data } = await supabase.from('system_settings').select('value').eq('key', key).single();
      return data?.value || defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  /**
   * Helper function to call OpenRouter API
   */
  async callOpenRouter(systemPrompt: string, userMessage: string, isJsonMode = false, history: any[] = [], modelOverride?: string): Promise<{ content: string, usage?: { prompt_tokens: number, completion_tokens: number, total_tokens: number } }> {
    try {
      const messagesPayload = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage }
      ];

      const model = modelOverride || this.model || 'openai/gpt-4o-mini';

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openRouterApiKey}`,
          'HTTP-Referer': 'https://maria.acutistech.com.br',
          'X-Title': 'MarIA Assistant',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: messagesPayload,
          response_format: isJsonMode ? { type: "json_object" } : undefined,
          temperature: isJsonMode ? 0.1 : 0.7,
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${JSON.stringify(data)}`);
      }

      return {
        content: data.choices[0].message.content,
        usage: data.usage
      };
    } catch (error) {
      this.logger.error('Erro ao chamar OpenRouter', error);
      throw error;
    }
  }

  /**
   * Descobre a intenção do usuário e quais regras de contexto aplicar.
   */
  async determineIntent(message: string): Promise<{ intent: string, rules: string[] }> {
    const bridgeModel = await this.getSystemSetting('bridge_model', 'google/gemini-2.0-flash-lite-001');
    const routerPrompt = this.promptService.getPrompt('intent_router');
    if (!routerPrompt) return { intent: 'CASUAL', rules: [] };

    try {
      const { content, usage } = await this.callOpenRouter(routerPrompt, message, true, [], bridgeModel);

      // Logs intent routing usage (internal)
      this.logger.debug(`Intent Router usage: ${JSON.stringify(usage)}`);

      const result = JSON.parse(content);
      return {
        intent: result.intent || 'CASUAL',
        rules: result.rules || []
      };
    } catch (error) {
      this.logger.warn('Falha ao determinar intent/rules, usando fallback', error);
      return { intent: 'CASUAL', rules: [] };
    }
  }

  /**
   * Obtém ou cria o usuário baseado no wa_chatid.
   */
  private async getOrCreateUser(waChatId: string, pushName?: string, phone?: string): Promise<any> {
    const supabase = this.supabaseService.getClient();
    let { data: user } = await supabase.from('users').select('*').eq('wa_chatid', waChatId).single();

    if (!user) {
      const insertData: any = {
        wa_chatid: waChatId,
        status: 'triage_intro', // Novo fluxo começa em triage_intro
        subscription_tier: 'free'
      };
      if (pushName) insertData.name = pushName;
      if (phone) insertData.phone = phone;

      const { data: newUser, error } = await supabase.from('users').insert(insertData).select('*').single();
      if (error) throw new Error(`Falha ao criar usuário: ${error.message}`);
      user = newUser;
    }
    return user;
  }

  private async checkSubscriptionLimits(user: any): Promise<{ allowed: boolean; reason?: string }> {
    // Admins e usuários ilimitados não têm restrições
    if (user.subscription_tier === 'unlimited' || user.subscription_tier === 'admin') {
      return { allowed: true };
    }

    // Verificar expiração
    if (user.subscription_expires_at) {
      const expiration = new Date(user.subscription_expires_at);
      if (expiration < new Date()) {
        // Se expirou, volta para o plano free
        const supabase = this.supabaseService.getClient();
        await supabase.from('users').update({ subscription_tier: 'free', subscription_expires_at: null }).eq('id', user.id);
        user.subscription_tier = 'free';
      }
    }

    // Se for free, não há limite de mensagens (apenas restrição de funcionalidades no processMessage)
    if (user.subscription_tier === 'free') {
      return { allowed: true };
    }

    // Limites por tier
    const limits = {
      'premium': 300,
      'patron': 600
    };

    const monthlyLimit = limits[user.subscription_tier as keyof typeof limits] ?? 0;

    // Contar mensagens do mês (APENAS as que usaram LLM)
    const count = await this.countMonthlyMessages(user.id);
    
    if (count >= monthlyLimit) {
      return { 
        allowed: false, 
        reason: `Você atingiu seu limite mensal de ${monthlyLimit} mensagens no plano ${user.subscription_tier === 'premium' ? 'Premium' : 'Patrono'}. Seu apoio é fundamental para mantermos a MarIA ativa! Gostaria de fazer um upgrade ou renovar seu plano?` 
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
    return messages.reverse().map(m => ({ role: m.role, content: m.content }));
  }

  /**
   * Salva uma mensagem no banco de dados.
   */
  private async saveMessage(userId: string, role: string, content: string, isLlm = false): Promise<string> {
    const supabase = this.supabaseService.getClient();
    const { data: msg } = await supabase
      .from('messages')
      .insert({ user_id: userId, role, content, is_llm: isLlm })
      .select('id')
      .single();

    return msg?.id;
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
    let query = supabase.from('messages').select('id', { count: 'exact' }).eq('user_id', userId);
    
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
      this.logger.log(`Atingido limite de 10 mensagens para o usuário ${userId}. Iniciando condensação de contexto...`);

      // Busca as últimas 10 mensagens exatas para o processamento
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      const conversationText = recentMessages?.reverse().map(m => `${m.role === 'user' ? 'Usuário' : 'MarIA'}: ${m.content}`).join('\n') || '';

      // Prompt aprimorado: Contexto Anterior + 10 Últimas Mensagens
      const summarizationPrompt = (this.promptService.getPrompt('memory_summarization') || '')
        .replace('{{previous_summary}}', context?.general_summary || 'Nenhum histórico disponível ainda.')
        .replace('{{recent_messages}}', conversationText);

      const mainModel = await this.getSystemSetting('main_model', 'openai/gpt-4o-mini');
      const { content: newSummary, usage } = await this.callOpenRouter(summarizationPrompt, "Gere o resumo consolidado.", false, [], mainModel);
      
      if (usage) await this.logUsage(userId, usage, mainModel);

      // Extração de Interesses (Badges) - Também usando apenas as 10 mensagens
      const interestExtractorPrompt = (this.promptService.getPrompt('interest_extractor') || '')
        .replace('{{previous_interests}}', JSON.stringify(context?.interests || []));

      const { content: interestsJson } = await this.callOpenRouter(interestExtractorPrompt, conversationText, true, [], mainModel);
      let interests = context?.interests || [];
      try {
        const extracted = JSON.parse(interestsJson);
        if (Array.isArray(extracted)) interests = extracted;
      } catch (e) {
        this.logger.warn(`Falha ao extrair interesses para o usuário ${userId}`);
      }

      // 4. Atualizar ou Criar no banco
      const updateData = {
        general_summary: newSummary,
        interests: interests,
        last_processed_message_id: lastMessageId,
        updated_at: new Date().toISOString()
      };

      if (context) {
        await supabase.from('user_contexts').update(updateData).eq('user_id', userId);
      } else {
        await supabase.from('user_contexts').insert({
          user_id: userId,
          ...updateData
        });
      }
      this.logger.log(`Contexto e interesses atualizados com sucesso para o usuário ${userId}.`);
    }
  }

  /**
   * Processa a mensagem do usuário baseada no seu status atual.
   * Representa a Máquina de Estados da Conversa.
   */
  async processMessage(waChatId: string, message: string, pushName?: string, phone?: string): Promise<string | string[]> {
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

    const user = await this.getOrCreateUser(waChatId, pushName, phone);
    const userId = user.id;
    let userStatus = user.status || 'active';

    // Se o usuário estava 'disabled', resetar para triagem
    if (userStatus === 'disabled') {
      this.logger.log(`Usuário ${userId} (disabled) entrou em contato. Resetando para triagem.`);
      await supabase.from('users').update({ status: 'triage_intro' }).eq('id', userId);
      userStatus = 'triage_intro';
      user.status = 'triage_intro';
      user.name = null;
    }

    // Verificar limites de assinatura antes de processar (exceto triagem)
    if (!userStatus.startsWith('triage')) {
      const { allowed, reason } = await this.checkSubscriptionLimits(user);
      if (!allowed) {
        return reason || this.promptService.getPrompt('usage_limit_reached');
      }
    }

    // Salvar a mensagem do usuário (inicialmente is_llm: false)
    const userMessageId = await this.saveMessage(userId, 'user', message, false);

    const corePersona = this.promptService.getCorePersona();

    // --- MÁQUINA DE ESTADOS (TRIAGEM) ---

    // 1. Triagem Inicial (Nome)
    if (userStatus === 'triage_intro' || userStatus === 'triage_name') {
      await supabase.from('messages').update({ is_llm: true }).eq('id', userMessageId);
      
      const extractionNamePrompt = (this.promptService.getPrompt('extractor_name') || '').replace('{{message}}', message);
      const { content: extractedName } = await this.callOpenRouter(extractionNamePrompt, "", false);
      
      const updateData: any = {};
      let nameFound = false;

      if (extractedName && extractedName.toLowerCase() !== 'null') {
        updateData.name = extractedName.replace(/[".]/g, '').trim();
        nameFound = true;
      }

      if (nameFound) {
        await supabase.from('users').update({ ...updateData, status: 'triage_presentation_subscription' }).eq('id', userId);
        userStatus = 'triage_presentation_subscription';
      } else {
        const triagePromptKey = userStatus === 'triage_intro' ? 'triage_intro' : 'triage_name';
        const triagePrompt = this.promptService.getPrompt(triagePromptKey);
        
        const fullSystemPrompt = `${corePersona}\n\nREGRAS ATUAIS:\n${triagePrompt}`;
        const { content: response, usage } = await this.callOpenRouter(fullSystemPrompt, message);
        if (usage) await this.logUsage(userId, usage, this.model);

        if (userStatus === 'triage_intro') {
          await supabase.from('users').update({ status: 'triage_name' }).eq('id', userId);
        }

        await this.saveMessage(userId, 'assistant', response, true);
        return response;
      }
    }

    // 2. Apresentação Detalhada
    if (userStatus === 'triage_presentation_subscription') {
      await supabase.from('messages').update({ is_llm: true }).eq('id', userMessageId);

      const presentationPrompt = this.promptService.getPrompt('detailed_presentation');
      const isSubscriber = user.subscription_tier && user.subscription_tier !== 'free';
      const subscriptionContext = isSubscriber 
        ? "\n\nO usuário JÁ É UM ASSINANTE. Agradeça e não ofereça planos." 
        : "\n\nO usuário NÃO é assinante. Apresente os planos conforme as regras.";

      const fullSystemPrompt = `${corePersona}${subscriptionContext}\n\nREGRAS DE APRESENTAÇÃO:\n${presentationPrompt}`;
      const { content: response, usage } = await this.callOpenRouter(fullSystemPrompt, message);
      if (usage) await this.logUsage(userId, usage, this.model);

      await supabase.from('users').update({ status: 'active' }).eq('id', userId);
      await this.saveMessage(userId, 'assistant', response, true);
      return response;
    }

    // --- FLUXO ATIVO ---
    const isFree = user.subscription_tier === 'free';
    const { intent, rules } = await this.determineIntent(message);
    
    // Lista de intenções de utilidade (cacheáveis)
    const utilityIntents = ['LITURGY', 'SAINT', 'SAINT_OF_DAY', 'ROSARY_MYSTERIES', 'ROSARY_GUIDE'];
    const isUtility = utilityIntents.includes(intent);

    // Bloqueio Free para não-utilitários
    if (isFree && !isUtility) {
      const response = this.promptService.getPrompt('free_tier_block');
      await this.saveMessage(userId, 'assistant', response, false);
      return response;
    }

    let intentContext = '';
    let cachedResponse: string | null = null;
    const mainModel = await this.getSystemSetting('main_model', 'openai/gpt-4o-mini');
    const bridgeModel = await this.getSystemSetting('bridge_model', 'google/gemini-2.0-flash-lite-001');
    const targetDate = await this.extractTargetDate(message, bridgeModel);

    // Lógica de Contexto por Intenção
    switch (intent) {
      case 'LITURGY':
        cachedResponse = await this.getDailyCache('liturgy', targetDate);
        if (!cachedResponse) {
          cachedResponse = await this.liturgyService.getDailyLiturgy(targetDate);
        }
        intentContext = `CONTEÚDO DA LITURGIA (${targetDate}):\n${cachedResponse}`;
        break;
      case 'SAINT':
      case 'SAINT_OF_DAY':
        cachedResponse = await this.getDailyCache('saint', targetDate);
        if (!cachedResponse) {
          // Se não está no cache, precisamos consultar o Magistério (que usa LLM)
          await supabase.from('messages').update({ is_llm: true }).eq('id', userMessageId);
          const { content, usage } = await this.magisteriumService.query(`${message} (Dia ${targetDate})`, this.promptService.getPrompt('intent_saint'));
          if (usage) await this.logUsage(userId, usage, this.model);
          cachedResponse = content;
        }
        intentContext = `CONTEÚDO DO SANTO (${targetDate}):\n${cachedResponse}`;
        break;
      case 'ROSARY_MYSTERIES':
        cachedResponse = await this.getDailyCache('rosary', targetDate);
        intentContext = `CONTEÚDO DO TERÇO:\n${cachedResponse || 'Mistérios do dia.'}`;
        break;
      case 'THEOLOGY':
      case 'PRAYER':
      case 'BIBLE':
      case 'ADVICE':
        // Intenções GENERATIVAS -> Marcar como is_llm: true e processar com LLM
        await supabase.from('messages').update({ is_llm: true }).eq('id', userMessageId);
        const promptKey = `intent_${intent.toLowerCase()}`;
        const { content: magisteriumRes, usage: magUsage } = await this.magisteriumService.query(message, this.promptService.getPrompt(promptKey));
        if (magUsage) await this.logUsage(userId, magUsage, this.model);
        intentContext = `CONTEÚDO DO MAGISTERIUM:\n${magisteriumRes}`;
        break;
      default:
        // Caso padrão também usa LLM para conversa casual
        await supabase.from('messages').update({ is_llm: true }).eq('id', userMessageId);
        intentContext = this.promptService.getPrompt('intent_casual');
    }

    // Decisão de Resposta: Cache Direto vs LLM
    const { data: msgStatus } = await supabase.from('messages').select('is_llm').eq('id', userMessageId).single();
    const isLlmConfirmed = msgStatus?.is_llm || false;

    if (!isLlmConfirmed && cachedResponse) {
      // Conteúdo utilitário e cacheado -> Enviar direto sem gastar quota/LLM
      this.logger.log(`Servindo cache direto para intent ${intent}.`);
      const response = `*${intent === 'LITURGY' ? 'Liturgia' : 'Conteúdo'} do Dia (${targetDate})*\n\n${cachedResponse.trim()}`;
      await this.saveMessage(userId, 'assistant', response, false);
      return response;
    }

    // Se não serviu cache direto, usa o LLM (Interesses, Resumo, Persona)
    // Marcar mensagem do usuário como LLM para contagem de quota
    await supabase.from('messages').update({ is_llm: true }).eq('id', userMessageId);
    
    const history = await this.getChatHistory(userId);
    const summary = user.general_summary || "Sem resumo.";
    const fullSystemPrompt = `${corePersona}\n\nCONTEXTO:\n${summary}\n\nINTENÇÃO:\n${intentContext}\n\nResponda com amor maternal.`;

    const { content: response, usage } = await this.callOpenRouter(fullSystemPrompt, message, false, history, mainModel);
    if (usage) await this.logUsage(userId, usage, mainModel);

    // Verificar se avisamos sobre expiração
    let finalResponse = response;
    if (user.subscription_expires_at) {
      const diff = Math.ceil((new Date(user.subscription_expires_at).getTime() - new Date().getTime()) / 86400000);
      if (diff > 0 && diff <= 3) {
        finalResponse += `\n\n_Sua assinatura expira em ${diff} ${diff === 1 ? 'dia' : 'dias'}. Considere renovar para manter seu acesso completo!_`;
      }
    }

    await this.saveMessage(userId, 'assistant', finalResponse, true);
    this.updateContextIfNeeded(userId, userMessageId).catch(e => this.logger.error(e));

    return finalResponse;
  }

  private async getDailyCache(type: string, date: string): Promise<string | null> {
    const { data } = await this.supabaseService.getClient()
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
  private async findInSemanticCache(message: string, intent: string): Promise<string | null> {
    try {
      const embedding = await this.embeddingService.generate(message);
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase.rpc('match_magisterium_cache', {
        query_embedding: embedding,
        match_threshold: 0.92,
        match_count: 1,
        p_intent: intent
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
  private async saveToSemanticCache(question: string, answer: string, intent: string) {
    try {
      const embedding = await this.embeddingService.generate(question);
      const supabase = this.supabaseService.getClient();

      await supabase.from('magisterium_cache').insert({
        question,
        answer,
        intent,
        embedding
      });
    } catch (error) {
      this.logger.warn('Erro ao salvar no cache semântico', error);
    }
  }

  /**
   * Extrai a data alvo da mensagem do usuário usando IA se necessário.
   */
  private async extractTargetDate(message: string, model: string): Promise<string> {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    const lowerMessage = message.toLowerCase();

    // Atalhos rápidos para evitar chamadas de IA desnecessárias
    if (lowerMessage === 'liturgia de hoje' || lowerMessage === 'santo de hoje' || lowerMessage === 'hoje') return today;

    const temporalKeywords = ['ontem', 'amanhã', 'amanha', 'domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'dia', 'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    
    const hasTemporalReference = temporalKeywords.some(kw => lowerMessage.includes(kw)) || /\d+/.test(message);
    
    if (!hasTemporalReference) return today;

    const prompt = (this.promptService.getPrompt('extractor_date') || '')
      .replace('{{today}}', today)
      .replace('{{weekday}}', new Date().toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'America/Sao_Paulo' }))
      .replace('{{message}}', message);

    try {
      const { content } = await this.callOpenRouter(prompt, "", false, [], model);
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
      const supabase = this.supabaseService.getClient();
      await supabase.from('usage_logs').insert({
        user_id: userId,
        prompt_tokens: usage.prompt_tokens || 0,
        completion_tokens: usage.completion_tokens || 0,
        total_tokens: usage.total_tokens || 0,
        model: model,
      });
    } catch (error) {
      this.logger.warn(`Falha ao salvar usage log para ${userId || 'SYSTEM/CRON'}`, error);
    }
  }
}

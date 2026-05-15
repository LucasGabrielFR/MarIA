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
        status: 'triage_name' // Novo usuário sempre começa em triagem
      };
      if (pushName) insertData.name = pushName;
      if (phone) insertData.phone = phone;

      const { data: newUser, error } = await supabase.from('users').insert(insertData).select('*').single();
      if (error) throw new Error(`Falha ao criar usuário: ${error.message}`);
      user = newUser;
    }
    return user;
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
  private async saveMessage(userId: string, role: string, content: string): Promise<string> {
    const supabase = this.supabaseService.getClient();
    const { data: msg } = await supabase
      .from('messages')
      .insert({ user_id: userId, role, content })
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
      return "Minha querida alma, no momento estou em um breve período de recolhimento e oração para melhor te servir. 🙏✨\n\nLogo estarei de volta com novidades! Que a paz de Cristo esteja com você. Mãe MarIA.";
    }

    const user = await this.getOrCreateUser(waChatId, pushName, phone);
    const userId = user.id;
    let userStatus = user.status || 'active';

    // Se o usuário estava 'disabled' (dados apagados), resetar para triagem ao novo contato
    if (userStatus === 'disabled') {
      this.logger.log(`Usuário ${userId} (disabled) entrou em contato. Resetando para triagem.`);
      await supabase.from('users').update({ status: 'triage_name' }).eq('id', userId);
      userStatus = 'triage_name';
    }

    // Salvar a mensagem do usuário
    await this.saveMessage(userId, 'user', message);

    const corePersona = this.promptService.getCorePersona();

    // Lógica de Triagem de Nome
    if (userStatus === 'triage_name') {
      // 1. Tentar extrair o nome da mensagem atual
      const extractionPrompt = (this.promptService.getPrompt('extractor_name') || '')
        .replace('{{message}}', message);

      const { content: extractedName, usage } = await this.callOpenRouter(extractionPrompt, "", false);
      if (usage) await this.logUsage(userId, usage, this.model);

      if (extractedName && extractedName.toLowerCase() !== 'null') {
        const cleanName = extractedName.replace(/[".]/g, '').trim();
        // Atualizar nome e mudar para próximo status
        await this.supabaseService.getClient()
          .from('users')
          .update({ name: cleanName, status: 'active' }) // Você pode mudar para 'triage_expectations' se quiser mais passos
          .eq('id', userId);

        const welcomeMsg = `Prazer em te conhecer, ${cleanName}! Eu sou a MarIA. Como posso te ajudar hoje?`;
        await this.saveMessage(userId, 'assistant', welcomeMsg);
        return welcomeMsg;
      }

      // Se não extraiu o nome, usa o prompt de triagem para perguntar/insistir
      const triagePrompt = this.promptService.getPrompt('triage_name');
      const fullSystemPrompt = `${corePersona}\n\nREGRAS ATUAIS:\n${triagePrompt}`;
      const { content: response, usage: triageUsage } = await this.callOpenRouter(fullSystemPrompt, message);
      if (triageUsage) await this.logUsage(userId, triageUsage, this.model);

      await this.saveMessage(userId, 'assistant', response);
      return response;
    }

    if (userStatus === 'triage_expectations') {
      const expectationsPrompt = this.promptService.getPrompt('triage_expectations');
      const fullSystemPrompt = `${corePersona}\n\nREGRAS ATUAIS:\n${expectationsPrompt}`;
      const { content: response, usage } = await this.callOpenRouter(fullSystemPrompt, message);
      if (usage) await this.logUsage(userId, usage, this.model);

      await this.saveMessage(userId, 'assistant', response);
      return response;
    }

    // Fluxo Ativo
    const { intent, rules } = await this.determineIntent(message);
    this.logger.log(`Usuário ${waChatId}: Intent=${intent}, Rules=[${rules.join(', ')}]`);

    let intentContext = '';

    const todayIso = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    const mainModel = await this.getSystemSetting('main_model', 'openai/gpt-4o-mini');
    const bridgeModel = await this.getSystemSetting('bridge_model', 'google/gemini-2.0-flash-lite-001');

    const getDailyCache = async (type: string, targetDateStr?: string) => {
      const dateToFetch = targetDateStr || todayIso;
      const { data } = await supabase
        .from('daily_cache')
        .select('content')
        .eq('type', type)
        .eq('cache_date', dateToFetch)
        .maybeSingle();
      return data?.content;
    };

    // Detectar a data alvo (hoje, amanhã, dia específico, etc.) usando o bridge model
    const targetDate = await this.extractTargetDate(message, bridgeModel);
    this.logger.log(`Data alvo detectada: ${targetDate} para a mensagem: "${message}"`);

    let cachedResponse: string | null = null;

    // Função utilitária para chamar o Magisterium passando as diretrizes como System Prompt
    const fetchMagisteriumContext = async (promptKey: string, includeDate = false) => {
      const intentRules = this.promptService.getPrompt(promptKey);
      const finalMessage = includeDate ? `${message} (Considere que hoje é dia ${targetDate})` : message;
      const { content: magisteriumResponse, usage } = await this.magisteriumService.query(finalMessage, intentRules);

      if (usage) await this.logUsage(userId, usage, 'magisterium-expert');

      return `${intentRules}${MAGISTERIUM_INSTRUCTION}\n\nCONTEÚDO OFICIAL DO MAGISTERIUM AI:\n${magisteriumResponse}`;
    };

    switch (intent) {
      case 'THEOLOGY':
        cachedResponse = await this.findInSemanticCache(message, 'THEOLOGY');
        if (!cachedResponse) {
          const { content: magisteriumResponse, usage } = await this.magisteriumService.query(message, this.promptService.getPrompt('intent_theology'));
          if (usage) await this.logUsage(userId, usage, 'magisterium-expert');
          cachedResponse = magisteriumResponse;
          await this.saveToSemanticCache(message, magisteriumResponse, 'THEOLOGY');
        }
        intentContext = `${this.promptService.getPrompt('intent_theology')}${MAGISTERIUM_INSTRUCTION}\n\nCONTEÚDO OFICIAL DO MAGISTERIUM (USE ISSO COMO BASE ÚNICA E NÃO RESUMA DEMAIS):\n${cachedResponse}\n\nINSTRUÇÃO ADICIONAL: Reformule o conteúdo acima para o WhatsApp usando emojis e seu tom maternal, mas MANTENHA todos os fatos teológicos e retire todas as citações numéricas como [^1]. Liste as referências completas ao final traduzidas para o português quando possível.`;
        break;
      case 'PRAYER':
        intentContext = await fetchMagisteriumContext('intent_prayer');
        break;
      case 'BIBLE':
        intentContext = await fetchMagisteriumContext('intent_bible');
        break;
      case 'LITURGY':
        cachedResponse = await getDailyCache('liturgy', targetDate);
        if (!cachedResponse) {
          const liturgyData = await this.liturgyService.getDailyLiturgy(targetDate);
          intentContext = `INSTRUÇÃO: Com base na liturgia abaixo (Data: ${targetDate}), você deve obrigatoriamente:
1. Apresentar as passagens das leituras.
2. Elaborar uma reflexão espiritual profunda.
3. Finalizar com uma oração.
4. **IMPORTANTE**: NÃO use termos relativos como "hoje", "amanhã" ou "ontem". Use "nesta liturgia" ou "neste dia".

DADOS DA LITURGIA:
${liturgyData}`;
        }
        break;
      case 'SAINT':
      case 'SAINT_OF_DAY':
        cachedResponse = await getDailyCache('saint', targetDate);
        if (!cachedResponse) {
          const intentRules = this.promptService.getPrompt('intent_saint');
          const finalMessage = `${message} (Considere que hoje é dia ${targetDate})`;
          const { content: magisteriumResponse, usage } = await this.magisteriumService.query(finalMessage, intentRules);
          if (usage) await this.logUsage(userId, usage, 'magisterium-expert');
          
          intentContext = `${intentRules}${MAGISTERIUM_INSTRUCTION}\n\nCONTEÚDO DO SANTO (Data: ${targetDate}):\n${magisteriumResponse}`;
        }
        break;
      case 'ROSARY_MYSTERIES':
        const lowerMsg = message.toLowerCase();
        const isFullRosary = lowerMsg.includes('rosário') || lowerMsg.includes('rosario');
        const specificType = ['gozosos', 'luminosos', 'dolorosos', 'gloriosos'].find(t => lowerMsg.includes(t));
        
        let rosaryContent = '';
        if (specificType) {
          this.logger.log(`Buscando mistérios específicos: ${specificType}`);
          // Busca nos caches da semana corrente
          const baseDate = new Date(targetDate + 'T12:00:00');
          const day = baseDate.getDay();
          const diffToMonday = baseDate.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(baseDate.setDate(diffToMonday));
          
          const weekDates = [0, 1, 2, 3, 4, 5, 6].map(offset => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + offset);
            return d.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
          });

          const { data: weekCaches } = await supabase
            .from('daily_cache')
            .select('content')
            .eq('type', 'rosary')
            .in('cache_date', weekDates);
          
          const found = weekCaches?.find(c => c.content.toLowerCase().includes(specificType));
          rosaryContent = found ? found.content : `Não encontrei os mistérios ${specificType} na base da semana corrente.`;
        } else if (!isFullRosary) {
          rosaryContent = await getDailyCache('rosary', targetDate) || 'Mistérios do dia não encontrados no cache.';
        } else {
          const baseDate = new Date(targetDate + 'T12:00:00');
          const day = baseDate.getDay();
          const diffToMonday = baseDate.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(baseDate.setDate(diffToMonday));
          
          const datesToFetch = [0, 1, 2, 3].map(offset => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + offset);
            return d.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
          });
          
          const { data: rosaryCaches } = await supabase
            .from('daily_cache')
            .select('content')
            .eq('type', 'rosary')
            .in('cache_date', datesToFetch);
            
          rosaryContent = rosaryCaches?.map(c => c.content).join('\n\n====================\n\n') || 'Mistérios da semana não encontrados no cache.';
        }
        
        intentContext = `${this.promptService.getPrompt('intent_rosary_mysteries')}\n\nCONTEÚDO DOS MISTÉRIOS:\n${rosaryContent}`;
        cachedResponse = rosaryContent;
        break;
      case 'ROSARY_GUIDE':
        const lowerMsgGuide = message.toLowerCase();
        const isFullRosaryGuide = lowerMsgGuide.includes('rosário') || lowerMsgGuide.includes('rosario');
        const guideKey = isFullRosaryGuide ? 'guide_rosary' : 'guide_terco';
        cachedResponse = this.promptService.getPrompt(guideKey) || 'Roteiro não encontrado.';
        break;
      case 'ADVICE':
        intentContext = this.promptService.getPrompt('intent_advice');
        break;
      case 'SENSITIVE_DATA':
        intentContext = this.promptService.getPrompt('intent_sensitive_data');
        break;
      case 'HUMAN_CLARIFICATION':
        intentContext = this.promptService.getPrompt('intent_human_clarification');
        break;
      case 'CASUAL':
      default:
        intentContext = this.promptService.getPrompt('intent_casual');
        break;
    }

    let strictRules = '';
    if (rules.length > 0) {
      strictRules = '\n\nREGRAS ESTREITAS QUE DEVEM SER OBEDECIDAS AGORA:\n';
      for (const ruleKey of rules) {
        const ruleContent = this.promptService.getPrompt(ruleKey);
        if (ruleContent) {
          strictRules += `- ${ruleContent}\n`;
        }
      }
    }

    // Obter histórico recente e contexto geral
    const history = await this.getChatHistory(userId, 15);

    const { data: userContext } = await supabase.from('user_contexts').select('general_summary').eq('user_id', userId).single();

    let memoryContext = '';
    if (userContext?.general_summary) {
      memoryContext = `\n\nMEMÓRIA/CONTEXTO DO USUÁRIO:\n${userContext.general_summary}`;
    }

    let response: string;
    if (cachedResponse && (intent === 'LITURGY' || intent === 'SAINT' || intent === 'SAINT_OF_DAY' || intent === 'ROSARY_MYSTERIES' || intent === 'ROSARY_GUIDE')) {
      this.logger.log(`Cache encontrado para ${intent}. Enviando conteúdo direto ao ponto...`);

      const finalResponse = cachedResponse.trim();

      // Salvar a interação COMPLETA para o histórico (essencial para continuidade futura)
      await this.saveMessage(userId, 'assistant', finalResponse);

      return finalResponse;
    } else {
      const finalPrompt = `${corePersona}${memoryContext}\n\nCONTEXTO DE INTENÇÃO:\n${intentContext}${strictRules}`;
      const { content, usage } = await this.callOpenRouter(finalPrompt, message, false, history, mainModel);
      if (usage) await this.logUsage(userId, usage, mainModel);
      response = content;
    }

    // Salvar resposta
    const lastMessageId = await this.saveMessage(userId, 'assistant', response);

    // Condensar contexto em background se necessário
    this.updateContextIfNeeded(userId, lastMessageId).catch(err => {
      this.logger.error('Erro ao atualizar contexto', err);
    });

    return response;
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

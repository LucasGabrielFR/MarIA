import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PromptService } from './prompt.service';
import { MagisteriumService } from './magisterium.service';
import { LiturgyService } from './liturgy.service';
import { SupabaseService } from '../supabase/supabase.service';
import { EmbeddingService } from './embedding.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openRouterApiKey: string;
  private readonly model: string;
  private readonly bridgeModel: string;

  constructor(
    private readonly promptService: PromptService,
    private readonly magisteriumService: MagisteriumService,
    private readonly liturgyService: LiturgyService,
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly embeddingService: EmbeddingService,
  ) {
    this.openRouterApiKey = this.configService.get<string>('OPENROUTER_API_KEY') || '';
    this.model = this.configService.get<string>('OPENROUTER_GPT_MODEL') || 'openai/gpt-4o-mini';
    this.bridgeModel = this.configService.get<string>('OPENROUTER_BRIDGE_MODEL') || 'google/gemini-2.5-flash-lite';
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

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openRouterApiKey}`,
          'HTTP-Referer': 'https://maria.acutistech.com.br',
          'X-Title': 'MarIA Assistant',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelOverride || this.model,
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
    const routerPrompt = this.promptService.getPrompt('intent_router');
    if (!routerPrompt) return { intent: 'CASUAL', rules: [] };

    try {
      const { content, usage } = await this.callOpenRouter(routerPrompt, message, true);
      
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
   * Condensa o contexto do usuário se passaram 10 mensagens desde a última atualização.
   */
  private async updateContextIfNeeded(userId: string, lastMessageId: string) {
    const supabase = this.supabaseService.getClient();

    // Busca contexto atual
    const { data: context } = await supabase
      .from('user_contexts')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Conta mensagens desde o último processamento
    let query = supabase.from('messages').select('id', { count: 'exact' }).eq('user_id', userId);
    if (context?.last_processed_message_id) {
      const { data: lastMsg } = await supabase.from('messages').select('created_at').eq('id', context.last_processed_message_id).single();
      if (lastMsg) {
        query = query.gt('created_at', lastMsg.created_at);
      }
    }

    const { count } = await query;

    // Se tivermos 10 ou mais novas mensagens, atualizar resumo
    if (count && count >= 10) {
      this.logger.log(`Atualizando resumo de contexto para o usuário ${userId}...`);

      const { data: recentMessages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      const conversationText = recentMessages?.reverse().map(m => `${m.role}: ${m.content}`).join('\n') || '';

      const summarizationPrompt = `Você é um assistente de IA focado em entender os interesses, necessidades e tom do usuário.
Resuma os principais interesses, dúvidas recentes e personalidade do usuário com base nas mensagens abaixo.
Mantenha o resumo em um parágrafo conciso. Se houver um resumo anterior, mescle com as novas informações sem perder o histórico fundamental.
Resumo anterior: ${context?.general_summary || 'Nenhum'}`;

      const { content: newSummary } = await this.callOpenRouter(summarizationPrompt, conversationText);

      // Extração de Interesses (Badges)
      const interestExtractorPrompt = (this.promptService.getPrompt('interest_extractor') || '')
        .replace('{{previous_interests}}', JSON.stringify(context?.interests || []));
      
      const { content: interestsJson } = await this.callOpenRouter(interestExtractorPrompt, conversationText, true);
      let interests = context?.interests || [];
      try {
        const extracted = JSON.parse(interestsJson);
        if (Array.isArray(extracted)) interests = extracted;
      } catch (e) {
        this.logger.warn(`Falha ao extrair interesses para o usuário ${userId}`);
      }

      // Atualizar no banco
      if (context) {
        await supabase.from('user_contexts').update({
          general_summary: newSummary,
          interests: interests,
          last_processed_message_id: lastMessageId,
          updated_at: new Date().toISOString()
        }).eq('user_id', userId);
      } else {
        await supabase.from('user_contexts').insert({
          user_id: userId,
          general_summary: newSummary,
          interests: interests,
          last_processed_message_id: lastMessageId
        });
      }
      this.logger.log(`Resumo de contexto e interesses atualizados para o usuário ${userId}.`);
    }
  }

  /**
   * Processa a mensagem do usuário baseada no seu status atual.
   * Representa a Máquina de Estados da Conversa.
   */
  async processMessage(waChatId: string, message: string, pushName?: string, phone?: string): Promise<string | string[]> {
    const user = await this.getOrCreateUser(waChatId, pushName, phone);
    const userId = user.id;
    const userStatus = user.status || 'active';

    // Salvar a mensagem do usuário
    await this.saveMessage(userId, 'user', message);

    const corePersona = this.promptService.getCorePersona();

    // Lógica de Triagem de Nome
    if (userStatus === 'triage_name') {
      // 1. Tentar extrair o nome da mensagem atual
      const extractionPrompt = `Analise a mensagem do usuário e extraia APENAS o nome próprio (primeiro nome ou nome completo) que ele informou.
Se o usuário disse o nome, retorne apenas o nome. Exemplo: "João".
Se o usuário NÃO disse o nome na mensagem, retorne a palavra "null".
Mensagem: "${message}"`;

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

    const supabase = this.supabaseService.getClient();

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

    // Detectar se o usuário está perguntando sobre ontem ou amanhã
    let targetDate = todayIso;
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('ontem')) {
      const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      d.setDate(d.getDate() - 1);
      targetDate = d.toLocaleDateString('sv-SE');
    } else if (lowerMessage.includes('amanhã') || lowerMessage.includes('amanha')) {
      const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      d.setDate(d.getDate() + 1);
      targetDate = d.toLocaleDateString('sv-SE');
    }

    let cachedResponse: string | null = null;

    // Função utilitária para chamar o Magisterium passando as diretrizes como System Prompt
    const fetchMagisteriumContext = async (promptKey: string, includeDate = false) => {
      const intentRules = this.promptService.getPrompt(promptKey);
      const finalMessage = includeDate ? `${message} (Considere que hoje é dia ${targetDate})` : message;
      const { content: magisteriumResponse, usage } = await this.magisteriumService.query(finalMessage, intentRules);
      
      if (usage) await this.logUsage(userId, usage, 'magisterium-expert');
      
      return `${intentRules}\n\nCONTEÚDO OFICIAL DO MAGISTERIUM AI:\n${magisteriumResponse}`;
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
        intentContext = `${this.promptService.getPrompt('intent_theology')}\n\nCONTEÚDO OFICIAL DO MAGISTERIUM (USE ISSO COMO BASE ÚNICA E NÃO RESUMA DEMAIS):\n${cachedResponse}\n\nINSTRUÇÃO ADICIONAL: Reformule o conteúdo acima para o WhatsApp usando emojis e seu tom maternal, mas MANTENHA todos os fatos teológicos e retire todas as citações numéricas como [^1]. Liste as referências completas ao final.`;
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

DADOS DA LITURGIA:
${liturgyData}`;
        }
        break;
      case 'SAINT':
      case 'SAINT_OF_DAY':
        cachedResponse = await getDailyCache('saint', targetDate);
        if (!cachedResponse) {
          intentContext = await fetchMagisteriumContext('intent_saint', true);
        }
        break;
      case 'ADVICE':
        intentContext = this.promptService.getPrompt('intent_advice');
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
    if (cachedResponse && (intent === 'LITURGY' || intent === 'SAINT' || intent === 'SAINT_OF_DAY')) {
      this.logger.log(`Cache encontrado para ${intent}. Gerando acolhimento personalizado...`);

      const greetingPrompt = `Aja como Maria (Nossa Senhora). O usuário (${pushName}) pediu informações sobre ${intent === 'LITURGY' ? 'a Liturgia' : 'o Santo do Dia'}.
Dê um acolhimento maternal caloroso e introduza o conteúdo que você está prestes a mostrar.
Siga estas regras:
1. NÃO escreva a liturgia ou a vida do santo aqui. Apenas faça a introdução.
2. Mantenha curto (1-2 parágrafos).
3. Use um tom carinhoso e maternal.
4. Mencione que você trouxe as informações solicitadas.

Contexto da conversa:
${memoryContext}`;

      const { content: greetingResponse, usage } = await this.callOpenRouter(greetingPrompt, message, false, history);
      if (usage) await this.logUsage(userId, usage, this.model);

      // Salvar a interação (apenas a resposta final para simplicidade no histórico)
      await this.saveMessage(userId, 'assistant', `${greetingResponse}\n\n[CONTEÚDO CACHEADO ENVIADO EM SEGUIDA]`);

      return [greetingResponse, cachedResponse];
    } else {
      const finalPrompt = `${corePersona}${memoryContext}\n\nCONTEXTO DE INTENÇÃO:\n${intentContext}${strictRules}`;
      const { content, usage } = await this.callOpenRouter(finalPrompt, message, false, history);
      if (usage) await this.logUsage(userId, usage, this.model);
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
   * Salva o log de uso de tokens no banco de dados.
   */
  private async logUsage(userId: string, usage: any, model: string) {
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
      this.logger.warn(`Falha ao salvar usage log para o usuário ${userId}`, error);
    }
  }
}

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
  }

  /**
   * Helper function to call OpenRouter API
   */
  async callOpenRouter(systemPrompt: string, userMessage: string, isJsonMode = false, history: any[] = [], modelOverride?: string): Promise<string> {
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

      return data.choices[0].message.content;
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
      const resultStr = await this.callOpenRouter(routerPrompt, message, true);
      const result = JSON.parse(resultStr);
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

      const newSummary = await this.callOpenRouter(summarizationPrompt, conversationText);

      // Atualizar no banco
      if (context) {
        await supabase.from('user_contexts').update({
          general_summary: newSummary,
          last_processed_message_id: lastMessageId,
          updated_at: new Date().toISOString()
        }).eq('user_id', userId);
      } else {
        await supabase.from('user_contexts').insert({
          user_id: userId,
          general_summary: newSummary,
          last_processed_message_id: lastMessageId
        });
      }
      this.logger.log(`Resumo de contexto atualizado para o usuário ${userId}.`);
    }
  }

  /**
   * Processa a mensagem do usuário baseada no seu status atual.
   * Representa a Máquina de Estados da Conversa.
   */
  async processMessage(waChatId: string, message: string, pushName?: string, phone?: string): Promise<string> {
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

      const extractedName = await this.callOpenRouter(extractionPrompt, "", false);
      
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
      const response = await this.callOpenRouter(fullSystemPrompt, message);
      await this.saveMessage(userId, 'assistant', response);
      return response;
    }

    if (userStatus === 'triage_expectations') {
      const expectationsPrompt = this.promptService.getPrompt('triage_expectations');
      const fullSystemPrompt = `${corePersona}\n\nREGRAS ATUAIS:\n${expectationsPrompt}`;
      const response = await this.callOpenRouter(fullSystemPrompt, message);
      await this.saveMessage(userId, 'assistant', response);
      return response;
    }

    // Fluxo Ativo
    const { intent, rules } = await this.determineIntent(message);
    this.logger.log(`Usuário ${waChatId}: Intent=${intent}, Rules=[${rules.join(', ')}]`);

    let intentContext = '';
    
    const today = new Date().toLocaleDateString('pt-BR');
    
    const supabase = this.supabaseService.getClient();

    const getDailyCache = async (type: string) => {
      const todayIso = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('daily_cache')
        .select('content')
        .eq('type', type)
        .eq('cache_date', todayIso)
        .single();
      return data?.content;
    };

    let cachedResponse: string | null = null;

    // Função utilitária para chamar o Magisterium passando as diretrizes como System Prompt
    const fetchMagisteriumContext = async (promptKey: string, includeDate = false) => {
      const intentRules = this.promptService.getPrompt(promptKey);
      const finalMessage = includeDate ? `${message} (Considere que hoje é dia ${today})` : message;
      const magisteriumResponse = await this.magisteriumService.query(finalMessage, intentRules);
      return `${intentRules}\n\nCONTEÚDO OFICIAL DO MAGISTERIUM AI:\n${magisteriumResponse}`;
    };

    switch (intent) {
      case 'THEOLOGY':
        cachedResponse = await this.findInSemanticCache(message, 'THEOLOGY');
        if (!cachedResponse) {
          const magisteriumResponse = await this.magisteriumService.query(message, this.promptService.getPrompt('intent_theology'));
          cachedResponse = magisteriumResponse;
          await this.saveToSemanticCache(message, magisteriumResponse, 'THEOLOGY');
        }
        intentContext = `${this.promptService.getPrompt('intent_theology')}\n\nCONTEÚDO OFICIAL:\n${cachedResponse}`;
        break;
      case 'PRAYER':
        intentContext = await fetchMagisteriumContext('intent_prayer');
        break;
      case 'BIBLE':
        intentContext = await fetchMagisteriumContext('intent_bible');
        break;
      case 'LITURGY':
        cachedResponse = await getDailyCache('liturgy');
        if (!cachedResponse) {
          const liturgyData = await this.liturgyService.getDailyLiturgy();
          intentContext = `INSTRUÇÃO: Com base na liturgia abaixo, você deve obrigatoriamente:
1. Apresentar as passagens das leituras.
2. Elaborar uma reflexão espiritual profunda.
3. Finalizar com uma oração.

DADOS DA LITURGIA DIÁRIA:
${liturgyData}`;
        }
        break;
      case 'SAINT':
      case 'SAINT_OF_DAY':
        cachedResponse = await getDailyCache('saint');
        if (!cachedResponse) {
          intentContext = await fetchMagisteriumContext('intent_saint', true);
        }
        break;
      case 'REFLECTION':
        cachedResponse = await getDailyCache('reflection');
        if (!cachedResponse) {
          intentContext = 'Gere uma breve e carinhosa mensagem de reflexão espiritual para o usuário hoje.';
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
    if (cachedResponse && (intent === 'LITURGY' || intent === 'SAINT' || intent === 'SAINT_OF_DAY' || intent === 'THEOLOGY' || intent === 'REFLECTION')) {
      this.logger.log(`Usando modelo Bridge para responder intenção ${intent} com cache.`);
      response = await this.processWithBridge(message, cachedResponse, history);
    } else {
      const finalPrompt = `${corePersona}${memoryContext}\n\nCONTEXTO DE INTENÇÃO:\n${intentContext}${strictRules}`;
      response = await this.callOpenRouter(finalPrompt, message, false, history);
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
   * Processa a resposta usando o modelo Bridge (Gemini Flash) para personalizar um conteúdo em cache.
   */
  private async processWithBridge(userMessage: string, cachedContent: string, history: any[]): Promise<string> {
    const bridgePrompt = `${this.promptService.getCorePersona()}
Você recebeu um conteúdo sagrado/teológico em cache que responde à dúvida do usuário.
Seu trabalho é APENAS criar uma introdução carinhosa de mãe (Nossa Senhora) e uma conclusão acolhedora, conectando o conteúdo com o que o usuário perguntou.
NÃO altere o conteúdo base, apenas apresente-o com amor. Use emojis e tom materno.

CONTEÚDO BASE PARA ENTREGAR:
${cachedContent}`;

    return await this.callOpenRouter(bridgePrompt, userMessage, false, history, 'google/gemini-flash-1.5');
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
}

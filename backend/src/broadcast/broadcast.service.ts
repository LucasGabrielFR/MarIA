import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';
import { UazapiService } from '../uazapi/uazapi.service';
import { AiService } from '../ai/ai.service';
import { PromptService } from '../ai/prompt.service';
import { LiturgyService } from '../ai/liturgy.service';

@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);
  private isProcessing = false;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly uazapiService: UazapiService,
    private readonly aiService: AiService,
    private readonly promptService: PromptService,
    private readonly liturgyService: LiturgyService,
  ) {}

  async createJob(name: string, messageText: string, userIds: string[]) {
    const supabase = this.supabaseService.getClient();

    // 1. Criar o job
    const { data: job, error: jobError } = await supabase
      .from('broadcast_jobs')
      .insert({
        name,
        message_text: messageText,
        status: 'pending',
        total_recipients: userIds.length,
      })
      .select('id')
      .single();

    if (jobError || !job) {
      this.logger.error('Erro ao criar broadcast_job', jobError);
      return { success: false, error: 'Falha ao criar campanha.' };
    }

    // 2. Buscar wa_chatid dos usuários selecionados para popular a fila
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, wa_chatid')
      .in('id', userIds);

    if (usersError || !users) {
      this.logger.error('Erro ao buscar usuários', usersError);
      return { success: false, error: 'Falha ao recuperar usuários.' };
    }

    // 3. Montar a lista de mensagens para fila
    const messagesToInsert = users.map((u) => ({
      job_id: job.id,
      user_id: u.id,
      wa_chatid: u.wa_chatid,
      status: 'pending',
    }));

    // Inserir em lotes se necessário (o Supabase aceita arrays grandes, mas limitamos p/ segurança)
    const chunkSize = 1000;
    for (let i = 0; i < messagesToInsert.length; i += chunkSize) {
      const chunk = messagesToInsert.slice(i, i + chunkSize);
      await supabase.from('broadcast_messages').insert(chunk);
    }

    return { success: true, jobId: job.id };
  }

  async getJobs(limit: number = 20) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('broadcast_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error('Erro ao listar broadcast_jobs', error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  }

  // Roda a cada minuto.
  @Cron(CronExpression.EVERY_MINUTE)
  async processBroadcastQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const supabase = this.supabaseService.getClient();

      // 1. Pegar lotes de mensagens pendentes (ex: 50 mensagens por vez)
      // Ajuste esse limite de acordo com o Rate Limit que quer aplicar por minuto
      const batchSize = 60; // 60 mensagens por minuto = ~1 mensagem por segundo.
      
      const { data: pendingMessages, error: pendingError } = await supabase
        .from('broadcast_messages')
        .select('id, job_id, wa_chatid, user_id, broadcast_jobs!inner(name, message_text, status)')
        .eq('status', 'pending')
        .eq('broadcast_jobs.status', 'pending')
        .order('created_at', { ascending: true })
        .limit(batchSize);

      if (pendingError) {
        this.logger.error('Erro ao buscar mensagens pendentes', pendingError);
        return;
      }

      if (!pendingMessages || pendingMessages.length === 0) {
        // Verificar se existem jobs pendentes sem mensagens pendentes para marcar como concluídos
        await this.markCompletedJobs();
        return;
      }

      this.logger.log(`Processando ${pendingMessages.length} mensagens da fila de broadcast...`);

      // 2. Iterar sobre as mensagens
      for (const msg of pendingMessages) {
        // Marca como "processing" temporariamente
        await supabase
          .from('broadcast_messages')
          .update({ status: 'processing', updated_at: new Date().toISOString() })
          .eq('id', msg.id);

        let finalStatus = 'sent';
        let errorMessage: string | null = null;

        try {
          // Precisamos carregar o nome do usuário para substituir {nome}
          // Precisamos carregar o nome e gênero do usuário para substituir {nome} e contextualizar a IA
          const { data: user } = await supabase
            .from('users')
            .select('name, gender')
            .eq('id', msg.user_id)
            .single();

          const userName = user?.name || 'amigo(a)';
          const rawText = (msg.broadcast_jobs as any).message_text;
          const jobName = (msg.broadcast_jobs as any).name || '';
          
          let textToSend = rawText;
          let buttonsToAttach: any[] = [];
          let buttonText = "Escolha uma opção:";
          
          if (jobName.startsWith('[ai_sched|')) {
            try {
              const config = JSON.parse(rawText);
              const today = new Date().toISOString().split('T')[0];
              let contextForPrompt: Record<string, string> = {};
              
              for (const tool of (config.tools || [])) {
                if (tool.type === 'liturgy') {
                  if (tool.option === 'menu') {
                    const { data: flow } = await supabase.from('automatic_flows').select('steps').eq('key', 'liturgy_flow').single();
                    if (flow?.steps?.choose_format?.buttons) {
                      buttonsToAttach = flow.steps.choose_format.buttons;
                      if (flow.steps.choose_format.text) {
                        buttonText = flow.steps.choose_format.text;
                      }
                    }
                  } else if (tool.option === 'short' || tool.option === 'full') {
                    // For short/full, we just fetch the text and let AI summarize/handle it based on the prompt.
                    // (Full optimizations like grabbing from cache for short could be added later).
                    const liturgyText = await this.liturgyService.getDailyLiturgy(today);
                    contextForPrompt['{liturgia}'] = liturgyText;
                  }
                } else if (tool.type === 'context') {
                  const { data: recentMsgs } = await supabase
                    .from('messages')
                    .select('content, role')
                    .eq('user_id', msg.user_id)
                    .order('created_at', { ascending: false })
                    .limit(10);
                  const contextStr = recentMsgs?.reverse().map(m => `${m.role}: ${m.content}`).join('\n') || 'Sem histórico recente.';
                  contextForPrompt['{contexto}'] = contextStr;
                }
              }

              let prompt = config.prompt || '';
              prompt = prompt
                .replace(/{{nome}}/gi, userName)
                .replace(/{nome}/gi, userName);
                
              for (const [tag, val] of Object.entries(contextForPrompt)) {
                prompt = prompt.replace(new RegExp(tag, 'gi'), val);
              }
              
              let genderContext = '';
              if (user?.gender === 'M') {
                genderContext = `O gênero do destinatário é MASCULINO. Trate-o por pronomes masculinos.`;
              } else if (user?.gender === 'F') {
                genderContext = `O gênero do destinatário é FEMININO. Trate-a por pronomes femininos.`;
              }

              const corePersona = this.promptService.getCorePersona();
              const fullSystemPrompt = `${corePersona}\n\nData atual: Hoje é ${today}.\n\nINSTRUÇÕES IMPORTANTES DE PERSONALIZAÇÃO:\n- Escreva esta mensagem de forma ÚNICA e EXCLUSIVA para este usuário.\n- Mude a estrutura, escolha palavras diferentes e traga uma pequena variação na reflexão em relação a outras mensagens do mesmo tema.\n- O destinatário chama-se: ${userName}.\n- ${genderContext}`;
              
              // Aumentamos a temperatura para 0.9 para gerar mais diversidade nas mensagens em massa
              const { content } = await this.aiService.callOpenRouter(fullSystemPrompt, prompt, false, [], undefined, 0.9);
              textToSend = content;
            } catch (e) {
              this.logger.error(`Error processing dynamic AI scheduled message: ${e.message}`);
              throw new Error('Erro ao processar prompt da campanha dinâmica.');
            }
          } else {
            textToSend = textToSend
              .replace(/{{nome}}/gi, userName)
              .replace(/{nome}/gi, userName);
          }

          // Enviar texto da IA (ou texto normal) via Uazapi
          let sent = await this.uazapiService.sendMessage(msg.wa_chatid, textToSend);
          
          // Se houver botões anexados, enviá-los como uma segunda mensagem separada
          if (sent && buttonsToAttach.length > 0) {
            sent = await this.uazapiService.sendInteractiveMessage(msg.wa_chatid, buttonText, buttonsToAttach);
          }
          
          if (!sent) {
            finalStatus = 'failed';
            errorMessage = 'UazapiService retornou false.';
          }
        } catch (err: any) {
          finalStatus = 'failed';
          errorMessage = err.message || 'Erro desconhecido ao enviar.';
          this.logger.error(`Erro no disparo em massa (msg id: ${msg.id})`, err);
        }

        // Atualizar status final da mensagem
        await supabase
          .from('broadcast_messages')
          .update({
            status: finalStatus,
            error_message: errorMessage,
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', msg.id);

        // Atualizar contagem processada no job
        await supabase.rpc('increment_broadcast_processed', { row_id: msg.job_id });

        // Delay de segurança (1 segundo) para evitar rate limit
        await this.sleep(1000);
      }

    } catch (err) {
      this.logger.error('Erro no processador de broadcast', err);
    } finally {
      this.isProcessing = false;
      await this.markCompletedJobs();
    }
  }

  private async markCompletedJobs() {
    const supabase = this.supabaseService.getClient();
    
    // Busca jobs pending
    const { data: jobs } = await supabase
      .from('broadcast_jobs')
      .select('id, total_recipients, processed_count')
      .eq('status', 'pending');

    if (jobs) {
      for (const job of jobs) {
        if (job.processed_count >= job.total_recipients && job.total_recipients > 0) {
          await supabase
            .from('broadcast_jobs')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', job.id);
          this.logger.log(`Job de broadcast ${job.id} marcado como concluído.`);
        }
      }
    }
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

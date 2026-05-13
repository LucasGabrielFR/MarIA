import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface AiPrompt {
  id: string;
  key: string;
  content: string;
  description: string;
  is_active: boolean;
}

@Injectable()
export class PromptService implements OnModuleInit {
  private readonly logger = new Logger(PromptService.name);
  private promptCache: Map<string, string> = new Map();

  constructor(private readonly supabaseService: SupabaseService) { }

  async onModuleInit() {
    await this.refreshCache();
  }

  async refreshCache() {
    this.logger.log('Atualizando cache de prompts da IA...');
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('ai_prompts')
      .select('key, content')
      .eq('is_active', true);

    if (error) {
      this.logger.error('Erro ao buscar prompts do Supabase', error);
      return;
    }

    this.promptCache.clear();
    for (const prompt of data) {
      this.promptCache.set(prompt.key, prompt.content);
    }

    this.logger.log(`Carregados ${this.promptCache.size} prompts na memória.`);
  }

  getPrompt(key: string): string {
    const content = this.promptCache.get(key) || '';

    const magisteriumIntents = ['intent_theology', 'intent_prayer', 'intent_bible', 'intent_liturgy', 'intent_saint'];
    if (magisteriumIntents.includes(key)) {
      return content + '\n\nOBRIGATÓRIO: Ao final da sua resposta, você deve listar as referências exatas de onde a informação foi extraída. ' +
        'RETIRE as citações numéricas no texto (ex: [^1]) e crie uma seção "*Referências:*" ao final com a lista completa formatada para WhatsApp em português quando possível.';
    }
    return content;
  }

  getCorePersona(): string {
    return this.getPrompt('core_persona');
  }
}

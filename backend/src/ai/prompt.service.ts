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

  constructor(private readonly supabaseService: SupabaseService) {}

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
      // Unescape literal \n if they exist
      const content = (prompt.content || '').replace(/\\n/g, '\n');
      this.promptCache.set(prompt.key, content);
    }

    this.logger.log(`Carregados ${this.promptCache.size} prompts na memória.`);
  }

  getPrompt(key: string): string {
    const value = this.promptCache.get(key);
    if (!value) {
      this.logger.warn(`Prompt não encontrado para chave: "${key}"`);
      return '';
    }
    return value;
  }

  getCorePersona(): string {
    const basePersona = this.getPrompt('core_persona');
    const whatsappRule = '\n\nATENÇÃO MÁXIMA À FORMATAÇÃO: O usuário recebe as mensagens no WhatsApp. O WhatsApp NÃO suporta Markdown tradicional (como #, ##, ###, **, etc). Você DEVE usar APENAS a formatação suportada pelo WhatsApp:\n- *negrito* (asteriscos simples)\n- _itálico_ (underline)\n- ~tachado~ (til)\nNUNCA use #, ##, ### para títulos. Se precisar de um título, use *Título* (apenas asterisco simples para negrito) ou escreva em maiúsculas.';
    return basePersona + whatsappRule;
  }
}

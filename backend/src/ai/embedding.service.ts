import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://maria-ia.com.br',
          'X-Title': 'MarIA Assistant',
        },
      });
    } else {
      this.logger.warn(
        'OPENROUTER_API_KEY não encontrada. Embeddings não funcionarão corretamente.',
      );
    }
  }

  async generate(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error(
        'OpenAI client not initialized. Please provide OPENAI_API_KEY.',
      );
    }

    try {
      const response = await this.openai.embeddings.create({
        model: 'openai/text-embedding-3-small',
        input: text.replace(/\n/g, ' '),
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Erro ao gerar embedding', error);
      throw error;
    }
  }
}

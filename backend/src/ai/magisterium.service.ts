import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MagisteriumService {
  private readonly logger = new Logger(MagisteriumService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl =
      this.configService.get<string>('MAGISTERIUM_API_URL') ||
      'https://www.magisterium.com/api';
    this.apiKey = this.configService.get<string>('MAGISTERIUM_API_KEY') || '';
  }

  /**
   * Consulta a base de dados teológica do Magisterium AI
   * Pode receber um system prompt customizado para parametrizar o foco (ex: orações, santos, liturgia).
   */
  async query(
    message: string,
    systemPrompt?: string,
  ): Promise<{
    content: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }> {
    try {
      this.logger.log(`Consultando Magisterium AI para: "${message}"`);

      const messagesPayload: { role: string; content: string }[] = [];
      if (systemPrompt) {
        messagesPayload.push({ role: 'system', content: systemPrompt });
      }
      messagesPayload.push({ role: 'user', content: message });

      const response = await fetch(`${this.apiUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'magisterium-expert',
          messages: messagesPayload,
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Erro na API Magisterium: ${response.status} - ${errorText}`,
        );
        return { content: 'Erro ao consultar a base teológica.' };
      }

      const data = await response.json();

      const content =
        data.choices?.[0]?.message?.content ||
        'Nenhuma informação teológica encontrada.';
      let finalResponse = content;

      if (data.citations && data.citations.length > 0) {
        finalResponse += '\n\n**Referências:**\n';

        const uniqueDocs = new Set<string>();
        data.citations.forEach((cit: any) => {
          if (cit.document_title) {
            const author = cit.document_author
              ? ` - ${cit.document_author}`
              : '';
            const year = cit.document_year ? ` (${cit.document_year})` : '';
            const docRef = `- ${cit.document_title}${author}${year}`;

            if (!uniqueDocs.has(docRef)) {
              uniqueDocs.add(docRef);
              finalResponse += `${docRef}\n`;
            }
          }
        });
      }

      return {
        content: finalResponse,
        usage: data.usage, // Magisterium segue o padrão de retornar usage no root
      };
    } catch (error) {
      this.logger.error('Falha crítica ao consultar Magisterium AI', error);
      return { content: 'A base teológica está temporariamente indisponível.' };
    }
  }
}

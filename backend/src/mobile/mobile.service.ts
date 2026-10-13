import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';

export class MobileChatMessageDto {
  role: 'user' | 'assistant';
  content: string;
}

export class MobileChatRequestDto {
  message: string;
  history?: MobileChatMessageDto[];
  phone?: string;
  userId?: string;
  userName?: string;
  source?: 'mobile' | 'whatsapp';
}

@Injectable()
export class MobileService {
  private readonly logger = new Logger(MobileService.name);

  constructor(private readonly aiService: AiService) {}

  async processChat(dto: MobileChatRequestDto): Promise<{ response: string; timestamp: string }> {
    const userMessage = dto.message.trim();
    const source = dto.source || 'mobile';
    const cleanPhone = dto.phone ? dto.phone.replace(/\D/g, '') : undefined;
    const pushName = dto.userName || 'Fiel';

    // Determina o identificador do chat unificado
    let chatId = '';
    if (cleanPhone) {
      chatId = `mobile:${cleanPhone}`;
    } else if (dto.userId) {
      chatId = `mobile:${dto.userId}`;
    } else {
      chatId = `mobile:guest_${pushName.toLowerCase().replace(/\s+/g, '_')}`;
    }

    this.logger.log(
      `[Mobile Chat] Processando mensagem via AiService (source: ${source}, chatId: ${chatId}): "${userMessage.substring(0, 50)}..."`,
    );

    try {
      // Processa a mensagem através do pipeline oficial da MarIA no AiService (mesmo motor do WhatsApp)
      const aiResult = await this.aiService.processMessage(
        chatId,
        userMessage,
        pushName,
        cleanPhone,
        null,
        source,
      );

      let responseText = '';
      if (typeof aiResult === 'string') {
        responseText = aiResult;
      } else if (aiResult && typeof aiResult === 'object') {
        if (aiResult.text) {
          responseText = aiResult.text;
        } else if (aiResult.body) {
          responseText = aiResult.body;
        } else if (aiResult.content) {
          responseText = aiResult.content;
        } else {
          responseText = JSON.stringify(aiResult);
        }
      }

      if (!responseText || !responseText.trim()) {
        responseText = 'Salve Maria! Filho querido, estou em constante oração por você.';
      }

      return {
        response: responseText.trim(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `[Mobile Chat] Falha ao processar mensagem via AiService: ${error.message}`,
        error.stack,
      );

      return {
        response:
          'Salve Maria! Tive um breve momento de instabilidade ao buscar nossa resposta, mas continuo rezando por você. Como posso te acompanhar agora?',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UazapiService {
  private readonly logger = new Logger(UazapiService.name);
  private readonly apiUrl: string;
  private readonly token: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('UAZAPI_INSTANCE_URL') || '';
    this.token = this.configService.get<string>('UAZAPI_INSTANCE_TOKEN') || '';
  }

  async sendMessage(chatId: string, text: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/send/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': this.token,
        },
        body: JSON.stringify({
          number: chatId,
          text: text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to send message via UAZAPI: ${response.status} - ${errorText}`);
        return false;
      }

      this.logger.log(`Message sent successfully to ${chatId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending message via UAZAPI: ${error.message}`);
      return false;
    }
  }

  async markRead(chatId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/chat/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': this.token,
        },
        body: JSON.stringify({
          number: chatId,
          read: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to mark chat as read via UAZAPI: ${response.status} - ${errorText}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Error marking chat as read via UAZAPI: ${error.message}`);
      return false;
    }
  }

  async sendPresence(chatId: string, presence: 'composing' | 'recording' | 'paused' = 'composing'): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/message/presence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': this.token,
        },
        body: JSON.stringify({
          number: chatId,
          presence: presence,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to send presence via UAZAPI: ${response.status} - ${errorText}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Error sending presence via UAZAPI: ${error.message}`);
      return false;
    }
  }

  async sendInteractiveMessage(chatId: string, text: string, buttons: Array<{id: string, text: string}>): Promise<boolean> {
    // Always attempt native WhatsApp buttons first, regardless of count.
    // If WhatsApp rejects the request (e.g., >3 buttons), we fall back to plain text automatically.
    try {
      this.logger.log(`Attempting to send ${buttons.length} native buttons to ${chatId}`);
      const response = await fetch(`${this.apiUrl}/send/buttons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': this.token,
        },
        body: JSON.stringify({
          number: chatId,
          text: text,
          buttons: buttons.map(b => ({
            buttonId: b.id,
            buttonText: { displayText: b.text },
            type: 1
          }))
        }),
      });

      if (response.ok) {
        this.logger.log(`Native buttons sent successfully to ${chatId}`);
        return true;
      }

      const errorText = await response.text();
      this.logger.warn(`UAZAPI /send/buttons failed (${response.status}: ${errorText}). Falling back to text message.`);
    } catch (error) {
      this.logger.warn(`Error sending native buttons: ${error.message}. Falling back to text message.`);
    }

    // Fallback: plain text (already contains numbered list 1️⃣, 2️⃣... from the DB)
    return this.sendMessage(chatId, text);
  }
}


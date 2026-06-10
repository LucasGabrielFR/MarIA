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
          token: this.token,
        },
        body: JSON.stringify({
          number: chatId,
          text: text,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Failed to send message via UAZAPI: ${response.status} - ${errorText}`,
        );
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
          token: this.token,
        },
        body: JSON.stringify({
          number: chatId,
          read: true,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Failed to mark chat as read via UAZAPI: ${response.status} - ${errorText}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Error marking chat as read via UAZAPI: ${error.message}`,
      );
      return false;
    }
  }

  async sendPresence(
    chatId: string,
    presence: 'composing' | 'recording' | 'paused' = 'composing',
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/message/presence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: this.token,
        },
        body: JSON.stringify({
          number: chatId,
          presence: presence,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Failed to send presence via UAZAPI: ${response.status} - ${errorText}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Error sending presence via UAZAPI: ${error.message}`);
      return false;
    }
  }

  async sendInteractiveMessage(
    chatId: string,
    text: string,
    buttons: Array<{ id: string; text: string }>,
  ): Promise<boolean> {
    if (!buttons?.length) {
      return this.sendMessage(chatId, text);
    }

    // UAZAPI usa POST /send/menu com type "button" e choices no formato "rótulo|id"
    const choices = buttons.slice(0, 3).map((b) => {
      const label = (b.text || b.id).trim();
      const id = String(b.id || label).trim();
      return label === id ? label : `${label}|${id}`;
    });

    try {
      this.logger.log(
        `Sending ${choices.length} menu buttons to ${chatId} via /send/menu`,
      );
      const response = await fetch(`${this.apiUrl}/send/menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: this.token,
        },
        body: JSON.stringify({
          number: chatId,
          type: 'button',
          text,
          choices,
          readchat: true,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (response.ok) {
        this.logger.log(`Menu buttons sent successfully to ${chatId}`);
        return true;
      }

      const errorText = await response.text();
      this.logger.warn(
        `UAZAPI /send/menu failed (${response.status}: ${errorText}). Falling back to text message.`,
      );
    } catch (error) {
      this.logger.warn(
        `Error sending menu buttons: ${error.message}. Falling back to text message.`,
      );
    }

    const numbered = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
    const fallbackText =
      text +
      '\n\n' +
      buttons
        .map((b, i) => `${numbered[i] || `${i + 1}.`} ${b.text}`)
        .join('\n');
    return this.sendMessage(chatId, fallbackText);
  }
}

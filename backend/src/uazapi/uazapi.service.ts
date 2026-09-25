import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemLogsService } from '../system-logs/system-logs.service';

export interface InteractiveOptions {
  type?: 'button' | 'list' | 'auto';
  listButton?: string;
  footerText?: string;
  sectionTitle?: string;
}

@Injectable()
export class UazapiService {
  private readonly logger = new Logger(UazapiService.name);
  private readonly apiUrl: string;
  private readonly token: string;

  constructor(
    private configService: ConfigService,
    private readonly systemLogsService: SystemLogsService,
  ) {
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
        const errMsg = `Falha ao enviar mensagem via UAZAPI: ${response.status} - ${errorText}`;
        this.logger.error(errMsg);
        await this.systemLogsService.logError('UazapiService', errMsg, null, {
          chatId,
          status: response.status,
          errorText,
          preview: text.substring(0, 100),
        });
        return false;
      }

      this.logger.log(`Message sent successfully to ${chatId}`);
      await this.systemLogsService.logInfo(
        'UazapiService',
        `Mensagem de texto enviada com sucesso para ${chatId}`,
        { chatId, preview: text.substring(0, 100) },
      );
      return true;
    } catch (error: any) {
      const errMsg = `Exceção ao enviar mensagem via UAZAPI para ${chatId}: ${error.message}`;
      this.logger.error(errMsg);
      await this.systemLogsService.logError('UazapiService', errMsg, error, {
        chatId,
        preview: text.substring(0, 100),
      });
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
    buttons: Array<{ id: string; text: string; description?: string }>,
    options?: InteractiveOptions,
  ): Promise<boolean> {
    if (!buttons?.length) {
      return this.sendMessage(chatId, text);
    }

    // Determina o tipo interativo: 'list' (se > 3 botões ou explicitamente 'list') ou 'button' (até 3 botões)
    const isListRequested = options?.type === 'list';
    const isButtonRequested = options?.type === 'button';
    const shouldUseList = isListRequested || (!isButtonRequested && buttons.length > 3);

    if (shouldUseList) {
      const sectionTitle = options?.sectionTitle || 'Opções Disponíveis';
      const listButton = (options?.listButton || 'Ver opções').substring(0, 20);

      // WhatsApp List suporta no máximo 10 itens por mensagem
      const visibleButtons = buttons.slice(0, 10);
      const choices: string[] = [`[${sectionTitle}]`];

      for (const b of visibleButtons) {
        const label = (b.text || b.id).trim();
        const id = String(b.id || label).trim();
        if (b.description?.trim()) {
          choices.push(`${label}|${id}|${b.description.trim()}`);
        } else {
          choices.push(label === id ? label : `${label}|${id}`);
        }
      }

      try {
        this.logger.log(
          `Sending list menu with ${visibleButtons.length} choices to ${chatId} via /send/menu`,
        );
        const payload: Record<string, any> = {
          number: chatId,
          type: 'list',
          text,
          choices,
          listButton,
          readchat: true,
        };
        if (options?.footerText) {
          payload.footerText = options.footerText;
        }

        const response = await fetch(`${this.apiUrl}/send/menu`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token: this.token,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10_000),
        });

        if (response.ok) {
          this.logger.log(`List menu sent successfully to ${chatId}`);
          await this.systemLogsService.logInfo(
            'UazapiService',
            `Menu de lista interativo enviado com sucesso para ${chatId}`,
            { chatId, type: 'list', itemsCount: visibleButtons.length, preview: text.substring(0, 100) },
          );
          return true;
        }

        const errorText = await response.text();
        const warnMsg = `UAZAPI /send/menu (list) falhou (${response.status}: ${errorText}). Acionando fallback em texto.`;
        this.logger.warn(warnMsg);
        await this.systemLogsService.logWarn('UazapiService', warnMsg, {
          chatId,
          status: response.status,
          errorText,
        });
      } catch (error: any) {
        const warnMsg = `Erro ao enviar menu de lista para ${chatId}: ${error.message}. Acionando fallback em texto.`;
        this.logger.warn(warnMsg);
        await this.systemLogsService.logWarn('UazapiService', warnMsg, {
          chatId,
          error: error.message,
        });
      }

      // Fallback para texto caso o menu de lista falhe na API
      const numbered = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
      const fallbackText =
        text +
        '\n\n' +
        buttons
          .map((b, i) => `${numbered[i] || `${i + 1}.`} ${b.text}`)
          .join('\n');
      return this.sendMessage(chatId, fallbackText);
    }

    // Modo Botões (type: 'button', máximo 3)
    const activeButtons = buttons.slice(0, 3);
    const choices = activeButtons.map((b) => {
      const label = (b.text || b.id).trim();
      const id = String(b.id || label).trim();
      return label === id ? label : `${label}|${id}`;
    });

    try {
      this.logger.log(
        `Sending ${choices.length} menu buttons to ${chatId} via /send/menu`,
      );
      const payload: Record<string, any> = {
        number: chatId,
        type: 'button',
        text,
        choices,
        readchat: true,
      };
      if (options?.footerText) {
        payload.footerText = options.footerText;
      }

      const response = await fetch(`${this.apiUrl}/send/menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: this.token,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });

      if (response.ok) {
        this.logger.log(`Menu buttons sent successfully to ${chatId}`);
        await this.systemLogsService.logInfo(
          'UazapiService',
          `Botões interativos enviados com sucesso para ${chatId}`,
          { chatId, type: 'button', buttonsCount: choices.length, preview: text.substring(0, 100) },
        );
        return true;
      }

      const errorText = await response.text();
      const warnMsg = `UAZAPI /send/menu falhou (${response.status}: ${errorText}). Acionando fallback em texto.`;
      this.logger.warn(warnMsg);
      await this.systemLogsService.logWarn('UazapiService', warnMsg, {
        chatId,
        status: response.status,
        errorText,
      });
    } catch (error: any) {
      const warnMsg = `Erro ao enviar botões interativos para ${chatId}: ${error.message}. Acionando fallback em texto.`;
      this.logger.warn(warnMsg);
      await this.systemLogsService.logWarn('UazapiService', warnMsg, {
        chatId,
        error: error.message,
      });
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

import { Controller, Post, Body, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { UazapiService } from './uazapi.service';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('webhook/uazapi')
export class UazapiController {
  private readonly logger = new Logger(UazapiController.name);

  constructor(
    private readonly aiService: AiService,
    private readonly uazapiService: UazapiService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Post()
  async handleWebhook(@Body() payload: any) {
    const eventType = payload?.EventType || payload?.event || 'unknown';
    // Para depuração, apenas logs curtos ou baseados no tipo do evento
    this.logger.log(`Received Webhook event: ${eventType}`);

    // Salvar log no Supabase para análise futura
    try {
      await this.supabaseService.getClient()
        .from('webhook_logs')
        .insert({
          event_type: eventType,
          payload: payload,
        });
    } catch (logError) {
      this.logger.error(`Failed to save webhook log: ${logError.message}`);
    }

    // Suporte ao formato UAZAPI (EventType e objeto message direto)
    if (eventType === 'messages' || eventType === 'messages.upsert') {
      const messageData = payload.message || (payload.data?.messages ? payload.data.messages[0] : null);
      
      if (!messageData) {
        return { status: 'no_message_data' };
      }

      // Ignorar mensagens enviadas pelo próprio bot
      const fromMe = messageData.fromMe;
      if (fromMe) return { status: 'ignored_from_me' };

      // Extrair o chatId
      const chatId = messageData.chatid || messageData.remoteJid || messageData.key?.remoteJid;
      
      // Ignorar grupos
      if (chatId && chatId.includes('@g.us')) return { status: 'ignored_group' };

      // O texto no formato UAZAPI vem em 'text' ou 'content'
      const messageContent = messageData.text 
        || messageData.content 
        || messageData.message?.conversation 
        || messageData.message?.extendedTextMessage?.text 
        || '';

      if (!messageContent || !chatId) {
        return { status: 'missing_content_or_chatid' }; 
      }

      this.logger.log(`Processing message from ${chatId}: "${messageContent}"`);

      // Extrair nome e telefone para persistência se for novo usuário
      const pushName = messageData.senderName || payload.chat?.wa_name || payload.chat?.wa_contactName || 'Usuário';
      const phoneNumber = payload.chat?.phone || chatId.split('@')[0];

      try {
        const responseText = await this.aiService.processMessage(chatId, messageContent, pushName, phoneNumber);
        
        if (responseText) {
          await this.uazapiService.sendMessage(chatId, responseText);
          this.logger.log(`Response sent to ${chatId}`);
        }
      } catch (error) {
        this.logger.error(`Error processing message for ${chatId}: ${error.message}`);
      }
    }

    return { status: 'success' };
  }
}

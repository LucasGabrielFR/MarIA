import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { SupabaseService } from '../supabase/supabase.service';

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

export class UpdatePreferencesDto {
  phone?: string;
  userId?: string;
  receiveDailyLiturgy?: boolean;
  receiveDailyExam?: boolean;
  receiveDailySaint?: boolean;
  whatsappBridgeEnabled?: boolean;
}

export class UserPreferencesResponseDto {
  userId: string;
  phone: string;
  name: string;
  receiveDailyLiturgy: boolean;
  receiveDailyExam: boolean;
  receiveDailySaint: boolean;
  whatsappBridgeEnabled: boolean;
  isRegisteredOnWhatsapp: boolean;
}

export class SpiritualHabitDto {
  id: string;
  title: string;
  description?: string;
  period: string; // 'Manhã', 'Meio-dia', 'Tarde', 'Noite'
  defaultTime: string; // '07:00'
  isCompleted?: boolean;
  completedAt?: string;
  reminderEnabled?: boolean;
  notifyOnDevice?: boolean;
  notifyOnWhatsApp?: boolean;
  soundType?: string;
  isCustom?: boolean;
  orderIndex?: number;
  updatedAt?: string;
}

export class UpdateSpiritualPlanDto {
  phone?: string;
  userId?: string;
  habits: SpiritualHabitDto[];
  streakDays?: number;
}

export class SpiritualPlanResponseDto {
  userId: string;
  phone: string;
  habits: SpiritualHabitDto[];
  streakDays: number;
  updatedAt: string;
}

@Injectable()
export class MobileService {
  private readonly logger = new Logger(MobileService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly supabaseService: SupabaseService,
  ) {}

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

  /**
   * Obtém as preferências espirituais do fiel conectadas ao WhatsApp e Supabase.
   */
  async getPreferences(phone?: string, userId?: string): Promise<UserPreferencesResponseDto> {
    const supabase = this.supabaseService.getClient();
    const cleanPhone = phone ? phone.replace(/\D/g, '') : undefined;

    let user: any = null;

    if (cleanPhone) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .or(`phone.eq.${cleanPhone},phone.eq.+${cleanPhone},phone.eq.55${cleanPhone},wa_chatid.ilike.%${cleanPhone}%`)
        .limit(1)
        .maybeSingle();
      user = data;
    } else if (userId) {
      const { data } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      user = data;
    }

    if (!user) {
      return {
        userId: userId || '',
        phone: cleanPhone || '',
        name: 'Fiel Convidado',
        receiveDailyLiturgy: true,
        receiveDailyExam: true,
        receiveDailySaint: false,
        whatsappBridgeEnabled: true,
        isRegisteredOnWhatsapp: false,
      };
    }

    return {
      userId: user.id,
      phone: user.phone || cleanPhone || '',
      name: user.name || 'Fiel',
      receiveDailyLiturgy: user.receive_daily_liturgy ?? true,
      receiveDailyExam: user.receive_daily_exam ?? true,
      receiveDailySaint: user.receive_daily_saint ?? false,
      whatsappBridgeEnabled: user.whatsapp_bridge_enabled ?? true,
      isRegisteredOnWhatsapp: !!user.wa_chatid || !!user.phone,
    };
  }

  /**
   * Atualiza as preferências espirituais do fiel, refletindo diretamente nos disparos do WhatsApp.
   */
  async updatePreferences(dto: UpdatePreferencesDto): Promise<UserPreferencesResponseDto> {
    const supabase = this.supabaseService.getClient();
    const cleanPhone = dto.phone ? dto.phone.replace(/\D/g, '') : undefined;

    let user: any = null;

    if (cleanPhone) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .or(`phone.eq.${cleanPhone},phone.eq.+${cleanPhone},phone.eq.55${cleanPhone},wa_chatid.ilike.%${cleanPhone}%`)
        .limit(1)
        .maybeSingle();
      user = data;
    } else if (dto.userId) {
      const { data } = await supabase.from('users').select('*').eq('id', dto.userId).maybeSingle();
      user = data;
    }

    // Se o usuário ainda não existir no Supabase e temos o telefone, criamos o cadastro inicial
    if (!user && cleanPhone) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          phone: cleanPhone,
          wa_chatid: `${cleanPhone}@s.whatsapp.net`,
          name: 'Fiel MarIA',
          status: 'active',
          origin: 'mobile',
          receive_daily_liturgy: dto.receiveDailyLiturgy ?? true,
        })
        .select()
        .single();

      if (!createError && newUser) {
        user = newUser;
        this.logger.log(`[Mobile Preferences] Usuário criado via App: ${user.id} (${cleanPhone})`);
      }
    }

    if (!user) {
      // Retorna estado simulado se não for possível vincular usuário
      return {
        userId: dto.userId || '',
        phone: cleanPhone || '',
        name: 'Fiel Convidado',
        receiveDailyLiturgy: dto.receiveDailyLiturgy ?? true,
        receiveDailyExam: dto.receiveDailyExam ?? true,
        receiveDailySaint: dto.receiveDailySaint ?? false,
        whatsappBridgeEnabled: dto.whatsappBridgeEnabled ?? true,
        isRegisteredOnWhatsapp: false,
      };
    }

    // Monta payload de atualização
    const fullPayload: any = {};
    const minimalPayload: any = {};

    if (dto.receiveDailyLiturgy !== undefined) {
      fullPayload.receive_daily_liturgy = dto.receiveDailyLiturgy;
      minimalPayload.receive_daily_liturgy = dto.receiveDailyLiturgy;
    }
    if (dto.receiveDailyExam !== undefined) {
      fullPayload.receive_daily_exam = dto.receiveDailyExam;
    }
    if (dto.receiveDailySaint !== undefined) {
      fullPayload.receive_daily_saint = dto.receiveDailySaint;
    }
    if (dto.whatsappBridgeEnabled !== undefined) {
      fullPayload.whatsapp_bridge_enabled = dto.whatsappBridgeEnabled;
    }

    // Atualização com fallback gracioso caso as colunas opcionais ainda não estejam criadas
    try {
      const { data: updated, error } = await supabase
        .from('users')
        .update(fullPayload)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        this.logger.warn(
          `[Mobile Preferences] Tentando update mínimo em users devido a: ${error.message}`,
        );
        const { data: fallbackUpdated } = await supabase
          .from('users')
          .update(minimalPayload)
          .eq('id', user.id)
          .select()
          .single();
        user = fallbackUpdated || user;
      } else {
        user = updated || user;
      }
    } catch (err) {
      this.logger.error(`[Mobile Preferences] Erro ao salvar preferências: ${err.message}`);
    }

    this.logger.log(
      `[Mobile Preferences] Preferências atualizadas para ${user.id} (${user.phone}): liturgia=${user.receive_daily_liturgy}, exame=${user.receive_daily_exam}`,
    );

    return {
      userId: user.id,
      phone: user.phone || cleanPhone || '',
      name: user.name || 'Fiel',
      receiveDailyLiturgy: user.receive_daily_liturgy ?? dto.receiveDailyLiturgy ?? true,
      receiveDailyExam: user.receive_daily_exam ?? dto.receiveDailyExam ?? true,
      receiveDailySaint: user.receive_daily_saint ?? dto.receiveDailySaint ?? false,
      whatsappBridgeEnabled: user.whatsapp_bridge_enabled ?? dto.whatsappBridgeEnabled ?? true,
      isRegisteredOnWhatsapp: !!user.wa_chatid || !!user.phone,
    };
  }

  async getSpiritualPlan(phone?: string, userId?: string): Promise<SpiritualPlanResponseDto> {
    const cleanPhone = phone ? phone.replace(/\D/g, '') : undefined;
    const supabase = this.supabaseService.getClient();

    let user: any = null;
    if (userId) {
      const { data } = await supabase.from('users').select('id, phone, name').eq('id', userId).maybeSingle();
      user = data;
    }
    if (!user && cleanPhone) {
      const { data } = await supabase.from('users').select('id, phone, name').ilike('phone', `%${cleanPhone}%`).maybeSingle();
      user = data;
    }

    if (!user) {
      return {
        userId: userId || '',
        phone: cleanPhone || '',
        habits: [],
        streakDays: 0,
        updatedAt: new Date().toISOString(),
      };
    }

    const { data: plan } = await supabase
      .from('user_spiritual_plans')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    return {
      userId: user.id,
      phone: user.phone || cleanPhone || '',
      habits: (plan?.habits as SpiritualHabitDto[]) || [],
      streakDays: plan?.streak_days || 0,
      updatedAt: plan?.updated_at || new Date().toISOString(),
    };
  }

  async updateSpiritualPlan(dto: UpdateSpiritualPlanDto): Promise<SpiritualPlanResponseDto> {
    const cleanPhone = dto.phone ? dto.phone.replace(/\D/g, '') : undefined;
    const supabase = this.supabaseService.getClient();

    let user: any = null;
    if (dto.userId) {
      const { data } = await supabase.from('users').select('id, phone, name').eq('id', dto.userId).maybeSingle();
      user = data;
    }
    if (!user && cleanPhone) {
      const { data } = await supabase.from('users').select('id, phone, name').ilike('phone', `%${cleanPhone}%`).maybeSingle();
      user = data;
    }

    if (!user && cleanPhone) {
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          phone: cleanPhone,
          name: 'Fiel App',
          subscription_tier: 'free',
        })
        .select()
        .single();
      user = newUser;
    }

    if (!user) {
      return {
        userId: dto.userId || '',
        phone: cleanPhone || '',
        habits: dto.habits || [],
        streakDays: dto.streakDays || 0,
        updatedAt: new Date().toISOString(),
      };
    }

    const nowIso = new Date().toISOString();
    const { data: savedPlan, error } = await supabase
      .from('user_spiritual_plans')
      .upsert(
        {
          user_id: user.id,
          habits: dto.habits || [],
          streak_days: dto.streakDays ?? 0,
          updated_at: nowIso,
        },
        { onConflict: 'user_id' },
      )
      .select()
      .single();

    if (error) {
      this.logger.error(`[Spiritual Plan] Erro ao salvar plano para usuário ${user.id}: ${error.message}`);
    } else {
      this.logger.log(`[Spiritual Plan] Plano salvo para ${user.id} com ${dto.habits?.length ?? 0} hábitos.`);
    }

    return {
      userId: user.id,
      phone: user.phone || cleanPhone || '',
      habits: (savedPlan?.habits as SpiritualHabitDto[]) || dto.habits || [],
      streakDays: savedPlan?.streak_days ?? dto.streakDays ?? 0,
      updatedAt: savedPlan?.updated_at || nowIso,
    };
  }
}

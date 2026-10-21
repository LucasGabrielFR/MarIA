import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { SupabaseService } from '../supabase/supabase.service';
import { RemindersService, SyncMobileRemindersDto } from '../reminders/reminders.service';
import { LiturgyService } from '../ai/liturgy.service';
import { SaintService } from '../ai/saint.service';

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
  toolType?: string;
  customText?: string;
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
    private readonly remindersService: RemindersService,
    private readonly liturgyService: LiturgyService,
    private readonly saintService: SaintService,
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

    let habits: SpiritualHabitDto[] = (plan?.habits as SpiritualHabitDto[]) || [];

    // Busca lembretes cadastrados no banco para o usuário (ex: criados no WhatsApp ou pré-existentes)
    const { data: userReminders } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (userReminders && userReminders.length > 0) {
      let habitsChanged = false;
      for (const rem of userReminders) {
        // Tenta achar hábito pelo external_id ou pelo tool_type
        const existingHabit = habits.find(
          (h) => h.id === rem.external_id || (rem.tool_type && rem.tool_type !== 'custom' && h.toolType === rem.tool_type),
        );

        if (existingHabit) {
          // Garante que o status do WhatsApp no hábito reflita o estado real do lembrete no banco
          if (existingHabit.notifyOnWhatsApp !== (rem.send_whatsapp === true)) {
            existingHabit.notifyOnWhatsApp = rem.send_whatsapp === true;
            habitsChanged = true;
          }
          if (rem.reminder_time && existingHabit.defaultTime !== rem.reminder_time) {
            existingHabit.defaultTime = rem.reminder_time;
            habitsChanged = true;
          }
          if (!existingHabit.toolType && rem.tool_type) {
            existingHabit.toolType = rem.tool_type;
            habitsChanged = true;
          }
        } else {
          // Lembrete criado fora do app (ex: no WhatsApp via chat) -> adiciona como hábito consolidado!
          const [hStr] = (rem.reminder_time || '07:00').split(':');
          const hour = parseInt(hStr || '7', 10);
          
          let period = rem.scheduled_period;
          if (!period) {
            if (hour < 12) period = 'Manhã';
            else if (hour === 12) period = 'Meio-dia';
            else if (hour < 18) period = 'Tarde';
            else period = 'Noite';
          }

          const isCanonical = [
            'morning_prayer',
            'liturgy',
            'saint',
            'angelus',
            'divine_mercy',
            'rosary',
            'night_prayer',
            'conscience_exam',
          ].includes(rem.tool_type);

          const generatedId = rem.external_id || `rem_${rem.id}`;
          const newHabit: SpiritualHabitDto = {
            id: generatedId,
            title: rem.title,
            description: rem.custom_text || (rem.is_prayer ? 'Oração agendada via WhatsApp' : 'Lembrete do Plano de Vida'),
            period: period,
            defaultTime: rem.reminder_time || '07:00',
            reminderEnabled: true,
            notifyOnDevice: true,
            notifyOnWhatsApp: rem.send_whatsapp === true,
            soundType: 'Sino de Mosteiro',
            isCustom: !isCanonical,
            toolType: rem.tool_type || 'custom',
            customText: rem.custom_text || undefined,
            orderIndex: habits.length,
          };
          habits.push(newHabit);
          habitsChanged = true;

          // Se o reminder não tinha external_id, vincula agora
          if (!rem.external_id) {
            await supabase.from('reminders').update({ external_id: generatedId }).eq('id', rem.id);
          }
        }
      }

      // Se novos hábitos foram consolidados, salva em user_spiritual_plans
      if (habitsChanged) {
        await supabase
          .from('user_spiritual_plans')
          .upsert(
            {
              user_id: user.id,
              habits,
              streak_days: plan?.streak_days || 0,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' },
          );
      }
    }

    return {
      userId: user.id,
      phone: user.phone || cleanPhone || '',
      habits,
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

      // Sincroniza hábitos ativados na tabela reminders e limpa quaisquer lembretes desativados
      try {
        const remindersToSync = (dto.habits || []).map((h) => {
          let toolType = h.toolType || 'custom';
          if (toolType === 'custom') {
            const hid = (h.id || '').toLowerCase();
            if (hid.includes('morning') || hid.includes('offering')) toolType = 'morning_prayer';
            else if (hid.includes('liturgy')) toolType = 'liturgy';
            else if (hid.includes('saint')) toolType = 'saint';
            else if (hid.includes('angelus')) toolType = 'angelus';
            else if (hid.includes('mercy')) toolType = 'divine_mercy';
            else if (hid.includes('rosary')) toolType = 'rosary';
            else if (hid.includes('night_prayer')) toolType = 'night_prayer';
            else if (hid.includes('night_exam') || hid.includes('exam')) toolType = 'conscience_exam';
          }

          return {
            id: h.id,
            title: h.title,
            subtitle: h.description,
            time: h.defaultTime || '07:00',
            isEnabled: true,
            sendOnWhatsApp: h.notifyOnWhatsApp === true,
            ringOnDevice: h.notifyOnDevice ?? true,
            soundType: h.soundType || 'Sino de Mosteiro',
            toolType,
            customText: h.customText,
            isCustom: h.isCustom ?? false,
          };
        });

        await this.remindersService.syncMobileReminders({
          userId: user.id,
          phone: user.phone || cleanPhone,
          reminders: remindersToSync,
        });
        this.logger.log(`[Spiritual Plan] Lembretes do usuário ${user.id} sincronizados com sucesso.`);

        // Sincroniza toggles no registro do usuário para conformidade do perfil
        const hasLiturgyWhatsApp = (dto.habits || []).some(
          (h) => (h.toolType === 'liturgy' || (h.id || '').includes('liturgy')) && h.notifyOnWhatsApp === true,
        );
        const hasExamWhatsApp = (dto.habits || []).some(
          (h) => (h.toolType === 'conscience_exam' || (h.id || '').includes('exam')) && h.notifyOnWhatsApp === true,
        );
        const hasSaintWhatsApp = (dto.habits || []).some(
          (h) => (h.toolType === 'saint' || (h.id || '').includes('saint')) && h.notifyOnWhatsApp === true,
        );

        await supabase
          .from('users')
          .update({
            receive_daily_liturgy: hasLiturgyWhatsApp,
            receive_daily_exam: hasExamWhatsApp,
            receive_daily_saint: hasSaintWhatsApp,
            updated_at: nowIso,
          })
          .eq('id', user.id);
      } catch (err) {
        this.logger.error(`[Spiritual Plan] Erro ao sincronizar lembretes na fila: ${err.message}`);
      }
    }

    return {
      userId: user.id,
      phone: user.phone || cleanPhone || '',
      habits: (savedPlan?.habits as SpiritualHabitDto[]) || dto.habits || [],
      streakDays: savedPlan?.streak_days ?? dto.streakDays ?? 0,
      updatedAt: savedPlan?.updated_at || nowIso,
    };
  }

  async getReminders(userId?: string, phone?: string) {
    return this.remindersService.getUserReminders(userId, phone);
  }

  async syncReminders(dto: SyncMobileRemindersDto) {
    return this.remindersService.syncMobileReminders(dto);
  }

  async getDailyContent(dateStr?: string) {
    const supabase = this.supabaseService.getClient();
    const targetDate =
      dateStr ||
      new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });

    // 1. Busca registros no daily_cache para targetDate
    const { data: cacheRows, error } = await supabase
      .from('daily_cache')
      .select('*')
      .eq('cache_date', targetDate);

    if (error) {
      this.logger.error(
        `[Daily Content] Erro ao buscar daily_cache para ${targetDate}: ${error.message}`,
      );
    }

    const saintRow = cacheRows?.find((r) => r.type === 'saint');
    const liturgyRow = cacheRows?.find((r) => r.type === 'liturgy');
    const rosaryRow = cacheRows?.find((r) => r.type === 'rosary');

    // 2. Parse do Santo do Dia (com suporte a múltiplos santos no mesmo dia)
    let saints: any[] = [];
    if (saintRow?.content) {
      saints = this.parseAllSaints(saintRow.content, targetDate);
    }
    if (saints.length === 0) {
      saints = [await this.fallbackSaintFromDb(targetDate)];
    }
    const saint = saints[0];

    // 3. Liturgia Diária
    let liturgy: any = null;
    const rawLiturgyData = await this.liturgyService.getRawLiturgy(targetDate);
    if (liturgyRow?.content) {
      liturgy = this.buildLiturgyResponse(
        liturgyRow.content,
        rawLiturgyData,
        targetDate,
      );
    } else if (rawLiturgyData) {
      liturgy = {
        data: rawLiturgyData.data || targetDate,
        liturgia: rawLiturgyData.liturgia || 'Feria / Tempo Comum',
        cor: rawLiturgyData.cor || 'Verde',
        rawContent: await this.liturgyService.getDailyLiturgy(targetDate),
        reflection: '',
        dailyPrayer: '',
        leituras: rawLiturgyData.leituras || {},
      };
    }

    // 4. Terço Diário
    let rosary: any = null;
    if (rosaryRow?.content) {
      const mysteryMatch = rosaryRow.content.match(/Mistérios\s+([A-Za-zÀ-ú]+)/i);
      rosary = {
        mysteryType: mysteryMatch ? mysteryMatch[1] : 'Mistérios do Terço',
        rawContent: rosaryRow.content,
      };
    }

    return {
      date: targetDate,
      saint,
      saints,
      liturgy,
      rosary,
    };
  }

  private buildLiturgyResponse(
    cachedContent: string,
    rawLiturgyData: any,
    targetDate: string,
  ) {
    const headerMatch = cachedContent.match(
      /\*Liturgia do dia\s+([0-9\/]+)\s*-\s*([^*]+)\*/i,
    );
    const dateFormatted = headerMatch
      ? headerMatch[1].trim()
      : targetDate.split('-').reverse().join('/');
    const celebration = headerMatch
      ? headerMatch[2].trim()
      : rawLiturgyData?.liturgia || 'Tempo Comum';
    const cor = rawLiturgyData?.cor || 'Verde';

    let reflection = '';
    const reflectionMatch = cachedContent.match(
      /\*Reflexão\*\s*([\s\S]*?)(?=(?:\*Minha oração|$))/i,
    );
    if (reflectionMatch) {
      reflection = reflectionMatch[1].trim();
    }

    let dailyPrayer = '';
    const prayerMatch = cachedContent.match(
      /\*Minha oração diária\*\s*([\s\S]*)/i,
    );
    if (prayerMatch) {
      dailyPrayer = prayerMatch[1].replace(/^\*|\*$/g, '').trim();
    }

    return {
      data: dateFormatted,
      liturgia: rawLiturgyData?.liturgia || celebration,
      cor: cor,
      rawContent: cachedContent,
      reflection,
      dailyPrayer,
      leituras: rawLiturgyData?.leituras || {},
    };
  }

  private parseAllSaints(content: string, dateStr: string): any[] {
    if (!content || !content.trim()) {
      return [];
    }

    const cleanContent = content
      .replace(/^\s*\*Santo do dia[^*]*\*\s*/i, '')
      .trim();

    // Se houver ⚜️ **, dividimos por cada ocorrência
    let rawBlocks: string[] = [];
    if (cleanContent.includes('⚜️')) {
      rawBlocks = cleanContent
        .split(/\n\s*(?=⚜️\s*\*\*)/g)
        .map((b) => b.trim())
        .filter((b) => b.length > 0);
    } else {
      // Caso contrário, tenta dividir por quebras com cabeçalho em negrito
      rawBlocks = cleanContent
        .split(/\n\s*(?=\*\*[A-ZÀ-Ú][^*]+\*\*)/g)
        .map((b) => b.trim())
        .filter((b) => b.length > 0);
    }

    if (rawBlocks.length === 0) {
      rawBlocks = [cleanContent];
    }

    const parsed = rawBlocks
      .map((block) => this.parseSaintBlock(block, dateStr))
      .filter((s) => s.name && s.name !== 'Santo do Dia');

    if (parsed.length > 0) {
      return parsed;
    }

    return [this.parseSaintBlock(cleanContent, dateStr)];
  }

  private parseSaintContent(content: string, dateStr: string) {
    const all = this.parseAllSaints(content, dateStr);
    return all.length > 0 ? all[0] : this.parseSaintBlock(content, dateStr);
  }

  private parseSaintBlock(block: string, dateStr: string) {
    let name = 'Santo do Dia';
    let title = 'Memória Litúrgica';
    let virtue = 'Constância na Fé e Intercessão Fraterna';
    let quote = 'Quem a Deus tem, nada lhe falta.';
    let biography = '';
    let prayer = '';

    const headerMatch = block.match(/(?:⚜️\s*)?\*\*([^*]+)\*\*/);
    if (headerMatch) {
      const rawHeader = headerMatch[1].trim();
      if (rawHeader.includes(',')) {
        const parts = rawHeader.split(',');
        name = parts[0].trim();
        title = parts.slice(1).join(',').trim();
      } else {
        name = rawHeader;
      }
    }

    const bioMatch = block.match(
      /(?:📜\s*)?\*A Vida do Santo\*:\s*([\s\S]*?)(?=(?:🙏\s*)?\*Oração|$)/i,
    );
    if (bioMatch) {
      biography = bioMatch[1].trim();
    } else {
      const parts = block.split(/🙏|\*Oração/i);
      biography = parts[0]
        .replace(/(?:⚜️\s*)?\*\*([^*]+)\*\*/, '')
        .replace(/\*Santo do dia[^*]*\*/i, '')
        .trim();
    }

    const prayerMatch = block.match(/(?:🙏\s*)?\*Oração[^:]*\*:\s*([\s\S]*)/i);
    if (prayerMatch) {
      prayer = prayerMatch[1].replace(/Amém\.?\s*🙏?✨?/i, 'Amém.').trim();
    }

    if (biography) {
      const sentences = biography.split(/(?<=[.!?])\s+/);
      const goodSentence = sentences.find(
        (s) => s.length >= 25 && s.length <= 160,
      );
      if (goodSentence) {
        quote = goodSentence.replace(/^["'“”]|["'“”]$/g, '').trim();
      }
    }

    const lowerBio = (biography + ' ' + title).toLowerCase();
    if (
      lowerBio.includes('doentes') ||
      lowerBio.includes('enfermeira') ||
      lowerBio.includes('caridade') ||
      lowerBio.includes('hospital')
    ) {
      virtue = 'Caridade Heroica e Cuidado aos Enfermos';
    } else if (
      lowerBio.includes('mártir') ||
      lowerBio.includes('sangue') ||
      lowerBio.includes('coragem')
    ) {
      virtue = 'Fortaleza na Fé e Coragem Martirial';
    } else if (
      lowerBio.includes('oração') ||
      lowerBio.includes('contemplat') ||
      lowerBio.includes('mística') ||
      lowerBio.includes('eremita') ||
      lowerBio.includes('mosteiro') ||
      lowerBio.includes('abade')
    ) {
      virtue = 'Oração Contemplativa e União com Deus';
    } else if (
      lowerBio.includes('pobres') ||
      lowerBio.includes('humildade') ||
      lowerBio.includes('desapego')
    ) {
      virtue = 'Amor aos Pobres e Humildade Evangélica';
    } else if (
      lowerBio.includes('doutor') ||
      lowerBio.includes('teologia') ||
      lowerBio.includes('palavra') ||
      lowerBio.includes('evangeliz')
    ) {
      virtue = 'Zelo Apostólico e Ensino da Palavra';
    } else {
      virtue = 'Constância na Fé e Intercessão Fraterna';
    }

    return {
      name,
      title,
      virtue,
      quote,
      biography,
      prayer,
      rawContent: block,
    };
  }

  private async fallbackSaintFromDb(dateStr: string) {
    try {
      const parts = dateStr.split('-');
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      const supabase = this.supabaseService.getClient();
      const { data: dbSaints } = await supabase
        .from('saints')
        .select('name, short_description, full_description')
        .eq('month', month)
        .eq('day', day);

      if (dbSaints && dbSaints.length > 0) {
        const s = dbSaints[0];
        return {
          name: s.name,
          title: s.short_description || 'Memória Litúrgica',
          virtue: 'Constância na Fé e Amor de Deus',
          quote: 'Quem a Deus tem, nada lhe falta.',
          biography: s.full_description || s.short_description || '',
          prayer: `Ó Deus, que nos destes em ${s.name} um testemunho admirável de santidade, concedei-nos por sua intercessão viver firmes na fé e generosos no amor. Amém.`,
          rawContent: `${s.name}\n\n${s.full_description || s.short_description}`,
        };
      }
    } catch (err) {
      this.logger.warn(`[Daily Content] Fallback saint db error: ${err.message}`);
    }

    return {
      name: 'Santos de Deus e Anjos da Guarda',
      title: 'Comunhão dos Santos • Memória Litúrgica',
      virtue: 'Constância na Fé e Intercessão Fraterna',
      quote:
        'Não tenhas medo, porque eu estou contigo; não te angusties, porque eu sou o teu Deus.',
      biography:
        'A Igreja recorda a multidão dos justos e mártires que já alcançaram a glória eterna.',
      prayer:
        'Santos e Santas de Deus que contemplais a face do Pai no Céu, intercedei por nós.',
      rawContent: 'Santos de Deus e Anjos da Guarda',
    };
  }
}


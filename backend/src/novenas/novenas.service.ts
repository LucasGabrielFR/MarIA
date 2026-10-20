import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export class NovenaDayDto {
  day_number: number;
  title: string;
  opening_prayer?: string;
  scripture_reading?: string;
  meditation: string;
  daily_prayer: string;
  intentions_prompt?: string;
  concluding_prayer?: string;
}

export class CreateNovenaDto {
  title: string;
  slug?: string;
  subtitle?: string;
  description?: string;
  category: string;
  tags?: string[];
  feast_date?: string;
  ideal_start_date?: string;
  image_url?: string;
  banner_color?: string;
  is_published?: boolean;
  is_featured?: boolean;
  display_order?: number;
  days?: NovenaDayDto[];
}

export class UpdateNovenaDto {
  title?: string;
  slug?: string;
  subtitle?: string;
  description?: string;
  category?: string;
  tags?: string[];
  feast_date?: string;
  ideal_start_date?: string;
  image_url?: string;
  banner_color?: string;
  is_published?: boolean;
  is_featured?: boolean;
  display_order?: number;
  days?: NovenaDayDto[];
}

export class StartUserNovenaDto {
  userId: string;
  novenaId: string;
  personalIntention?: string;
  reminderTime?: string;
  notifyWhatsApp?: boolean;
}

export class CheckDayDto {
  userId: string;
  userNovenaId: string;
  dayNumber: number;
  channel?: 'mobile' | 'whatsapp';
}

@Injectable()
export class NovenasService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  // ================= SEEDING & POPULATION =================

  async seedDefaultNovenas() {
    const { count, error } = await this.supabase
      .from('novenas')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new BadRequestException(`Erro ao verificar novenas: ${error.message}`);
    }

    return {
      success: true,
      message: `Novenas canônicas já estão persistidas no Supabase. Total de novenas ativas: ${count ?? 0}.`,
      count: count ?? 0,
    };
  }

  // ================= ADMIN CMS METHODS =================

  async getAdminNovenas(search?: string, category?: string, status?: string) {
    let query = this.supabase
      .from('novenas')
      .select('*, novena_days(count)')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (search && search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (status === 'published') {
      query = query.eq('is_published', true);
    } else if (status === 'draft') {
      query = query.eq('is_published', false);
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(`Erro ao listar novenas: ${error.message}`);

    return (data || []).map((novena: any) => ({
      ...novena,
      total_days_configured: novena.novena_days?.[0]?.count || 0,
    }));
  }

  async getNovenaById(id: string) {
    const { data: novena, error: novenaErr } = await this.supabase
      .from('novenas')
      .select('*')
      .eq('id', id)
      .single();

    if (novenaErr || !novena) {
      throw new NotFoundException('Novena não encontrada.');
    }

    const { data: days, error: daysErr } = await this.supabase
      .from('novena_days')
      .select('*')
      .eq('novena_id', id)
      .order('day_number', { ascending: true });

    if (daysErr) throw new BadRequestException(`Erro ao carregar dias: ${daysErr.message}`);

    return {
      ...novena,
      days: days || [],
    };
  }

  async createNovena(dto: CreateNovenaDto) {
    if (!dto.title || !dto.category) {
      throw new BadRequestException('Título e Categoria são obrigatórios.');
    }

    const slug =
      dto.slug?.trim() ||
      dto.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const { data: novena, error: novenaErr } = await this.supabase
      .from('novenas')
      .insert({
        slug,
        title: dto.title.trim(),
        subtitle: dto.subtitle?.trim(),
        description: dto.description?.trim(),
        category: dto.category,
        tags: dto.tags || [],
        feast_date: dto.feast_date,
        ideal_start_date: dto.ideal_start_date,
        image_url: dto.image_url,
        banner_color: dto.banner_color || '#002D6E',
        is_published: dto.is_published ?? true,
        is_featured: dto.is_featured ?? false,
        display_order: dto.display_order ?? 0,
      })
      .select()
      .single();

    if (novenaErr) throw new BadRequestException(`Erro ao criar novena: ${novenaErr.message}`);

    // Inserir dias se fornecidos
    if (dto.days && dto.days.length > 0) {
      const daysToInsert = dto.days.map(d => ({
        novena_id: novena.id,
        day_number: d.day_number,
        title: d.title,
        opening_prayer: d.opening_prayer,
        scripture_reading: d.scripture_reading,
        meditation: d.meditation,
        daily_prayer: d.daily_prayer,
        intentions_prompt: d.intentions_prompt,
        concluding_prayer: d.concluding_prayer,
      }));

      const { error: daysErr } = await this.supabase.from('novena_days').insert(daysToInsert);
      if (daysErr) throw new BadRequestException(`Erro ao salvar dias da novena: ${daysErr.message}`);
    }

    return this.getNovenaById(novena.id);
  }

  async updateNovena(id: string, dto: UpdateNovenaDto) {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title !== undefined) updatePayload.title = dto.title.trim();
    if (dto.slug !== undefined) updatePayload.slug = dto.slug.trim();
    if (dto.subtitle !== undefined) updatePayload.subtitle = dto.subtitle?.trim();
    if (dto.description !== undefined) updatePayload.description = dto.description?.trim();
    if (dto.category !== undefined) updatePayload.category = dto.category;
    if (dto.tags !== undefined) updatePayload.tags = dto.tags;
    if (dto.feast_date !== undefined) updatePayload.feast_date = dto.feast_date;
    if (dto.ideal_start_date !== undefined) updatePayload.ideal_start_date = dto.ideal_start_date;
    if (dto.image_url !== undefined) updatePayload.image_url = dto.image_url;
    if (dto.banner_color !== undefined) updatePayload.banner_color = dto.banner_color;
    if (dto.is_published !== undefined) updatePayload.is_published = dto.is_published;
    if (dto.is_featured !== undefined) updatePayload.is_featured = dto.is_featured;
    if (dto.display_order !== undefined) updatePayload.display_order = dto.display_order;

    const { error: novenaErr } = await this.supabase
      .from('novenas')
      .update(updatePayload)
      .eq('id', id);

    if (novenaErr) throw new BadRequestException(`Erro ao atualizar novena: ${novenaErr.message}`);

    // Atualizar / Upsert dias caso fornecidos
    if (dto.days && dto.days.length > 0) {
      for (const d of dto.days) {
        await this.supabase.from('novena_days').upsert(
          {
            novena_id: id,
            day_number: d.day_number,
            title: d.title,
            opening_prayer: d.opening_prayer,
            scripture_reading: d.scripture_reading,
            meditation: d.meditation,
            daily_prayer: d.daily_prayer,
            intentions_prompt: d.intentions_prompt,
            concluding_prayer: d.concluding_prayer,
          },
          { onConflict: 'novena_id,day_number' },
        );
      }
    }

    return this.getNovenaById(id);
  }

  async deleteNovena(id: string) {
    const { error } = await this.supabase.from('novenas').delete().eq('id', id);
    if (error) throw new BadRequestException(`Erro ao excluir novena: ${error.message}`);
    return { success: true, message: 'Novena excluída com sucesso.' };
  }

  // ================= MOBILE CONSUMPTION METHODS =================

  async getPublishedNovenas(category?: string, search?: string) {
    let query = this.supabase
      .from('novenas')
      .select('id, slug, title, subtitle, description, category, tags, feast_date, ideal_start_date, image_url, banner_color, is_featured, display_order, novena_days(count)')
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      if (category === 'liturgica' || category === 'liturgicas') {
        query = query.in('category', ['liturgica', 'espirito_santo', 'almas', 'liturgicas']);
      } else {
        query = query.eq('category', category);
      }
    }

    if (search && search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(`Erro ao listar novenas: ${error.message}`);

    return (data || []).map((novena: any) => ({
      ...novena,
      total_days: novena.novena_days?.[0]?.count || 0,
    }));
  }

  async getNovenaBySlugOrId(identifier: string) {
    let query = this.supabase.from('novenas').select('*');

    // Se for UUID válido ou slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    if (isUuid) {
      query = query.eq('id', identifier);
    } else {
      query = query.eq('slug', identifier);
    }

    const { data: novena, error: novenaErr } = await query.single();
    if (novenaErr || !novena) {
      throw new NotFoundException('Novena não encontrada.');
    }

    const { data: days, error: daysErr } = await this.supabase
      .from('novena_days')
      .select('*')
      .eq('novena_id', novena.id)
      .order('day_number', { ascending: true });

    if (daysErr) throw new BadRequestException(`Erro ao carregar dias: ${daysErr.message}`);

    return {
      ...novena,
      days: days || [],
    };
  }

  private isValidUuid(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  }

  async getUserActiveNovenas(userId: string) {
    if (!this.isValidUuid(userId)) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('user_novenas')
      .select(`
        id,
        current_day,
        status,
        personal_intention,
        started_at,
        last_prayed_at,
        reminder_time,
        notify_whatsapp,
        novenas (
          id,
          slug,
          title,
          subtitle,
          category,
          image_url,
          banner_color
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw new BadRequestException(`Erro ao carregar novenas do usuário: ${error.message}`);
    return data || [];
  }

  async startUserNovena(dto: StartUserNovenaDto) {
    if (!dto.userId || !dto.novenaId) {
      throw new BadRequestException('userId e novenaId são obrigatórios.');
    }

    const effectiveUserId = this.isValidUuid(dto.userId)
      ? dto.userId
      : 'a0000000-0000-0000-0000-000000000001';

    // Verifica se já existe em andamento
    const { data: existing } = await this.supabase
      .from('user_novenas')
      .select('id, current_day, status')
      .eq('user_id', effectiveUserId)
      .eq('novena_id', dto.novenaId)
      .eq('status', 'in_progress')
      .maybeSingle();

    if (existing) {
      return existing;
    }

    const { data, error } = await this.supabase
      .from('user_novenas')
      .insert({
        user_id: effectiveUserId,
        novena_id: dto.novenaId,
        current_day: 1,
        status: 'in_progress',
        personal_intention: dto.personalIntention?.trim() || null,
        reminder_time: dto.reminderTime || '07:00',
        notify_whatsapp: dto.notifyWhatsApp ?? false,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(`Erro ao iniciar novena: ${error.message}`);
    return data;
  }

  async checkUserNovenaDay(dto: CheckDayDto) {
    const { data: userNovena, error: findErr } = await this.supabase
      .from('user_novenas')
      .select('*')
      .eq('id', dto.userNovenaId)
      .eq('user_id', dto.userId)
      .single();

    if (findErr || !userNovena) {
      throw new NotFoundException('Novena do usuário não encontrada.');
    }

    // Registra log do dia rezado
    await this.supabase.from('user_novena_logs').insert({
      user_novena_id: userNovena.id,
      day_number: dto.dayNumber,
      channel: dto.channel || 'mobile',
    });

    const isLastDay = dto.dayNumber >= 9;
    const nextDay = isLastDay ? 9 : Math.max(userNovena.current_day, dto.dayNumber + 1);
    const newStatus = isLastDay ? 'completed' : 'in_progress';

    const { data: updated, error: updateErr } = await this.supabase
      .from('user_novenas')
      .update({
        current_day: nextDay,
        status: newStatus,
        last_prayed_at: new Date().toISOString(),
        completed_at: isLastDay ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userNovena.id)
      .select()
      .single();

    if (updateErr) throw new BadRequestException(`Erro ao avançar dia: ${updateErr.message}`);
    return updated;
  }
}

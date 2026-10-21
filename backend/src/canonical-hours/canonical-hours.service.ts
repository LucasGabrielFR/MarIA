import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  CanonicalHourType,
  DailyCanonicalHourRecord,
  LiturgicalColor,
  LiturgicalRank,
} from './canonical-hours.types';
import { CanonicalHoursParser } from './canonical-hours-parser';

interface WordPressPost {
  id: number;
  date: string;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  link: string;
}

@Injectable()
export class CanonicalHoursService {
  private readonly logger = new Logger(CanonicalHoursService.name);
  private readonly wpApiUrl = 'https://liturgiadashoras.online/wp-json/wp/v2/posts';

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Determina a hora canônica recomendada de acordo com o horário de Brasília
   */
  getRecommendedHourType(): CanonicalHourType {
    const spDate = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }),
    );
    const hours = spDate.getHours();

    if (hours >= 6 && hours < 9) return 'lauds';
    if (hours >= 9 && hours < 12) return 'terce';
    if (hours >= 12 && hours < 15) return 'sext';
    if (hours >= 15 && hours < 18) return 'none';
    if (hours >= 18 && hours < 21) return 'vespers';
    if (hours >= 21) return 'compline';
    return 'office_of_readings'; // 00h às 06h
  }

  /**
   * Obtém todas as horas canônicas de uma determinada data
   */
  async getDailyHours(date: string): Promise<{
    date: string;
    recommendedHour: CanonicalHourType;
    hours: DailyCanonicalHourRecord[];
  }> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('daily_canonical_hours')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(`Erro ao consultar daily_canonical_hours para ${date}: ${error.message}`);
    }

    let records: DailyCanonicalHourRecord[] = (data as DailyCanonicalHourRecord[]) || [];

    // Se ainda não houver horas cadastradas para o dia, dispara sincronização sob demanda
    if (records.length === 0) {
      this.logger.log(`Nenhuma hora encontrada para ${date}. Tentando sincronizar...`);
      try {
        await this.syncFromWordPress(date);
        const { data: syncedData } = await supabase
          .from('daily_canonical_hours')
          .select('*')
          .eq('date', date);
        records = (syncedData as DailyCanonicalHourRecord[]) || [];
      } catch (syncErr) {
        this.logger.warn(`Falha na sincronização sob demanda para ${date}: ${syncErr?.message}`);
      }
    }

    return {
      date,
      recommendedHour: this.getRecommendedHourType(),
      hours: records,
    };
  }

  /**
   * Obtém uma hora canônica específica de um dia
   */
  async getHour(date: string, hourType: CanonicalHourType): Promise<DailyCanonicalHourRecord | null> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('daily_canonical_hours')
      .select('*')
      .eq('date', date)
      .eq('hour_type', hourType)
      .maybeSingle();

    if (error) {
      this.logger.error(`Erro ao consultar hora ${hourType} de ${date}: ${error.message}`);
      return null;
    }

    if (!data) {
      // Tenta sincronizar se não encontrou
      await this.syncFromWordPress(date);
      const { data: retryData } = await supabase
        .from('daily_canonical_hours')
        .select('*')
        .eq('date', date)
        .eq('hour_type', hourType)
        .maybeSingle();
      return (retryData as DailyCanonicalHourRecord) || null;
    }

    return data as DailyCanonicalHourRecord;
  }

  /**
   * Sincroniza as horas canônicas a partir do WordPress da Liturgia das Horas Online
   * @param targetDateStr Data no formato YYYY-MM-DD ou undefined para os posts recentes
   */
  async syncFromWordPress(targetDateStr?: string): Promise<{ syncedCount: number }> {
    this.logger.log(`Iniciando sincronização de Liturgia das Horas (Alvo: ${targetDateStr || 'semana'})...`);

    try {
      const url = `${this.wpApiUrl}?categories=22&per_page=60`;
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });

      if (!res.ok) {
        throw new Error(`WordPress API respondeu com status ${res.status}: ${res.statusText}`);
      }

      const posts: WordPressPost[] = await res.json();
      if (!Array.isArray(posts) || posts.length === 0) {
        this.logger.warn('Nenhum post retornado pela API do liturgiadashoras.online');
        return { syncedCount: 0 };
      }

      const supabase = this.supabaseService.getClient();
      let syncedCount = 0;

      for (const post of posts) {
        const postDate = post.date.substring(0, 10); // YYYY-MM-DD
        if (targetDateStr && postDate !== targetDateStr) {
          // Se especificou uma data alvo, filtra por ela
          continue;
        }

        const rawTitle = post.title.rendered || '';
        const rawContent = post.content.rendered || '';
        const hourType = CanonicalHoursParser.identifyHourType(post.slug, rawTitle);

        if (!hourType) {
          continue;
        }

        const cleanHtml = CanonicalHoursParser.sanitizeHtml(rawContent);
        const parsedContent = CanonicalHoursParser.parseContent(cleanHtml);
        const liturgicalRank: LiturgicalRank = CanonicalHoursParser.identifyLiturgicalRank(
          rawTitle,
          cleanHtml,
        );
        const liturgicalColor: LiturgicalColor = CanonicalHoursParser.identifyLiturgicalColor(
          liturgicalRank,
          rawTitle,
        );

        const hasMemorial =
          liturgicalRank === 'obligatory_memorial' ||
          liturgicalRank === 'optional_memorial' ||
          rawTitle.toLowerCase().includes('memória');

        const recordToUpsert: Partial<DailyCanonicalHourRecord> = {
          date: postDate,
          hour_type: hourType,
          liturgical_color: liturgicalColor,
          liturgical_rank: liturgicalRank,
          celebration_title: rawTitle,
          source_url: post.link,
          has_memorial: hasMemorial,
          memorial_title: hasMemorial ? rawTitle : undefined,
          content: parsedContent,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('daily_canonical_hours')
          .upsert(recordToUpsert, { onConflict: 'date,hour_type' });

        if (error) {
          this.logger.error(
            `Erro ao fazer upsert de ${hourType} em ${postDate}: ${error.message}`,
          );
        } else {
          syncedCount++;
        }
      }

      this.logger.log(`Sincronização concluída com sucesso. ${syncedCount} horas processadas.`);
      return { syncedCount };
    } catch (err: any) {
      this.logger.error(`Erro crítico na sincronização de Liturgia das Horas: ${err?.message}`, err);
      return { syncedCount: 0 };
    }
  }

  /**
   * Sincroniza um intervalo de datas a partir da data de referência até o sábado da semana correspondente
   */
  async syncWeekRange(referenceDateStr: string): Promise<{ syncedCount: number; dates: string[] }> {
    const [year, month, day] = referenceDateStr.split('-').map(Number);
    const refDate = new Date(year, month - 1, day);
    const dayOfWeek = refDate.getDay(); // 0 (Domingo) a 6 (Sábado)

    // Dias até o sábado (6 - dayOfWeek)
    const daysUntilSaturday = 6 - dayOfWeek;
    const targetDates: string[] = [];

    for (let i = 0; i <= daysUntilSaturday; i++) {
      const d = new Date(refDate);
      d.setDate(refDate.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dt = String(d.getDate()).padStart(2, '0');
      targetDates.push(`${y}-${m}-${dt}`);
    }

    this.logger.log(`Sincronizando intervalo até sábado: ${targetDates.join(', ')}`);

    let totalSynced = 0;
    try {
      const url = `${this.wpApiUrl}?categories=22&per_page=100`;
      const res = await fetch(url, { signal: AbortSignal.timeout(25_000) });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const posts: WordPressPost[] = await res.json();

      const supabase = this.supabaseService.getClient();

      for (const post of posts) {
        const postDate = post.date.substring(0, 10);
        if (!targetDates.includes(postDate)) continue;

        const rawTitle = post.title.rendered || '';
        const rawContent = post.content.rendered || '';
        const hourType = CanonicalHoursParser.identifyHourType(post.slug, rawTitle);
        if (!hourType) continue;

        const cleanHtml = CanonicalHoursParser.sanitizeHtml(rawContent);
        const parsedContent = CanonicalHoursParser.parseContent(cleanHtml);
        const liturgicalRank = CanonicalHoursParser.identifyLiturgicalRank(rawTitle, cleanHtml);
        const liturgicalColor = CanonicalHoursParser.identifyLiturgicalColor(liturgicalRank, rawTitle);
        const hasMemorial =
          liturgicalRank === 'obligatory_memorial' ||
          liturgicalRank === 'optional_memorial' ||
          rawTitle.toLowerCase().includes('memória');

        const recordToUpsert: Partial<DailyCanonicalHourRecord> = {
          date: postDate,
          hour_type: hourType,
          liturgical_color: liturgicalColor,
          liturgical_rank: liturgicalRank,
          celebration_title: rawTitle,
          source_url: post.link,
          has_memorial: hasMemorial,
          memorial_title: hasMemorial ? rawTitle : undefined,
          content: parsedContent,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('daily_canonical_hours')
          .upsert(recordToUpsert, { onConflict: 'date,hour_type' });

        if (!error) totalSynced++;
      }
    } catch (err: any) {
      this.logger.error(`Erro ao sincronizar intervalo da semana: ${err?.message}`);
    }

    return { syncedCount: totalSynced, dates: targetDates };
  }

  /**
   * Atualiza manualmente o conteúdo de uma hora canônica via painel administrativo
   */
  async updateHour(
    id: string,
    updateData: { celebration_title?: string; rawCleanText?: string; content?: any },
  ) {
    const supabase = this.supabaseService.getClient();

    const { data: existing, error: fetchErr } = await supabase
      .from('daily_canonical_hours')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      throw new Error('Hora canônica não encontrada para atualização');
    }

    const newContent = {
      ...(existing.content || {}),
      ...(updateData.content || {}),
      rawCleanText: updateData.rawCleanText ?? existing.content?.rawCleanText,
    };

    const { data, error } = await supabase
      .from('daily_canonical_hours')
      .update({
        celebration_title: updateData.celebration_title ?? existing.celebration_title,
        content: newContent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

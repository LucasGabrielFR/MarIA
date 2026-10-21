import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  CanonicalHourType,
  DailyCanonicalHourRecord,
  LiturgicalColor,
  LiturgicalRank,
} from './canonical-hours.types';
import { CanonicalHoursParser, EXPECTED_ORATIO_HOURS, ORATIO_BASE_URL } from './canonical-hours-parser';

export type SyncStatus = 'complete' | 'partial' | 'failed';
export interface SyncResult {
  complete: boolean;
  status: SyncStatus;
  expectedCount: number;
  missingCount: number;
  failedCount: number;
  syncedCount: number;
  dates: string[];
}

@Injectable()
export class CanonicalHoursService {
  private readonly logger = new Logger(CanonicalHoursService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  getRecommendedHourType(): CanonicalHourType {
    const hour = Number(new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo', hour: '2-digit', hourCycle: 'h23',
    }).format(new Date()));
    if (hour >= 6 && hour < 9) return 'lauds';
    if (hour >= 9 && hour < 12) return 'terce';
    if (hour >= 12 && hour < 15) return 'sext';
    if (hour >= 15 && hour < 18) return 'none';
    if (hour >= 18 && hour < 21) return 'vespers';
    if (hour >= 21) return 'compline';
    return 'office_of_readings';
  }

  async getDailyHours(date: string): Promise<{
    date: string;
    recommendedHour: CanonicalHourType;
    hours: DailyCanonicalHourRecord[];
  }> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('daily_canonical_hours').select('*').eq('date', date)
      .order('created_at', { ascending: true });
    if (error) this.logger.error(`Erro ao consultar horas de ${date}: ${error.message}`);
    let records = (data as DailyCanonicalHourRecord[]) || [];
    if (!records.length) {
      await this.syncFromOratio(date);
      const { data: syncedData } = await supabase.from('daily_canonical_hours').select('*').eq('date', date);
      records = (syncedData as DailyCanonicalHourRecord[]) || [];
    }
    return { date, recommendedHour: this.getRecommendedHourType(), hours: records };
  }

  async getHour(date: string, hourType: CanonicalHourType): Promise<DailyCanonicalHourRecord | null> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('daily_canonical_hours').select('*').eq('date', date)
      .eq('hour_type', hourType).maybeSingle();
    if (error) {
      this.logger.error(`Erro ao consultar ${hourType} de ${date}: ${error.message}`);
      return null;
    }
    if (data) return data as DailyCanonicalHourRecord;
    await this.syncFromOratio(date);
    const { data: retryData } = await supabase.from('daily_canonical_hours').select('*').eq('date', date)
      .eq('hour_type', hourType).maybeSingle();
    return (retryData as DailyCanonicalHourRecord) || null;
  }

  async syncFromOratio(targetDateStr = this.getTodayInSaoPaulo()): Promise<SyncResult> {
    return this.syncDates([targetDateStr]);
  }

  async syncWeekRange(referenceDateStr: string): Promise<SyncResult> {
    const dates = this.getDatesThroughSaturday(referenceDateStr);
    return this.syncDates(dates);
  }

  private async syncDates(dates: string[]): Promise<SyncResult> {
    const expectedCount = dates.length * EXPECTED_ORATIO_HOURS.length;
    let syncedCount = 0;
    let failedCount = 0;
    for (const date of dates) {
      try {
        const supabase = this.supabaseService.getClient();
        const { data: existing, error: existingError } = await supabase.from('daily_canonical_hours')
          .select('hour_type,liturgical_rank,has_memorial,memorial_title').eq('date', date);
        if (existingError) throw new Error(`Leitura prévia de ${date} falhou: ${existingError.message}`);
        const previous = new Map((existing || []).map((row: any) => [row.hour_type, row]));
        const records = await this.fetchCompleteDay(date, previous);
        const { data, error } = await supabase.from('daily_canonical_hours')
          .upsert(records, { onConflict: 'date,hour_type' }).select('date,hour_type');
        if (error) throw new Error(`Persistência de ${date} falhou: ${error.message}`);
        if (!data || data.length !== EXPECTED_ORATIO_HOURS.length) {
          throw new Error(`Persistência de ${date} retornou ${data?.length ?? 0}/7 registros`);
        }
        syncedCount += data.length;
      } catch (error) {
        failedCount++;
        this.logger.error(`Sincronização Oratio de ${date} falhou: ${(error as Error).message}`);
      }
    }
    const missingCount = expectedCount - syncedCount;
    const complete = missingCount === 0 && failedCount === 0;
    const status: SyncStatus = complete ? 'complete' : syncedCount > 0 ? 'partial' : 'failed';
    return { complete, status, expectedCount, missingCount, failedCount, syncedCount, dates };
  }

  private async fetchCompleteDay(
    date: string,
    previous: Map<string, any> = new Map(),
  ): Promise<Partial<DailyCanonicalHourRecord>[]> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || this.formatDateUtc(this.parseDateUtc(date)) !== date) {
      throw new Error(`Data inválida: ${date}`);
    }
    const indexUrl = `${ORATIO_BASE_URL}/liturgia-das-horas/${date.replaceAll('-', '/')}/`;
    const indexResponse = await this.fetchOratio(indexUrl);
    const indexHtml = await indexResponse.text();
    const day = CanonicalHoursParser.parseDayIndex(indexHtml, date);
    const rank = this.classifyRank(day.celebration);
    day.metadata.rankKnown = rank !== 'unknown' || previous.size === EXPECTED_ORATIO_HOURS.length;
    day.metadata.memorialKnown = /mem[oó]ria/i.test(day.celebration) ||
      rank !== 'unknown' || previous.size === EXPECTED_ORATIO_HOURS.length;
    const hours = await Promise.all(day.hours.map(async (hour) => {
      const response = await this.fetchOratio(hour.url);
      const parsed = CanonicalHoursParser.parseHour(await response.text(), date, hour.slug);
      const old = previous.get(hour.type);
      const hourRank = rank === 'unknown' ? (old?.liturgical_rank || 'unknown') : rank;
      const hasMemorial = /mem[oó]ria/i.test(day.celebration)
        ? true
        : rank !== 'unknown'
          ? false
          : (old?.has_memorial ?? false);
      const color = this.mapLiturgicalColor(day.metadata.color);
      return {
        date,
        hour_type: hour.type,
        liturgical_color: color,
        liturgical_rank: hourRank,
        celebration_title: parsed.title,
        source_url: hour.url,
        has_memorial: hasMemorial,
        memorial_title: hasMemorial ? (old?.memorial_title || day.celebration) : undefined,
        content: {
          rawCleanText: parsed.rawCleanText,
          plainText: parsed.plainText,
          dayMetadata: day.metadata,
        },
        updated_at: new Date().toISOString(),
      } satisfies Partial<DailyCanonicalHourRecord>;
    }));
    if (hours.length !== EXPECTED_ORATIO_HOURS.length || new Set(hours.map((hour) => hour.hour_type)).size !== 7) {
      throw new Error(`Conjunto de horas incompleto para ${date}`);
    }
    return hours;
  }

  private async fetchOratio(url: string): Promise<Response> {
    const parsedUrl = new URL(url);
    if (parsedUrl.origin !== ORATIO_BASE_URL) throw new Error(`Host de origem não permitido: ${parsedUrl.origin}`);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(20_000),
      headers: { 'user-agent': 'MarIA-CanonicalHours/1.0' },
      redirect: 'manual',
    });
    const finalUrl = new URL(response.url || url);
    if (response.redirected || finalUrl.origin !== ORATIO_BASE_URL || finalUrl.pathname !== parsedUrl.pathname) {
      throw new Error(`Redirecionamento Oratio para rota não autorizada: ${finalUrl.href}`);
    }
    if (!response.ok) throw new Error(`Oratio respondeu ${response.status} para ${url}`);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('text/html')) throw new Error(`Resposta não HTML para ${url}`);
    return response;
  }

  private getDatesThroughSaturday(referenceDate: string): string[] {
    const date = this.parseDateUtc(referenceDate);
    if (this.formatDateUtc(date) !== referenceDate) throw new Error(`Data inválida: ${referenceDate}`);
    const days = 6 - date.getUTCDay();
    return Array.from({ length: days + 1 }, (_, index) => {
      const next = new Date(date);
      next.setUTCDate(date.getUTCDate() + index);
      return this.formatDateUtc(next);
    });
  }

  private parseDateUtc(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  private formatDateUtc(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private getTodayInSaoPaulo(): string {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  }

  private mapLiturgicalColor(value?: string): LiturgicalColor {
    const color = value?.toLocaleLowerCase('pt-BR') || '';
    if (color.includes('branc')) return 'white';
    if (color.includes('vermelh')) return 'red';
    if (color.includes('roxo') || color.includes('viol')) return 'purple';
    if (color.includes('rosa')) return 'rose';
    return 'green';
  }

  private classifyRank(celebration: string): LiturgicalRank {
    const value = celebration.toLocaleLowerCase('pt-BR');
    if (/solenidade/.test(value)) return 'solemnity';
    if (/(?:^|\s)festa(?:\s|$)/.test(value)) return 'feast';
    if (/mem[oó]ria obrigat[oó]ria/.test(value)) return 'obligatory_memorial';
    if (/mem[oó]ria facultativa/.test(value)) return 'optional_memorial';
    return 'unknown';
  }

  async updateHour(
    id: string,
    updateData: { celebration_title?: string; rawCleanText?: string; content?: any },
  ) {
    const supabase = this.supabaseService.getClient();
    const { data: existing, error: fetchErr } = await supabase.from('daily_canonical_hours')
      .select('*').eq('id', id).single();
    if (fetchErr || !existing) throw new Error('Hora canônica não encontrada para atualização');
    const newContent = {
      ...(existing.content || {}),
      ...(updateData.content || {}),
      rawCleanText: updateData.rawCleanText ?? existing.content?.rawCleanText,
    };
    const { data, error } = await supabase.from('daily_canonical_hours').update({
      celebration_title: updateData.celebration_title ?? existing.celebration_title,
      content: newContent,
      updated_at: new Date().toISOString(),
    }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
}

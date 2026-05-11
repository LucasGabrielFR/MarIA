import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface SaintDetail {
  title: string;
  content: string;
}

@Injectable()
export class SaintService {
  private readonly logger = new Logger(SaintService.name);
  private readonly baseUrl = 'https://www.vaticannews.va';

  constructor(private readonly supabaseService: SupabaseService) {}

  async getSaintOfDay(date?: string): Promise<SaintDetail[]> {
    const { month, day } = this.parseDateToBrazil(date);

    // 1. Fonte primária: tabela `saints` no Supabase
    const fromDb = await this.getSaintsFromDatabase(month, day);
    if (fromDb.length > 0) {
      this.logger.log(`[DB] ${fromDb.length} santo(s) para ${day}/${month}`);
      return fromDb;
    }

    // 2. Fallback: scraping em tempo real (dia ainda não indexado)
    this.logger.warn(`[FALLBACK] Sem dados no BD para ${day}/${month} — tentando scraping...`);
    return this.getSaintsFromScraping(month, day);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private parseDateToBrazil(date?: string): { month: number; day: number } {
    if (date) {
      const parts = date.split('-');
      return { month: parseInt(parts[1], 10), day: parseInt(parts[2], 10) };
    }
    // Garante data no horário de Brasília
    const now = new Date(
      new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }),
    );
    return { month: now.getMonth() + 1, day: now.getDate() };
  }

  // ── Fonte Primária: Banco de Dados ──────────────────────────────────────────

  private async getSaintsFromDatabase(month: number, day: number): Promise<SaintDetail[]> {
    try {
      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase
        .from('saints')
        .select('name, short_description, full_description')
        .eq('month', month)
        .eq('day', day);

      if (error) {
        this.logger.error('[DB] Erro ao buscar santos', error.message);
        return [];
      }

      if (!data || data.length === 0) return [];

      return data.map((saint) => ({
        title: saint.name,
        content: saint.full_description || saint.short_description || 'Sem descrição disponível.',
      }));
    } catch (err) {
      this.logger.error('[DB] Exceção ao buscar santos', err);
      return [];
    }
  }

  // ── Fallback: Scraping em Tempo Real ────────────────────────────────────────

  private async getSaintsFromScraping(month: number, day: number): Promise<SaintDetail[]> {
    try {
      const mm = String(month).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const listUrl = `${this.baseUrl}/pt/santo-do-dia/${mm}/${dd}.html`;

      this.logger.log(`[SCRAPING] ${listUrl}`);
      const response = await fetch(listUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();

      const saints = this.parseSaintList(html);
      const results: SaintDetail[] = [];

      for (const saint of saints) {
        if (saint.detailUrl) {
          const detailHtml = await (await fetch(saint.detailUrl)).text();
          results.push({ title: saint.title, content: this.extractFullBiography(detailHtml) });
        } else {
          results.push({ title: saint.title, content: saint.teaserContent });
        }
      }

      return results.length > 0
        ? results
        : [{ title: 'Santo do Dia', content: 'Não foi possível obter os dados dos santos no momento.' }];
    } catch (error) {
      this.logger.error('[SCRAPING] Erro no fallback', error);
      return [{ title: 'Santo do Dia', content: 'Não foi possível obter os dados dos santos no momento.' }];
    }
  }

  // ── Parsers HTML (fallback only) ────────────────────────────────────────────

  private parseSaintList(html: string): Array<{ title: string; teaserContent: string; detailUrl?: string }> {
    const saints: Array<{ title: string; teaserContent: string; detailUrl?: string }> = [];

    // Estrutura Vatican News (verificada maio/2026):
    // <div class="section__head"><h2>Nome</h2></div>
    // <div class="section__wrapper"><div class="section__content"><p>Desc</p></div></div>
    const headRegex = /<div[^>]+class="[^"]*section__head[^"]*"[^>]*>([\s\S]+?)<\/div>/g;
    let headMatch: RegExpExecArray | null;

    while ((headMatch = headRegex.exec(html)) !== null) {
      const h2Match = headMatch[1].match(/<h2[^>]*>([\s\S]+?)<\/h2>/);
      if (!h2Match) continue;

      const title = h2Match[1].replace(/<[^>]+>/g, '').trim();
      if (!title || title.length < 3) continue;

      const afterHead = html.substring(
        headMatch.index + headMatch[0].length,
        headMatch.index + headMatch[0].length + 2000,
      );
      const wrapperMatch = afterHead.match(
        /<div[^>]+class="[^"]*section__wrapper[^"]*"[^>]*>([\s\S]+?)<\/div>\s*<\/div>/,
      );

      let teaserContent = '';
      let detailUrl: string | undefined;

      if (wrapperMatch) {
        const pMatches = wrapperMatch[1].matchAll(/<p[^>]*>([\s\S]+?)<\/p>/g);
        for (const pm of pMatches) {
          const linkMatch = pm[1].match(/href="(\/pt\/santo-do-dia\/[^"]+)"/);
          if (linkMatch) {
            detailUrl = `${this.baseUrl}${linkMatch[1]}`;
          } else {
            const text = pm[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
            if (text) teaserContent += text + ' ';
          }
        }
      }

      saints.push({ title, teaserContent: teaserContent.trim(), detailUrl });
    }

    return saints;
  }

  private extractFullBiography(html: string): string {
    const contentMatch = html.match(/<div[^>]+class="[^"]*section__content[^"]*"[^>]*>([\s\S]+?)<\/div>/);
    if (contentMatch) {
      return contentMatch[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    return 'Conteúdo detalhado não disponível.';
  }
}

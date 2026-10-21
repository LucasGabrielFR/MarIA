import * as cheerio from 'cheerio';
import {
  CanonicalDayMetadata,
  CanonicalHourType,
} from './canonical-hours.types';

export const ORATIO_BASE_URL = 'https://oratioapp.com.br';
export const EXPECTED_ORATIO_HOURS: ReadonlyArray<{
  slug: string;
  type: CanonicalHourType;
}> = [
  { slug: 'oficio-das-leituras', type: 'office_of_readings' },
  { slug: 'laudes', type: 'lauds' },
  { slug: 'hora-terca', type: 'terce' },
  { slug: 'hora-sexta', type: 'sext' },
  { slug: 'hora-nona', type: 'none' },
  { slug: 'vesperas', type: 'vespers' },
  { slug: 'completas', type: 'compline' },
];

export interface OratioHourLink {
  slug: string;
  type: CanonicalHourType;
  url: string;
}

export interface ParsedOratioDay {
  calendarTitle: string;
  dateLabel: string;
  celebration: string;
  hours: OratioHourLink[];
  metadata: CanonicalDayMetadata;
}

export interface ParsedOratioHour {
  title: string;
  rawCleanText: string;
  plainText: string;
}

export class CanonicalHoursParser {
  private static parseBrazilianDate(value: string): string {
    const parts = value.match(/(\d{1,2}) de ([^ ]+) de (\d{4})/i);
    const months: Record<string, string> = {
      janeiro: '01', fevereiro: '02', março: '03', marco: '03', abril: '04',
      maio: '05', junho: '06', julho: '07', agosto: '08', setembro: '09',
      outubro: '10', novembro: '11', dezembro: '12',
    };
    if (!parts) return '';
    const month = months[parts[2].toLocaleLowerCase('pt-BR')];
    return month ? `${parts[3]}-${month}-${parts[1].padStart(2, '0')}` : '';
  }

  static parseDayIndex(html: string, expectedDate: string): ParsedOratioDay {
    const $ = cheerio.load(html);
    const summary = $('section.liturgy-summary').first();
    const dateLabel = summary.find('.liturgy-summary__date').first().text().trim();
    const calendarTitle = summary.find('h1, h2').first().text().trim() || dateLabel;
    const facts = new Map<string, string>();
    summary.find('dl.liturgy-facts dt').each((_, dt) => {
      const key = $(dt).text().trim().toLocaleLowerCase('pt-BR');
      const value = $(dt).next('dd').text().trim();
      facts.set(key, value);
    });
    const parsedDate = this.parseBrazilianDate(dateLabel);
    if (!summary.length || !dateLabel || parsedDate !== expectedDate) {
      throw new Error(`Data do calendário Oratio incompatível: ${dateLabel || 'ausente'}`);
    }

    let calendarEntry: any;
    try {
      const serializedDays = $('script[data-liturgy-days-json]').html();
      const days = JSON.parse(serializedDays || '[]');
      calendarEntry = Array.isArray(days) ? days.find((item) => item?.date === expectedDate) : undefined;
    } catch {
      throw new Error('Índice JSON do calendário Oratio inválido');
    }
    if (!calendarEntry || this.parseBrazilianDate(calendarEntry.label || '') !== expectedDate) {
      throw new Error(`Data do índice JSON Oratio incompatível: ${calendarEntry?.date || 'ausente'}`);
    }

    const expectedBySlug = new Map(EXPECTED_ORATIO_HOURS.map((hour) => [hour.slug, hour]));
    const hours = new Map<string, OratioHourLink>();
    $('article[data-hour-card]').each((_, article) => {
      const card = $(article);
      if (card.attr('data-hour-date') !== expectedDate) return;
      const slug = card.attr('data-hour-slug') || '';
      const expected = expectedBySlug.get(slug);
      if (!expected) return;
      const href = card.find('a[href]').first().attr('href');
      const url = this.validateHourUrl(href || '', expectedDate, slug);
      const jsonUrl = calendarEntry.hours?.[slug];
      if (!jsonUrl || this.validateHourUrl(jsonUrl, expectedDate, slug) !== url) {
        throw new Error(`Rota do cartão diverge do índice JSON para ${slug}`);
      }
      if (hours.has(slug)) throw new Error(`Cartão Oratio duplicado para ${slug}`);
      hours.set(slug, { ...expected, url });
    });
    if (hours.size !== EXPECTED_ORATIO_HOURS.length) {
      const missing = EXPECTED_ORATIO_HOURS.filter((hour) => !hours.has(hour.slug)).map((hour) => hour.slug);
      throw new Error(`Índice Oratio incompleto para ${expectedDate}; ausentes: ${missing.join(', ')}`);
    }

    const abstinence = $('ul.liturgy-observances li').toArray()
      .some((item) => /abstinência/i.test($(item).text()));
    return {
      calendarTitle,
      dateLabel,
      celebration: String(calendarEntry.celebration || ''),
      hours: EXPECTED_ORATIO_HOURS.map((hour) => hours.get(hour.slug)!),
      metadata: {
        calendarTitle,
        dateLabel,
        season: facts.get('tempo'),
        week: facts.get('semana'),
        psalter: facts.get('saltério') || facts.get('salterio'),
        cycle: facts.get('ciclo'),
        color: facts.get('cor'),
        celebration: String(calendarEntry.celebration || ''),
        rankKnown: false,
        memorialKnown: false,
        abstinence,
      },
    };
  }

  static parseHour(html: string, expectedDate: string, expectedSlug: string): ParsedOratioHour {
    const $ = cheerio.load(html);
    const title = $('h1').first().text().trim();
    const heroParagraphs = $('header.liturgy-hour-hero .liturgy-hour-hero__content p')
      .toArray()
      .map((el) => $(el).text().trim());
    const heroDate = heroParagraphs.find((text) => this.parseBrazilianDate(text) !== '') || '';
    if (this.parseBrazilianDate(heroDate) !== expectedDate) {
      throw new Error(`Data do cabeçalho Oratio incompatível para ${expectedSlug}: ${heroDate || 'ausente'}`);
    }
    const reading = $('.liturgy-reading__text[data-reading-text]').first();
    if (!title || !reading.length) throw new Error(`Página Oratio sem título ou conteúdo: ${expectedSlug}`);

    reading.find('script, style, iframe, object, embed, form, input, button, svg, audio, video').remove();
    reading.add(reading.find('*')).each((_, element) => {
      const node = $(element);
      for (const name of Object.keys((element as any).attribs || {})) {
        const value = node.attr(name) || '';
        if (/^on/i.test(name) || name === 'srcdoc' || name === 'style' || name === 'src' || name === 'srcset') {
          node.removeAttr(name);
        } else if (name === 'href') {
          try {
            const resolved = new URL(value, ORATIO_BASE_URL);
            const allowed = resolved.origin === ORATIO_BASE_URL &&
              new RegExp(`^/liturgia-das-horas/${expectedDate.replaceAll('-', '/')}/${expectedSlug}/?$`).test(resolved.pathname);
            if (!allowed || !['http:', 'https:'].includes(resolved.protocol)) node.removeAttr(name);
            else node.attr('href', resolved.href);
          } catch {
            node.removeAttr(name);
          }
        }
      }
    });
    const rawCleanText = reading.html()?.trim() || '';
    const plainText = reading.text().replace(/\s+/g, ' ').trim();
    if (plainText.length < 50 || rawCleanText.length < 50) {
      throw new Error(`Conteúdo Oratio vazio ou curto para ${expectedSlug}`);
    }
    return { title, rawCleanText, plainText };
  }

  static validateHourUrl(href: string, date: string, slug: string): string {
    const url = new URL(href, ORATIO_BASE_URL);
    const expectedPath = `/liturgia-das-horas/${date.replaceAll('-', '/')}/${slug}`;
    if (url.origin !== ORATIO_BASE_URL || !['http:', 'https:'].includes(url.protocol) ||
      ![expectedPath, `${expectedPath}/`].includes(url.pathname)) {
      throw new Error(`Rota Oratio inválida para ${slug}: ${href}`);
    }
    return url.href;
  }
}

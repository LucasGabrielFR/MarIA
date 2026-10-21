import * as cheerio from 'cheerio';
import {
  CanonicalHourContent,
  CanonicalHourType,
  LiturgicalColor,
  LiturgicalRank,
} from './canonical-hours.types';

export class CanonicalHoursParser {
  /**
   * Sanitiza o HTML cru removendo anúncios, Pix, banners e players de áudio
   */
  static sanitizeHtml(rawHtml: string): string {
    if (!rawHtml) return '';

    const $ = cheerio.load(rawHtml);

    // Remove anúncios e scripts
    $('script').remove();
    $('ins.adsbygoogle').remove();
    $('[class*="anuncio"]').remove();
    $('[id*="litur-"]').remove();

    // Remove blocos de Pix e doações
    $('[class*="ctc-shortcode"]').remove();
    $(':contains("Copiar Chave Pix")').remove();
    $(':contains("Apoie a Liturgia das Horas")').remove();

    // Remove imagens de banners/cursos/QR Code
    $('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (
        src.includes('QRCode') ||
        src.includes('Banner') ||
        src.includes('pay.kiwify') ||
        src.includes('curso')
      ) {
        $(el).closest('figure').remove();
        $(el).remove();
      }
    });

    // Remove iframes e embeds do YouTube
    $('iframe').remove();
    $('figure.wp-block-embed-youtube').remove();
    $('figure.wp-block-embed').remove();

    // Remove players de áudio (direitos autorais de terceiros)
    $('audio').remove();

    // Remove botões de navegação para links externos desnecessários
    $('div.wp-block-buttons').remove();

    return $('body').html() || '';
  }

  /**
   * Identifica o tipo de Hora Canônica com base no slug ou título
   */
  static identifyHourType(slug: string, title: string): CanonicalHourType | null {
    const s = `${slug} ${title}`.toLowerCase();

    if (s.includes('oficio-das-leituras') || s.includes('ofício das leituras')) {
      return 'office_of_readings';
    }
    if (s.includes('laudes')) {
      return 'lauds';
    }
    if (s.includes('terca') || s.includes('terça') || s.includes('hora terca') || s.includes('hora terça')) {
      return 'terce';
    }
    if (s.includes('sexta') || s.includes('hora sexta')) {
      return 'sext';
    }
    if (s.includes('nona') || s.includes('hora nona')) {
      return 'none';
    }
    if (s.includes('vesperas') || s.includes('vésperas')) {
      return 'vespers';
    }
    if (s.includes('completas')) {
      return 'compline';
    }
    if (s.includes('invitatorio') || s.includes('invitatório')) {
      return 'invitatory';
    }

    return null;
  }

  /**
   * Identifica o grau litúrgico
   */
  static identifyLiturgicalRank(title: string, content: string): LiturgicalRank {
    const text = `${title} ${content}`.toLowerCase();
    if (text.includes('solenidade')) return 'solemnity';
    if (text.includes('festa de') || text.includes('festa do') || text.includes('festa da')) return 'feast';
    if (text.includes('memória de') || text.includes('memoria de')) {
      return text.includes('facultativa') ? 'optional_memorial' : 'obligatory_memorial';
    }
    return 'ferial';
  }

  /**
   * Dedução ou normalização de cor litúrgica
   */
  static identifyLiturgicalColor(rank: LiturgicalRank, title: string): LiturgicalColor {
    const t = title.toLowerCase();
    if (t.includes('mártir') || t.includes('martir') || t.includes('apóstolo') || t.includes('apostolo') || t.includes('paixão')) {
      return 'red';
    }
    if (
      rank === 'solemnity' ||
      rank === 'feast' ||
      t.includes('nossa senhora') ||
      t.includes('virgem') ||
      t.includes('pastor') ||
      t.includes('doutor') ||
      t.includes('papa') ||
      t.includes('bispo') ||
      t.includes('natal') ||
      t.includes('páscoa') ||
      t.includes('pascoa')
    ) {
      return 'white';
    }
    if (t.includes('quaresma') || t.includes('advento')) {
      return 'purple';
    }
    return 'green';
  }

  /**
   * Extrai e formata o conteúdo em seções e gera texto limpo e legível
   */
  static parseContent(cleanHtml: string): CanonicalHourContent {
    const $ = cheerio.load(cleanHtml);
    const content: CanonicalHourContent = {};

    // Remove tags vazias
    $('p').each((_, el) => {
      if (!$(el).text().trim() && $(el).children().length === 0) {
        $(el).remove();
      }
    });

    const paragraphs: string[] = [];
    $('p, h2, h3, h4').each((_, el) => {
      const text = $(el).text().trim();
      if (text) {
        paragraphs.push(text);
      }
    });

    // Detecta seções estruturais
    let currentSection = 'intro';
    const hymnVerses: string[] = [];
    const intercessionsList: string[] = [];
    let closingPrayerText = '';
    let readingText = '';

    for (const p of paragraphs) {
      const lower = p.toLowerCase();

      if (lower.startsWith('v.') && lower.includes('vinde, ó deus')) {
        content.introductoryVerse = p;
        continue;
      }

      if (lower === 'hino' || lower.startsWith('hino')) {
        currentSection = 'hymn';
        continue;
      }

      if (lower === 'salmodia' || lower.startsWith('salmodia')) {
        currentSection = 'psalmody';
        continue;
      }

      if (lower.startsWith('primeira leitura') || lower.startsWith('leitura breve') || lower.startsWith('leitura')) {
        currentSection = 'reading';
        continue;
      }

      if (lower.startsWith('responsório breve') || lower.startsWith('responsório')) {
        currentSection = 'responsory';
        continue;
      }

      if (lower.startsWith('cântico evangélico') || lower.startsWith('cântico de simeão') || lower.startsWith('benedictus') || lower.startsWith('magnificat')) {
        currentSection = 'canticle';
        continue;
      }

      if (lower === 'preces' || lower.startsWith('preces')) {
        currentSection = 'intercessions';
        continue;
      }

      if (lower === 'oração' || lower.startsWith('oração')) {
        currentSection = 'closing_prayer';
        continue;
      }

      if (lower.startsWith('conclusão da hora') || lower.startsWith('o senhor nos abençoe')) {
        currentSection = 'conclusion';
        content.conclusion = { text: p };
        continue;
      }

      // Agrupa pelo estado
      if (currentSection === 'hymn') {
        if (!p.startsWith('Ant.') && !p.startsWith('Salmo')) {
          hymnVerses.push(p);
        }
      } else if (currentSection === 'reading') {
        readingText += (readingText ? '\n\n' : '') + p;
      } else if (currentSection === 'intercessions') {
        if (!p.toLowerCase().startsWith('pai nosso')) {
          intercessionsList.push(p);
        }
      } else if (currentSection === 'closing_prayer') {
        closingPrayerText += (closingPrayerText ? '\n\n' : '') + p;
      }
    }

    if (hymnVerses.length > 0) {
      content.hymn = { verses: hymnVerses };
    }

    if (readingText) {
      content.briefReading = { text: readingText };
    }

    if (intercessionsList.length > 0) {
      content.intercessions = {
        intentions: intercessionsList,
        ourFather: 'Pai nosso que estais nos céus...',
      };
    }

    if (closingPrayerText) {
      content.closingPrayer = { text: closingPrayerText };
    }

    // rawCleanText formatado com espaçamento sacro
    content.rawCleanText = cleanHtml;

    return content;
  }
}

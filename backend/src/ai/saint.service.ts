import { Injectable, Logger } from '@nestjs/common';

export interface SaintDetail {
  title: string;
  content: string;
}

@Injectable()
export class SaintService {
  private readonly logger = new Logger(SaintService.name);
  private readonly baseUrl = 'https://www.vaticannews.va';

  async getSaintOfDay(date?: string): Promise<SaintDetail[]> {
    try {
      // Formata a URL: https://www.vaticannews.va/pt/santo-do-dia/05/12.html
      let day = '';
      let month = '';
      
      if (date) {
        const parts = date.split('-');
        month = parts[1];
        day = parts[2];
      } else {
        const now = new Date();
        month = String(now.getMonth() + 1).padStart(2, '0');
        day = String(now.getDate()).padStart(2, '0');
      }

      const listUrl = `${this.baseUrl}/pt/santo-do-dia/${month}/${day}.html`;
      this.logger.log(`Fetching saints list from ${listUrl}...`);

      const response = await fetch(listUrl);
      if (!response.ok) throw new Error(`Failed to fetch list: ${response.statusText}`);
      const html = await response.text();

      // 1. Extrair todos os teasers (título e link de leitura)
      const saints = this.parseSaintList(html, month, day);
      
      // 2. Para cada santo, buscar o conteúdo detalhado se houver link
      const results: SaintDetail[] = [];
      for (const saint of saints) {
        if (saint.detailUrl) {
          this.logger.log(`Fetching detail for ${saint.title} from ${saint.detailUrl}...`);
          const detailHtml = await (await fetch(saint.detailUrl)).text();
          const fullContent = this.extractFullBiography(detailHtml);
          results.push({ title: saint.title, content: fullContent });
        } else {
          results.push({ title: saint.title, content: saint.teaserContent });
        }
      }

      return results;
    } catch (error) {
      this.logger.error('Error fetching saints from Vatican News', error);
      return [{ title: 'Santo do Dia', content: 'Não foi possível obter os dados dos santos no momento.' }];
    }
  }

  private parseSaintList(html: string, month: string, day: string): Array<{ title: string; teaserContent: string; detailUrl?: string }> {
    const saints: Array<{ title: string; teaserContent: string; detailUrl?: string }> = [];
    
    // Expressões regulares para encontrar os blocos de santo
    // No Vatican News os títulos estão em <p class="teaser__title"> ou <a> dentro dele
    const teaserRegex = /<p class="teaser__title">([\s\S]+?)<\/p>/g;
    let match;

    while ((match = teaserRegex.exec(html)) !== null) {
      const titleHtml = match[1];
      const title = titleHtml.replace(/<[^>]+>/g, '').trim();
      
      // Busca o link "Leia tudo..." no contexto próximo
      // O link geralmente segue o padrão /pt/santo-do-dia/MM/DD/nome.html
      const linkMatch = html.substring(match.index, match.index + 1000).match(/href="(\/pt\/santo-do-dia\/[^"]+)"[^>]*class="saintReadMore"/);
      const detailUrl = linkMatch ? `${this.baseUrl}${linkMatch[1]}` : undefined;

      // Busca a descrição curta
      const contentMatch = html.substring(match.index, match.index + 1000).match(/<div class="teaser__content">([\s\S]+?)<\/div>/);
      const teaserContent = contentMatch ? contentMatch[1].replace(/<[^>]+>/g, '').trim() : '';

      if (title) {
        saints.push({ title, teaserContent, detailUrl });
      }
    }

    return saints;
  }

  private extractFullBiography(html: string): string {
    // O conteúdo completo está em <div class="section__content santi--detail">
    const match = html.match(/<div class="section__content santi--detail">([\s\S]+?)<\/div>\s*<\/section>/);
    if (!match) return 'Conteúdo detalhado não encontrado.';

    return match[1]
      .replace(/<br\s*\/?>/gi, '\n') // Preserva quebras de linha
      .replace(/<\/p>/gi, '\n\n')    // Preserva parágrafos
      .replace(/<[^>]+>/g, '')       // Remove outras tags
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

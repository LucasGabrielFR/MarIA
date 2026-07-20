import { Injectable, Logger } from '@nestjs/common';

export interface LiturgyData {
  data: string;
  liturgia: string;
  cor: string;
  leituras: {
    primeiraLeitura?: Array<{ referencia: string; titulo: string; texto: string }>;
    segundaLeitura?: Array<{ referencia: string; titulo: string; texto: string }>;
    salmo?: Array<{ referencia: string; refrao: string; texto: string }>;
    evangelho?: Array<{ referencia: string; titulo: string; texto: string }>;
    extras?: Array<{ titulo: string; texto: string }>;
  };
}

@Injectable()
export class LiturgyService {
  private readonly logger = new Logger(LiturgyService.name);
  private readonly apiUrl = 'https://liturgia.up.railway.app/v2/';

  async getDailyLiturgy(date?: string): Promise<string> {
    try {
      let url = this.apiUrl;
      if (date) {
        const [year, month, day] = date.split('-');
        url = `${this.apiUrl}?dia=${parseInt(day, 10)}&mes=${parseInt(month, 10)}&ano=${year}`;
      }
      this.logger.log(`Fetching liturgy from ${url}...`);
      const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });

      if (!response.ok) {
        throw new Error(`Failed to fetch liturgy: ${response.statusText}`);
      }

      const data: LiturgyData = await response.json();
      return this.formatLiturgy(data);
    } catch (error) {
      this.logger.error('Error fetching liturgy', error);
      return 'Não foi possível obter a liturgia no momento.';
    }
  }

  private formatLiturgy(data: LiturgyData): string {
    if (!data.liturgia) {
      return 'Nenhuma celebração encontrada para hoje.';
    }

    const colorEmojiMap: Record<string, string> = {
      Verde: '🟢',
      Vermelho: '🔴',
      Roxo: '🟣',
      Branco: '⚪',
      Rosa: '🌸',
      Preto: '⚫',
    };
    const emoji = data.cor ? colorEmojiMap[data.cor] || '' : '';
    const corText = emoji ? `${data.cor} ${emoji}` : data.cor;

    let formatted = `LITURGIA DE HOJE (${data.data})\n`;
    formatted += `Celebração: ${data.liturgia}\n`;
    formatted += `Cor Litúrgica: ${corText}\n\n`;

    const { leituras } = data;
    if (!leituras) return formatted;

    const sections = [
      { key: 'primeiraLeitura', label: '1ª Leitura', type: 'reading' },
      { key: 'salmo', label: 'Salmo', type: 'psalm' },
      { key: 'segundaLeitura', label: '2ª Leitura', type: 'reading' },
      { key: 'evangelho', label: 'Evangelho', type: 'gospel' }
    ];

    for (const section of sections) {
      const parts = leituras[section.key as keyof typeof leituras];
      if (parts && Array.isArray(parts) && parts.length > 0) {
        parts.forEach((p) => {
          formatted += `*${section.label}*\n`;
          
          if (section.type === 'psalm') {
            if (p.referencia) formatted += `Referência: ${p.referencia}\n`;
            if (p.refrao) formatted += `*${p.refrao.trim()}*\n\n`;
            if (p.texto) formatted += `${p.texto.trim()}\n\n`;
          } else if (section.type === 'gospel') {
            if (p.referencia) formatted += `Referência: ${p.referencia}\n\n`;
            if (p.titulo) formatted += `*${p.titulo.trim()}*\n\n`;
            if (p.texto) formatted += `${p.texto.trim()}\n\n`;
          } else {
            if (p.titulo) formatted += `*${p.titulo.trim()}*\n`;
            if (p.referencia) formatted += `Referência: ${p.referencia}\n\n`;
            if (p.texto) formatted += `${p.texto.trim()}\n\n`;
          }
        });
      }
    }

    return formatted.trim();
  }
}


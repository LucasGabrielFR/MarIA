import { Injectable, Logger } from '@nestjs/common';

export interface LiturgyData {
  data: string;
  celebracoes: Array<{
    id: string;
    liturgia: string;
    cor: string;
    principal: boolean;
    leituras: Array<{
      ordem: number;
      tipo: string;
      rotulo: string;
      opcoes: Array<{
        referencia: string;
        titulo: string;
        texto: string;
        refrao?: string;
      }>;
    }>;
  }>;
}

@Injectable()
export class LiturgyService {
  private readonly logger = new Logger(LiturgyService.name);
  private readonly apiUrl = 'https://liturgia.up.railway.app/v3/';

  async getDailyLiturgy(date?: string): Promise<string> {
    try {
      let url = this.apiUrl;
      if (date) {
        const [year, month, day] = date.split('-');
        url = `${this.apiUrl}?dia=${parseInt(day, 10)}&mes=${parseInt(month, 10)}&ano=${year}`;
      }
      this.logger.log(`Fetching liturgy from ${url}...`);
      const response = await fetch(url);
      
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
    if (!data.celebracoes || data.celebracoes.length === 0) {
      return 'Nenhuma celebração encontrada para hoje.';
    }

    const principal = data.celebracoes.find(c => c.principal) || data.celebracoes[0];
    let formatted = `LITURGIA DE HOJE (${data.data})\n`;
    formatted += `Celebração: ${principal.liturgia}\n`;
    formatted += `Cor Litúrgica: ${principal.cor}\n\n`;

    principal.leituras.forEach(leitura => {
      formatted += `--- ${leitura.rotulo} ---\n`;
      leitura.opcoes.forEach(opcao => {
        formatted += `Referência: ${opcao.referencia}\n`;
        formatted += `Título: ${opcao.titulo}\n`;
        if (opcao.refrao) {
          formatted += `Refrão: ${opcao.refrao}\n`;
        }
        formatted += `Texto: ${opcao.texto}\n\n`;
      });
    });

    return formatted;
  }
}

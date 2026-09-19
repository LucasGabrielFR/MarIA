import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface FlowButton {
  id: string;
  text: string;
  target_step?: string;
  description?: string;
}

export interface FlowStep {
  title?: string;
  type?: 'decision' | 'input' | 'options' | 'message' | 'end';
  text: string;
  buttons: FlowButton[];
  next_step?: string;
  input_variable?: string;
  action?: string;
}

export interface AutomaticFlow {
  id: string;
  key: string;
  name: string;
  steps: Record<string, FlowStep>;
}

export interface StepResolutionResult {
  nextStepKey: string | null;
  matchedButton?: FlowButton;
  isExit?: boolean;
  capturedValue?: string;
}

export interface FormattedStepMessage {
  type: 'text' | 'interactive';
  text: string;
  buttons?: Array<{ id: string; text: string; description?: string }>;
  interactiveType?: 'buttons' | 'list';
  listButton?: string;
  sectionTitle?: string;
}

@Injectable()
export class FlowInterpreterService {
  private readonly logger = new Logger(FlowInterpreterService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Busca a definição do fluxo no banco de dados
   */
  async getFlow(flowKey: string): Promise<AutomaticFlow | null> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('automatic_flows')
      .select('*')
      .eq('key', flowKey)
      .maybeSingle();

    if (error || !data) {
      this.logger.warn(`Fluxo automático "${flowKey}" não encontrado no banco de dados.`);
      return null;
    }

    return data as AutomaticFlow;
  }

  /**
   * Resolve a próxima etapa com base na entrada do usuário e nos botões/transições configurados no banco
   */
  resolveNextStep(step: FlowStep, userInput: string): StepResolutionResult {
    const lowerInput = (userInput || '').trim().toLowerCase();

    // 1. Comando universal de cancelamento/saída
    if (lowerInput === 'cancelar' || lowerInput === 'sair' || lowerInput === 'parar') {
      return { isExit: true, nextStepKey: 'idle' };
    }

    // 2. Se a etapa possui botões/opções
    if (step.buttons && step.buttons.length > 0) {
      // 2.1. Correspondência direta por ID
      let matched = step.buttons.find(
        (b) => String(b.id || '').trim().toLowerCase() === lowerInput,
      );

      // 2.2. Correspondência direta por Texto do botão
      if (!matched) {
        matched = step.buttons.find(
          (b) => String(b.text || '').trim().toLowerCase() === lowerInput,
        );
      }

      // 2.3. Correspondência por Índice Numérico (ex: usuário digitou "1" para a 1ª opção)
      if (!matched) {
        const numIdx = parseInt(lowerInput, 10);
        if (!isNaN(numIdx) && numIdx >= 1 && numIdx <= step.buttons.length) {
          matched = step.buttons[numIdx - 1];
        }
      }

      // 2.4. Correspondência parcial por inclusão (fallback amigável)
      if (!matched && lowerInput.length >= 3) {
        matched = step.buttons.find((b) =>
          String(b.text || '').toLowerCase().includes(lowerInput),
        );
      }

      if (matched) {
        return {
          nextStepKey: matched.target_step || step.next_step || null,
          matchedButton: matched,
          capturedValue: matched.text,
        };
      }
    }

    // 3. Se for etapa de entrada livre (input) com next_step configurado
    if (step.next_step) {
      return {
        nextStepKey: step.next_step,
        capturedValue: userInput.trim(),
      };
    }

    return { nextStepKey: null };
  }

  /**
   * Formata a mensagem da etapa substituindo variáveis e preparando o payload para WhatsApp
   */
  formatStepMessage(
    step: FlowStep,
    context: Record<string, any> = {},
  ): FormattedStepMessage {
    let formattedText = step.text || '';

    // Interpolação de variáveis dinâmicas {variavel} e {{variavel}}
    for (const [key, value] of Object.entries(context)) {
      if (value !== undefined && value !== null) {
        const regex = new RegExp(`{+${key}}+`, 'gi');
        formattedText = formattedText.replace(regex, String(value));
      }
    }

    const buttons = step.buttons || [];

    // Sem botões: mensagem pura de texto
    if (buttons.length === 0) {
      return {
        type: 'text',
        text: formattedText,
      };
    }

    // Até 3 opções: botões rápidos nativos do WhatsApp
    if (buttons.length <= 3) {
      return {
        type: 'interactive',
        interactiveType: 'buttons',
        text: formattedText,
        buttons: buttons.map((b) => ({
          id: b.id,
          text: b.text,
        })),
      };
    }

    // Mais de 3 opções: Menu de Lista nativo (gaveta com botão "Ver opções")
    return {
      type: 'interactive',
      interactiveType: 'list',
      text: formattedText,
      listButton: 'Ver opções',
      sectionTitle: 'Opções Disponíveis',
      buttons: buttons.map((b) => ({
        id: b.id,
        text: b.text,
        description: b.description || 'Selecione esta opção',
      })),
    };
  }
}

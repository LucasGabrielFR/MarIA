import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Save,
  Loader2,
  GitFork,
  MessageSquare,
  ArrowRight,
  ArrowDown,
  AlertTriangle,
  RotateCcw,
  Plus,
  Trash2,
  Sparkles,
  Network,
  Clock,
  ListFilter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Wrench,
  BookOpen,
  CreditCard,
  UserCheck,
  Unlink
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';

export interface FlowButton {
  id: string;
  text: string;
  target_step?: string;
  description?: string;
}

export interface FlowStep {
  title?: string;
  type?: string;
  text: string;
  buttons: FlowButton[];
  next_step?: string;
  input_variable?: string;
  action?: string;
}

export interface NodeTool {
  id: string;
  name: string;
  badge: string;
  categoryLabel: string;
  description: string;
  details: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeClass: string;
  targetFlowKey?: string;
  targetStepKey?: string;
}

export const AVAILABLE_NODE_TOOLS: Record<string, NodeTool> = {
  prayer_list: {
    id: 'prayer_list',
    name: 'Catálogo de Orações',
    badge: 'Lista Dinâmica',
    categoryLabel: 'Banco de Dados',
    description: 'Consulta a tabela de orações (prayers) e gera em tempo real um Menu de Lista nativo no WhatsApp com as orações ativas (is_selectable = true).',
    details: 'As opções são geradas em tempo real a partir das orações cadastradas. Não necessita de botões manuais pré-fixados.',
    icon: ListFilter,
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    targetFlowKey: 'reminder_flow',
    targetStepKey: 'reminder_prayer_select'
  },
  guided_exam_focus: {
    id: 'guided_exam_focus',
    name: 'Foco Diário do Exame de Consciência',
    badge: 'Reflexão Diária',
    categoryLabel: 'IA Devocional',
    description: 'Injeta dinamicamente a reflexão espiritual e virtude correspondente ao dia da semana (substitui {{foco_diario}} no texto).',
    details: 'Busca na tabela prayers a oração específica do dia ("Exame Guiado - Domingo/Segunda...").',
    icon: Sparkles,
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    targetFlowKey: 'conscience_exam_flow',
    targetStepKey: 'step_confession'
  },
  liturgy_fetch: {
    id: 'liturgy_fetch',
    name: 'Liturgia Diária (CNBB / Canção Nova)',
    badge: 'Liturgia',
    categoryLabel: 'Liturgia Católica',
    description: 'Carrega as leituras bíblicas oficiais do dia (Primeira Leitura, Salmo e Evangelho) com opção de versão Resumida ou Completa.',
    details: 'Alimenta o texto do nó ou envia opções de formato para o fiel.',
    icon: BookOpen,
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    targetFlowKey: 'liturgy_flow',
    targetStepKey: 'choose_format'
  },
  asaas_pricing: {
    id: 'asaas_pricing',
    name: 'Tabela de Preços & Cupons Asaas',
    badge: 'Financeiro',
    categoryLabel: 'Financeiro & Vendas',
    description: 'Calcula dinamicamente valores de assinatura, aplica cupons de desconto ativos e gera links seguros de checkout no Asaas.',
    details: 'Substitui variáveis de preço como {basic_price_month} e formata opções de planos.',
    icon: CreditCard,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    targetFlowKey: 'subscription_flow',
    targetStepKey: 'select_plan'
  },
  user_preference_toggle: {
    id: 'user_preference_toggle',
    name: 'Preferência de Envio Diário',
    badge: 'Perfil do Fiel',
    categoryLabel: 'Perfil do Fiel',
    description: 'Salva a opção de receber a liturgia diária (receive_daily_liturgy) diretamente no perfil do usuário no Supabase.',
    details: 'Executa atualização no Supabase ao selecionar Sim ou Não.',
    icon: UserCheck,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    targetFlowKey: 'welcome_flow',
    targetStepKey: 'ask_daily_liturgy'
  }
};

type FlowStepKey = string;
type FlowSteps = Record<FlowStepKey, FlowStep>;

interface AutomaticFlow {
  id: string;
  key: string;
  name: string;
  steps: FlowSteps;
  created_at: string;
  updated_at: string;
}

function normalizeFlowSteps(steps: any, flowKey?: string): FlowSteps {
  const normalized: FlowSteps = {};
  if (!steps) return normalized;
  
  // Trata chaves legadas do subscription_flow
  if (steps.confirm_plan && !steps.select_cycle) {
    steps.select_cycle = steps.confirm_plan;
  }
  
  for (const key of Object.keys(steps)) {
    if (key === 'confirm_plan') continue;
    const rawStep = steps[key] || {};
    
    // Injeção ou preservação de ferramentas conhecidas
    let action = rawStep.action || undefined;
    if (!action) {
      if (key === 'reminder_prayer_select') {
        action = 'prayer_list';
      } else if (key === 'step_confession') {
        action = 'guided_exam_focus';
      } else if (key === 'choose_format' && (flowKey === 'liturgy_flow' || steps.choose_format?.buttons?.some((b: any) => String(b.id || '').includes('liturgy')))) {
        action = 'liturgy_fetch';
      } else if (key === 'select_plan') {
        action = 'asaas_pricing';
      } else if (key === 'ask_daily_liturgy') {
        action = 'user_preference_toggle';
      }
    }

    normalized[key] = {
      title: rawStep.title || undefined,
      type: rawStep.type || undefined,
      text: rawStep.text || '',
      next_step: rawStep.next_step || undefined,
      input_variable: rawStep.input_variable || undefined,
      action: action,
      buttons: Array.isArray(rawStep.buttons)
        ? rawStep.buttons.map((b: any) => ({
            id: String(b.id ?? ''),
            text: String(b.text ?? ''),
            target_step: b.target_step ? String(b.target_step) : undefined,
            description: b.description ? String(b.description) : undefined,
          }))
        : []
    };
  }
  
  // Garante que o subscription_flow sempre tenha as 3 etapas essenciais se estiver vazio
  if (steps.select_plan || steps.select_cycle || steps.payment_confirmed || steps.confirm_plan) {
    if (!normalized.select_plan) normalized.select_plan = { text: '', action: 'asaas_pricing', buttons: [] };
    if (!normalized.select_cycle) normalized.select_cycle = { text: '', buttons: [] };
    if (!normalized.payment_confirmed) normalized.payment_confirmed = { text: '', buttons: [] };
  } else if (steps.coupon_activated) {
    if (!normalized.coupon_activated) normalized.coupon_activated = { text: '', buttons: [] };
  } else if (steps.reminder_type || steps.reminder_confirm) {
    if (!normalized.reminder_type) normalized.reminder_type = { text: '', buttons: [] };
    if (!normalized.reminder_prayer_select) normalized.reminder_prayer_select = { text: '', action: 'prayer_list', buttons: [] };
    if (!normalized.reminder_period_prayer) normalized.reminder_period_prayer = { text: '', buttons: [] };
    if (!normalized.reminder_custom_title) normalized.reminder_custom_title = { text: '', buttons: [] };
    if (!normalized.reminder_period_custom) normalized.reminder_period_custom = { text: '', buttons: [] };
    if (steps.reminder_time_morning && !normalized.reminder_time_morning) normalized.reminder_time_morning = { text: '', buttons: [] };
    if (steps.reminder_time_afternoon && !normalized.reminder_time_afternoon) normalized.reminder_time_afternoon = { text: '', buttons: [] };
    if (steps.reminder_time_night && !normalized.reminder_time_night) normalized.reminder_time_night = { text: '', buttons: [] };
    if (!normalized.reminder_time && !normalized.reminder_time_morning) normalized.reminder_time = { text: '', buttons: [] };
    if (!normalized.reminder_confirm) normalized.reminder_confirm = { text: '', buttons: [] };
    if (!normalized.reminder_success) normalized.reminder_success = { text: '', buttons: [] };
  }
  
  return normalized;
}

const COUPON_ACTIVATED_MESSAGE_TEXT =
  '🎉 *Cupom ativado com sucesso!*\n\n' +
  'O código *{coupon_code}* foi aplicado à sua conta. Você terá um desconto de {discount_percentage}% em nossos planos!\n\n' +
  'Quer conhecer os planos e garantir esse desconto agora mesmo?';

const REMINDER_FLOW_DEFAULTS = {
  reminder_type: { text: '*Agendador de Lembretes* ⏰\n\nQue tipo de lembrete você gostaria de criar?', buttons: [{ id: '1', text: 'Personalizado' }, { id: '2', text: 'Oração' }] },
  reminder_prayer_select: { text: 'Nós temos uma lista de orações disponíveis. Basta selecionar a oração que deseja:', action: 'prayer_list', buttons: [] },
  reminder_period_prayer: { text: 'Ótima escolha: {prayer_title}!\n\nEm qual período você quer receber?', buttons: [{id:'1', text:'Manhã'}, {id:'2', text:'Tarde'}, {id:'3', text:'Noite'}] },
  reminder_custom_title: { text: 'Certo! Qual o título ou mensagem do seu lembrete?', buttons: [] },
  reminder_period_custom: { text: 'Perfeito. Título do lembrete: *{reminder_title}*.\n\nEm qual período você quer receber?', buttons: [{id:'1', text:'Manhã'}, {id:'2', text:'Tarde'}, {id:'3', text:'Noite'}] },
  reminder_time_morning: { text: 'Que horário pela manhã? (Selecione ou digite um horário específico como 08:30)', buttons: [{id:'07:00', text:'07:00'}, {id:'08:00', text:'08:00'}, {id:'09:00', text:'09:00'}] },
  reminder_time_afternoon: { text: 'Que horário à tarde? (Selecione ou digite um horário específico como 15:30)', buttons: [{id:'12:00', text:'12:00'}, {id:'15:00', text:'15:00'}, {id:'18:00', text:'18:00'}] },
  reminder_time_night: { text: 'Que horário à noite? (Selecione ou digite um horário específico como 20:30)', buttons: [{id:'19:00', text:'19:00'}, {id:'21:00', text:'21:00'}, {id:'22:00', text:'22:00'}] },
  reminder_time: { text: 'Qual horário (de Brasília) você quer agendar este lembrete?\n(Selecione ou digite um horário específico como 08:30)', buttons: [{id:'08:00', text:'08:00'}, {id:'14:00', text:'14:00'}, {id:'20:00', text:'20:00'}] },
  reminder_confirm: { text: 'Confirma o agendamento de *{title}* para às *{time}* (horário de Brasília)?', buttons: [{id:'1', text:'Confirmar'}, {id:'2', text:'Cancelar'}] },
  reminder_success: { text: 'Lembrete *{title}* agendado com sucesso para às *{time}*! 🙌', buttons: [] }
};

function formatFlowPreviewText(text: string): string {
  return (text || '').replace(/\\n/g, '\n');
}

const SELECT_PLAN_MESSAGE_TEXT =
  '{coupon_info}Olá! Que bom que você quer assinar a MarIA. ✨\n\n' +
  'Conheça nossos planos:\n\n' +
  '*📘 Plano Básico*\n' +
  'Para quem busca direcionamento e uma companhia diária constante.\n' +
  '• Tudo do gratuito (Liturgia, Santo do Dia e Terço)\n' +
  '• *300 mensagens/mês* conversando com a IA\n' +
  '• Aconselhamento emocional profundo\n' +
  '• Tira-dúvidas com base teológica e do Catecismo\n' +
  '• A partir de *R$ {basic_price_month}/mês* (ou *R$ {basic_price_year_monthly}/mês* no anual)\n\n' +
  '*✨ Plano Premium*\n' +
  'Para quem deseja imersão teológica e oração intensa.\n' +
  '• Tudo do plano Básico\n' +
  '• *600 mensagens/mês* conversando com a IA\n' +
  '• Respostas mais elaboradas e longas\n' +
  '• Acompanhamento diário rigoroso\n' +
  '• A partir de *R$ {premium_price_month}/mês* (ou *R$ {premium_price_year_monthly}/mês* no anual)\n\n' +
  '_Escolha o plano nos botões abaixo. Na próxima etapa você define se prefere pagamento mensal ou anual._';

const SELECT_CYCLE_MESSAGE_TEXT =
  '{upgrade_warning}Plano *{tier_label}* selecionado.\n\n' +
  'Escolha a *forma de pagamento*:\n\n' +
  '{plan_options}\n\n' +
  '_Use os botões abaixo._';

const PAYMENT_CONFIRMED_MESSAGE_TEXT =
  '🎉 *Seja muito bem-vindo ao Plano {tier_label} da MarIA!* 🎉\n\n' +
  'Sua assinatura foi confirmada com sucesso no Asaas! 🌟\n\n' +
  'Agora você tem acesso a mais recursos e limites aumentados. Que a sua jornada espiritual seja ricamente abençoada. Estou muito feliz em te acompanhar de perto! 🙏✨\n\n' +
  '💡 *Dica:* Se precisar ver seu limite de mensagens ou tirar dúvidas sobre sua conta, basta enviar a palavra *Painel* ou *Ajuda* a qualquer momento.\n\n' +
  'Que o amor maternal de Maria Santíssima te guarde hoje e sempre! 🕊️💙';

interface StepMeta {
  title: string;
  subtitle: string;
  routeLabel?: string;
  badgeVariant?: 'default' | 'outline' | 'secondary';
  badgeClass?: string;
  themeColor: string;
  nodeType: 'start' | 'branch' | 'decision' | 'action' | 'end';
}

function getStepMeta(stepKey: string): StepMeta {
  switch (stepKey) {
    case 'select_plan':
      return {
        title: '1. Escolha do Plano',
        subtitle: 'Básico, Premium ou Cancelar',
        routeLabel: 'Entrada do Fluxo',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        themeColor: 'blue',
        nodeType: 'start'
      };
    case 'select_cycle':
      return {
        title: '2. Forma de Pagamento',
        subtitle: 'Ciclo Mensal ou Anual',
        routeLabel: 'Negociação Asaas',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        themeColor: 'blue',
        nodeType: 'action'
      };
    case 'payment_confirmed':
      return {
        title: '3. Boas-Vindas & Conclusão',
        subtitle: 'Ativação pós-pagamento',
        routeLabel: 'Finalização',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        themeColor: 'emerald',
        nodeType: 'end'
      };
    case 'coupon_activated':
      return {
        title: '1. Ativação de Cupom',
        subtitle: 'Resposta imediata do código aplicado',
        routeLabel: 'Promoção',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        themeColor: 'emerald',
        nodeType: 'end'
      };
    case 'ask_name':
      return {
        title: '1. Pergunta do Nome',
        subtitle: 'Acolhida inicial do fiel',
        routeLabel: 'Onboarding',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        themeColor: 'blue',
        nodeType: 'start'
      };
    case 'presentation':
      return {
        title: '2. Apresentação Maternal',
        subtitle: 'Explicação dos recursos da MarIA',
        routeLabel: 'Acolhida',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        themeColor: 'blue',
        nodeType: 'action'
      };
    case 'ask_daily_liturgy':
      return {
        title: '3. Oferta de Liturgia',
        subtitle: 'Convite para receber leituras diárias',
        routeLabel: 'Engajamento',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        themeColor: 'emerald',
        nodeType: 'end'
      };
    case 'choose_format':
      return {
        title: '1. Escolha de Formato',
        subtitle: 'Exame Guiado vs. Exame Completo',
        routeLabel: 'Opções',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        themeColor: 'blue',
        nodeType: 'start'
      };
    case 'step_gratitude':
      return {
        title: '2. Gratidão do Dia',
        subtitle: 'Reconhecimento das bênçãos recebidas',
        routeLabel: 'Reflexão',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        themeColor: 'indigo',
        nodeType: 'action'
      };
    case 'step_confession':
      return {
        title: '3. Exame & Virtude',
        subtitle: 'Ato de contrição e virtude diária',
        routeLabel: 'Conclusão',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        themeColor: 'emerald',
        nodeType: 'end'
      };
    case 'reminder_type':
      return {
        title: '1. Tipo de Lembrete',
        subtitle: 'Oração ou Personalizado',
        routeLabel: 'Ponto de Decisão',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 font-black',
        themeColor: 'blue',
        nodeType: 'decision'
      };
    case 'reminder_prayer_select':
      return {
        title: '2. Seleção de Oração',
        subtitle: 'Menu com orações disponíveis',
        routeLabel: 'Rota: Oração',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        themeColor: 'indigo',
        nodeType: 'branch'
      };
    case 'reminder_period_prayer':
      return {
        title: '3. Turno (Oração)',
        subtitle: 'Manhã, Tarde ou Noite',
        routeLabel: 'Rota: Oração',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        themeColor: 'indigo',
        nodeType: 'branch'
      };
    case 'reminder_custom_title':
      return {
        title: '2. Título Personalizado',
        subtitle: 'Pergunta o tema do lembrete',
        routeLabel: 'Rota: Personalizado',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        themeColor: 'amber',
        nodeType: 'branch'
      };
    case 'reminder_period_custom':
      return {
        title: '3. Turno (Personalizado)',
        subtitle: 'Manhã, Tarde ou Noite',
        routeLabel: 'Rota: Personalizado',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        themeColor: 'amber',
        nodeType: 'branch'
      };
    case 'reminder_time_morning':
      return {
        title: '4. Horário: Manhã',
        subtitle: 'Opções matutinas (07h, 08h, 09h)',
        routeLabel: 'Turno Matutino',
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
        themeColor: 'sky',
        nodeType: 'action'
      };
    case 'reminder_time_afternoon':
      return {
        title: '4. Horário: Tarde',
        subtitle: 'Opções vespertinas (12h, 15h, 18h)',
        routeLabel: 'Turno Vespertino',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        themeColor: 'amber',
        nodeType: 'action'
      };
    case 'reminder_time_night':
      return {
        title: '4. Horário: Noite',
        subtitle: 'Opções noturnas (19h, 21h, 22h)',
        routeLabel: 'Turno Noturno',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        themeColor: 'indigo',
        nodeType: 'action'
      };
    case 'reminder_time':
      return {
        title: '4. Seleção de Horário',
        subtitle: 'Horários sugeridos ou livre',
        routeLabel: 'Horário Universal',
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
        themeColor: 'sky',
        nodeType: 'action'
      };
    case 'reminder_confirm':
      return {
        title: '5. Confirmação',
        subtitle: 'Resumo com horário e Sim/Não',
        routeLabel: 'Validação',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        themeColor: 'blue',
        nodeType: 'action'
      };
    case 'reminder_success':
      return {
        title: '6. Sucesso & Agendamento',
        subtitle: 'Lembrete confirmado e salvo',
        routeLabel: 'Conclusão',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
        themeColor: 'emerald',
        nodeType: 'end'
      };
    default:
      return {
        title: stepKey.replace(/_/g, ' '),
        subtitle: 'Etapa configurável',
        routeLabel: 'Etapa',
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
        themeColor: 'slate',
        nodeType: 'action'
      };
  }
}

/** Card de Nó do Diagrama / Mapa Mental */
interface MindMapNodeProps {
  stepKey: string;
  step: FlowStep;
  isActive: boolean;
  onSelect: (key: string) => void;
  overrideRoute?: string;
  overrideBadgeClass?: string;
}

function MindMapNodeCard({ stepKey, step, isActive, onSelect, overrideRoute, overrideBadgeClass }: MindMapNodeProps) {
  const meta = getStepMeta(stepKey);
  const routeName = overrideRoute || meta.routeLabel;
  const badgeClass = overrideBadgeClass || meta.badgeClass;

  const buttonsCount = step.buttons?.length || 0;
  const tool = step.action ? AVAILABLE_NODE_TOOLS[step.action] : null;

  return (
    <div
      onClick={() => onSelect(stepKey)}
      className={`relative group cursor-pointer text-left p-4 rounded-3xl border transition-all duration-200 select-none min-w-[210px] max-w-[245px] flex flex-col justify-between gap-3 ${
        isActive
          ? 'bg-white border-blue-600 shadow-xl shadow-blue-500/10 ring-4 ring-blue-500/20 scale-[1.02] z-20'
          : 'bg-white/90 hover:bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-md shadow-sm z-10'
      }`}
    >
      {/* Header do Card com Badge de Rota e Status */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs uppercase tracking-wider ${badgeClass}`}>
          {routeName}
        </span>
        {isActive ? (
          <span className="flex items-center gap-1 text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Editando
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 font-bold group-hover:text-blue-600 transition-colors">
            Configurar ➔
          </span>
        )}
      </div>

      {/* Conteúdo Principal do Card */}
      <div className="flex flex-col gap-1.5">
        <h4 className={`text-sm font-black tracking-tight ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>
          {step?.title || meta.title}
        </h4>

        {/* Badge da Ferramenta Vinculada */}
        {tool && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold w-fit shadow-2xs">
            <Wrench className="h-3 w-3 text-indigo-600 shrink-0" />
            <span className="truncate max-w-[170px]">{tool.name}</span>
          </div>
        )}

        <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
          {step.text ? step.text.replace(/\*/g, '') : meta.subtitle}
        </p>
      </div>

      {/* Rodapé do Card com Tags de Botões / Ferramenta / Ações */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
        {tool ? (
          <div className="flex items-center gap-1 text-indigo-700 font-bold">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            <span className="truncate max-w-[95px]">{tool.badge}</span>
          </div>
        ) : buttonsCount > 0 ? (
          <div className="flex items-center gap-1 text-slate-600 font-bold">
            <ListFilter className="h-3 w-3 text-blue-500" />
            <span>{buttonsCount} {buttonsCount === 1 ? 'opção' : 'opções'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-slate-400 font-medium">
            <MessageSquare className="h-3 w-3 text-slate-300" />
            <span>Texto livre</span>
          </div>
        )}

        <div className="flex gap-1 overflow-hidden max-w-[110px]">
          {step.buttons?.slice(0, 2).map((b, i) => (
            <span key={i} className="text-[9px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 truncate max-w-[50px]" title={b.text}>
              {b.text || b.id}
            </span>
          ))}
          {buttonsCount > 2 && (
            <span className="text-[9px] px-1 bg-slate-100 rounded text-slate-500 font-bold">
              +{buttonsCount - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FlowsPage() {
  const [flows, setFlows] = React.useState<AutomaticFlow[]>([]);
  const [selectedFlow, setSelectedFlow] = React.useState<AutomaticFlow | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState<FlowStepKey>('select_plan');
  const [isSelectorCollapsed, setIsSelectorCollapsed] = React.useState(false);
  const [draggedButtonIndex, setDraggedButtonIndex] = React.useState<number | null>(null);
  const [dragOverButtonIndex, setDragOverButtonIndex] = React.useState<number | null>(null);
  const [toolModalOpen, setToolModalOpen] = React.useState(false);
  const diagramRef = React.useRef<HTMLDivElement>(null);

  const scrollDiagram = (direction: 'left' | 'right' | 'reset') => {
    if (!diagramRef.current) return;
    if (direction === 'reset') {
      diagramRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (direction === 'left') {
      diagramRef.current.scrollBy({ left: -360, behavior: 'smooth' });
    } else {
      diagramRef.current.scrollBy({ left: 360, behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/ai/prompts/automatic-flows');
      if (data && data.length > 0) {
        if (!data.find((f: AutomaticFlow) => f.key === 'coupon_flow')) {
          data.push({
            id: 'local_coupon_flow',
            key: 'coupon_flow',
            name: 'Ativação de Cupom',
            steps: { coupon_activated: { text: COUPON_ACTIVATED_MESSAGE_TEXT, buttons: [{ id: 'ver_planos', text: 'Ver Planos' }] } },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        
        if (!data.find((f: AutomaticFlow) => f.key === 'reminder_flow')) {
          data.push({
            id: 'local_reminder_flow',
            key: 'reminder_flow',
            name: 'Agendador de Lembretes',
            steps: REMINDER_FLOW_DEFAULTS,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        
        setFlows(data);
        const preferredFlow = data.find((f: AutomaticFlow) => f.key === 'reminder_flow') || data[0];
        const copy = JSON.parse(JSON.stringify(preferredFlow)) as AutomaticFlow;
        copy.steps = normalizeFlowSteps(copy.steps);
        setSelectedFlow(copy);
        setActiveStep(Object.keys(copy.steps)[0]);
      } else {
        const initialSteps: FlowSteps = {
          select_plan: { text: SELECT_PLAN_MESSAGE_TEXT, buttons: [] },
          select_cycle: { text: SELECT_CYCLE_MESSAGE_TEXT, buttons: [] },
          payment_confirmed: { text: PAYMENT_CONFIRMED_MESSAGE_TEXT, buttons: [] }
        };
        const defaultFlows: AutomaticFlow[] = [
          {
            id: 'temp_reminder',
            key: 'reminder_flow',
            name: 'Agendador de Lembretes',
            steps: REMINDER_FLOW_DEFAULTS,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'temp',
            key: 'subscription_flow',
            name: 'Fluxo de Assinatura de Planos',
            steps: initialSteps,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'temp_coupon',
            key: 'coupon_flow',
            name: 'Ativação de Cupom',
            steps: { coupon_activated: { text: COUPON_ACTIVATED_MESSAGE_TEXT, buttons: [{ id: 'ver_planos', text: 'Ver Planos' }] } },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        setFlows(defaultFlows);
        setSelectedFlow(defaultFlows[0]);
        setActiveStep('reminder_type');
      }
    } catch (error) {
      toast.error('Erro ao carregar fluxos automáticos');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFlow = (flow: AutomaticFlow) => {
    const copy = JSON.parse(JSON.stringify(flow)) as AutomaticFlow;
    copy.steps = normalizeFlowSteps(copy.steps);
    setSelectedFlow(copy);
    const keys = Object.keys(copy.steps);
    setActiveStep(keys[0] || '');
  };

  const handleTextChange = (stepKey: FlowStepKey, value: string) => {
    if (!selectedFlow) return;

    setSelectedFlow(current => {
      if (!current) return null;
      return {
        ...current,
        steps: {
          ...current.steps,
          [stepKey]: {
            ...current.steps[stepKey],
            text: value
          }
        }
      };
    });
  };

  const handleButtonTextChange = (stepKey: FlowStepKey, buttonIndex: number, value: string) => {
    if (!selectedFlow) return;

    setSelectedFlow(current => {
      if (!current) return null;
      const step = current.steps[stepKey];
      const newButtons = [...step.buttons];
      newButtons[buttonIndex] = { ...newButtons[buttonIndex], text: value };

      return {
        ...current,
        steps: {
          ...current.steps,
          [stepKey]: {
            ...step,
            buttons: newButtons
          }
        }
      };
    });
  };

  const handleButtonIdChange = (stepKey: FlowStepKey, buttonIndex: number, value: string) => {
    if (!selectedFlow) return;

    setSelectedFlow(current => {
      if (!current) return null;
      const step = current.steps[stepKey];
      const newButtons = [...step.buttons];
      newButtons[buttonIndex] = { ...newButtons[buttonIndex], id: value };

      return {
        ...current,
        steps: {
          ...current.steps,
          [stepKey]: {
            ...step,
            buttons: newButtons
          }
        }
      };
    });
  };

  const handleAddButton = (stepKey: FlowStepKey) => {
    if (!selectedFlow) return;

    setSelectedFlow(current => {
      if (!current) return null;
      const step = current.steps[stepKey];
      const nextId = String(step.buttons.length > 0 ? Math.max(...step.buttons.map(b => parseInt(b.id) || 0)) + 1 : 1);
      
      let defaultTarget = step.next_step || '';
      if (!defaultTarget && step.buttons.length > 0) {
        defaultTarget = step.buttons[0].target_step || '';
      }
      if (!defaultTarget) {
        defaultTarget = stepKey;
      }

      const newButtons = [...step.buttons, { id: nextId, text: '', target_step: defaultTarget }];

      return {
        ...current,
        steps: {
          ...current.steps,
          [stepKey]: {
            ...step,
            buttons: newButtons
          }
        }
      };
    });
  };

  const handleDeleteButton = (stepKey: FlowStepKey, buttonIndex: number) => {
    if (!selectedFlow) return;

    setSelectedFlow(current => {
      if (!current) return null;
      const step = current.steps[stepKey];
      const newButtons = step.buttons.filter((_, idx) => idx !== buttonIndex);

      return {
        ...current,
        steps: {
          ...current.steps,
          [stepKey]: {
            ...step,
            buttons: newButtons
          }
        }
      };
    });
  };

  const handleReorderButton = (stepKey: FlowStepKey, fromIndex: number, toIndex: number) => {
    if (!selectedFlow) return;
    if (fromIndex === toIndex) return;

    setSelectedFlow(current => {
      if (!current) return null;
      const step = current.steps[stepKey];
      if (!step || !step.buttons) return current;
      if (toIndex < 0 || toIndex >= step.buttons.length) return current;

      const newButtons = [...step.buttons];
      const [moved] = newButtons.splice(fromIndex, 1);
      newButtons.splice(toIndex, 0, moved);

      return {
        ...current,
        steps: {
          ...current.steps,
          [stepKey]: {
            ...step,
            buttons: newButtons
          }
        }
      };
    });
  };

  const handleAddButtonAt = (stepKey: FlowStepKey, atIndex: number) => {
    if (!selectedFlow) return;

    setSelectedFlow(current => {
      if (!current) return null;
      const step = current.steps[stepKey];
      const nextId = String(step.buttons.length > 0 ? Math.max(...step.buttons.map(b => parseInt(b.id) || 0)) + 1 : 1);
      const newButtons = [...step.buttons];

      let defaultTarget = step.next_step || '';
      if (!defaultTarget && step.buttons.length > 0) {
        defaultTarget = step.buttons[0].target_step || '';
      }
      if (!defaultTarget) {
        defaultTarget = stepKey;
      }

      newButtons.splice(atIndex, 0, { id: nextId, text: '', target_step: defaultTarget });

      return {
        ...current,
        steps: {
          ...current.steps,
          [stepKey]: {
            ...step,
            buttons: newButtons
          }
        }
      };
    });
  };

  const handleButtonTargetStepChange = (stepKey: FlowStepKey, buttonIndex: number, value: string) => {
    if (!selectedFlow) return;

    setSelectedFlow(current => {
      if (!current) return null;
      const step = current.steps[stepKey];
      const newButtons = [...step.buttons];
      newButtons[buttonIndex] = { ...newButtons[buttonIndex], target_step: value };

      return {
        ...current,
        steps: {
          ...current.steps,
          [stepKey]: {
            ...step,
            buttons: newButtons
          }
        }
      };
    });
  };

  const handleSetStepTool = (stepKey: FlowStepKey, toolId: string | undefined) => {
    if (!selectedFlow) return;

    setSelectedFlow(current => {
      if (!current) return null;
      const step = current.steps[stepKey];
      if (!step) return current;

      return {
        ...current,
        steps: {
          ...current.steps,
          [stepKey]: {
            ...step,
            action: toolId || undefined
          }
        }
      };
    });

    const toolObj = toolId ? AVAILABLE_NODE_TOOLS[toolId] : null;
    toast.success(toolObj ? `Ferramenta "${toolObj.name}" conectada à etapa!` : 'Ferramenta desconectada da etapa.');
  };

  const loadOptimizedPreset = () => {
    if (!selectedFlow) return;

    if (selectedFlow.key === 'subscription_flow') {
      setSelectedFlow(current => {
        if (!current) return null;
        return {
          ...current,
          steps: {
            select_plan: {
              text: SELECT_PLAN_MESSAGE_TEXT,
              buttons: [
                { id: '1', text: 'Básico' },
                { id: '2', text: 'Premium' },
                { id: '3', text: 'Cancelar' },
              ],
            },
            select_cycle: {
              text: SELECT_CYCLE_MESSAGE_TEXT,
              buttons: [
                { id: '1', text: 'Mensal' },
                { id: '2', text: 'Anual' },
                { id: '3', text: 'Voltar' },
              ],
            },
            payment_confirmed: {
              text: PAYMENT_CONFIRMED_MESSAGE_TEXT,
              buttons: [],
            },
          },
        };
      });
      toast.success('Preset de assinatura carregado! Clique em "Salvar Alterações" para aplicar.');
    } else if (selectedFlow.key === 'reminder_flow') {
      setSelectedFlow(current => {
        if (!current) return null;
        return {
          ...current,
          steps: normalizeFlowSteps(REMINDER_FLOW_DEFAULTS)
        };
      });
      toast.success('Preset de lembretes completo carregado! Clique em "Salvar Alterações" para aplicar.');
    }
  };

  const saveFlow = async () => {
    if (!selectedFlow) return;

    const steps = normalizeFlowSteps(selectedFlow.steps);
    for (const [key, step] of Object.entries(steps)) {
      if (!step.text?.trim()) {
        toast.error(`O texto da etapa "${key}" não pode estar vazio.`);
        return;
      }
    }

    setSaving(true);
    try {
      await apiRequest(`/ai/prompts/automatic-flows/${selectedFlow.key}`, {
        method: 'PUT',
        body: JSON.stringify({
          steps: normalizeFlowSteps(selectedFlow.steps),
          name: selectedFlow.name
        })
      });
      toast.success(`Fluxo "${selectedFlow.name}" atualizado com sucesso!`);
      setFlows(prev => prev.map(f => f.key === selectedFlow.key ? JSON.parse(JSON.stringify(selectedFlow)) : f));
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar o fluxo automático');
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    if (!flows || flows.length === 0) return;
    const original = flows.find(f => f.key === selectedFlow?.key);
    if (original) {
      const copy = JSON.parse(JSON.stringify(original)) as AutomaticFlow;
      copy.steps = normalizeFlowSteps(copy.steps);
      setSelectedFlow(copy);
      toast.success('Alterações descartadas. Retornado ao estado original do banco.');
    }
  };

  if (loading) {
    return (
      <MainLayout title="Fluxos Automáticos" subtitle="Gerenciador de conversas guiadas e fluxos estruturados.">
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="font-bold text-slate-500">Carregando fluxos do banco de dados...</p>
        </div>
      </MainLayout>
    );
  }

  // Identificação do step ativo
  const activeStepMeta = getStepMeta(activeStep);
  const activeStepAction = selectedFlow?.steps[activeStep]?.action;
  const activeStepTool = (activeStepAction && AVAILABLE_NODE_TOOLS[activeStepAction]) || null;

  return (
    <MainLayout
      title="Fluxos Automáticos"
      subtitle="Navegue pelas etapas dos fluxos em formato de mapa mental e personalize mensagens e botões interativos."
    >
      <div className="flex flex-col gap-8 w-full max-w-full min-w-0">

        {/* 1. SELETOR HORIZONTAL DE FLUXOS (COLAPSÁVEL) */}
        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2.5rem] bg-white/90 backdrop-blur-md border border-white/50 overflow-hidden w-full max-w-full">
          <CardHeader className="pb-3 px-8 pt-6 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                <GitFork className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold text-slate-800">
                  Fluxos do Sistema
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 font-semibold">
                  Selecione o fluxo que deseja visualizar no diagrama e editar
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-xs font-bold px-3 py-1">
                {flows.length} fluxos
              </Badge>
              <button
                type="button"
                onClick={() => setIsSelectorCollapsed(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title={isSelectorCollapsed ? "Expandir seletor de fluxos" : "Recolher seletor para ganhar espaço na tela"}
              >
                {isSelectorCollapsed ? (
                  <>
                    <ChevronDown className="h-3.5 w-3.5 text-blue-600" />
                    <span>Expandir Fluxos</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                    <span>Recolher</span>
                  </>
                )}
              </button>
            </div>
          </CardHeader>

          {!isSelectorCollapsed ? (
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                {flows.map(f => {
                  const isSelected = selectedFlow?.key === f.key;
                  const stepCount = Object.keys(f.steps || {}).length;
                  return (
                    <button
                      key={f.id || f.key}
                      onClick={() => handleSelectFlow(f)}
                      className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-3 group cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20 scale-[1.02]'
                          : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200/70 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-blue-700/60 text-blue-100' : 'bg-slate-200/60 text-slate-500'
                        }`}>
                          {f.key}
                        </span>
                        {isSelected && (
                          <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                        )}
                      </div>
                      <div>
                        <h4 className={`font-black text-xs leading-snug line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                          {f.name}
                        </h4>
                        <p className={`text-[11px] font-semibold mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          {stepCount} {stepCount === 1 ? 'etapa' : 'etapas'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          ) : (
            <div className="px-8 py-3 bg-slate-50/50 flex items-center justify-between text-xs border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">Fluxo ativo:</span>
                <span className="font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  {selectedFlow?.name} ({selectedFlow ? Object.keys(selectedFlow.steps || {}).length : 0} etapas)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectorCollapsed(false)}
                className="text-blue-600 hover:text-blue-800 font-bold text-xs underline cursor-pointer"
              >
                Trocar de fluxo
              </button>
            </div>
          )}
        </Card>

        {/* 2. MAPA MENTAL / DIAGRAMA INTERATIVO DO FLUXO */}
        {selectedFlow && (
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white border border-slate-100 overflow-hidden w-full max-w-full">
            {/* Header do Canvas com Legenda e Controles de Scroll */}
            <div className="bg-gradient-to-r from-slate-50 via-white to-blue-50/20 border-b border-slate-100/80 px-8 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-2xs">
                  <Network className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                    Mapa Mental & Diagrama: <span className="text-blue-600">{selectedFlow.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    Clique em qualquer nó do diagrama para inspecionar e editar no painel abaixo.
                  </p>
                </div>
              </div>

              {/* Controles de Navegação Horizontal & Legenda */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Botões de Rolagem do Diagrama */}
                <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => scrollDiagram('reset')}
                    className="p-1.5 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-white transition-all text-[11px] font-bold flex items-center gap-1 px-2.5 cursor-pointer"
                    title="Voltar ao início do diagrama"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Início</span>
                  </button>
                  <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                  <button
                    type="button"
                    onClick={() => scrollDiagram('left')}
                    className="p-1.5 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-white transition-all text-[11px] font-bold flex items-center gap-1 px-2.5 cursor-pointer"
                    title="Rolar diagrama para a esquerda"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Esquerda</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollDiagram('right')}
                    className="p-1.5 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-white transition-all text-[11px] font-bold flex items-center gap-1 px-2.5 cursor-pointer"
                    title="Rolar diagrama para a direita"
                  >
                    <span className="hidden sm:inline">Direita</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Legenda do Mapa Mental */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> Início/Decisão
                  </span>
                  {selectedFlow.key === 'reminder_flow' && (
                    <>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Oração
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Personalizado
                      </span>
                    </>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Conclusão
                  </span>
                </div>
              </div>
            </div>

            {/* Canvas do Mapa Mental - Rolagem isolada estritamente neste quadro */}
            <div
              ref={diagramRef}
              className="p-8 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] bg-slate-50/40 overflow-x-auto canvas-scrollbar scroll-smooth w-full max-w-full select-none min-h-[380px]"
            >
              
              {/* RENDERIZAÇÃO ESPECIAL: FLUXO DE LEMBRETES (ÁRVORE COM RAMIFICAÇÕES) */}
              {selectedFlow.key === 'reminder_flow' ? (
                <div className="inline-flex items-center gap-6 py-6 min-w-max justify-start">
                  
                  {/* NÓ INICIAL / DECISÃO: reminder_type */}
                  {selectedFlow.steps.reminder_type && (
                    <div className="flex flex-col items-center">
                      <MindMapNodeCard
                        stepKey="reminder_type"
                        step={selectedFlow.steps.reminder_type}
                        isActive={activeStep === 'reminder_type'}
                        onSelect={setActiveStep}
                        overrideRoute="Entrada do Agendador"
                        overrideBadgeClass="bg-blue-600 text-white font-black"
                      />
                    </div>
                  )}

                  {/* CONECTOR BIFURCADO */}
                  <div className="flex flex-col items-center justify-center gap-16 text-slate-300">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full shadow-2xs whitespace-nowrap">
                        Se "Oração" ➔
                      </span>
                      <ArrowRight className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shadow-2xs whitespace-nowrap">
                        Se "Personalizado" ➔
                      </span>
                      <ArrowRight className="h-4 w-4 text-amber-400" />
                    </div>
                  </div>

                  {/* DUAS ROTAS PARALELAS (ORAÇÃO & PERSONALIZADO) */}
                  <div className="flex flex-col gap-6">
                    {/* RAMO SUPERIOR: ORAÇÃO */}
                    <div className="flex items-center gap-4 p-3 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 shadow-2xs">
                      {selectedFlow.steps.reminder_prayer_select && (
                        <MindMapNodeCard
                          stepKey="reminder_prayer_select"
                          step={selectedFlow.steps.reminder_prayer_select}
                          isActive={activeStep === 'reminder_prayer_select'}
                          onSelect={setActiveStep}
                          overrideRoute="1ª Etapa Oração"
                          overrideBadgeClass="bg-indigo-100 text-indigo-800 border-indigo-200"
                        />
                      )}
                      <ArrowRight className="h-5 w-5 text-indigo-300" />
                      {selectedFlow.steps.reminder_period_prayer && (
                        <MindMapNodeCard
                          stepKey="reminder_period_prayer"
                          step={selectedFlow.steps.reminder_period_prayer}
                          isActive={activeStep === 'reminder_period_prayer'}
                          onSelect={setActiveStep}
                          overrideRoute="2ª Etapa Turno"
                          overrideBadgeClass="bg-indigo-100 text-indigo-800 border-indigo-200"
                        />
                      )}
                    </div>

                    {/* RAMO INFERIOR: PERSONALIZADO */}
                    <div className="flex items-center gap-4 p-3 bg-amber-50/50 rounded-[2rem] border border-amber-100 shadow-2xs">
                      {selectedFlow.steps.reminder_custom_title && (
                        <MindMapNodeCard
                          stepKey="reminder_custom_title"
                          step={selectedFlow.steps.reminder_custom_title}
                          isActive={activeStep === 'reminder_custom_title'}
                          onSelect={setActiveStep}
                          overrideRoute="1ª Etapa Título"
                          overrideBadgeClass="bg-amber-100 text-amber-800 border-amber-200"
                        />
                      )}
                      <ArrowRight className="h-5 w-5 text-amber-300" />
                      {selectedFlow.steps.reminder_period_custom && (
                        <MindMapNodeCard
                          stepKey="reminder_period_custom"
                          step={selectedFlow.steps.reminder_period_custom}
                          isActive={activeStep === 'reminder_period_custom'}
                          onSelect={setActiveStep}
                          overrideRoute="2ª Etapa Turno"
                          overrideBadgeClass="bg-amber-100 text-amber-800 border-amber-200"
                        />
                      )}
                    </div>
                  </div>

                  {/* CONECTOR DE CONVERGÊNCIA PARA HORÁRIOS */}
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs whitespace-nowrap">
                      Convergência ➔
                    </span>
                    <ArrowRight className="h-5 w-5 text-slate-300" />
                  </div>

                  {/* SELEÇÃO DE HORÁRIOS */}
                  <div className="flex flex-col gap-2 p-3 bg-white/80 rounded-[2rem] border border-slate-200 shadow-2xs">
                    <div className="px-3 pt-1 text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-sky-500" />
                      Seleção de Horários
                    </div>

                    {selectedFlow.steps.reminder_time_morning && (
                      <MindMapNodeCard
                        stepKey="reminder_time_morning"
                        step={selectedFlow.steps.reminder_time_morning}
                        isActive={activeStep === 'reminder_time_morning'}
                        onSelect={setActiveStep}
                      />
                    )}
                    {selectedFlow.steps.reminder_time_afternoon && (
                      <MindMapNodeCard
                        stepKey="reminder_time_afternoon"
                        step={selectedFlow.steps.reminder_time_afternoon}
                        isActive={activeStep === 'reminder_time_afternoon'}
                        onSelect={setActiveStep}
                      />
                    )}
                    {selectedFlow.steps.reminder_time_night && (
                      <MindMapNodeCard
                        stepKey="reminder_time_night"
                        step={selectedFlow.steps.reminder_time_night}
                        isActive={activeStep === 'reminder_time_night'}
                        onSelect={setActiveStep}
                      />
                    )}
                    {selectedFlow.steps.reminder_time && !selectedFlow.steps.reminder_time_morning && (
                      <MindMapNodeCard
                        stepKey="reminder_time"
                        step={selectedFlow.steps.reminder_time}
                        isActive={activeStep === 'reminder_time'}
                        onSelect={setActiveStep}
                      />
                    )}
                  </div>

                  {/* CONECTOR FINAL */}
                  <ArrowRight className="h-5 w-5 text-slate-300" />

                  {/* CONFIRMAÇÃO & SUCESSO */}
                  <div className="flex flex-col gap-4">
                    {selectedFlow.steps.reminder_confirm && (
                      <MindMapNodeCard
                        stepKey="reminder_confirm"
                        step={selectedFlow.steps.reminder_confirm}
                        isActive={activeStep === 'reminder_confirm'}
                        onSelect={setActiveStep}
                      />
                    )}
                    <div className="flex justify-center">
                      <ArrowDown className="h-4 w-4 text-slate-300" />
                    </div>
                    {selectedFlow.steps.reminder_success && (
                      <MindMapNodeCard
                        stepKey="reminder_success"
                        step={selectedFlow.steps.reminder_success}
                        isActive={activeStep === 'reminder_success'}
                        onSelect={setActiveStep}
                        overrideBadgeClass="bg-emerald-600 text-white font-black"
                      />
                    )}
                  </div>

                </div>
              ) : (
                /* RENDERIZAÇÃO LINEAR EM FLUXOGRAMA SEQUENCIAL */
                <div className="inline-flex items-center gap-6 py-6 min-w-max justify-start">
                  {Object.keys(selectedFlow.steps).map((stepKey, index, arr) => {
                    const step = selectedFlow.steps[stepKey];
                    const isLast = index === arr.length - 1;

                    return (
                      <React.Fragment key={stepKey}>
                        <MindMapNodeCard
                          stepKey={stepKey}
                          step={step}
                          isActive={activeStep === stepKey}
                          onSelect={setActiveStep}
                        />

                        {!isLast && (
                          <div className="flex flex-col items-center gap-1 text-slate-300 flex-shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-2xs">
                              Avança ➔
                            </span>
                            <ArrowRight className="h-5 w-5 text-slate-300" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}

            </div>
          </Card>
        )}

        {/* 3. WORKSPACE DE EDIÇÃO DA ETAPA SELECIONADA */}
        {selectedFlow && selectedFlow.steps[activeStep] ? (
          <div id="step-editor-workspace" className="scroll-mt-6">
            <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden bg-white border border-white/50">

              {/* Header do Editor */}
              <div className="bg-gradient-to-r from-slate-50 via-white to-blue-50/20 border-b border-slate-100 p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-blue-600 rounded-2xl text-white shadow-md shadow-blue-500/20 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                        Etapa em Edição
                      </span>
                      <span className="text-xs text-slate-400 font-bold">
                        chave: <code className="font-mono text-slate-600 font-bold">{activeStep}</code>
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">
                      {activeStepMeta.title}
                    </h3>
                    <p className="text-slate-400 font-medium text-xs mt-0.5">
                      {activeStepMeta.subtitle} • Personalize a mensagem enviada e as opções interativas.
                    </p>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={resetChanges}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 rounded-2xl font-bold h-11 px-5 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Descartar
                  </Button>
                  <Button
                    onClick={saveFlow}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold h-11 px-6 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Corpo de Edição */}
              <CardContent className="p-8 space-y-8">

                {/* Bloco de Mensagem (Editor + Preview WhatsApp) */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-black text-slate-700 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      Mensagem Enviada no WhatsApp
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400">
                        {selectedFlow.steps[activeStep].text.length} caracteres
                      </span>
                      <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 font-bold px-2 py-0.5 text-[10px]">
                        WhatsApp Markdown
                      </Badge>
                    </div>
                  </div>

                  {/* Toolbar de Formatação Rápida */}
                  <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">Inserir:</span>
                    {[
                      { label: '*Negrito*', insert: '*texto*', title: 'Negrito' },
                      { label: '_Itálico_', insert: '_texto_', title: 'Itálico' },
                      { label: '↵ Nova linha', insert: '\n', title: 'Quebra de linha' },
                      { label: '↵↵ Parágrafo', insert: '\n\n', title: 'Parágrafo' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          const textarea = document.getElementById(`msg-editor-${activeStep}`) as HTMLTextAreaElement;
                          if (!textarea) return;
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const current = selectedFlow.steps[activeStep].text;
                          const newText = current.slice(0, start) + item.insert + current.slice(end);
                          handleTextChange(activeStep, newText);
                          setTimeout(() => {
                            textarea.focus();
                            textarea.setSelectionRange(start + item.insert.length, start + item.insert.length);
                          }, 0);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-all cursor-pointer shadow-2xs"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Grid: Editor + Preview WhatsApp */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Textarea do Editor */}
                    <div className="lg:col-span-7 flex flex-col gap-1">
                      <div className="relative">
                        <textarea
                          id={`msg-editor-${activeStep}`}
                          value={selectedFlow.steps[activeStep].text}
                          onChange={(e) => handleTextChange(activeStep, e.target.value)}
                          placeholder={"Digite a mensagem que a MarIA enviará nesta etapa..."}
                          rows={12}
                          style={{ fontFamily: "'Courier New', Courier, monospace", lineHeight: '1.6' }}
                          className="w-full rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-slate-700 p-4 transition-all text-[13px] resize-y bg-slate-50/70 shadow-inner"
                        />
                        <div className="absolute bottom-3 right-3 text-[9px] font-bold text-slate-300 pointer-events-none select-none">
                          {selectedFlow.steps[activeStep].text.split('\n').length} linhas
                        </div>
                      </div>

                      {/* Dicas de Variáveis Conforme o Passo */}
                      {selectedFlow.key === 'subscription_flow' && (
                        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-black">Variáveis suportadas:</span>
                            <span className="font-mono text-[10px] ml-1">
                              {activeStep === 'select_plan' && '{basic_price_month}, {premium_price_month}, {coupon_info}'}
                              {activeStep === 'select_cycle' && '{tier_label}, {plan_options}, {upgrade_warning}'}
                              {activeStep === 'payment_confirmed' && '{tier_label}, {user_name}'}
                            </span>
                          </div>
                        </div>
                      )}
                      {selectedFlow.key === 'reminder_flow' && (
                        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-800 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-black">Variáveis dinâmicas:</span>
                            <span className="font-mono text-[10px] ml-1">
                              {'{title}'} (título do lembrete), {'{prayer_title}'} (nome da oração), {'{time}'} (horário de Brasília), {'{period}'} (Manhã, Tarde ou Noite).
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Preview WhatsApp */}
                    <div className="lg:col-span-5 flex flex-col gap-1">
                      <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-lg bg-[#e5ddd5] p-4 flex flex-col justify-between min-h-[300px]">
                        <div className="flex flex-col gap-2">
                          {/* Balão de Mensagem */}
                          <div className="self-start max-w-[95%] bg-white rounded-2xl rounded-tl-xs px-4 py-3 shadow-sm text-[12.5px] text-slate-800 leading-relaxed break-words" style={{ fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
                            {selectedFlow.steps[activeStep].text ? (
                              formatFlowPreviewText(selectedFlow.steps[activeStep].text)
                                .split('\n')
                                .map((line, i) => (
                                  <span key={i}>
                                    {line
                                      .split(/(\*[^*]+\*|_[^_]+_)/g)
                                      .map((part, j) => {
                                        if (part.startsWith('*') && part.endsWith('*'))
                                          return <strong key={j}>{part.slice(1, -1)}</strong>;
                                        if (part.startsWith('_') && part.endsWith('_'))
                                          return <em key={j}>{part.slice(1, -1)}</em>;
                                        return <span key={j}>{part}</span>;
                                      })}
                                    {i < selectedFlow.steps[activeStep].text.split('\n').length - 1 && <br />}
                                  </span>
                                ))
                            ) : (
                              <span className="text-slate-400 italic text-xs">Pré-visualização da mensagem...</span>
                            )}
                            <div className="text-right mt-1.5">
                              <span className="text-[10px] text-slate-400">00:00 ✓✓</span>
                            </div>
                          </div>

                          {/* Preview dos Botões Interativos ou Ferramenta Dinâmica */}
                          {selectedFlow.steps[activeStep].buttons.length > 0 ? (
                            <div className="flex flex-col gap-1.5 self-start w-[95%]">
                              {selectedFlow.steps[activeStep].buttons.length <= 3 ? (
                                selectedFlow.steps[activeStep].buttons.map((b, i) => (
                                  <div
                                    key={i}
                                    className="w-full py-2 px-3 bg-white/95 rounded-xl text-center text-xs font-bold text-blue-600 shadow-2xs border border-slate-200/80 flex items-center justify-center gap-1.5"
                                  >
                                    <span>{b.text || `Opção ${i + 1}`}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="w-full py-2.5 px-4 bg-white rounded-xl text-center text-xs font-bold text-emerald-700 shadow-2xs border border-emerald-200 flex items-center justify-center gap-2">
                                  <ListFilter className="h-3.5 w-3.5" />
                                  <span>Ver opções ({selectedFlow.steps[activeStep].buttons.length} itens no Menu de Lista)</span>
                                </div>
                              )}
                            </div>
                          ) : activeStepTool?.id === 'prayer_list' ? (
                            <div className="flex flex-col gap-1.5 self-start w-[95%]">
                              <div className="w-full py-2.5 px-4 bg-white rounded-xl text-center text-xs font-bold text-indigo-700 shadow-2xs border border-indigo-200 flex items-center justify-center gap-2">
                                <ListFilter className="h-3.5 w-3.5 text-indigo-600" />
                                <span>Ver Orações (10 orações ativas no banco de dados)</span>
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="text-center pt-2 text-[10px] text-slate-400 font-bold">
                          Simulação em tempo real do WhatsApp
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Bloco de Ferramentas & Ações Dinâmicas do Nó */}
                <div className="border-t border-slate-100 pt-6 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-blue-600" />
                        Ferramenta & Ação Dinâmica do Nó
                      </h4>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        Conecte ferramentas para carregar dados do banco, executar integrações ou gerar opções em tempo real.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setToolModalOpen(true)}
                      className="h-9 px-3 rounded-xl border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100/70 font-bold text-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-2xs"
                    >
                      <Plus className="h-3.5 w-3.5 text-blue-600" />
                      {activeStepTool ? 'Alterar Ferramenta' : 'Adicionar Ferramenta'}
                    </Button>
                  </div>

                  {/* Card da Ferramenta Conectada ou Estado Vazio */}
                  {activeStepTool ? (
                    <div className="p-4 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-blue-50/40 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="p-3 rounded-2xl bg-white border border-indigo-200 shadow-2xs text-indigo-600 shrink-0">
                          <activeStepTool.icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-slate-900">{activeStepTool.name}</span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs ${activeStepTool.badgeClass}`}>
                              {activeStepTool.categoryLabel}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                              Ativa no Nó
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            {activeStepTool.description}
                          </p>
                          <p className="text-[11px] text-indigo-800 font-bold">
                            💡 {activeStepTool.details}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setToolModalOpen(true)}
                          className="h-8 px-3 rounded-xl border-slate-200 text-slate-700 hover:bg-white text-xs font-bold cursor-pointer"
                        >
                          Trocar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetStepTool(activeStep, undefined)}
                          className="h-8 px-2.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                          title="Desconectar ferramenta desta etapa"
                        >
                          <Unlink className="h-3.5 w-3.5 mr-1" />
                          Desconectar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500">
                      <div className="flex items-center gap-2.5 text-xs font-medium">
                        <Wrench className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>Nenhuma ferramenta conectada a este nó. O comportamento seguirá exclusivamente os botões manuais ou texto livre.</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setToolModalOpen(true)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50/60 cursor-pointer shrink-0"
                      >
                        + Conectar Ferramenta
                      </Button>
                    </div>
                  )}
                </div>

                {/* Bloco de Opções / Botões Interativos */}
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        Botões Interativos & Menu de Lista WhatsApp
                      </h4>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        Configure as opções de resposta rápida. Se tiver até 3 opções, envia como botões; se tiver mais de 3, envia como Menu de Lista nativo.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={loadOptimizedPreset}
                        className="h-9 px-3 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                        Preset
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleAddButtonAt(activeStep, 0)}
                        className="h-9 px-3 rounded-xl border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100/70 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        title="Inserir nova opção na primeira posição"
                      >
                        <Plus className="h-3.5 w-3.5 text-blue-600" />
                        Inserir no Início
                      </Button>

                      <Button
                        type="button"
                        onClick={() => handleAddButton(activeStep)}
                        className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Adicionar no Fim
                      </Button>
                    </div>
                  </div>

                  {/* Grid de Inputs dos Botões com Suporte a Drag & Drop e Reordenação */}
                  {selectedFlow.steps[activeStep].buttons.length === 0 ? (
                    activeStepTool ? (
                      <div className="p-5 text-center rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/30 flex flex-col items-center justify-center gap-1.5">
                        <div className="flex items-center gap-2 font-black text-xs text-indigo-900">
                          <Sparkles className="h-4 w-4 text-indigo-600" />
                          <span>Opções dinâmicas gerenciadas pela ferramenta: {activeStepTool.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 max-w-lg leading-relaxed">
                          {activeStepTool.details} Você ainda pode usar os botões acima ("+ Inserir no Início" / "+ Adicionar no Fim") se desejar adicionar botões manuais adicionais ou rotas de saída rápida.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <p className="text-xs font-bold">Nenhum botão ou opção interativa configurada nesta etapa.</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">A MarIA aguardará resposta de texto livre do fiel.</p>
                      </div>
                    )
                  ) : (
                    <div className="space-y-3">
                      {activeStepTool && (
                        <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                            <span><strong>Ferramenta Ativa ({activeStepTool.name}):</strong> Os {selectedFlow.steps[activeStep].buttons.length} botões abaixo funcionarão como opções complementares ou de saída rápida no WhatsApp.</span>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {selectedFlow.steps[activeStep].buttons.map((btn, idx) => (
                        <div
                          key={idx}
                          draggable={true}
                          onDragStart={(e) => {
                            setDraggedButtonIndex(idx);
                            e.dataTransfer.setData('text/plain', String(idx));
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (dragOverButtonIndex !== idx) setDragOverButtonIndex(idx);
                          }}
                          onDragLeave={() => {
                            if (dragOverButtonIndex === idx) setDragOverButtonIndex(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedButtonIndex !== null && draggedButtonIndex !== idx) {
                              handleReorderButton(activeStep, draggedButtonIndex, idx);
                              toast.success(`Opção movida da posição ${draggedButtonIndex + 1} para a posição ${idx + 1}`);
                            }
                            setDraggedButtonIndex(null);
                            setDragOverButtonIndex(null);
                          }}
                          onDragEnd={() => {
                            setDraggedButtonIndex(null);
                            setDragOverButtonIndex(null);
                          }}
                          className={`p-3.5 rounded-2xl border flex flex-col gap-2.5 transition-all shadow-2xs group ${
                            draggedButtonIndex === idx
                              ? 'opacity-40 border-dashed border-blue-500 bg-blue-50/20 scale-95'
                              : dragOverButtonIndex === idx
                              ? 'border-blue-600 ring-2 ring-blue-400/60 bg-blue-50/60 scale-[1.02]'
                              : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          {/* Header do Card da Opção */}
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                              <div
                                className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-300 hover:text-blue-600 rounded transition-colors"
                                title="Clique e arraste para reordenar esta opção"
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                Opção {idx + 1}
                              </span>
                            </div>

                            {/* Controles de Reordenação e Exclusão */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleReorderButton(activeStep, idx, idx - 1)}
                                className={`p-1 rounded-md transition-colors ${
                                  idx === 0
                                    ? 'text-slate-200 cursor-not-allowed'
                                    : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer'
                                }`}
                                title="Mover para trás / esquerda"
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                disabled={idx === selectedFlow.steps[activeStep].buttons.length - 1}
                                onClick={() => handleReorderButton(activeStep, idx, idx + 1)}
                                className={`p-1 rounded-md transition-colors ${
                                  idx === selectedFlow.steps[activeStep].buttons.length - 1
                                    ? 'text-slate-200 cursor-not-allowed'
                                    : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer'
                                }`}
                                title="Mover para frente / direita"
                              >
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>

                              <div className="w-[1px] h-3.5 bg-slate-200 mx-0.5" />

                              <button
                                type="button"
                                onClick={() => handleDeleteButton(activeStep, idx)}
                                className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Excluir opção"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Campos de ID e Texto */}
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-4 flex flex-col gap-1">
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase">ID / Dígito</span>
                              <Input
                                type="text"
                                value={btn.id}
                                onChange={(e) => handleButtonIdChange(activeStep, idx, e.target.value)}
                                placeholder="ID"
                                className="h-8 rounded-lg border-slate-200 font-extrabold text-slate-700 text-xs px-2 text-center bg-white"
                              />
                            </div>

                            <div className="col-span-8 flex flex-col gap-1">
                              <div className="flex justify-between items-center px-0.5">
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase">Rótulo / Texto</span>
                                <span className={`text-[8px] font-bold ${btn.text.length > 20 ? 'text-amber-600' : 'text-slate-400'}`}>
                                  {btn.text.length}/20 carac.
                                </span>
                              </div>
                              <Input
                                type="text"
                                value={btn.text}
                                onChange={(e) => handleButtonTextChange(activeStep, idx, e.target.value)}
                                placeholder="Ex: Manhã"
                                maxLength={30}
                                className={`h-8 rounded-lg font-bold text-slate-700 text-xs px-2.5 bg-white ${
                                  btn.text.length > 20 ? 'border-amber-300' : 'border-slate-200'
                                }`}
                              />
                            </div>
                          </div>

                          {/* Rota / Destino da Opção (target_step) */}
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 text-[10px]">
                            <span className="font-extrabold text-slate-400 uppercase text-[9px] whitespace-nowrap">
                              Destino:
                            </span>
                            <Input
                              type="text"
                              value={btn.target_step || ''}
                              onChange={(e) => handleButtonTargetStepChange(activeStep, idx, e.target.value)}
                              placeholder="Etapa destino (ex: reminder_confirm)"
                              className="h-7 text-[10px] font-mono px-2 rounded-md bg-white border-slate-200 text-slate-600 focus:border-blue-400"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* MODAL DO CATÁLOGO DE FERRAMENTAS DO NÓ */}
      <Dialog open={toolModalOpen} onOpenChange={setToolModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 bg-white shadow-2xl border border-slate-200">
          <DialogHeader className="space-y-1 pb-3 border-b border-slate-100">
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              Catálogo de Ferramentas dos Nós
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Conecte uma ferramenta à etapa ativa ({activeStep}) para carregar dados do banco de dados, executar integrações ou gerar opções dinâmicas no WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            {Object.values(AVAILABLE_NODE_TOOLS).map((tool) => {
              const isConnected = selectedFlow?.steps[activeStep]?.action === tool.id;
              const IconComponent = tool.icon;

              return (
                <div
                  key={tool.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isConnected
                      ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`p-3 rounded-2xl border shrink-0 ${isConnected ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="text-sm font-black text-slate-900">{tool.name}</h5>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs ${tool.badgeClass}`}>
                          {tool.categoryLabel}
                        </span>
                        {isConnected && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Ativa nesta etapa
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {tool.description}
                      </p>
                      <p className="text-[11px] text-blue-700 font-bold">
                        💡 {tool.details}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 self-end sm:self-center">
                    {isConnected ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleSetStepTool(activeStep, undefined);
                          setToolModalOpen(false);
                        }}
                        className="h-8 px-3 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                      >
                        <Unlink className="h-3.5 w-3.5 mr-1" />
                        Desconectar
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          handleSetStepTool(activeStep, tool.id);
                          setToolModalOpen(false);
                        }}
                        className="h-8 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-xs"
                      >
                        Conectar ao Nó
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400 font-medium">
              Novas ferramentas integradas no código aparecerão automaticamente neste catálogo.
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setToolModalOpen(false)}
              className="rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
    </MainLayout>
  );
}

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
  AlertTriangle,
  RotateCcw,
  Plus,
  Trash2,
  Sparkles
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';

interface FlowStep {
  text: string;
  buttons: Array<{ id: string; text: string }>;
}

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

function normalizeFlowSteps(steps: any): FlowSteps {
  const normalized: FlowSteps = {};
  if (!steps) return normalized;
  
  // Trata chaves legadas do subscription_flow
  if (steps.confirm_plan && !steps.select_cycle) {
    steps.select_cycle = steps.confirm_plan;
  }
  
  for (const key of Object.keys(steps)) {
    if (key === 'confirm_plan') continue;
    normalized[key] = {
      text: steps[key].text || '',
      buttons: Array.isArray(steps[key].buttons) ? steps[key].buttons : []
    };
  }
  
  // Garante que o subscription_flow sempre tenha as 3 etapas essenciais se estiver vazio
  if (steps.select_plan || steps.select_cycle || steps.payment_confirmed) {
    if (!normalized.select_plan) normalized.select_plan = { text: '', buttons: [] };
    if (!normalized.select_cycle) normalized.select_cycle = { text: '', buttons: [] };
    if (!normalized.payment_confirmed) normalized.payment_confirmed = { text: '', buttons: [] };
  } else if (steps.coupon_activated) {
    // É o coupon_flow
    if (!normalized.coupon_activated) normalized.coupon_activated = { text: '', buttons: [] };
  }
  
  return normalized;
}

/** Texto padrão da etapa Cupom Ativado. */
const COUPON_ACTIVATED_MESSAGE_TEXT =
  '🎉 *Cupom ativado com sucesso!*\n\n' +
  'O código *{coupon_code}* foi aplicado à sua conta. Você terá um desconto de {discount_percentage}% em nossos planos!\n\n' +
  'Quer conhecer os planos e garantir esse desconto agora mesmo?';

function formatFlowPreviewText(text: string): string {
  return (text || '').replace(/\\n/g, '\n');
}

/** Texto padrão da etapa 1 — alinhado à landing (planos e benefícios). */
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

/** Texto padrão da etapa 3 — Confirmação de pagamento e boas-vindas. */
const PAYMENT_CONFIRMED_MESSAGE_TEXT =
  '🎉 *Seja muito bem-vindo ao Plano {tier_label} da MarIA!* 🎉\n\n' +
  'Sua assinatura foi confirmada com sucesso no Asaas! 🌟\n\n' +
  'Agora você tem acesso a mais recursos e limites aumentados. Que a sua jornada espiritual seja ricamente abençoada. Estou muito feliz em te acompanhar de perto! 🙏✨\n\n' +
  '💡 *Dica:* Se precisar ver seu limite de mensagens ou tirar dúvidas sobre sua conta, basta enviar a palavra *Painel* ou *Ajuda* a qualquer momento.\n\n' +
  'Que o amor maternal de Maria Santíssima te guarde hoje e sempre! 🕊️💙';

export default function FlowsPage() {
  const [flows, setFlows] = React.useState<AutomaticFlow[]>([]);
  const [selectedFlow, setSelectedFlow] = React.useState<AutomaticFlow | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState<FlowStepKey>('select_plan');

  React.useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/ai/prompts/automatic-flows');
      if (data && data.length > 0) {
        // Verifica se coupon_flow existe, senão injeta localmente para edição (será salvo depois)
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
        
        setFlows(data);
        const subFlow = data.find((f: AutomaticFlow) => f.key === 'subscription_flow') || data[0];
        const copy = JSON.parse(JSON.stringify(subFlow)) as AutomaticFlow;
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
            id: 'temp',
            key: 'subscription_flow',
            name: 'Assinatura (Fluxo de Vendas)',
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
        setActiveStep('select_plan');
      }
    } catch (error) {
      toast.error('Erro ao carregar fluxos automáticos');
    } finally {
      setLoading(false);
    }
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

      // Encontra o próximo ID numérico livre
      const nextId = String(step.buttons.length > 0 ? Math.max(...step.buttons.map(b => parseInt(b.id) || 0)) + 1 : 1);
      const newButtons = [...step.buttons, { id: nextId, text: '' }];

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

  const loadOptimizedPreset = () => {
    if (!selectedFlow) return;

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
    toast.success('Preset do fluxo em 3 etapas carregado! Clique em "Salvar Alterações" para aplicar.');
  };

  const saveFlow = async () => {
    if (!selectedFlow) return;

    // Validações básicas do fluxo
    const steps = normalizeFlowSteps(selectedFlow.steps);
    
    if (selectedFlow.key === 'subscription_flow') {
      const selectPlanText = steps.select_plan?.text || '';
      const selectCycleText = steps.select_cycle?.text || '';
      const paymentConfirmedText = steps.payment_confirmed?.text || '';

      if (!selectPlanText.trim()) {
        toast.error('O texto da etapa de plano não pode estar vazio');
        return;
      }

      if (!selectCycleText.trim()) {
        toast.error('O texto da etapa de pagamento não pode estar vazio');
        return;
      }

      if (!paymentConfirmedText.trim()) {
        toast.error('O texto da etapa de confirmação de pagamento não pode estar vazio');
        return;
      }

      if ((steps.select_plan?.buttons?.length || 0) > 3 || (steps.select_cycle?.buttons?.length || 0) > 3 || (steps.payment_confirmed?.buttons?.length || 0) > 3) {
        toast.warning('Cada etapa deve ter no máximo 3 botões para o WhatsApp enviar botões nativos.');
      }

      if (!selectCycleText.includes('{tier_label}') || !selectCycleText.includes('{plan_options}')) {
        toast.warning('Atenção: Use {tier_label} e {plan_options} na etapa de pagamento para exibir o plano e os valores.');
      }
    } else {
      // General validation for other flows
      for (const step of Object.values(steps)) {
        if (!step.text?.trim()) {
          toast.error(`O texto da etapa não pode estar vazio.`);
          return;
        }
        if ((step.buttons?.length || 0) > 3) {
          toast.warning('Cada etapa deve ter no máximo 3 botões para o WhatsApp enviar botões nativos.');
        }
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
      toast.success('Fluxo de assinatura atualizado com sucesso!');

      // Atualiza o registro original na lista local
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

  return (
    <MainLayout
      title="Fluxos Automáticos"
      subtitle="Configure o comportamento, as mensagens de opções e os botões interativos enviados pelo WhatsApp."
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

        {/* Sidebar de Passos do Fluxo - Esquerda */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2.5rem] bg-white/80 backdrop-blur-md border border-white/40">
            <CardHeader className="pb-4 px-8 pt-8">
              <CardTitle className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <GitFork className="h-5 w-5 text-blue-600" />
                Fluxos Disponíveis
              </CardTitle>
              <CardDescription className="text-slate-400 font-bold">
                Selecione o fluxo para editar
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="space-y-2">
                {flows.map(f => (
                  <button
                    key={f.id}
                    onClick={() => {
                      const copy = JSON.parse(JSON.stringify(f)) as AutomaticFlow;
                      copy.steps = normalizeFlowSteps(copy.steps);
                      setSelectedFlow(copy);
                      setActiveStep(Object.keys(copy.steps)[0]);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${selectedFlow?.key === f.key
                        ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm shadow-blue-50/50'
                        : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50 hover:scale-[1.02]'
                      }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-sm text-slate-700 group-hover:text-blue-700 transition-colors">{f.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono tracking-tighter">chave: {f.key}</span>
                    </div>
                    <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50 text-[10px] px-2.5 py-0.5 capitalize">Ativo</Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Card de Visualização do Fluxograma */}
          {selectedFlow && (
            <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2.5rem] bg-white/80 backdrop-blur-md border border-white/40 overflow-hidden">
              <CardHeader className="pb-4 px-8 pt-8 border-b border-slate-100/40 bg-gradient-to-br from-slate-50/50 to-white/30">
                <CardTitle className="text-sm font-extrabold text-slate-500 uppercase tracking-wider">
                  Etapas do Fluxo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-col gap-4">
                  {Object.keys(selectedFlow.steps).map((stepKey, index) => (
                    <React.Fragment key={stepKey}>
                      <button
                        onClick={() => setActiveStep(stepKey)}
                        className={`p-4 rounded-2xl border text-left flex items-start gap-4 transition-all relative ${activeStep === stepKey
                            ? 'bg-blue-50 border-blue-200 shadow-sm shadow-blue-50'
                            : 'bg-slate-50/30 border-slate-100 hover:bg-slate-50/50'
                          }`}
                      >
                        <div className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center ${activeStep === stepKey ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 text-slate-600'
                          }`}>
                          {index + 1}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">
                             {stepKey === 'select_plan' ? 'Escolha do Plano' :
                             stepKey === 'select_cycle' ? 'Forma de Pagamento' :
                             stepKey === 'payment_confirmed' ? 'Boas-Vindas (Plano Ativo)' :
                             stepKey === 'coupon_activated' ? 'Cupom Ativado' :
                             stepKey}
                          </span>
                          <span className="text-xs text-slate-400">
                            {stepKey === 'select_plan' ? 'Básico / Premium / Cancelar' :
                             stepKey === 'select_cycle' ? 'Mensal / Anual / Voltar' :
                             stepKey === 'payment_confirmed' ? 'Mensagem final de sucesso' :
                             stepKey === 'coupon_activated' ? 'Mensagem de cupom' :
                             stepKey}
                          </span>
                        </div>
                        {activeStep === stepKey && (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                        )}
                      </button>

                      {index < Object.keys(selectedFlow.steps).length - 1 && (
                        <div className="flex justify-center my-0">
                          <ArrowRight className="h-5 w-5 text-slate-300 rotate-90" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Workspace de Edição do Passo - Direita */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {selectedFlow ? (
            <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden bg-white border border-white/40">

              {/* Header do Workspace */}
              <div className="bg-gradient-to-br from-slate-50/50 to-white/30 border-b border-slate-100 pb-8 px-10 pt-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-blue-50 rounded-[1.5rem] border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                      {activeStep === 'select_plan' ? 'Etapa 1: Escolha do Plano' :
                       activeStep === 'select_cycle' ? 'Etapa 2: Forma de Pagamento' :
                       activeStep === 'payment_confirmed' ? 'Mensagem de Boas-Vindas' :
                       activeStep === 'coupon_activated' ? 'Mensagem de Ativação de Cupom' :
                       activeStep.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-slate-400 font-bold text-sm mt-1">
                      {activeStep === 'select_plan' ? 'Botões Básico, Premium e Cancelar (máx. 3 — nativos no WhatsApp).' :
                       activeStep === 'select_cycle' ? 'As variáveis {tier_label} e {plan_options} serão trocadas no código.' :
                       activeStep === 'payment_confirmed' ? 'Enviada quando a assinatura é ativada. Use {tier_label}.' :
                       activeStep === 'coupon_activated' ? 'Resposta enviada ao aplicar um cupom válido.' :
                       'Configure os botões interativos e as opções de texto da etapa selecionada.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={resetChanges}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 rounded-2xl font-bold h-12 px-5 transition-all flex items-center gap-2 active:scale-95"
                    title="Descartar mudanças não salvas"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Descartar
                  </Button>
                  <Button
                    onClick={saveFlow}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold h-12 px-6 shadow-lg shadow-blue-100 transition-all flex items-center gap-2 active:scale-95 disabled:scale-100"
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

              {/* Corpo de Configurações da Etapa */}
              <CardContent className="p-10 space-y-8">

                {/* Editor do Texto Principal da Mensagem */}
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-black text-slate-700 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      Mensagem Enviada pelo WhatsApp
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

                  {/* Toolbar de formatação rápida */}
                  <div className="flex flex-wrap items-center gap-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">Inserir:</span>
                    {[
                      { label: '*Negrito*', insert: '*texto*', title: 'Negrito WhatsApp' },
                      { label: '_Itálico_', insert: '_texto*', title: 'Itálico WhatsApp' },
                      { label: '↵ Nova linha', insert: '\n', title: 'Quebra de linha' },
                      { label: '↵↵ Parágrafo', insert: '\n\n', title: 'Parágrafo (linha em branco)' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        title={item.title}
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
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Editor + Preview lado a lado */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Editor */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">✏️ Editor</span>
                      <div className="relative">
                        <textarea
                          id={`msg-editor-${activeStep}`}
                          value={selectedFlow.steps[activeStep].text}
                          onChange={(e) => handleTextChange(activeStep, e.target.value)}
                          placeholder={"Olá! Aqui está a mensagem que será enviada...\n\nUse *negrito* e _itálico_ para formatar."}
                          rows={14}
                          style={{ fontFamily: "'Courier New', Courier, monospace", lineHeight: '1.65', letterSpacing: '0.01em' }}
                          className="w-full rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-slate-700 p-4 transition-all text-[13px] resize-y bg-slate-50/80 shadow-inner"
                        />
                        <div className="absolute bottom-3 right-3 text-[9px] font-bold text-slate-300 pointer-events-none select-none">
                          {selectedFlow.steps[activeStep].text.split('\n').length} linhas
                        </div>
                      </div>
                    </div>

                    {/* Preview WhatsApp */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">👁️ Preview WhatsApp</span>
                      <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-inner bg-[#e5ddd5] h-full min-h-[280px] p-4 flex flex-col justify-end gap-2">
                        <div className="self-start max-w-[92%] bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm text-[13px] text-slate-800 leading-relaxed break-words" style={{ fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
                          {selectedFlow.steps[activeStep].text
                            ? formatFlowPreviewText(selectedFlow.steps[activeStep].text)
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
                            : <span className="text-slate-400 italic text-xs">Pré-visualização aparecerá aqui...</span>
                          }
                          <div className="text-right mt-1.5">
                            <span className="text-[10px] text-slate-400">00:00 ✓✓</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {activeStep === 'select_plan' && (
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-amber-800 text-xs font-medium leading-relaxed flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-extrabold mb-1">Placeholders nesta etapa:</p>
                        <ul className="list-disc list-inside mt-1 pl-2 space-y-1 font-bold font-mono text-[10px] text-slate-600">
                          <li>{`{basic_price_month}`} — Preço mensal do plano Básico</li>
                          <li>{`{basic_price_year_monthly}`} — Equivalente mensal do plano Básico anual</li>
                          <li>{`{premium_price_month}`} — Preço mensal do plano Premium</li>
                          <li>{`{premium_price_year_monthly}`} — Equivalente mensal do plano Premium anual</li>
                          <li>{`{coupon_info}`} — Mensagem de desconto, se o cupom estiver ativo</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeStep === 'select_cycle' && (
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-amber-800 text-xs font-medium leading-relaxed flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-extrabold mb-1">Placeholders nesta etapa:</p>
                        <ul className="list-disc list-inside mt-1 pl-2 space-y-1 font-bold font-mono text-[10px] text-slate-600">
                          <li>{`{tier_label}`} — Básico ou Premium</li>
                          <li>{`{plan_options}`} — Valores mensal e anual do plano</li>
                          <li>{`{upgrade_warning}`} — Aviso de upgrade (só quando aplicável)</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeStep === 'payment_confirmed' && (
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-amber-800 text-xs font-medium leading-relaxed flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-extrabold mb-1">Placeholders nesta etapa:</p>
                        <ul className="list-disc list-inside mt-1 pl-2 space-y-1 font-bold font-mono text-[10px] text-slate-600">
                          <li>{`{tier_label}`} — Nome do plano em português (ex: Básico ou Premium)</li>
                          <li>{`{user_name}`} — Nome do usuário (se cadastrado no banco)</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Editor de Botões Interativos (WhatsApp) */}
                <div className="border-t border-slate-100 pt-8 space-y-6">

                  {/* Top Bar do Editor de Botões */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-black text-slate-700 flex items-center gap-2">
                        Botões Interativos e Opções Híbridas
                      </h4>
                      <p className="text-xs text-slate-400 font-bold mt-1">
                        Configure as opções de resposta rápida e os botões que serão enviados no WhatsApp.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={loadOptimizedPreset}
                        className="h-9 px-4 rounded-xl border-emerald-100 hover:border-emerald-200 text-emerald-700 hover:bg-emerald-50/50 bg-emerald-50/10 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Carregar preset (2 etapas + 3 botões)
                      </Button>

                      <Button
                        type="button"
                        onClick={() => handleAddButton(activeStep)}
                        className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Adicionar Opção
                      </Button>
                    </div>
                  </div>

                  {/* Informação sobre botões */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/80 text-xs font-semibold leading-relaxed flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-extrabold text-slate-700 mb-0.5">Botões Interativos WhatsApp:</p>
                        <p className="text-slate-500">
                          Máximo de 3 botões por etapa (limite do WhatsApp). O sistema sempre tenta enviar botões nativos; se falhar, usa fallback em texto.
                        </p>
                      </div>
                    </div>
                    <div>
                      {selectedFlow.steps[activeStep].buttons.length > 3 ? (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 font-extrabold uppercase text-[9px] px-2.5 py-1 flex-shrink-0">
                          ⚠️ Fallback Texto Ativo
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-extrabold uppercase text-[9px] px-2.5 py-1 flex-shrink-0">
                          ✅ Botões Nativos
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Grid de Inputs de Botões */}
                  {selectedFlow.steps[activeStep].buttons.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                      <p className="text-xs font-bold">Nenhum botão ou opção configurada para esta etapa.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Clique em "Adicionar Opção" para começar.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedFlow.steps[activeStep].buttons.map((btn, idx) => (
                        <div key={idx} className="p-4 bg-slate-50/30 hover:bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col gap-3 transition-all hover:border-slate-200 shadow-sm relative group">

                          {/* Top Bar da Opção */}
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
                              Opção {idx + 1}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDeleteButton(activeStep, idx)}
                                className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                title="Excluir opção"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Inputs de ID e Texto */}
                          <div className="grid grid-cols-12 gap-2 items-center">

                            {/* Coluna ID */}
                            <div className="col-span-3 flex flex-col gap-1">
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase pl-1">ID (Dígito)</span>
                              <Input
                                type="text"
                                value={btn.id}
                                onChange={(e) => handleButtonIdChange(activeStep, idx, e.target.value)}
                                placeholder="ID"
                                className="h-9 rounded-xl border-slate-200 focus:ring-blue-100 focus:border-blue-400 font-extrabold text-slate-700 text-xs px-2.5 text-center bg-white shadow-sm"
                              />
                            </div>

                            {/* Coluna Texto */}
                            <div className="col-span-9 flex flex-col gap-1">
                              <div className="flex justify-between items-center px-1">
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase">Texto do Botão / Opção</span>
                                <span className={`text-[8px] font-bold ${btn.text.length > 20 ? 'text-amber-600' : 'text-slate-400'}`}>
                                  {btn.text.length}/20 carac.
                                </span>
                              </div>
                              <Input
                                type="text"
                                value={btn.text}
                                onChange={(e) => handleButtonTextChange(activeStep, idx, e.target.value)}
                                placeholder="Ex: Básico R$14,99"
                                maxLength={30}
                                className={`h-9 rounded-xl focus:ring-blue-100 focus:border-blue-400 font-bold text-slate-700 text-xs px-3 bg-white shadow-sm ${btn.text.length > 20 ? 'border-amber-300 focus:border-amber-400' : 'border-slate-200'
                                  }`}
                              />
                            </div>
                          </div>

                          {/* Mensagem de alerta se passar dos 20 caracteres */}
                          {btn.text.length > 20 && (
                            <span className="text-[8px] text-amber-600 font-extrabold flex items-center gap-1 mt-0.5">
                              ⚠️ Acima de 20 caracteres. O texto será cortado no WhatsApp se enviado em modo botões nativo!
                            </span>
                          )}

                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="font-bold text-slate-500">Nenhum fluxo selecionado.</p>
            </div>
          )}
        </div>

      </div>
    </MainLayout>
  );
}

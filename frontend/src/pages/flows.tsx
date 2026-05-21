import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Save, 
  Loader2, 
  GitFork, 
  MessageSquare, 
  Sparkles, 
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';

interface FlowStep {
  text: string;
  buttons: Array<{ id: string; text: string }>;
}

interface AutomaticFlow {
  id: string;
  key: string;
  name: string;
  steps: {
    select_plan: FlowStep;
    confirm_plan: FlowStep;
    [key: string]: FlowStep;
  };
  created_at: string;
  updated_at: string;
}

export default function FlowsPage() {
  const [flows, setFlows] = React.useState<AutomaticFlow[]>([]);
  const [selectedFlow, setSelectedFlow] = React.useState<AutomaticFlow | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState<'select_plan' | 'confirm_plan'>('select_plan');

  React.useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/ai/prompts/automatic-flows');
      setFlows(data || []);
      if (data && data.length > 0) {
        // Seleciona o fluxo de assinatura por padrão
        const subFlow = data.find((f: AutomaticFlow) => f.key === 'subscription_flow') || data[0];
        setSelectedFlow(JSON.parse(JSON.stringify(subFlow))); // Deep copy para edição segura
      }
    } catch (error) {
      toast.error('Erro ao carregar fluxos automáticos');
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (stepKey: 'select_plan' | 'confirm_plan', value: string) => {
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

  const handleButtonTextChange = (stepKey: 'select_plan' | 'confirm_plan', buttonIndex: number, value: string) => {
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

  const saveFlow = async () => {
    if (!selectedFlow) return;

    // Validações básicas do fluxo
    const selectPlanText = selectedFlow.steps.select_plan.text;
    const confirmPlanText = selectedFlow.steps.confirm_plan.text;

    if (!selectPlanText.trim()) {
      toast.error('O texto de seleção de planos não pode estar vazio');
      return;
    }

    if (!confirmPlanText.trim()) {
      toast.error('O texto de confirmação não pode estar vazio');
      return;
    }

    // Alerta se placeholders críticos forem removidos de confirm_plan
    if (!confirmPlanText.includes('{plan_name}') || !confirmPlanText.includes('{upgrade_warning}')) {
      toast.warning('Atenção: Os placeholders {plan_name} ou {upgrade_warning} não foram encontrados no texto de confirmação. Eles são necessários para renderizar o plano dinamicamente.');
    }

    setSaving(true);
    try {
      await apiRequest(`/ai/prompts/automatic-flows/${selectedFlow.key}`, {
        method: 'PUT',
        body: JSON.stringify({
          steps: selectedFlow.steps,
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
      setSelectedFlow(JSON.parse(JSON.stringify(original)));
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
                    onClick={() => setSelectedFlow(JSON.parse(JSON.stringify(f)))}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                      selectedFlow?.key === f.key
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
                  <button
                    onClick={() => setActiveStep('select_plan')}
                    className={`p-4 rounded-2xl border text-left flex items-start gap-4 transition-all relative ${
                      activeStep === 'select_plan'
                        ? 'bg-blue-50 border-blue-200 shadow-sm shadow-blue-50'
                        : 'bg-slate-50/30 border-slate-100 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center ${
                      activeStep === 'select_plan' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 text-slate-600'
                    }`}>
                      1
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">Escolha do Plano</span>
                      <span className="text-xs text-slate-400">Mensal / Anual / Cancelar</span>
                    </div>
                    {activeStep === 'select_plan' && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                    )}
                  </button>

                  <div className="flex justify-center my-0">
                    <ArrowRight className="h-5 w-5 text-slate-300 rotate-90" />
                  </div>

                  <button
                    onClick={() => setActiveStep('confirm_plan')}
                    className={`p-4 rounded-2xl border text-left flex items-start gap-4 transition-all relative ${
                      activeStep === 'confirm_plan'
                        ? 'bg-blue-50 border-blue-200 shadow-sm shadow-blue-50'
                        : 'bg-slate-50/30 border-slate-100 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center ${
                      activeStep === 'confirm_plan' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 text-slate-600'
                    }`}>
                      2
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">Confirmação de Plano</span>
                      <span className="text-xs text-slate-400">Sim / Voltar / Cancelar</span>
                    </div>
                    {activeStep === 'confirm_plan' && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                    )}
                  </button>
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
                      {activeStep === 'select_plan' ? 'Etapa 1: Escolha do Plano' : 'Etapa 2: Confirmação de Plano'}
                    </h3>
                    <p className="text-slate-400 font-bold text-sm mt-1">
                      {activeStep === 'select_plan' 
                        ? 'Define o texto principal e os botões de seleção de planos da assinatura.' 
                        : 'Define o texto de confirmação com suporte a placeholders de upgrade.'}
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
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-black text-slate-700 flex items-center gap-2">
                      Texto Principal da Mensagem WhatsApp
                    </Label>
                    <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-500 font-medium px-2 py-0.5 text-[10px]">
                      Suporta formatação do WhatsApp (*negrito*, _itálico_)
                    </Badge>
                  </div>
                  
                  <Textarea
                    value={selectedFlow.steps[activeStep].text}
                    onChange={(e) => handleTextChange(activeStep, e.target.value)}
                    placeholder="Digite a mensagem que o fiel receberá..."
                    rows={12}
                    className="rounded-2xl border-slate-200 focus:ring-blue-100 focus:border-blue-400 font-medium text-slate-700 leading-relaxed p-5 transition-all text-sm resize-y"
                  />
                  
                  {activeStep === 'confirm_plan' && (
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-amber-800 text-xs font-medium leading-relaxed flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-extrabold mb-1">Dica de Placeholders Requeridos:</p>
                        <p className="text-slate-600">Este texto é renderizado de forma dinâmica. Lembre-se de incluir as seguintes tags que o sistema substituirá automaticamente:</p>
                        <ul className="list-disc list-inside mt-2 pl-2 space-y-1 font-bold font-mono text-[10px] text-slate-600">
                          <li>{`{plan_name}`} - Nome do plano selecionado (Básico/Premium + valor)</li>
                          <li>{`{upgrade_warning}`} - Alerta de cancelamento de assinatura antiga no caso de Upgrade</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Editor de Botões Interativos (WhatsApp) */}
                <div className="border-t border-slate-100 pt-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-700 flex items-center gap-2">
                        Botões Interativos e Opções Numeradas
                      </h4>
                      <p className="text-xs text-slate-400 font-bold mt-1">
                        Estes botões serão enviados como botões no WhatsApp (quando compatível) e listados em texto como opções numeradas para fallback automático.
                      </p>
                    </div>
                    <Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                      Uazapi Híbrido
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedFlow.steps[activeStep].buttons.map((btn, idx) => (
                      <div key={btn.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col gap-2 transition-all hover:border-slate-200">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase">
                            Botão {idx + 1} (Opção {btn.id})
                          </span>
                          <Badge variant="outline" className="text-[9px] font-mono font-bold uppercase border-slate-200 text-slate-400 bg-white">
                            id: {btn.id}
                          </Badge>
                        </div>
                        <Input
                          type="text"
                          value={btn.text}
                          onChange={(e) => handleButtonTextChange(activeStep, idx, e.target.value)}
                          placeholder={`Texto do botão ${idx + 1}`}
                          maxLength={20} // Limite recomendado pelo WhatsApp para botões
                          className="h-10 rounded-xl border-slate-200 focus:ring-blue-100 focus:border-blue-400 font-bold text-slate-700 text-xs px-3"
                        />
                        <span className="text-[9px] text-slate-400 font-semibold text-right block">
                          {btn.text.length}/20 caracteres (Limite WhatsApp)
                        </span>
                      </div>
                    ))}
                  </div>
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

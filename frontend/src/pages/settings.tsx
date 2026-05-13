import { useState, useEffect, useRef } from 'react'
import { Select } from '@base-ui/react/select';
import { MainLayout } from '../components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Cpu, DollarSign, ShieldCheck, Save, RefreshCw, AlertTriangle, Trash2, Power } from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog"

export default function SettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);
  const [aiModels, setAiModels] = useState<any[]>([]);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    fetchSettings();
    handleSyncExchange();
    fetchAiModels();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:3000/admin/settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const fetchAiModels = async () => {
    try {
      const response = await fetch('http://localhost:3000/admin/ai-models');
      const data = await response.json();
      setAiModels(data);
    } catch (error) {
      console.error('Erro ao buscar modelos:', error);
    }
  };

  const handleUpdate = async (key: string, value: string) => {
    try {
      const response = await fetch(`http://localhost:3000/admin/settings/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      });

      if (response.ok) {
        toast.success(`Configuração "${key}" atualizada!`);
        fetchSettings();
      } else {
        throw new Error();
      }
    } catch (error) {
      toast.error("Erro ao atualizar configuração");
    }
  };

  const handleSyncExchange = async () => {
    setSyncing(true);
    try {
      const response = await fetch('http://localhost:3000/admin/settings/sync-exchange', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        toast.success(`Câmbio atualizado: R$ ${data.rate}`);
        fetchSettings();
      } else {
        throw new Error();
      }
    } catch (error) {
      toast.error("Erro ao sincronizar câmbio");
    } finally {
      setSyncing(false);
    }
  };

  const handleClearCache = async () => {
    setExecuting('cache');
    try {
      const response = await fetch('http://localhost:3000/admin/settings/clear-cache', { method: 'POST' });
      if (response.ok) {
        toast.success("Cache semântico limpo com sucesso!");
      } else {
        throw new Error();
      }
    } catch (error) {
      toast.error("Erro ao limpar cache");
    } finally {
      setExecuting(null);
      setConfirmAction(null);
    }
  };

  const handleToggleMaintenance = async () => {
    setExecuting('maintenance');
    try {
      const response = await fetch('http://localhost:3000/admin/settings/toggle-maintenance', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        toast.success(`Modo de manutenção ${data.enabled ? 'ativado' : 'desativado'}!`);
        fetchSettings();
      } else {
        throw new Error();
      }
    } catch (error) {
      toast.error("Erro ao alterar modo de manutenção");
    } finally {
      setExecuting(null);
      setConfirmAction(null);
    }
  };

  const getSettingValue = (key: string) => {
    return settings.find(s => s.key === key)?.value || '';
  };

  const setSettingValue = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const ModelSelect = ({ label, value, onChange, description }: { label: string, value: string, onChange: (val: string) => void, description: string }) => {
    const selectedModel = aiModels.find(m => m.id === value);
    
    return (
      <div className="space-y-2">
        <Label className="font-bold text-slate-700 ml-1">{label}</Label>
        <Select.Root value={value} onValueChange={onChange}>
          <Select.Trigger className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 hover:bg-slate-50 transition-all h-11 shadow-sm">
            <Select.Value placeholder="Selecione um modelo...">
              {selectedModel ? (
                <div className="flex items-center gap-2">
                  <span className="text-slate-800">{selectedModel.name}</span>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                    ${(Number(selectedModel.pricing.prompt) * 1000000).toFixed(2)}/M
                  </span>
                </div>
              ) : null}
            </Select.Value>
            <Select.Icon className="text-slate-400">
              <Cpu size={14} />
            </Select.Icon>
          </Select.Trigger>

          <Select.Portal>
            <Select.Positioner sideOffset={8} className="z-50 w-[var(--select-trigger-width)]">
              <Select.Popup className="bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <Select.List className="p-1.5 max-h-[300px] overflow-y-auto">
                  {aiModels.map((model) => (
                    <Select.Item
                      key={model.id}
                      value={model.id}
                      className="group flex flex-col gap-0.5 px-3 py-2.5 rounded-xl cursor-pointer outline-none data-[highlighted]:bg-slate-50 data-[selected]:bg-blue-50/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <Select.ItemText className="text-sm font-bold text-slate-700 group-data-[highlighted]:text-primary group-data-[selected]:text-primary transition-colors">
                          {model.name}
                        </Select.ItemText>
                        <Select.ItemIndicator className="text-primary">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        </Select.ItemIndicator>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400">
                        <span className="flex items-center gap-1">
                          <span className="opacity-60">Input:</span> 
                          <span className="text-slate-500">${(Number(model.pricing.prompt) * 1000000).toFixed(2)}/M</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="opacity-60">Output:</span> 
                          <span className="text-slate-500">${(Number(model.pricing.completion) * 1000000).toFixed(2)}/M</span>
                        </span>
                        {model.context_length && (
                          <span className="flex items-center gap-1 ml-auto">
                            <span className="opacity-60">Ctx:</span>
                            <span className="text-slate-500">{(model.context_length / 1000).toFixed(0)}k</span>
                          </span>
                        )}
                      </div>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">{description}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <MainLayout title="Configurações" subtitle="Carregando...">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin text-primary" size={32} />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Configurações" subtitle="Gerenciamento global do sistema e parâmetros de IA.">
      <div className="space-y-8 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* IA Configuration */}
          <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-primary rounded-xl">
                  <Cpu size={20} />
                </div>
                <div>
                  <CardTitle className="font-bold text-slate-800">Motores de IA</CardTitle>
                  <CardDescription className="text-slate-500 font-medium">Defina os modelos principais do ecossistema</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-8">
              <ModelSelect 
                label="Modelo Principal (Conversação)"
                value={getSettingValue('main_model')}
                onChange={(val) => {
                  setSettingValue('main_model', val);
                  handleUpdate('main_model', val);
                }}
                description="Usado em todas as interações diretas com fiéis."
              />

              <ModelSelect 
                label="Modelo de Automação (Crons)"
                value={getSettingValue('cron_model')}
                onChange={(val) => {
                  setSettingValue('cron_model', val);
                  handleUpdate('cron_model', val);
                }}
                description="Usado para geração de liturgia, santos e processamentos pesados."
              />
            </CardContent>
          </Card>

          {/* Financial */}
          <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                  <DollarSign size={20} />
                </div>
                <div>
                  <CardTitle className="font-bold text-slate-800">Financeiro</CardTitle>
                  <CardDescription className="text-slate-500 font-medium">Conversão de moeda para relatórios</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-8">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700 ml-1">Taxa de Câmbio (USD 1.00 = BRL X.XX)</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={getSettingValue('brl_rate')} 
                    onChange={(e) => setSettingValue('brl_rate', e.target.value)}
                    className="rounded-xl border-slate-200 h-11"
                  />
                  <Button onClick={() => handleUpdate('brl_rate', getSettingValue('brl_rate'))} variant="secondary" className="rounded-xl font-bold bg-slate-100 h-11 px-5">
                    <Save size={18} />
                  </Button>
                </div>
                <Button 
                  onClick={handleSyncExchange} 
                  disabled={syncing}
                  variant="outline" 
                  className="w-full text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-4 gap-2 border-slate-100 hover:bg-slate-50 h-10 rounded-xl"
                >
                  <RefreshCw size={12} className={syncing ? 'animate-spin text-primary' : ''} />
                  Sincronizar Cotação (AwesomeAPI)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Danger Zone Redesign */}
        <Card className="rounded-3xl border border-red-200/50 shadow-lg shadow-red-50/50 bg-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
          <div className="bg-red-50/50 px-6 py-5 border-b border-red-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="font-bold text-red-900 text-base">Zona de Segurança e Perigo</h3>
                <p className="text-[10px] text-red-600/70 font-bold uppercase tracking-tight">Gerenciamento de infraestrutura crítica</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-red-100/50 border border-red-200/50 px-3 py-1 rounded-full">
              <AlertTriangle size={12} className="text-red-600" />
              <span className="text-[10px] font-black uppercase text-red-600 tracking-wider">Ações Irreversíveis</span>
            </div>
          </div>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between gap-6 transition-all hover:border-red-100 hover:shadow-md">
                <div>
                   <p className="font-bold text-slate-800 text-sm group-hover:text-red-700 transition-colors">Limpar Cache Semântico</p>
                   <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">Remove todas as interpretações teológicas em cache. Força a MarIA a processar novas consultas via Magisterium AI.</p>
                </div>
                <Button 
                  variant="outline" 
                  disabled={executing === 'cache'}
                  onClick={() => setConfirmAction({
                    title: "Limpar Cache Semântico?",
                    description: "Esta ação removerá todas as interpretações salvas. A MarIA terá que reprocessar todas as consultas teológicas futuras, o que pode gerar custos extras de API.",
                    variant: "destructive",
                    onConfirm: handleClearCache
                  })}
                  className="border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 rounded-xl font-bold gap-2 w-full h-11 transition-all"
                >
                  {executing === 'cache' ? <RefreshCw className="animate-spin" size={16} /> : <Trash2 size={16} />}
                  Executar Limpeza
                </Button>
              </div>

              <div className="group p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between gap-6 transition-all hover:border-red-100 hover:shadow-md">
                <div>
                   <p className="font-bold text-slate-800 text-sm group-hover:text-red-700 transition-colors">Modo de Manutenção</p>
                   <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">Interrompe imediatamente o processamento de mensagens no WhatsApp. Útil para atualizações críticas.</p>
                </div>
                {getSettingValue('maintenance_mode') === 'true' ? (
                  <Button 
                    variant="default" 
                    disabled={executing === 'maintenance'}
                    onClick={() => setConfirmAction({
                      title: "Ativar Sistema?",
                      description: "Deseja retomar o processamento de mensagens no WhatsApp imediatamente?",
                      variant: "default",
                      onConfirm: handleToggleMaintenance
                    })}
                    className="bg-green-600 hover:bg-green-700 rounded-xl font-bold gap-2 w-full h-11 shadow-lg shadow-green-200 transition-all active:scale-[0.98]"
                  >
                    {executing === 'maintenance' ? <RefreshCw className="animate-spin" size={16} /> : <Power size={16} />}
                    Retomar Sistema
                  </Button>
                ) : (
                  <Button 
                    variant="destructive" 
                    disabled={executing === 'maintenance'}
                    onClick={() => setConfirmAction({
                      title: "Pausar Sistema?",
                      description: "Deseja ativar o modo de manutenção? A MarIA deixará de responder às consultas no WhatsApp até que o sistema seja retomado.",
                      variant: "destructive",
                      onConfirm: handleToggleMaintenance
                    })}
                    className="bg-red-600 hover:bg-red-700 rounded-xl font-bold gap-2 w-full h-11 shadow-lg shadow-red-200 transition-all active:scale-[0.98]"
                  >
                    {executing === 'maintenance' ? <RefreshCw className="animate-spin" size={16} /> : <Power size={16} />}
                    Pausar Sistema
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
          <DialogContent className="rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">{confirmAction?.title}</DialogTitle>
              <DialogDescription className="text-slate-500 mt-2 leading-relaxed">
                {confirmAction?.description}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-3 mt-6">
              <Button variant="outline" className="rounded-xl font-bold h-11 px-6 border-slate-200" onClick={() => setConfirmAction(null)}>
                Cancelar
              </Button>
              <Button 
                variant={confirmAction?.variant} 
                className={`rounded-xl font-bold h-11 px-8 ${confirmAction?.variant === 'default' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                onClick={confirmAction?.onConfirm}
              >
                Sim, Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}

import { useState, useEffect, useRef } from 'react'
import { API_URL } from '../lib/api'

import { MainLayout } from '../components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Cpu, DollarSign, ShieldCheck, Save, RefreshCw, AlertTriangle, Trash2, Power, ChevronDown, Search, FileText, Eye } from 'lucide-react'
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

  const [activeLegalTab, setActiveLegalTab] = useState<'terms' | 'privacy'>('terms');
  const [termsText, setTermsText] = useState('');
  const [privacyText, setPrivacyText] = useState('');

  useEffect(() => {
    if (settings.length > 0) {
      setTermsText(getSettingValue('terms_of_use'));
      setPrivacyText(getSettingValue('privacy_policy'));
    }
  }, [settings]);

  useEffect(() => {
    fetchSettings();
    handleSyncExchange();
    fetchAiModels();
  }, []);

  const fetchSettings = async () => {
    try {
      const storedUser = localStorage.getItem('maria_user');
      const adminId = storedUser ? JSON.parse(storedUser)?.id : '';
      const response = await fetch(`${API_URL}/admin/settings`, {
        headers: { 'x-admin-id': adminId }
      });
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
      const response = await fetch(`${API_URL}/admin/ai-models`);
      const data = await response.json();
      // Ordenar por nome em ordem alfabética
      const sorted = Array.isArray(data) ? data.sort((a: any, b: any) => a.name.localeCompare(b.name)) : [];
      setAiModels(sorted);
    } catch (error) {
      console.error('Erro ao buscar modelos:', error);
    }
  };

  const handleUpdate = async (key: string, value: string) => {
    try {
      const storedUser = localStorage.getItem('maria_user');
      const adminId = storedUser ? JSON.parse(storedUser)?.id : '';
      const response = await fetch(`${API_URL}/admin/settings/${key}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-id': adminId
        },
        body: JSON.stringify({ value })
      });

      if (response.ok) {
        toast.success(`Configuração salva com sucesso!`);
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
      const storedUser = localStorage.getItem('maria_user');
      const adminId = storedUser ? JSON.parse(storedUser)?.id : '';
      const response = await fetch(`${API_URL}/admin/settings/sync-exchange`, { 
        method: 'POST',
        headers: { 'x-admin-id': adminId }
      });
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
      const storedUser = localStorage.getItem('maria_user');
      const adminId = storedUser ? JSON.parse(storedUser)?.id : '';
      const response = await fetch(`${API_URL}/admin/settings/clear-cache`, { 
        method: 'POST',
        headers: { 'x-admin-id': adminId }
      });
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
      const storedUser = localStorage.getItem('maria_user');
      const adminId = storedUser ? JSON.parse(storedUser)?.id : '';
      const response = await fetch(`${API_URL}/admin/settings/toggle-maintenance`, { 
        method: 'POST',
        headers: { 'x-admin-id': adminId }
      });
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
          <Card className="rounded-3xl border-none shadow-sm bg-white">
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
                  if (val) {
                    setSettingValue('main_model', val);
                    handleUpdate('main_model', val);
                  }
                }}
                description="Usado em todas as interações diretas com fiéis."
                aiModels={aiModels}
              />

              <ModelSelect 
                label="Modelo de Automação (Crons)"
                value={getSettingValue('cron_model')}
                onChange={(val) => {
                  if (val) {
                    setSettingValue('cron_model', val);
                    handleUpdate('cron_model', val);
                  }
                }}
                description="Usado para geração de liturgia, santos e processamentos pesados."
                aiModels={aiModels}
              />

              <ModelSelect 
                label="Modelo de Ponte (Roteamento)"
                value={getSettingValue('bridge_model')}
                onChange={(val) => {
                  if (val) {
                    setSettingValue('bridge_model', val);
                    handleUpdate('bridge_model', val);
                  }
                }}
                description="Usado para detecção de intenção e extração de datas."
                aiModels={aiModels}
              />
            </CardContent>
          </Card>

          {/* Financial */}
          <Card className="rounded-3xl border-none shadow-sm bg-white">
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

              <div className="space-y-2 mt-6 pt-6 border-t border-slate-100">
                <Label className="font-bold text-slate-700 ml-1">Ambiente Asaas (Pagamentos)</Label>
                <select
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={getSettingValue('asaas_environment') || 'sandbox'}
                  onChange={(e) => {
                    setSettingValue('asaas_environment', e.target.value);
                    handleUpdate('asaas_environment', e.target.value);
                  }}
                >
                  <option value="sandbox">Sandbox (Ambiente de Testes)</option>
                  <option value="production">Produção (Pagamentos Reais)</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Páginas Legais Section */}
        <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 pb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-[#0047AB] rounded-xl">
                  <FileText size={20} />
                </div>
                <div>
                  <CardTitle className="font-bold text-slate-800">Páginas Legais</CardTitle>
                  <CardDescription className="text-slate-500 font-medium">Edite os Termos de Uso e a Política de Privacidade com suporte a Markdown.</CardDescription>
                </div>
              </div>
              
              {/* Tab Selector Buttons */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center shadow-inner">
                <Button 
                  onClick={() => setActiveLegalTab('terms')}
                  variant="ghost"
                  className={`h-9 px-4 rounded-lg text-xs font-bold transition-all ${activeLegalTab === 'terms' ? 'bg-white text-[#0047AB] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Termos de Uso
                </Button>
                <Button 
                  onClick={() => setActiveLegalTab('privacy')}
                  variant="ghost"
                  className={`h-9 px-4 rounded-lg text-xs font-bold transition-all ${activeLegalTab === 'privacy' ? 'bg-white text-[#0047AB] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Política de Privacidade
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Editor */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-700 ml-1">
                    {activeLegalTab === 'terms' ? 'Editar Termos de Uso (Markdown)' : 'Editar Política de Privacidade (Markdown)'}
                  </Label>
                  <span className="text-[10px] bg-blue-50 text-[#0047AB] font-extrabold uppercase px-2 py-0.5 rounded">Basic MD</span>
                </div>
                
                <textarea
                  value={activeLegalTab === 'terms' ? termsText : privacyText}
                  onChange={(e) => {
                    if (activeLegalTab === 'terms') {
                      setTermsText(e.target.value);
                    } else {
                      setPrivacyText(e.target.value);
                    }
                  }}
                  placeholder={activeLegalTab === 'terms' ? 'Digite os Termos de Uso...' : 'Digite a Política de Privacidade...'}
                  className="w-full min-h-[400px] max-h-[600px] font-mono text-sm p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all resize-y outline-none"
                />
                
                <div className="text-[11px] text-slate-400 font-medium ml-1 leading-relaxed">
                  <strong>Formatação Suportada:</strong> Use <code># Título 1</code>, <code>## Título 2</code>, <code>### Título 3</code>, <code>**Negrito**</code> e <code>- Marcador</code> para formatar o texto.
                </div>
                
                <Button 
                  onClick={() => {
                    if (activeLegalTab === 'terms') {
                      handleUpdate('terms_of_use', termsText);
                    } else {
                      handleUpdate('privacy_policy', privacyText);
                    }
                  }}
                  className="h-12 bg-[#0047AB] hover:bg-[#003580] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:shadow-2xl transition-all duration-300 mt-2"
                >
                  <Save size={18} />
                  Salvar {activeLegalTab === 'terms' ? 'Termos de Uso' : 'Política de Privacidade'}
                </Button>
              </div>

              {/* Right Column: Premium Live Preview */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-700 ml-1 flex items-center gap-2">
                    <Eye size={16} className="text-[#0047AB]" />
                    Visualização em Tempo Real (Landing Page)
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live Preview</span>
                  </div>
                </div>

                {/* Simulated Glassmorphism landing page view */}
                <div className="w-full h-full min-h-[400px] max-h-[500px] overflow-y-auto p-8 bg-slate-950 text-slate-300 rounded-2xl border border-slate-800 shadow-inner font-sans scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950 relative flex flex-col justify-between selection:bg-[#D4AF37] selection:text-[#0047AB]">
                  
                  {/* Subtle simulated ambient glows */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#0047AB]/10 rounded-full filter blur-2xl pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full filter blur-2xl pointer-events-none"></div>
                  
                  <div className="relative z-10 flex-grow">
                    <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mb-4 border-b border-white/5 pb-2">
                      Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })} (Simulado)
                    </div>
                    
                    <div 
                      className="prose prose-invert max-w-none text-slate-300 font-sans"
                      dangerouslySetInnerHTML={{ 
                        __html: parseMarkdown(activeLegalTab === 'terms' ? termsText : privacyText) || "<p class='text-slate-500 italic font-light'>Digite algo no editor ao lado para ver a pré-visualização instantânea...</p>" 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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

// Componente ModelSelect reconstruído do zero para máxima estabilidade e controle de foco
const ModelSelect = ({ 
  label, 
  value, 
  onChange, 
  description, 
  aiModels 
}: { 
  label: string, 
  value: string, 
  onChange: (val: string | null) => void, 
  description: string,
  aiModels: any[]
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedModel = aiModels.find(m => m.id === value);

  const filteredModels = aiModels.filter(model => 
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focar o input ao abrir
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);
  
  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <div className="flex flex-col gap-1">
        <Label className="text-sm font-semibold text-slate-700 ml-1">{label}</Label>
        <p className="text-[11px] text-slate-400 font-medium leading-relaxed ml-1">
          {description}
        </p>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white hover:border-primary hover:ring-4 hover:ring-primary/5 transition-all text-sm font-semibold text-slate-700 shadow-sm group h-12 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary"
        >
          <div className="flex items-center gap-2.5">
            {selectedModel ? (
              <>
                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span className="truncate max-w-[200px] text-left">{selectedModel.name}</span>
              </>
            ) : (
              <span className="text-slate-400 font-medium">Selecione um modelo</span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl border border-slate-200/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
            <div className="p-3 border-b border-slate-100 bg-slate-50/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  ref={inputRef}
                  placeholder="Filtrar modelos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-9 text-xs rounded-lg border-slate-200 bg-white/50 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                />
              </div>
            </div>

            <div className="max-h-[280px] min-h-[100px] overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-slate-200">
              {filteredModels.length > 0 ? (
                filteredModels.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => {
                      onChange(model.id);
                      setIsOpen(false);
                    }}
                    className={`group flex flex-col gap-1 px-3.5 py-3 rounded-xl cursor-pointer transition-all mb-0.5 last:mb-0 ${
                      value === model.id ? 'bg-primary/5' : 'hover:bg-primary/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[13px] font-bold transition-colors truncate ${
                        value === model.id ? 'text-primary' : 'text-slate-700 group-hover:text-primary'
                      }`}>
                        {model.name}
                      </span>
                      {value === model.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                      <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        <span className="opacity-60 uppercase text-[8px]">In</span> 
                        <span className="text-slate-600">${(Number(model.pricing.prompt) * 1000000).toFixed(2)}/M</span>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        <span className="opacity-60 uppercase text-[8px]">Out</span> 
                        <span className="text-slate-600">${(Number(model.pricing.completion) * 1000000).toFixed(2)}/M</span>
                      </div>
                      {model.context_length && (
                        <div className="flex items-center gap-1 ml-auto text-slate-400">
                          <span className="opacity-60">Ctx:</span>
                          <span>{(model.context_length / 1000).toFixed(0)}k</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center gap-3 opacity-40">
                  <Search className="w-8 h-8" />
                  <span className="text-xs font-bold uppercase tracking-widest">Nenhum modelo</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Markdown basic parser function to mimic Next.js terms/privacy render
function parseMarkdown(md: string) {
  if (!md) return "";
  
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Headers
  html = html.replace(/^### (.*?)$/gm, "<h3 class='text-xl font-bold mt-8 mb-4 text-white'>$1</h3>");
  html = html.replace(/^## (.*?)$/gm, "<h2 class='text-2xl font-bold mt-10 mb-4 text-white border-b border-white/10 pb-2'>$1</h2>");
  html = html.replace(/^# (.*?)$/gm, "<h1 class='text-4xl font-extrabold mt-12 mb-6 text-[#D4AF37]'>$1</h1>");

  // Bullet Lists
  const lines = html.split("\n");
  let inList = false;
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const content = trimmed.substring(2);
      let res = "";
      if (!inList) {
        inList = true;
        res += "<ul class='list-disc list-inside my-6 pl-4 space-y-3 text-slate-300'>";
      }
      res += `<li>${content}</li>`;
      return res;
    } else {
      let res = "";
      if (inList) {
        inList = false;
        res += "</ul>";
      }
      return res + line;
    }
  });
  if (inList) {
    processedLines.push("</ul>");
  }
  html = processedLines.join("\n");

  // Paragraphs (double newlines)
  const paragraphs = html.split(/\n\s*\n/);
  html = paragraphs
    .map(p => {
      const trimmed = p.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<h") || trimmed.startsWith("<ul") || trimmed.startsWith("<li")) {
        return trimmed;
      }
      return `<p class="my-5 text-slate-300 leading-relaxed font-light text-base md:text-lg">${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .filter(Boolean)
    .join("\n");

  return html;
}

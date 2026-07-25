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
  Bot, 
  MessageSquare, 
  Sparkles, 
  ShieldAlert, 
  Compass,
  Zap,
  Brain,
  PenTool,
  Search,
  ChevronRight
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AiPrompt {
  id: string;
  key: string;
  content: string;
  description: string;
  is_active: boolean;
  updated_at: string;
}

export default function AiSettingsPage() {
  const [prompts, setPrompts] = React.useState<AiPrompt[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [generating, setGenerating] = React.useState<string | null>(null);
  const [activeCategory, setActiveCategory] = React.useState('persona');
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/ai/prompts');
      setPrompts(data);
    } catch (error) {
      toast.error('Erro ao carregar configurações da IA');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (key: string, newContent: string) => {
    setPrompts(current => 
      current.map(p => p.key === key ? { ...p, content: newContent } : p)
    );
  };

  const savePrompt = async (prompt: AiPrompt) => {
    setSaving(prompt.key);
    try {
      await apiRequest(`/ai/prompts/${prompt.key}`, {
        method: 'PUT',
        body: JSON.stringify({ content: prompt.content })
      });
      toast.success('Regra atualizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar regra');
    } finally {
      setSaving(null);
    }
  };

  const generateAiPrompt = async (prompt: AiPrompt) => {
    setGenerating(prompt.key);
    try {
      const data = await apiRequest(`/ai/prompts/generate`, {
        method: 'POST',
        body: JSON.stringify({ 
          key: prompt.key, 
          description: prompt.description,
          currentContent: prompt.content
        })
      });
      handleContentChange(prompt.key, data.content);
      toast.success('Conteúdo gerado! Clique em salvar para aplicar.');
    } catch (error) {
      toast.error('Erro ao gerar com IA');
    } finally {
      setGenerating(null);
    }
  };

  const getIconForKey = (key: string) => {
    if (key.includes('core')) return <Sparkles className="text-amber-500 h-5 w-5" />;
    if (key.includes('router')) return <Compass className="text-blue-600 h-5 w-5" />;
    if (key.includes('triage')) return <MessageSquare className="text-indigo-500 h-5 w-5" />;
    if (key.includes('rule')) return <ShieldAlert className="text-rose-500 h-5 w-5" />;
    if (key.includes('intent')) return <Zap className="text-amber-600 h-5 w-5" />;
    if (key.includes('generator')) return <PenTool className="text-emerald-500 h-5 w-5" />;
    if (key.includes('extractor') || key.includes('memory')) return <Brain className="text-purple-500 h-5 w-5" />;
    return <Bot className="text-slate-500 h-5 w-5" />;
  };

  const formatKeyName = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const categories = {
    persona: {
      label: 'Identidade',
      icon: <Bot className="w-5 h-5" />,
      description: 'Define quem é a MarIA e como ela se comporta globalmente.',
      keys: ['core_persona', 'intent_router']
    },
    intentions: {
      label: 'Especialidades',
      icon: <Zap className="w-5 h-5" />,
      description: 'Como a IA responde a temas específicos (Bíblia, Oração, etc).',
      keys: ['intent_theology', 'intent_prayer', 'intent_bible', 'intent_liturgy', 'intent_saint', 'intent_rosary', 'intent_advice', 'intent_casual', 'intent_info']
    },
    rules: {
      label: 'Segurança',
      icon: <ShieldAlert className="w-5 h-5" />,
      description: 'Regras críticas para proteção de dados e comportamento ético.',
      keys: ['rule_crisis', 'rule_prohibited', 'rule_etiquette', 'rule_data_security', 'intent_sensitive_data']
    },
    extractors: {
      label: 'Inteligência',
      icon: <Brain className="w-5 h-5" />,
      description: 'Prompts de processamento de dados e memória.',
      keys: ['memory_summarization', 'interest_extractor', 'extractor_name', 'extractor_date']
    },
    system: {
      label: 'Mensagens',
      icon: <MessageSquare className="w-5 h-5" />,
      description: 'Respostas automáticas para situações específicas do sistema.',
      keys: ['audio_refusal', 'free_tier_block', 'subscription_expiration_warning', 'usage_limit_reached', 'maintenance_message']
    }
  };

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.key.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (searchTerm) return matchesSearch;
    const category = categories[activeCategory as keyof typeof categories];
    return category?.keys.includes(p.key);
  });

  const renderPromptCard = (prompt: AiPrompt) => (
    <Card key={prompt.id} className="border-none shadow-2xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden bg-white/70 backdrop-blur-md transition-all hover:shadow-primary/10 border border-white/40 group">
      <CardHeader className="bg-gradient-to-br from-slate-50/50 to-white/30 border-b border-slate-100/40 pb-8 px-10 pt-10">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="p-4 bg-white rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              {getIconForKey(prompt.key)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">
                  {formatKeyName(prompt.key)}
                </CardTitle>
                {prompt.key === 'core_persona' && (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Base Neural</Badge>
                )}
                {prompt.key.startsWith('rule') && (
                  <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Protocolo Crítico</Badge>
                )}
              </div>
              <CardDescription className="text-slate-400 font-bold mt-2 flex items-center gap-2">
                <code className="bg-slate-100 px-2 py-1 rounded-lg text-slate-500 text-[11px] font-mono tracking-tighter">IDENTIFICADOR: {prompt.key}</code>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => generateAiPrompt(prompt)}
              disabled={generating === prompt.key}
              variant="outline"
              className="bg-white/80 hover:bg-white text-indigo-600 border-indigo-100/50 rounded-2xl shadow-sm font-bold px-6 h-14 transition-all active:scale-95"
            >
              {generating === prompt.key ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando</>
              ) : (
                <><Sparkles className="mr-2 h-5 w-5" /> Refinar com IA</>
              )}
            </Button>
            <Button 
              onClick={() => savePrompt(prompt)}
              disabled={saving === prompt.key}
              className="bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl shadow-primary/20 font-black px-10 h-14 transition-all active:scale-95"
            >
              {saving === prompt.key ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sincronizando</>
              ) : (
                <><Save className="mr-2 h-5 w-5" /> Aplicar Regras</>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] ml-1 block">Onde funciona?</Label>
            <div className="text-sm text-slate-600 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 leading-relaxed font-medium">
              {prompt.key.startsWith('intent') ? 'Ativado dinamicamente pelo Roteador de Intenções quando o usuário demonstra este interesse.' : 
               prompt.key.startsWith('triage') ? 'Ativado durante o fluxo inicial de onboarding para novos usuários.' :
               prompt.key === 'core_persona' ? 'Injetado como base em TODAS as interações da IA.' :
               'Ativado pelo sistema em situações específicas de processamento.'}
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] ml-1 block">Impacto no Comportamento</Label>
            <div className="text-sm text-indigo-600/80 bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/50 leading-relaxed font-bold italic">
              {prompt.description || 'Define a lógica de resposta e o tom de voz para este contexto específico.'}
            </div>
          </div>
        </div>

        <div className="relative group">
          <Label className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] ml-1 mb-3 block flex justify-between items-center">
            <span>Conteúdo das Instruções Neural</span>
            <span className="font-bold opacity-40">
              Atualizado em {new Date(prompt.updated_at).toLocaleDateString('pt-BR')}
            </span>
          </Label>
          <div className="relative">
            <Textarea 
              value={prompt.content}
              onChange={(e) => handleContentChange(prompt.key, e.target.value)}
              className="min-h-[250px] resize-y rounded-[2rem] bg-white border-slate-200 focus:border-primary/50 focus:ring-[12px] focus:ring-primary/5 text-slate-700 leading-relaxed p-8 font-medium shadow-inner transition-all text-base"
              placeholder="Descreva as instruções que a IA deve seguir..."
            />
            <div className="absolute right-4 bottom-4 opacity-0 group-focus-within:opacity-100 transition-opacity">
              <Badge variant="outline" className="bg-white/80 backdrop-blur-sm text-[10px] font-bold text-slate-400 border-slate-100">Pressione Esc para sair do campo</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MainLayout 
      title="Engenharia de Prompt" 
      subtitle="Refine o coração da MarIA com instruções neurais de alta precisão."
    >
      <div className="max-w-[1600px] mx-auto pb-32 px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-40 text-slate-400">
            <div className="relative mb-10">
              <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse"></div>
              <div className="relative bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
              </div>
            </div>
            <p className="font-black text-slate-400 uppercase tracking-[0.4em] text-xs">Sincronizando Cognição Neural</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
            {/* Sidebar de Navegação */}
            <aside className="xl:col-span-3 space-y-8 sticky top-28">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-indigo-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-3xl" />
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Buscar por tag ou contexto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-14 h-16 rounded-[1.5rem] bg-white border-slate-100 shadow-xl shadow-slate-200/50 focus:ring-0 focus:border-primary/30 transition-all font-bold text-slate-700"
                  />
                </div>
              </div>

              <nav className="bg-white/60 backdrop-blur-2xl p-4 rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-white space-y-2">
                <div className="px-4 py-2 mb-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Arquitetura</p>
                </div>
                {Object.entries(categories).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveCategory(key);
                      setSearchTerm('');
                    }}
                    className={cn(
                      "w-full flex flex-col p-5 rounded-[1.8rem] transition-all duration-500 group relative overflow-hidden",
                      activeCategory === key && !searchTerm
                        ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/20"
                        : "text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-xl hover:shadow-slate-100"
                    )}
                  >
                    <div className="flex items-center justify-between w-full z-10">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2.5 rounded-2xl transition-all duration-500",
                          activeCategory === key && !searchTerm ? "bg-primary text-white" : "bg-slate-100 group-hover:bg-slate-900 group-hover:text-white"
                        )}>
                          {cat.icon}
                        </div>
                        <span className="font-black text-xs uppercase tracking-[0.15em]">{cat.label}</span>
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-all duration-500",
                        activeCategory === key && !searchTerm ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                      )} />
                    </div>
                    {activeCategory === key && !searchTerm && (
                      <p className="text-[10px] text-slate-400 mt-3 font-medium leading-tight text-left pl-1">
                        {cat.description}
                      </p>
                    )}
                  </button>
                ))}
              </nav>

              <div className="p-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
                  <Sparkles className="w-20 h-20 text-white" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3">Conhecimento MarIA</p>
                <p className="text-sm text-white font-bold leading-relaxed relative z-10">
                  Os prompts definem a alma da IA. Alterações impactam instantaneamente a experiência de todos os fiéis.
                </p>
              </div>
            </aside>

            {/* Conteúdo Principal */}
            <main className="xl:col-span-9 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-1 w-8 bg-primary rounded-full" />
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                      {searchTerm ? 'Neural Search' : 'Ativo'}
                    </Badge>
                  </div>
                  <h3 className="text-5xl font-black text-slate-900 tracking-tighter">
                    {searchTerm ? `Resultados: ${searchTerm}` : categories[activeCategory as keyof typeof categories].label}
                  </h3>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest text-center">Dataset</p>
                  <p className="text-slate-800 font-black text-xl text-center">
                    {filteredPrompts.length} <span className="text-xs text-slate-400 uppercase">Regras</span>
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-12 pb-40">
                {filteredPrompts.length > 0 ? (
                  filteredPrompts.map(renderPromptCard)
                ) : (
                  <div className="flex flex-col items-center justify-center p-32 bg-white/40 backdrop-blur-sm rounded-[4rem] border-2 border-dashed border-slate-200/60">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl mb-8">
                      <Search className="h-12 w-12 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm">Nenhum rastro encontrado</p>
                    <Button 
                      variant="link" 
                      onClick={() => setSearchTerm('')}
                      className="text-primary font-black mt-4 uppercase tracking-widest text-xs"
                    >
                      Resetar Filtros Neural
                    </Button>
                  </div>
                )}
              </div>
            </main>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

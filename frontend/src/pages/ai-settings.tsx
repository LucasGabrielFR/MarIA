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
  ScrollText,
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
      label: 'Personalidade',
      icon: <Bot className="w-5 h-5" />,
      keys: ['core_persona', 'intent_router']
    },
    intentions: {
      label: 'Intenções',
      icon: <Zap className="w-5 h-5" />,
      keys: ['intent_theology', 'intent_prayer', 'intent_bible', 'intent_liturgy', 'intent_saint', 'intent_rosary', 'intent_advice', 'intent_casual', 'intent_sensitive_data', 'intent_human_clarification']
    },
    rules: {
      label: 'Regras Estritas',
      icon: <ShieldAlert className="w-5 h-5" />,
      keys: ['rule_crisis', 'rule_prohibited', 'rule_etiquette', 'rule_data_security']
    },
    onboarding: {
      label: 'Onboarding',
      icon: <ScrollText className="w-5 h-5" />,
      keys: ['triage_intro', 'detailed_presentation']
    },
    extractors: {
      label: 'Extratores e Memória',
      icon: <Brain className="w-5 h-5" />,
      keys: ['memory_summarization', 'extractor_name', 'extractor_date', 'extractor_intentions']
    },
    generators: {
      label: 'Geradores de Conteúdo',
      icon: <PenTool className="w-5 h-5" />,
      keys: ['generator_system_prompt', 'generator_prayer_guide', 'generator_liturgy', 'generator_saint', 'generator_rosary']
    },
    system: {
      label: 'Mensagens do Sistema',
      icon: <MessageSquare className="w-5 h-5" />,
      keys: ['audio_refusal', 'free_tier_block', 'subscription_expiration_warning', 'usage_limit_reached', 'maintenance_message']
    }
  };

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.key.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (searchTerm) return matchesSearch;
    return categories[activeCategory as keyof typeof categories].keys.includes(p.key);
  });

  const renderPromptCard = (prompt: AiPrompt) => (
    <Card key={prompt.id} className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-sm transition-all hover:shadow-2xl hover:shadow-slate-200/70 border border-white/20">
      <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 border-b border-slate-100/50 pb-6 px-8 pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100/50 flex items-center justify-center">
              {getIconForKey(prompt.key)}
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                {formatKeyName(prompt.key)}
                {prompt.key === 'core_persona' && (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">Essencial</Badge>
                )}
                {prompt.key.startsWith('rule') && (
                  <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">Crítico</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-slate-500 font-bold mt-1 flex items-center gap-2">
                <code className="bg-slate-100/80 px-2 py-0.5 rounded-lg text-slate-600 text-xs font-mono">{prompt.key}</code>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => generateAiPrompt(prompt)}
              disabled={generating === prompt.key}
              variant="outline"
              className="bg-white hover:bg-slate-50 text-indigo-600 border-indigo-100 rounded-2xl shadow-sm font-bold px-6 h-12 transition-all active:scale-95"
            >
              {generating === prompt.key ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando</>
              ) : (
                <><Sparkles className="mr-2 h-5 w-5" /> Gerar com IA</>
              )}
            </Button>
            <Button 
              onClick={() => savePrompt(prompt)}
              disabled={saving === prompt.key}
              className="bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl shadow-blue-100 font-black px-8 h-12 transition-all active:scale-95"
            >
              {saving === prompt.key ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Salvando</>
              ) : (
                <><Save className="mr-2 h-5 w-5" /> Salvar</>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="group">
          <Label className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] ml-1 mb-3 block">Objetivo e Contexto</Label>
          <div className="text-sm text-slate-600 bg-slate-50/50 p-5 rounded-3xl border border-slate-100/50 leading-relaxed font-medium">
            {prompt.description}
          </div>
        </div>
        <div>
          <Label className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] ml-1 mb-3 block flex justify-between items-center">
            <span>Conteúdo das Instruções</span>
            <span className="font-bold opacity-60">
              Modificado em {new Date(prompt.updated_at).toLocaleDateString('pt-BR')}
            </span>
          </Label>
          <Textarea 
            value={prompt.content}
            onChange={(e) => handleContentChange(prompt.key, e.target.value)}
            className="min-h-[200px] resize-y rounded-[2rem] bg-white border-slate-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 text-slate-700 leading-relaxed p-6 font-medium shadow-inner transition-all"
            placeholder="Descreva as instruções que a IA deve seguir para este contexto..."
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MainLayout 
      title="Parametrização IA" 
      subtitle="Refine o coração e a mente da MarIA através de regras e personas dinâmicas."
    >
      <div className="max-w-7xl mx-auto pb-20 px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-32 text-slate-400">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
              <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
            </div>
            <p className="font-black text-slate-500 uppercase tracking-widest text-sm">Sincronizando Cognição...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Sidebar de Navegação */}
            <aside className="md:col-span-3 space-y-6 sticky top-24">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Buscar regra..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 rounded-2xl bg-white/50 backdrop-blur-sm border-white shadow-lg shadow-slate-100 focus:ring-primary/10 transition-all font-bold text-slate-700"
                />
              </div>

              <nav className="bg-white/40 backdrop-blur-xl p-3 rounded-[2.5rem] shadow-xl shadow-slate-100 border border-white/60 space-y-1">
                {Object.entries(categories).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveCategory(key);
                      setSearchTerm('');
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group",
                      activeCategory === key && !searchTerm
                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                        : "text-slate-500 hover:bg-white/60 hover:text-slate-800"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-xl transition-colors",
                        activeCategory === key && !searchTerm ? "bg-white/20" : "bg-slate-100/80 group-hover:bg-white"
                      )}>
                        {cat.icon}
                      </div>
                      <span className="font-black text-xs uppercase tracking-widest">{cat.label}</span>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      activeCategory === key && !searchTerm ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                    )} />
                  </button>
                ))}
              </nav>

              <div className="p-6 bg-amber-50/50 border border-amber-100/50 rounded-3xl">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 mb-2">Dica Pro</p>
                <p className="text-xs text-amber-600/80 font-medium leading-relaxed">
                  As regras são aplicadas em tempo real. Use o botão "Gerar com IA" para aprimorar instruções existentes.
                </p>
              </div>
            </aside>

            {/* Conteúdo Principal */}
            <main className="md:col-span-9 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-4">
                <div>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                    {searchTerm ? 'Resultados da Busca' : 'Configuração Ativa'}
                  </Badge>
                  <h3 className="text-4xl font-black text-slate-800 tracking-tight">
                    {searchTerm ? `Buscando: "${searchTerm}"` : categories[activeCategory as keyof typeof categories].label}
                  </h3>
                </div>
                <p className="text-slate-400 font-bold text-sm">
                  {filteredPrompts.length} regra{filteredPrompts.length !== 1 && 's'} encontrada{filteredPrompts.length !== 1 && 's'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-8 pb-20">
                {filteredPrompts.length > 0 ? (
                  filteredPrompts.map(renderPromptCard)
                ) : (
                  <div className="flex flex-col items-center justify-center p-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <Search className="h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Nenhuma regra encontrada</p>
                    <Button 
                      variant="link" 
                      onClick={() => setSearchTerm('')}
                      className="text-primary font-bold mt-2"
                    >
                      Limpar busca
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

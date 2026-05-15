import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  Loader2, 
  Bot, 
  MessageSquare, 
  Sparkles, 
  ShieldAlert, 
  Compass,
  ScrollText,
  Zap
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';

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
    return <Bot className="text-primary h-5 w-5" />;
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
      icon: <Bot className="w-4 h-4" />,
      keys: ['core_persona', 'intent_router']
    },
    intentions: {
      label: 'Intenções',
      icon: <Zap className="w-4 h-4" />,
      keys: ['intent_theology', 'intent_prayer', 'intent_bible', 'intent_liturgy', 'intent_saint', 'intent_rosary', 'intent_advice', 'intent_casual', 'rosary_guide']
    },
    rules: {
      label: 'Regras Estritas',
      icon: <ShieldAlert className="w-4 h-4" />,
      keys: ['rule_crisis', 'rule_prohibited', 'rule_etiquette']
    },
    onboarding: {
      label: 'Onboarding',
      icon: <ScrollText className="w-4 h-4" />,
      keys: ['triage_name', 'triage_expectations']
    }
  };

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
      <div className="max-w-6xl mx-auto pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-32 text-slate-400">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
              <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
            </div>
            <p className="font-black text-slate-500 uppercase tracking-widest text-sm">Sincronizando Cognição...</p>
          </div>
        ) : (
          <Tabs defaultValue="persona" className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex justify-center items-start sticky top-4 z-50 py-4">
              <TabsList className="bg-white/90 backdrop-blur-xl p-1.5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,71,171,0.15)] border border-white/60 h-fit flex gap-2">
                {Object.entries(categories).map(([key, cat]) => (
                  <TabsTrigger 
                    key={key} 
                    value={key}
                    className="group rounded-full px-8 py-3.5 data-[active]:bg-primary data-[active]:text-white data-[active]:shadow-lg data-[active]:shadow-primary/30 font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all duration-300 cursor-pointer hover:bg-slate-50 data-[active]:hover:bg-primary"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-100/50 group-data-[active]:bg-white/20 transition-colors">
                      {cat.icon}
                    </div>
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {Object.entries(categories).map(([key, cat]) => (
              <TabsContent key={key} value={key} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-10">
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-2">{cat.label}</h3>
                  <p className="text-slate-500 font-medium max-w-lg mx-auto">Ajuste as regras fundamentais que regem este módulo de consciência da MarIA.</p>
                </div>
                
                <div className="space-y-8">
                  {prompts
                    .filter(p => cat.keys.includes(p.key))
                    .map(renderPromptCard)
                  }
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}

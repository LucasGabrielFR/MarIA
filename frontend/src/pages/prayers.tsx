import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  Loader2, 
  Sparkles,
  BookHeart
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

export default function PrayersPage() {
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
      toast.error('Erro ao carregar configurações de orações');
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
      toast.success('Roteiro atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar roteiro');
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

  const getIconForKey = () => {
    return <BookHeart className="text-primary h-5 w-5" />;
  };

  const formatKeyName = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const categories = {
    guides: {
      label: 'Guias de Oração',
      icon: <BookHeart className="w-4 h-4" />,
      keys: ['guide_terco', 'guide_rosary']
    }
  };

  const renderPromptCard = (prompt: AiPrompt) => (
    <Card key={prompt.id} className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-sm transition-all hover:shadow-2xl hover:shadow-slate-200/70 border border-white/20">
      <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 border-b border-slate-100/50 pb-6 px-8 pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100/50 flex items-center justify-center">
              {getIconForKey()}
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                {formatKeyName(prompt.key)}
              </CardTitle>
              <CardDescription className="text-sm font-medium text-slate-500 font-mono tracking-wider bg-slate-100/50 px-2 py-0.5 rounded-md inline-block mt-2">
                {prompt.key}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={() => generateAiPrompt(prompt)}
              disabled={generating === prompt.key}
              className="bg-white/80 hover:bg-indigo-50 hover:text-indigo-600 border-indigo-100 text-indigo-500 font-bold px-5 py-5 rounded-2xl transition-all shadow-sm flex items-center gap-2"
            >
              {generating === prompt.key ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Gerar com IA
            </Button>
            <Button 
              onClick={() => savePrompt(prompt)}
              disabled={saving === prompt.key}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-5 rounded-2xl shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              {saving === prompt.key ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100/50">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 block">Objetivo e Contexto</Label>
            <p className="text-slate-600 font-medium leading-relaxed">
              {prompt.description}
            </p>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-3 px-1">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Conteúdo das Instruções</Label>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                Modificado em {new Date(prompt.updated_at).toLocaleDateString()}
              </span>
            </div>
            <Textarea
              value={prompt.content}
              onChange={(e) => handleContentChange(prompt.key, e.target.value)}
              className="min-h-[300px] font-mono text-sm leading-relaxed rounded-2xl border-slate-200 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white/50 p-6 shadow-inner"
              placeholder="Digite o roteiro da oração aqui..."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <MainLayout title="Orações" subtitle="Gerencie os guias e roteiros de orações para a IA">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <p className="text-slate-500 font-medium animate-pulse">Carregando roteiros...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Orações" 
      subtitle="Gerencie os guias de orações, como o Santo Terço, enviados pela IA."
    >
      <div className="bg-white/40 backdrop-blur-xl p-2 rounded-3xl inline-block shadow-sm border border-white mb-8">
        <Tabs defaultValue="guides" className="w-full">
          <TabsList className="bg-transparent h-auto p-0 flex gap-2">
            {Object.entries(categories).map(([key, category]) => (
              <TabsTrigger 
                key={key} 
                value={key}
                className="px-6 py-3 rounded-2xl font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:bg-white/60 flex items-center gap-2"
              >
                {category.icon}
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(categories).map(([key, category]) => (
            <TabsContent key={key} value={key} className="mt-8 space-y-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              {prompts
                .filter(p => category.keys.includes(p.key))
                .sort((a, b) => category.keys.indexOf(a.key) - category.keys.indexOf(b.key))
                .map(renderPromptCard)}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
}

import { useState, useEffect } from 'react'
import { MainLayout } from '../components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiRequest } from '@/lib/api'
import { toast } from "sonner"
import { Loader2, Save, RefreshCw, Sparkles, Calendar as CalendarIcon } from 'lucide-react'

interface DailyCache {
  id: string;
  type: 'liturgy' | 'saint' | 'reflection';
  cache_date: string;
  content: string;
  created_at: string;
}

export default function DailyContentPage() {
  const [contents, setContents] = useState<DailyCache[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | boolean>(false); // false, true (global), or type string (individual)
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('sv-SE'));

  const fetchDailyContent = async (date: string) => {
    setLoading(true);
    try {
      const data = await apiRequest(`/ai/daily-cache?date=${date}`);
      setContents(data);
    } catch (error) {
      toast.error("Erro ao carregar conteúdos diários");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyContent(selectedDate);
  }, [selectedDate]);

  const handleUpdate = async (id: string, content: string) => {
    setSaving(id);
    try {
      await apiRequest(`/ai/daily-cache/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      });
      toast.success("Conteúdo atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar conteúdo");
      console.error(error);
    } finally {
      setSaving(null);
    }
  };

  const handleGenerate = async (type?: 'liturgy' | 'saint') => {
    const isGlobal = !type;
    const item = type ? getByType(type) : contents.length > 0;
    
    if (item && !confirm(`Já existe conteúdo ${type ? 'para esta categoria' : 'para este dia'}. Deseja sobrescrever usando a IA? Isso gastará novos tokens.`)) {
      return;
    }

    setGenerating(type || true);
    try {
      await apiRequest('/ai/daily-cache/generate', {
        method: 'POST',
        body: JSON.stringify({ 
          date: selectedDate, 
          force: true,
          type: type 
        }),
      });
      toast.success(`${type ? 'Conteúdo' : 'Tudo'} gerado com sucesso!`);
      fetchDailyContent(selectedDate);
    } catch (error) {
      toast.error("Erro ao gerar conteúdo via IA");
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const getByType = (type: string) => contents.find(c => c.type === type);

  const ContentEditor = ({ type, title, description }: { type: string, title: string, description: string }) => {
    const item = getByType(type);
    const [localContent, setLocalContent] = useState(item?.content || '');

    useEffect(() => {
      setLocalContent(item?.content || '');
    }, [item]);

    return (
      <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold text-slate-800">{title}</CardTitle>
              <CardDescription className="font-medium text-slate-500 mt-1">{description}</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {item ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-bold px-3 py-1">
                  Gerado em {new Date(item.created_at).toLocaleTimeString()}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold px-3 py-1">
                  Pendente
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleGenerate(type as any)}
                disabled={generating === true || generating === type}
                className="h-8 rounded-xl text-primary hover:text-primary hover:bg-primary/10 font-bold gap-1.5"
              >
                {generating === type ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Gerar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Textarea 
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            placeholder="Conteúdo ainda não gerado..."
            className="min-h-[300px] rounded-2xl border-slate-200 focus:ring-primary/20 focus:border-primary transition-all text-slate-700 leading-relaxed font-medium"
          />
          <div className="flex justify-end mt-6">
            <Button 
              onClick={() => item && handleUpdate(item.id, localContent)}
              disabled={!item || saving === item.id}
              className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-6 rounded-2xl shadow-lg shadow-blue-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {saving === item?.id ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <MainLayout title="Conteúdo Diário" subtitle="Gerencie e revise os conteúdos gerados automaticamente pela MarIA.">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <CalendarIcon className="ml-4 text-slate-400 h-5 w-5" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-none focus:ring-0 text-slate-700 font-bold p-2 mr-2 cursor-pointer"
          />
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => fetchDailyContent(selectedDate)}
            className="rounded-2xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all px-6 py-6 h-auto"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Atualizar
          </Button>
          <Button 
            onClick={() => handleGenerate()}
            disabled={generating !== false}
            className="rounded-2xl bg-secondary hover:bg-secondary/90 text-white font-bold px-6 py-6 h-auto shadow-lg shadow-amber-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {generating === true ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
            Gerar Tudo
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
        </div>
      ) : (
        <Tabs defaultValue="liturgy" className="space-y-8">
          <TabsList className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 h-auto gap-1">
            <TabsTrigger value="liturgy" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all">Liturgia</TabsTrigger>
            <TabsTrigger value="saint" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all">Santo do Dia</TabsTrigger>
          </TabsList>

          <TabsContent value="liturgy">
            <ContentEditor 
              type="liturgy" 
              title="Liturgia Diária" 
              description="Reflexão espiritual baseada nas leituras da missa de hoje."
            />
          </TabsContent>
          
          <TabsContent value="saint">
            <ContentEditor 
              type="saint" 
              title="Santo do Dia" 
              description="Hagiografia e ensinamentos do santo celebrado hoje."
            />
          </TabsContent>

        </Tabs>
      )}
    </MainLayout>
  )
}

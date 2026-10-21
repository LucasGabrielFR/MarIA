import { useState, useEffect } from 'react'
import { MainLayout } from '../components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiRequest } from '@/lib/api'
import { toast } from "sonner"
import {
  Loader2,
  Save,
  RefreshCw,
  Sparkles,
  Calendar as CalendarIcon,
  BookOpen,
  CalendarDays,
  Download,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

interface DailyCache {
  id: string;
  type: 'liturgy' | 'saint' | 'reflection' | 'rosary';
  cache_date: string;
  content: string;
  created_at: string;
}

interface CanonicalHour {
  id: string;
  date: string;
  hour_type: string;
  liturgical_color: string;
  liturgical_rank: string;
  celebration_title: string;
  has_memorial: boolean;
  memorial_title?: string;
  source_url?: string;
  content: {
    rawCleanText?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

interface CanonicalSyncResponse {
  syncedCount?: number;
  dates?: string[];
  status?: 'complete' | 'partial' | 'failed';
  complete?: boolean;
  expectedCount?: number;
  missingCount?: number;
  failedCount?: number;
  missingHours?: any;
}

const HOUR_LABELS: Record<string, string> = {
  office_of_readings: 'Ofício das Leituras',
  lauds: 'Laudes (Manhã)',
  terce: 'Hora Terça (9h)',
  sext: 'Hora Sexta (12h)',
  none: 'Hora Nona (15h)',
  vespers: 'Vésperas (Tarde)',
  compline: 'Completas (Noite)',
  invitatory: 'Invitatório',
};

const COLOR_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  green: { label: 'Verde (Tempo Comum)', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  white: { label: 'Branco (Luz/Solenidade)', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  red: { label: 'Vermelho (Mártires/Paixão)', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  purple: { label: 'Índigo/Roxo (Penitência)', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
  rose: { label: 'Rosa (Alegria)', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
};

const RANK_LABELS: Record<string, string> = {
  solemnity: 'Solenidade',
  feast: 'Festa',
  obligatory_memorial: 'Memória Obrigatória',
  optional_memorial: 'Memória Facultativa',
  ferial: 'Tempo Comum / Féria',
};

export default function DailyContentPage() {
  const [contents, setContents] = useState<DailyCache[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | boolean>(false); // false, true (global), or type string (individual)
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('sv-SE'));

  // Estados específicos para Liturgia das Horas
  const [canonicalHours, setCanonicalHours] = useState<CanonicalHour[]>([]);
  const [loadingCanonical, setLoadingCanonical] = useState(false);
  const [syncingDay, setSyncingDay] = useState(false);
  const [syncingWeek, setSyncingWeek] = useState(false);
  const [activeHourType, setActiveHourType] = useState<string>('lauds');
  const [localTitle, setLocalTitle] = useState('');
  const [localHourContent, setLocalHourContent] = useState('');
  const [savingHourId, setSavingHourId] = useState<string | null>(null);

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

  const fetchCanonicalHours = async (date: string) => {
    setLoadingCanonical(true);
    try {
      const res = await apiRequest(`/canonical-hours/day?date=${date}`);
      const list: CanonicalHour[] = res.hours || [];
      setCanonicalHours(list);

      if (list.length > 0) {
        const currentActive = list.find(h => h.hour_type === activeHourType) || list[0];
        setActiveHourType(currentActive.hour_type);
        setLocalTitle(currentActive.celebration_title || '');
        setLocalHourContent(currentActive.content?.rawCleanText || '');
      } else {
        setLocalTitle('');
        setLocalHourContent('');
      }
    } catch (err) {
      console.error("Erro ao carregar horas canônicas", err);
    } finally {
      setLoadingCanonical(false);
    }
  };

  useEffect(() => {
    fetchDailyContent(selectedDate);
    fetchCanonicalHours(selectedDate);
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

  const handleGenerate = async (type?: 'liturgy' | 'saint' | 'rosary') => {
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

  // Sincroniza dados deste dia (Liturgia das Horas - Sem IA)
  const handleSyncCanonicalDay = async () => {
    setSyncingDay(true);
    try {
      const res: CanonicalSyncResponse = await apiRequest(`/canonical-hours/sync-day?date=${selectedDate}`, { method: 'POST' });
      const syncedCount = res?.syncedCount ?? 0;
      const expectedCount = res?.expectedCount ?? 7;
      const missingCount = res?.missingCount ?? (expectedCount !== undefined ? Math.max(0, expectedCount - syncedCount) : 0);
      const failedCount = res?.failedCount ?? 0;

      // 1. Falha total (priorizada em primeiro lugar)
      if (res?.status === 'failed' || syncedCount === 0 || (failedCount > 0 && syncedCount === 0)) {
        toast.error(`Falha ao sincronizar Liturgia das Horas de ${selectedDate}. Nenhuma hora válida atualizada.`);
      }
      // 2. Parcial ou Inconsistência (priorizada antes de qualquer sucesso; bloqueia complete contraditório)
      else if (
        res?.status === 'partial' ||
        res?.complete === false ||
        missingCount > 0 ||
        failedCount > 0 ||
        syncedCount < expectedCount ||
        (res?.complete === true && res?.status !== 'complete') ||
        (res?.status === 'complete' && res?.complete !== true)
      ) {
        const parts: string[] = [];
        if (expectedCount > 0) {
          parts.push(`${syncedCount}/${expectedCount} horas sincronizadas`);
        } else {
          parts.push(`${syncedCount} hora(s) sincronizada(s)`);
        }
        if (missingCount > 0) {
          parts.push(`${missingCount} ausente(s)`);
        }
        const detail = parts.length > 0 ? ` (${parts.join(', ')})` : '';
        toast.warning(`Sincronização parcial de ${selectedDate}${detail}.`);
      }
      // 3. Sucesso completo (exige complete coerente com status e todas as contagens)
      else if (
        syncedCount > 0 &&
        missingCount === 0 &&
        failedCount === 0 &&
        syncedCount >= expectedCount &&
        res?.complete === true &&
        res?.status === 'complete'
      ) {
        toast.success(`Liturgia das Horas de ${selectedDate} sincronizada com sucesso completo (${syncedCount} horas)!`);
      }
      // 4. Fallback para respostas legadas sem confirmação explícita de complete
      else {
        toast.info(`Sincronização de ${selectedDate} processada: ${syncedCount} hora(s) atualizada(s).`);
      }

      fetchCanonicalHours(selectedDate);
    } catch (err) {
      toast.error("Erro ao buscar dados deste dia da Liturgia das Horas");
      console.error(err);
    } finally {
      setSyncingDay(false);
    }
  };

  // Sincroniza dados da semana (de hoje até o próximo sábado)
  const handleSyncCanonicalWeek = async () => {
    setSyncingWeek(true);
    try {
      const res: CanonicalSyncResponse = await apiRequest(`/canonical-hours/sync-week?date=${selectedDate}`, { method: 'POST' });
      const syncedCount = res?.syncedCount ?? 0;
      const datesCount = res?.dates?.length;
      const expectedCount = res?.expectedCount ?? (datesCount ? datesCount * 7 : undefined);
      const failedCount = res?.failedCount ?? 0; // Contagem de DIAS com falha
      const missingCount = res?.missingCount ?? (expectedCount !== undefined ? Math.max(0, expectedCount - syncedCount) : 0); // Contagem de HORAS ausentes

      // 1. Falha total (priorizada em primeiro lugar)
      if (res?.status === 'failed' || syncedCount === 0 || (expectedCount !== undefined && failedCount > 0 && syncedCount === 0)) {
        toast.error("Falha ao sincronizar a semana da Liturgia das Horas. Nenhuma hora foi atualizada.");
      }
      // 2. Parcial ou Inconsistência (priorizada antes de qualquer sucesso; bloqueia complete contraditório)
      else if (
        res?.status === 'partial' ||
        res?.complete === false ||
        missingCount > 0 ||
        failedCount > 0 ||
        (expectedCount !== undefined && syncedCount < expectedCount) ||
        (res?.complete === true && res?.status !== 'complete') ||
        (res?.status === 'complete' && res?.complete !== true)
      ) {
        // NÃO somar unidades distintas (failedCount são dias, missingCount são horas) e não duplicar pendências
        const parts: string[] = [];
        if (expectedCount !== undefined) {
          parts.push(`${syncedCount}/${expectedCount} horas sincronizadas`);
        } else {
          parts.push(`${syncedCount} hora(s) sincronizada(s)`);
        }
        if (failedCount > 0) {
          parts.push(`${failedCount} dia(s) com falha`);
        } else if (missingCount > 0) {
          parts.push(`${missingCount} hora(s) ausente(s)`);
        }
        const detail = parts.length > 0 ? ` (${parts.join(', ')})` : '';
        toast.warning(`Sincronização parcial da semana até sábado${detail}.`);
      }
      // 3. Sucesso completo (exige complete coerente com status e todas as contagens)
      else if (
        syncedCount > 0 &&
        missingCount === 0 &&
        failedCount === 0 &&
        expectedCount !== undefined &&
        syncedCount >= expectedCount &&
        res?.complete === true &&
        res?.status === 'complete'
      ) {
        toast.success(`Semana sincronizada com sucesso completo até sábado (${syncedCount} horas atualizadas)!`);
      }
      // 4. Fallback para respostas legadas sem confirmação explícita de complete
      else {
        toast.info(`Sincronização da semana processada (${syncedCount} horas atualizadas). Verifique as datas.`);
      }

      fetchCanonicalHours(selectedDate);
    } catch (err) {
      toast.error("Erro ao buscar dados da semana da Liturgia das Horas");
      console.error(err);
    } finally {
      setSyncingWeek(false);
    }
  };

  // Salvar alterações de uma hora canônica
  const handleSaveCanonicalHour = async (hour: CanonicalHour) => {
    setSavingHourId(hour.id);
    try {
      await apiRequest(`/canonical-hours/update/${hour.id}`, {
        method: 'POST',
        body: JSON.stringify({
          celebration_title: localTitle,
          rawCleanText: localHourContent,
        }),
      });
      toast.success(`${HOUR_LABELS[hour.hour_type] || 'Hora'} atualizada com sucesso!`);
      fetchCanonicalHours(selectedDate);
    } catch (err) {
      toast.error("Erro ao salvar alterações da hora canônica");
      console.error(err);
    } finally {
      setSavingHourId(null);
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

  const selectedHour = canonicalHours.find(h => h.hour_type === activeHourType) || canonicalHours[0];

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
            onClick={() => {
              fetchDailyContent(selectedDate);
              fetchCanonicalHours(selectedDate);
            }}
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
            Gerar Tudo (IA)
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
            <TabsTrigger value="rosary" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all">Terço Diário</TabsTrigger>
            <TabsTrigger value="canonical_hours" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all gap-2">
              <BookOpen className="h-4 w-4" />
              Liturgia das Horas
            </TabsTrigger>
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

          <TabsContent value="rosary">
            <ContentEditor 
              type="rosary" 
              title="Mistérios do Terço" 
              description="Reflexões sobre os mistérios baseadas na liturgia da semana."
            />
          </TabsContent>

          {/* Nova Aba: Liturgia das Horas (Ofício Divino - Sem IA) */}
          <TabsContent value="canonical_hours" className="space-y-6">
            <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl font-bold text-slate-800">Liturgia das Horas (Ofício Divino)</CardTitle>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-bold px-2.5 py-0.5">
                        Sem IA • Extração Canônica
                      </Badge>
                    </div>
                    <CardDescription className="font-medium text-slate-500 mt-1">
                      Gerencie as 7 Horas Canônicas (Ofício das Leituras, Laudes, Terça, Sexta, Nona, Vésperas e Completas) da Igreja Católica.
                    </CardDescription>
                  </div>

                  {/* Botões exclusivos desta aba solicitados pelo usuário */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSyncCanonicalDay}
                      disabled={syncingDay || syncingWeek || loadingCanonical}
                      className="rounded-xl border-slate-200 font-bold text-slate-700 hover:bg-slate-100 h-10 px-4 gap-2"
                    >
                      {syncingDay ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Download className="h-4 w-4 text-primary" />}
                      Buscar dados deste dia
                    </Button>

                    <Button
                      size="sm"
                      onClick={handleSyncCanonicalWeek}
                      disabled={syncingDay || syncingWeek || loadingCanonical}
                      className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold h-10 px-4 gap-2 shadow-sm"
                    >
                      {syncingWeek ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <CalendarDays className="h-4 w-4 text-white" />}
                      Buscar dados da semana (até Sábado)
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {loadingCanonical ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="font-medium text-sm">Carregando horas canônicas da data...</p>
                  </div>
                ) : canonicalHours.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 px-6">
                    <AlertCircle className="h-12 w-12 text-slate-400 mb-3" />
                    <h4 className="text-lg font-bold text-slate-700 mb-1">Nenhuma hora canônica registrada para esta data</h4>
                    <p className="text-sm text-slate-500 max-w-md mb-6">
                      Você pode sincronizar os dados deste dia específico ou antecipar a semana inteira (de hoje até sábado) sem consumir tokens de IA.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={handleSyncCanonicalDay}
                        disabled={syncingDay || syncingWeek}
                        className="rounded-xl font-bold"
                      >
                        {syncingDay ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Buscar dados de {selectedDate}
                      </Button>
                      <Button
                        onClick={handleSyncCanonicalWeek}
                        disabled={syncingDay || syncingWeek}
                        className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
                      >
                        {syncingWeek ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarDays className="mr-2 h-4 w-4" />}
                        Buscar dados da semana (até Sábado)
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Barra de Informações Litúrgicas do Dia */}
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <div>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Celebração Litúrgica</span>
                          <p className="text-base font-bold text-slate-800">{canonicalHours[0].celebration_title}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Badge de Cor Litúrgica */}
                        {(() => {
                          const col = canonicalHours[0].liturgical_color?.toLowerCase() || 'green';
                          const cfg = COLOR_BADGES[col] || COLOR_BADGES.green;
                          return (
                            <Badge variant="outline" className={`${cfg.bg} ${cfg.text} ${cfg.border} font-bold px-3 py-1`}>
                              Cor: {cfg.label}
                            </Badge>
                          );
                        })()}

                        {/* Grau Litúrgico */}
                        <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 font-bold px-3 py-1">
                          {RANK_LABELS[canonicalHours[0].liturgical_rank] || 'Féria'}
                        </Badge>

                        {canonicalHours[0].has_memorial && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 font-bold px-3 py-1">
                            Possui Memória de Santo
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Seletor de Hora Canônica */}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                        Selecione a Hora Canônica ({canonicalHours.length} disponíveis)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {canonicalHours.map((h) => {
                          const isSelected = h.hour_type === (selectedHour?.hour_type || activeHourType);
                          return (
                            <button
                              key={h.id}
                              onClick={() => {
                                setActiveHourType(h.hour_type);
                                setLocalTitle(h.celebration_title || '');
                                setLocalHourContent(h.content?.rawCleanText || '');
                              }}
                              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                                isSelected
                                  ? 'bg-primary text-white border-primary shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {HOUR_LABELS[h.hour_type] || h.hour_type}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Editor da Hora Selecionada */}
                    {selectedHour && (
                      <div className="space-y-4 pt-2">
                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1">
                            Título da Hora / Celebração
                          </label>
                          <input
                            type="text"
                            value={localTitle}
                            onChange={(e) => setLocalTitle(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-slate-600">
                              Texto Canônico & Rubricas ({HOUR_LABELS[selectedHour.hour_type] || selectedHour.hour_type})
                            </label>
                            <span className="text-xs text-slate-400 font-medium">
                              {localHourContent.length} caracteres
                            </span>
                          </div>
                          <Textarea
                            value={localHourContent}
                            onChange={(e) => setLocalHourContent(e.target.value)}
                            placeholder="Texto da oração..."
                            className="min-h-[350px] font-mono text-sm leading-relaxed p-4 rounded-2xl border-slate-200 focus:ring-primary/20 focus:border-primary text-slate-700"
                          />
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <p className="text-xs text-slate-400">
                            Última atualização: {new Date(selectedHour.updated_at || selectedHour.created_at).toLocaleString()}
                          </p>
                          <Button
                            onClick={() => handleSaveCanonicalHour(selectedHour)}
                            disabled={savingHourId === selectedHour.id}
                            className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-5 rounded-xl shadow-md transition-all gap-2"
                          >
                            {savingHourId === selectedHour.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Salvar Alterações desta Hora
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </MainLayout>
  )
}

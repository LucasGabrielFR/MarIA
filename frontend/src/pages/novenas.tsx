import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Save, 
  Loader2, 
  RefreshCw, 
  Star, 
  Eye, 
  EyeOff, 
  BookOpen, 
  Wand2,
  X
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';

interface NovenaDay {
  id?: string;
  day_number: number;
  title: string;
  opening_prayer?: string;
  scripture_reading?: string;
  meditation: string;
  daily_prayer: string;
  intentions_prompt?: string;
  concluding_prayer?: string;
}

interface Novena {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  category: string;
  tags?: string[];
  feast_date?: string;
  ideal_start_date?: string;
  image_url?: string;
  banner_color?: string;
  is_published: boolean;
  is_featured: boolean;
  display_order: number;
  total_days_configured?: number;
  created_at: string;
  days?: NovenaDay[];
}

const CATEGORIES = [
  { id: 'all', label: 'Todas' },
  { id: 'marianas', label: 'Marianas' },
  { id: 'santos', label: 'Santos Protetores' },
  { id: 'causas_urgentes', label: 'Causas Urgentes' },
  { id: 'jesus', label: 'Jesus & Eucaristia' },
  { id: 'liturgicas', label: 'Tempo Litúrgico' },
];

export default function NovenasPage() {
  const [novenas, setNovenas] = React.useState<Novena[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [seeding, setSeeding] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  // Modal de edição / criação
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [editingNovena, setEditingNovena] = React.useState<Partial<Novena> | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = React.useState<number>(1);
  const [savingNovena, setSavingNovena] = React.useState(false);
  const [rawTextImport, setRawTextImport] = React.useState('');

  React.useEffect(() => {
    fetchNovenas();
  }, [categoryFilter, statusFilter]);

  const fetchNovenas = async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('maria_user');
      const requesterId = storedUser ? JSON.parse(storedUser)?.id : '';

      const queryParams = new URLSearchParams();
      if (categoryFilter !== 'all') queryParams.append('category', categoryFilter);
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);
      if (search.trim()) queryParams.append('search', search.trim());

      const url = `/panel/novenas?${queryParams.toString()}`;
      const data = await apiRequest(url, {
        headers: { 'x-admin-id': requesterId },
      });
      setNovenas(data || []);
    } catch (err: any) {
      toast.error('Erro ao carregar novenas: ' + (err.message || 'Falha de conexão'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNovenas();
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const storedUser = localStorage.getItem('maria_user');
      const requesterId = storedUser ? JSON.parse(storedUser)?.id : '';

      const res = await apiRequest('/panel/novenas/seed', {
        method: 'POST',
        headers: { 'x-admin-id': requesterId },
      });

      toast.success(`Novenas sincronizadas com sucesso! (${res.count} processadas)`);
      fetchNovenas();
    } catch (err: any) {
      toast.error('Erro ao sincronizar novenas: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleOpenEditor = async (novena?: Novena) => {
    if (novena) {
      try {
        const storedUser = localStorage.getItem('maria_user');
        const requesterId = storedUser ? JSON.parse(storedUser)?.id : '';

        const fullData = await apiRequest(`/panel/novenas/${novena.id}`, {
          headers: { 'x-admin-id': requesterId },
        });

        const daysMap: Record<number, NovenaDay> = {};
        (fullData.days || []).forEach((d: NovenaDay) => {
          daysMap[d.day_number] = d;
        });

        const completeDays: NovenaDay[] = [];
        for (let i = 1; i <= 9; i++) {
          completeDays.push(
            daysMap[i] || {
              day_number: i,
              title: `${i}º Dia`,
              meditation: '',
              daily_prayer: '',
            }
          );
        }

        setEditingNovena({
          ...fullData,
          days: completeDays,
        });
      } catch (err: any) {
        toast.error('Erro ao carregar detalhes da novena');
        return;
      }
    } else {
      const blankDays: NovenaDay[] = Array.from({ length: 9 }, (_, idx) => ({
        day_number: idx + 1,
        title: `${idx + 1}º Dia`,
        meditation: '',
        daily_prayer: '',
      }));

      setEditingNovena({
        title: '',
        subtitle: '',
        description: '',
        category: 'marianas',
        tags: [],
        banner_color: '#002D6E',
        is_published: true,
        is_featured: false,
        display_order: 0,
        days: blankDays,
      });
    }

    setSelectedDayNumber(1);
    setRawTextImport('');
    setIsEditorOpen(true);
  };

  const handleSaveNovena = async () => {
    if (!editingNovena?.title?.trim() || !editingNovena?.category) {
      toast.error('Título e Categoria são obrigatórios.');
      return;
    }

    setSavingNovena(true);
    try {
      const storedUser = localStorage.getItem('maria_user');
      const requesterId = storedUser ? JSON.parse(storedUser)?.id : '';

      const isUpdating = !!editingNovena.id;
      const endpoint = isUpdating
        ? `/panel/novenas/${editingNovena.id}`
        : '/panel/novenas';

      const method = isUpdating ? 'PATCH' : 'POST';

      await apiRequest(endpoint, {
        method,
        headers: { 'x-admin-id': requesterId },
        body: JSON.stringify(editingNovena),
      });

      toast.success(
        isUpdating
          ? 'Novena e seus 9 dias atualizados com sucesso!'
          : 'Nova novena criada com sucesso!'
      );

      setIsEditorOpen(false);
      setEditingNovena(null);
      fetchNovenas();
    } catch (err: any) {
      toast.error('Erro ao salvar novena: ' + err.message);
    } finally {
      setSavingNovena(false);
    }
  };

  const handleTogglePublished = async (novena: Novena) => {
    try {
      const storedUser = localStorage.getItem('maria_user');
      const requesterId = storedUser ? JSON.parse(storedUser)?.id : '';

      await apiRequest(`/panel/novenas/${novena.id}`, {
        method: 'PATCH',
        headers: { 'x-admin-id': requesterId },
        body: JSON.stringify({ is_published: !novena.is_published }),
      });

      toast.success(
        !novena.is_published ? 'Novena publicada no app!' : 'Novena colocada em rascunho.'
      );
      fetchNovenas();
    } catch (err: any) {
      toast.error('Erro ao atualizar status: ' + err.message);
    }
  };

  const handleToggleFeatured = async (novena: Novena) => {
    try {
      const storedUser = localStorage.getItem('maria_user');
      const requesterId = storedUser ? JSON.parse(storedUser)?.id : '';

      await apiRequest(`/panel/novenas/${novena.id}`, {
        method: 'PATCH',
        headers: { 'x-admin-id': requesterId },
        body: JSON.stringify({ is_featured: !novena.is_featured }),
      });

      toast.success(!novena.is_featured ? 'Marcada como destaque!' : 'Removida dos destaques.');
      fetchNovenas();
    } catch (err: any) {
      toast.error('Erro ao atualizar destaque: ' + err.message);
    }
  };

  const handleDeleteNovena = async (novena: Novena) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${novena.title}" e todos os seus 9 dias?`)) {
      return;
    }

    try {
      const storedUser = localStorage.getItem('maria_user');
      const requesterId = storedUser ? JSON.parse(storedUser)?.id : '';

      await apiRequest(`/panel/novenas/${novena.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-id': requesterId },
      });

      toast.success('Novena excluída com sucesso.');
      fetchNovenas();
    } catch (err: any) {
      toast.error('Erro ao excluir novena: ' + err.message);
    }
  };

  const handleParseRawText = () => {
    if (!rawTextImport.trim()) {
      toast.error('Cole o texto da novena na caixa antes de processar.');
      return;
    }

    const text = rawTextImport;
    const currentDays = [...(editingNovena?.days || [])];

    const dayRegex = /(?:(\d+)º\s*dia|dia\s*(\d+)|(?:primeiro|segundo|terceiro|quarto|quinto|sexto|sétimo|oitavo|nono)\s*dia)/gi;
    const matches = Array.from(text.matchAll(dayRegex));

    if (matches.length > 0) {
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const dayNum = i + 1;
        if (dayNum > 9) break;

        const startIndex = match.index || 0;
        const endIndex = i + 1 < matches.length ? (matches[i + 1].index || text.length) : text.length;
        const dayChunk = text.substring(startIndex, endIndex).trim();

        const lines = dayChunk.split('\n').map(l => l.trim()).filter(Boolean);
        const titleLine = lines[0] || `${dayNum}º Dia`;
        const bodyText = lines.slice(1).join('\n\n');

        const existingDayIdx = currentDays.findIndex(d => d.day_number === dayNum);
        if (existingDayIdx !== -1) {
          currentDays[existingDayIdx] = {
            ...currentDays[existingDayIdx],
            title: titleLine.substring(0, 100),
            meditation: bodyText.substring(0, 1500) || dayChunk,
            daily_prayer: currentDays[existingDayIdx].daily_prayer || 'Ó Deus de misericórdia, acolhei as nossas súplicas.',
          };
        }
      }

      setEditingNovena(prev => ({
        ...prev,
        days: currentDays,
      }));

      toast.success(`Texto dividido com sucesso! Verifique os 9 dias na aba 2.`);
    } else {
      const existingDayIdx = currentDays.findIndex(d => d.day_number === selectedDayNumber);
      if (existingDayIdx !== -1) {
        currentDays[existingDayIdx].meditation = text;
        setEditingNovena(prev => ({
          ...prev,
          days: currentDays,
        }));
        toast.info(`Texto inserido na meditação do ${selectedDayNumber}º Dia.`);
      }
    }
  };

  const currentDayData = editingNovena?.days?.find(d => d.day_number === selectedDayNumber);

  const updateCurrentDayField = (field: keyof NovenaDay, value: string) => {
    if (!editingNovena?.days) return;
    const updatedDays = editingNovena.days.map(d =>
      d.day_number === selectedDayNumber ? { ...d, [field]: value } : d
    );
    setEditingNovena({ ...editingNovena, days: updatedDays });
  };

  return (
    <MainLayout
      title="Novenário Sagrado (CMS)"
      subtitle="Gerencie o acervo de novenas tradicionais e seus 9 dias. Sincronizado dinamicamente com o App Móvel."
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Barra de Ações Rápidas & Filtros */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          {/* Campo de Busca */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título ou devoção..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </form>

          {/* Filtros de Categoria e Status */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="published">🟢 Publicadas no App</option>
              <option value="draft">⚪ Rascunhos</option>
            </select>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    categoryFilter === cat.id
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="h-10 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold rounded-xl px-3"
              title="Restaura as novenas canônicas de referência caso necessário"
            >
              <RefreshCw size={14} className={`mr-1.5 ${seeding ? 'animate-spin' : ''}`} />
              Sincronizar Padrão
            </Button>

            <Button
              size="sm"
              onClick={() => handleOpenEditor()}
              className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-4 shadow-sm shadow-blue-200"
            >
              <Plus size={16} className="mr-1.5" />
              Nova Novena
            </Button>
          </div>
        </div>

        {/* Grade de Novenas */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
            <Loader2 size={36} className="animate-spin mb-3 text-blue-600" />
            <p className="text-sm font-medium text-slate-600">Carregando novenas do Supabase...</p>
          </div>
        ) : novenas.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-200 bg-white rounded-3xl p-12 text-center shadow-sm">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/50">
                <BookOpen size={28} />
              </div>
              <h3 className="font-bold text-lg text-slate-800">
                Nenhuma novena encontrada
              </h3>
              <p className="text-sm text-slate-500">
                Não há novenas com os filtros selecionados. Clique em "Sincronizar Padrão" para carregar as novenas católicas clássicas ou crie uma nova agora.
              </p>
              <Button
                onClick={handleSeedDefaults}
                variant="outline"
                className="rounded-xl border-slate-200 font-semibold"
              >
                Carregar Novenas Padrão
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {novenas.map(novena => (
              <div
                key={novena.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden group"
              >
                {/* Faixa Superior com a Cor Sacra da Novena */}
                <div
                  className="h-3 w-full"
                  style={{ backgroundColor: novena.banner_color || '#002D6E' }}
                />

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Linha de Badges e Ações Rápidas */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {novena.category}
                        </span>

                        {novena.is_featured && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <Star size={10} className="fill-amber-500 text-amber-500" />
                            Destaque
                          </span>
                        )}

                        {novena.feast_date && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center gap-1">
                            <Calendar size={10} />
                            Festa: {novena.feast_date}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleFeatured(novena)}
                          className={`p-1.5 rounded-xl border transition-colors ${
                            novena.is_featured
                              ? 'text-amber-500 border-amber-300 bg-amber-50 hover:bg-amber-100'
                              : 'text-slate-400 border-slate-200 hover:text-amber-500 hover:bg-slate-50'
                          }`}
                          title={novena.is_featured ? 'Remover dos destaques' : 'Destacar no app'}
                        >
                          <Star size={14} className={novena.is_featured ? 'fill-amber-500' : ''} />
                        </button>

                        <button
                          onClick={() => handleTogglePublished(novena)}
                          className={`p-1.5 rounded-xl border transition-colors ${
                            novena.is_published
                              ? 'text-emerald-600 border-emerald-300 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-slate-400 border-slate-200 hover:text-emerald-600 hover:bg-slate-50'
                          }`}
                          title={novena.is_published ? 'Publicada (ativa no app)' : 'Rascunho (invisível)'}
                        >
                          {novena.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Título e Subtítulo */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                        {novena.title}
                      </h3>
                      {novena.subtitle && (
                        <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-2">
                          {novena.subtitle}
                        </p>
                      )}
                    </div>

                    {novena.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {novena.description}
                      </p>
                    )}

                    {/* Bloco de Integridade dos 9 Dias (Agora 100% Claro e Elegante) */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                        {novena.total_days_configured === 9 ? (
                          <CheckCircle2 size={15} className="text-emerald-600" />
                        ) : (
                          <AlertCircle size={15} className="text-amber-500" />
                        )}
                        Dias Estruturados:
                      </span>
                      <span className="font-bold text-slate-800 px-2 py-0.5 rounded-md bg-white border border-slate-200/80 shadow-2xs">
                        {novena.total_days_configured || 0} / 9 dias
                      </span>
                    </div>

                    {/* Tags */}
                    {novena.tags && novena.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {novena.tags.slice(0, 4).map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rodapé do Card com Ações */}
                  <div className="flex items-center justify-between gap-2 mt-5 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleDeleteNovena(novena)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Excluir novena"
                    >
                      <Trash2 size={16} />
                    </button>

                    <Button
                      size="sm"
                      onClick={() => handleOpenEditor(novena)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-9 px-4 shadow-sm shadow-blue-100"
                    >
                      <Edit3 size={13} className="mr-1.5" />
                      Editar os 9 Dias
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= MODAL DE EDIÇÃO 100% LIGHT THEME & CONTRASTE PERFEITO ================= */}
        {isEditorOpen && editingNovena && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              
              {/* Header do Modal */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-4 h-4 rounded-full border border-white shadow-xs"
                    style={{ backgroundColor: editingNovena.banner_color || '#002D6E' }}
                  />
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-800">
                      {editingNovena.id ? `Editar: ${editingNovena.title}` : 'Criar Nova Novena'}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Configure os metadados e os 9 dias de contemplação orante
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Corpo com Abas */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <Tabs defaultValue="metadata">
                  <TabsList className="grid grid-cols-3 mb-6 bg-slate-100 p-1 rounded-2xl">
                    <TabsTrigger value="metadata" className="rounded-xl font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
                      1. Dados Gerais
                    </TabsTrigger>
                    <TabsTrigger value="days" className="rounded-xl font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
                      2. Editor dos 9 Dias
                    </TabsTrigger>
                    <TabsTrigger value="import" className="rounded-xl font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
                      3. Colar Texto da Web
                    </TabsTrigger>
                  </TabsList>

                  {/* ABA 1: METADADOS */}
                  <TabsContent value="metadata" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                          Título da Novena *
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Novena a Nossa Senhora Desatadora dos Nós"
                          value={editingNovena.title || ''}
                          onChange={e => setEditingNovena({ ...editingNovena, title: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                          Categoria
                        </label>
                        <select
                          value={editingNovena.category || 'marianas'}
                          onChange={e => setEditingNovena({ ...editingNovena, category: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                        >
                          <option value="marianas">Marianas</option>
                          <option value="santos">Santos Protetores</option>
                          <option value="causas_urgentes">Causas Urgentes / Impossíveis</option>
                          <option value="jesus">Jesus & Eucaristia</option>
                          <option value="liturgicas">Tempo Litúrgico (Quaresma, Natal)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                        Subtítulo / Intenção Geral
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Para desatar os nós e dificuldades insolúveis da vida espiritual e familiar"
                        value={editingNovena.subtitle || ''}
                        onChange={e => setEditingNovena({ ...editingNovena, subtitle: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                        Descrição Histórica e Espiritual
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Breve história da devoção, aprovação eclesial e sentido pastoral..."
                        value={editingNovena.description || ''}
                        onChange={e => setEditingNovena({ ...editingNovena, description: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                          Festa Litúrgica (MM-DD)
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 09-28 ou 10-12"
                          value={editingNovena.feast_date || ''}
                          onChange={e => setEditingNovena({ ...editingNovena, feast_date: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                          Início Sugerido (MM-DD)
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 09-19 (9 dias antes)"
                          value={editingNovena.ideal_start_date || ''}
                          onChange={e => setEditingNovena({ ...editingNovena, ideal_start_date: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                          Cor Litúrgica (Hex)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editingNovena.banner_color || '#002D6E'}
                            onChange={e => setEditingNovena({ ...editingNovena, banner_color: e.target.value })}
                            className="h-10 w-12 rounded-xl border border-slate-200 cursor-pointer bg-white p-0.5"
                          />
                          <input
                            type="text"
                            value={editingNovena.banner_color || '#002D6E'}
                            onChange={e => setEditingNovena({ ...editingNovena, banner_color: e.target.value })}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-slate-100">
                      <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editingNovena.is_published ?? true}
                          onChange={e => setEditingNovena({ ...editingNovena, is_published: e.target.checked })}
                          className="rounded-md text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-300"
                        />
                        <span>Publicar imediatamente no Aplicativo Móvel</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editingNovena.is_featured ?? false}
                          onChange={e => setEditingNovena({ ...editingNovena, is_featured: e.target.checked })}
                          className="rounded-md text-amber-500 focus:ring-amber-500 h-4 w-4 border-slate-300"
                        />
                        <span>Destacar na tela inicial</span>
                      </label>
                    </div>
                  </TabsContent>

                  {/* ABA 2: EDITOR DOS 9 DIAS */}
                  <TabsContent value="days" className="space-y-5">
                    {/* Seletor Horizontal dos 9 Dias */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
                      {Array.from({ length: 9 }, (_, idx) => {
                        const dayNum = idx + 1;
                        const isDayFilled = !!editingNovena.days?.find(
                          d => d.day_number === dayNum && (d.meditation?.trim() || d.daily_prayer?.trim())
                        );
                        return (
                          <button
                            key={dayNum}
                            onClick={() => setSelectedDayNumber(dayNum)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                              selectedDayNumber === dayNum
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <span>{dayNum}º Dia</span>
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isDayFilled
                                  ? selectedDayNumber === dayNum
                                    ? 'bg-emerald-300'
                                    : 'bg-emerald-500'
                                  : 'bg-slate-300'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {/* Formulário do Dia Selecionado */}
                    {currentDayData ? (
                      <div className="space-y-4 pt-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                              Título do {selectedDayNumber}º Dia *
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: 1º Dia: O abandono à Divina Providência"
                              value={currentDayData.title || ''}
                              onChange={e => updateCurrentDayField('title', e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                              Leitura Bíblica de Apoio
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Lucas 1, 37: Porque para Deus nada é impossível."
                              value={currentDayData.scripture_reading || ''}
                              onChange={e => updateCurrentDayField('scripture_reading', e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                            Oração Inicial / Sinal da Cruz
                          </label>
                          <input
                            type="text"
                            placeholder="Em nome do Pai... Ato de contrição..."
                            value={currentDayData.opening_prayer || ''}
                            onChange={e => updateCurrentDayField('opening_prayer', e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                            Meditação e Reflexão Central do Dia *
                          </label>
                          <textarea
                            rows={4}
                            placeholder="Texto meditativo para leitura orante..."
                            value={currentDayData.meditation || ''}
                            onChange={e => updateCurrentDayField('meditation', e.target.value)}
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                            Oração Própria do {selectedDayNumber}º Dia *
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Oração específica dirigida a Deus ou ao intercessor..."
                            value={currentDayData.daily_prayer || ''}
                            onChange={e => updateCurrentDayField('daily_prayer', e.target.value)}
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed font-serif"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                              Pergunta / Lembrança de Intenção Particular
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Apresente agora a graça que deseja nesta novena..."
                              value={currentDayData.intentions_prompt || ''}
                              onChange={e => updateCurrentDayField('intentions_prompt', e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                              Oração de Conclusão / Glória
                            </label>
                            <input
                              type="text"
                              placeholder="Pai Nosso, Ave Maria e Glória ao Pai..."
                              value={currentDayData.concluding_prayer || ''}
                              onChange={e => updateCurrentDayField('concluding_prayer', e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </TabsContent>

                  {/* ABA 3: IMPORTADOR RÁPIDO */}
                  <TabsContent value="import" className="space-y-4">
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed font-medium">
                      💡 <strong>Como funciona a importação rápida:</strong> Copie o texto de uma novena de portais católicos (ex: Canção Nova, Padre Paulo Ricardo) contendo as seções de cada dia (ex: <em>"1º Dia... 2º Dia..."</em>) e cole abaixo. O assistente distribuirá automaticamente os textos nos 9 dias correspondentes para você revisar e salvar.
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                        Texto Bruto da Novena
                      </label>
                      <textarea
                        rows={10}
                        placeholder="Cole aqui o texto corrido da novena..."
                        value={rawTextImport}
                        onChange={e => setRawTextImport(e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={handleParseRawText}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-5 h-10 shadow-sm"
                    >
                      <Wand2 size={15} className="mr-2" />
                      Processar e Distribuir nos 9 Dias
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Rodapé do Modal */}
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50/70">
                <Button
                  variant="outline"
                  onClick={() => setIsEditorOpen(false)}
                  disabled={savingNovena}
                  className="rounded-xl border-slate-200 text-slate-700 font-bold hover:bg-slate-100"
                >
                  Cancelar
                </Button>

                <Button
                  onClick={handleSaveNovena}
                  disabled={savingNovena}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 shadow-sm shadow-blue-200"
                >
                  <Save size={15} className={`mr-2 ${savingNovena ? 'animate-spin' : ''}`} />
                  {savingNovena ? 'Salvando no Supabase...' : 'Salvar Novena'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

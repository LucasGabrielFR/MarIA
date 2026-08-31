import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  Loader2, 
  BookHeart,
  Plus,
  Trash2
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';

interface Prayer {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

export default function PrayersPage() {
  const [prayers, setPrayers] = React.useState<Prayer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<string | null>(null);

  // New prayer form state
  const [isCreating, setIsCreating] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [newCategory, setNewCategory] = React.useState('guia');
  const [newContent, setNewContent] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('all');

  React.useEffect(() => {
    fetchPrayers();
  }, []);

  const fetchPrayers = async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('maria_user');
      const requesterId = storedUser ? JSON.parse(storedUser)?.id : '';
      
      const data = await apiRequest('/panel/prayers', {
        headers: { 'x-admin-id': requesterId }
      });
      setPrayers(data || []);
    } catch (error) {
      toast.error('Erro ao carregar orações');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (id: string, newContent: string) => {
    setPrayers(current => 
      current.map(p => p.id === id ? { ...p, content: newContent } : p)
    );
  };

  const handleTitleChange = (id: string, newTitle: string) => {
    setPrayers(current => 
      current.map(p => p.id === id ? { ...p, title: newTitle } : p)
    );
  };

  const savePrayer = async (prayer: Prayer) => {
    setSaving(prayer.id);
    try {
      const storedUser = localStorage.getItem('maria_user');
      const requesterId = storedUser ? JSON.parse(storedUser)?.id : '';

      await apiRequest(`/panel/prayers/${prayer.id}`, {
        method: 'PATCH',
        headers: { 'x-admin-id': requesterId },
        body: JSON.stringify({ 
          title: prayer.title,
          content: prayer.content,
          category: prayer.category
        })
      });
      toast.success('Oração/Guia atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar oração');
    } finally {
      setSaving(null);
    }
  };

  const createPrayer = async () => {
    if (!newTitle || !newContent) {
      toast.error('Preencha título e conteúdo');
      return;
    }
    setSaving('new');
    try {
      const storedUser = localStorage.getItem('maria_user');
      const requesterId = storedUser ? JSON.parse(storedUser)?.id : '';

      const created = await apiRequest('/panel/prayers', {
        method: 'POST',
        headers: { 'x-admin-id': requesterId },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          category: newCategory
        })
      });
      setPrayers([created, ...prayers]);
      setIsCreating(false);
      setNewTitle('');
      setNewContent('');
      toast.success('Oração criada com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar oração');
    } finally {
      setSaving(null);
    }
  };

  const deletePrayer = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta oração?')) return;
    
    setDeleting(id);
    try {
      const storedUser = localStorage.getItem('maria_user');
      const requesterId = storedUser ? JSON.parse(storedUser)?.id : '';

      await apiRequest(`/panel/prayers/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-id': requesterId }
      });
      setPrayers(current => current.filter(p => p.id !== id));
      toast.success('Oração removida com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover oração');
    } finally {
      setDeleting(null);
    }
  };

  const categories = {
    oracao: {
      label: 'Orações',
      icon: <BookHeart className="w-4 h-4" />
    },
    guia: {
      label: 'Guias de Oração',
      icon: <BookHeart className="w-4 h-4" />
    },
    terco: {
      label: 'Terços e Rosários',
      icon: <BookHeart className="w-4 h-4" />
    }
  };

  const renderPrayerCard = (prayer: Prayer) => (
    <Card key={prayer.id} className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-sm transition-all hover:shadow-2xl hover:shadow-slate-200/70 border border-white/20">
      <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 border-b border-slate-100/50 pb-6 px-8 pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-1/2">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100/50 flex items-center justify-center">
              <BookHeart className="text-primary h-5 w-5" />
            </div>
            <div className="w-full">
              <Input
                value={prayer.title}
                onChange={(e) => handleTitleChange(prayer.id, e.target.value)}
                className="text-xl font-black text-slate-800 tracking-tight bg-transparent border-none focus-visible:ring-1 focus-visible:ring-blue-500 p-0 h-auto"
              />
              <CardDescription className="text-sm font-medium text-slate-500 tracking-wider inline-block mt-1">
                {categories[prayer.category as keyof typeof categories]?.label || prayer.category}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={() => deletePrayer(prayer.id)}
              disabled={deleting === prayer.id}
              className="bg-white/80 hover:bg-red-50 hover:text-red-600 border-red-100 text-red-500 font-bold px-4 py-5 rounded-2xl transition-all shadow-sm flex items-center gap-2"
            >
              {deleting === prayer.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
            <Button 
              onClick={() => savePrayer(prayer)}
              disabled={saving === prayer.id}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-5 rounded-2xl shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              {saving === prayer.id ? (
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
        <div>
          <div className="flex justify-between items-center mb-3 px-1">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Conteúdo do Texto</Label>
          </div>
          <Textarea
            value={prayer.content || ''}
            onChange={(e) => handleContentChange(prayer.id, e.target.value)}
            className="min-h-[300px] font-mono text-sm leading-relaxed rounded-2xl border-slate-200 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white/50 p-6 shadow-inner"
            placeholder="Digite a oração ou guia aqui..."
          />
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <MainLayout title="Orações e Guias" subtitle="Gerencie as orações disponíveis para a IA">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <p className="text-slate-500 font-medium animate-pulse">Carregando orações...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Orações e Guias" 
      subtitle="Gerencie os guias, terços e orações que a MarIA pode ensinar ou enviar."
    >
      <div className="flex justify-between items-center mb-8">
        <div className="bg-white/40 backdrop-blur-xl p-2 rounded-3xl inline-block shadow-sm border border-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-transparent h-auto p-0 flex gap-2">
              <TabsTrigger 
                value="all"
                className="px-6 py-3 rounded-2xl font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:bg-white/60"
              >
                Todas
              </TabsTrigger>
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
          </Tabs>
        </div>
        
        <Button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-6 rounded-2xl shadow-lg shadow-blue-200 transition-all hover:scale-[1.02]"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Oração
        </Button>
      </div>

      {isCreating && (
        <Card className="mb-8 border-none shadow-xl shadow-blue-100/50 rounded-[2.5rem] overflow-hidden bg-white/90 backdrop-blur-sm border-2 border-blue-100">
          <CardHeader className="bg-blue-50/50 pb-6 px-8 pt-8">
            <CardTitle className="text-xl font-black text-blue-900">Adicionar Nova Oração</CardTitle>
            <CardDescription>Crie um novo guia ou oração para o sistema.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Título da Oração</Label>
                <Input 
                  placeholder="Ex: Oração de São Bento" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <select 
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  <option value="oracao">Oração Simples</option>
                  <option value="guia">Guia de Oração (Passo a passo)</option>
                  <option value="terco">Terço ou Rosário</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Conteúdo Completo</Label>
              <Textarea 
                placeholder="Insira o texto da oração..." 
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="min-h-[200px] rounded-xl font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setIsCreating(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button onClick={createPrayer} disabled={saving === 'new'} className="rounded-xl px-8 bg-blue-600 hover:bg-blue-700">
                {saving === 'new' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Nova Oração
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
        {prayers.length === 0 ? (
          <div className="text-center py-12 bg-white/50 rounded-[3rem] border border-white/20">
            <BookHeart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-600">Nenhuma oração cadastrada</h3>
            <p className="text-slate-400 mt-2">Clique no botão "Nova Oração" para começar a adicionar.</p>
          </div>
        ) : (
          prayers.filter(p => activeTab === 'all' || p.category === activeTab).length === 0 ? (
            <div className="text-center py-12 bg-white/50 rounded-[3rem] border border-white/20">
              <BookHeart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-600">Nenhum item nesta categoria</h3>
            </div>
          ) : (
            prayers
              .filter(p => activeTab === 'all' || p.category === activeTab)
              .map(renderPrayerCard)
          )
        )}
      </div>
    </MainLayout>
  );
}

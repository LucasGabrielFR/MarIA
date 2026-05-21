import { useState, useEffect } from 'react'
import { API_URL, apiRequest } from '../lib/api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MainLayout } from '../components/layout/main-layout'
import { DollarSign, TrendingUp, CreditCard, AlertCircle, Calendar, Ban, Trash2, Loader2, RefreshCw, ArrowUpCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function FinancePage() {
  const [summary, setSummary] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Estados para ação de cancelar/excluir
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [actionType, setActionType] = useState<'cancel' | 'delete' | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Estados para alteração de plano (Update/Upgrade)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [editTier, setEditTier] = useState<'basic' | 'premium'>('basic');
  const [editCycle, setEditCycle] = useState<'monthly' | 'annual'>('monthly');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Estados para Filtro de Período
  const [activeFilter, setActiveFilter] = useState<'mes_atual' | 'ultima_semana' | '15_dias' | '30_dias' | '3_meses' | '6_meses' | 'ultimo_ano' | 'todo_periodo' | 'custom'>('mes_atual');
  const [activeFilterLabel, setActiveFilterLabel] = useState('Mês Atual');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  // Datas temporárias para o formulário customizado
  const [tempStart, setTempStart] = useState<string>('');
  const [tempEnd, setTempEnd] = useState<string>('');

  const computeDateRange = (type: string) => {
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    let start = new Date();

    switch (type) {
      case 'mes_atual':
        start = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
        break;
      case 'ultima_semana':
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        break;
      case '15_dias':
        start = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        break;
      case '30_dias':
        start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        break;
      case '3_meses':
        start = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate(), 0, 0, 0, 0);
        break;
      case '6_meses':
        start = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate(), 0, 0, 0, 0);
        break;
      case 'ultimo_ano':
        start = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate(), 0, 0, 0, 0);
        break;
      case 'todo_periodo':
        return { start: '', end: '' };
      default:
        return { start: '', end: '' };
    }

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  };

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      let summaryUrl = `${API_URL}/admin/finance/summary`;
      let subsUrl = `${API_URL}/admin/finance/subscriptions?limit=20`;

      const params = [];
      if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
      if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);

      if (params.length > 0) {
        const queryStr = params.join('&');
        summaryUrl += `?${queryStr}`;
        subsUrl += `&${queryStr}`;
      }

      const [sumRes, subRes] = await Promise.all([
        fetch(summaryUrl),
        fetch(subsUrl)
      ]);
      
      if (sumRes.ok) setSummary(await sumRes.json());
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscriptions(subData.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  // Inicializa dados e usuário
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('maria_user');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Erro ao ler usuário do localStorage:', e);
    }

    const range = computeDateRange('mes_atual');
    setStartDate(range.start);
    setEndDate(range.end);

    const todayStr = new Date().toISOString().split('T')[0];
    const firstDayStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    setTempStart(firstDayStr);
    setTempEnd(todayStr);
  }, []);

  // Recarrega sempre que as datas de filtro mudam
  useEffect(() => {
    if (startDate !== '' || endDate !== '' || activeFilter === 'todo_periodo') {
      fetchFinanceData();
    }
  }, [startDate, endDate]);

  const formatCurrency = (val: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const isSuperAdmin = currentUser?.email === 'lucasgabriel@acutistech.com.br' || currentUser?.role === 'superadmin';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border border-green-200 px-3 py-1 capitalize">pago</Badge>;
      case 'canceled':
        return <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border border-amber-200 px-3 py-1 capitalize">cancelado</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-700 hover:bg-slate-50 border border-slate-200 px-3 py-1 capitalize">{status}</Badge>;
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedSub || !actionType) return;
    setActionLoading(true);
    try {
      if (actionType === 'cancel') {
        await apiRequest(`/admin/finance/subscriptions/${selectedSub.id}/cancel`, {
          method: 'POST',
          headers: {
            'x-admin-email': currentUser?.email || '',
          }
        });
        toast.success('Assinatura cancelada com sucesso!');
      } else if (actionType === 'delete') {
        await apiRequest(`/admin/finance/subscriptions/${selectedSub.id}`, {
          method: 'DELETE',
          headers: {
            'x-admin-email': currentUser?.email || '',
          }
        });
        toast.success('Pagamento apagado com sucesso!');
      }
      
      // Recarregar os dados respeitando o período filtrado
      await fetchFinanceData();
      setIsConfirmDialogOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao realizar ação');
    } finally {
      setActionLoading(false);
      setSelectedSub(null);
      setActionType(null);
    }
  };

  const handleSyncAsaas = async () => {
    setSyncing(true);
    try {
      const res = await apiRequest('/admin/finance/sync-asaas', {
        method: 'POST',
        headers: {
          'x-admin-email': currentUser?.email || '',
        }
      });
      toast.success(`Sincronização concluída! Assinaturas sincronizadas: ${res.synced}`);
      await fetchFinanceData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao sincronizar com o Asaas');
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateSubscription = async () => {
    if (!selectedSub) return;
    setUpdateLoading(true);
    try {
      await apiRequest(`/admin/finance/subscriptions/${selectedSub.id}/update`, {
        method: 'POST',
        headers: {
          'x-admin-email': currentUser?.email || '',
        },
        body: JSON.stringify({
          tier: editTier,
          cycle: editCycle
        })
      });
      toast.success('Assinatura atualizada no Asaas com sucesso!');
      await fetchFinanceData();
      setIsUpdateDialogOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao atualizar assinatura no Asaas');
    } finally {
      setUpdateLoading(false);
      setSelectedSub(null);
    }
  };

  const handlePresetSelect = (preset: typeof activeFilter, label: string) => {
    setActiveFilter(preset);
    setActiveFilterLabel(label);
    const range = computeDateRange(preset);
    setStartDate(range.start);
    setEndDate(range.end);
    setIsFilterDialogOpen(false);
    toast.success(`Filtro "${label}" aplicado!`);
  };

  const handleApplyCustom = () => {
    if (!tempStart || !tempEnd) {
      toast.error('Preencha ambas as datas!');
      return;
    }
    const startDateTime = new Date(tempStart + 'T00:00:00.000Z').toISOString();
    const endDateTime = new Date(tempEnd + 'T23:59:59.999Z').toISOString();
    
    setStartDate(startDateTime);
    setEndDate(endDateTime);
    setActiveFilter('custom');
    
    const formatLocal = (dStr: string) => {
      const parts = dStr.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };
    setActiveFilterLabel(`Personalizado: ${formatLocal(tempStart)} a ${formatLocal(tempEnd)}`);
    setIsFilterDialogOpen(false);
    toast.success('Filtro de período personalizado aplicado!');
  };

  return (
    <MainLayout title="Financeiro" subtitle="Gestão de receita, custos de IA e lucratividade do projeto.">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FinanceCard 
          title="Faturamento Bruto" 
          value={formatCurrency(summary?.total_revenue)}
          icon={<DollarSign className="h-5 w-5" />}
          color="bg-green-50 text-green-600"
          description="Receita total confirmada"
        />
        <FinanceCard 
          title="Custos de IA" 
          value={formatCurrency(summary?.total_cost)}
          icon={<TrendingUp className="h-5 w-5" />}
          color="bg-amber-50 text-amber-600"
          description="Tokens OpenRouter + Magisterium"
        />
        <FinanceCard 
          title="Lucro Líquido" 
          value={formatCurrency(summary?.net_profit)}
          icon={<CreditCard className="h-5 w-5" />}
          color="bg-blue-50 text-blue-600"
          description="Receita - Custos de IA"
        />
        <FinanceCard 
          title="Margem de Contribuição" 
          value={`${(summary?.margin_percentage || 0).toFixed(1)}%`}
          icon={<AlertCircle className="h-5 w-5" />}
          color="bg-purple-50 text-purple-600"
          description="Eficiência financeira"
        />
      </div>

      <div className="mt-10 bg-white rounded-3xl shadow-sm p-8 border border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold text-slate-800">Últimas Assinaturas</h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Período Ativo</span>
              <span className="text-xs font-extrabold text-blue-700 bg-blue-50/70 border border-blue-100 px-3 py-1 rounded-full">{activeFilterLabel}</span>
            </div>
            <button 
              onClick={handleSyncAsaas}
              disabled={syncing}
              className="flex items-center gap-2 text-emerald-700 text-sm font-bold bg-emerald-50 hover:bg-emerald-100/80 px-4 py-2 rounded-full transition-all border border-emerald-100 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar com o ASAAS'}
            </button>
            <button 
              onClick={() => setIsFilterDialogOpen(true)}
              className="flex items-center gap-2 text-primary text-sm font-bold bg-blue-50 hover:bg-blue-100/80 px-4 py-2 rounded-full transition-all border border-blue-100 hover:scale-105 active:scale-95"
            >
              <Calendar className="h-4 w-4" />
              Filtrar Período
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-50">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-bold">Fiel</TableHead>
                <TableHead className="font-bold">Plano</TableHead>
                <TableHead className="font-bold">Valor</TableHead>
                <TableHead className="font-bold">Data Pagto</TableHead>
                <TableHead className="font-bold">Expiração</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                {isSuperAdmin && <TableHead className="font-bold text-right pr-6">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 7 : 6} className="text-center py-10 text-slate-400">Carregando dados...</TableCell>
                </TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 7 : 6} className="text-center py-10 text-slate-400">Nenhuma assinatura registrada ainda.</TableCell>
                </TableRow>
              ) : subscriptions.map((sub: any) => (
                <TableRow key={sub.id} className="border-slate-50 hover:bg-slate-50/50 transition-all">
                  <TableCell className="font-bold py-4">
                    <div className="flex flex-col">
                      <span>{sub.users?.name || 'Sem nome'}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{sub.users?.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize font-medium text-slate-600 bg-slate-50 border-slate-200 px-3 py-1">
                      {sub.tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-slate-700">
                    {formatCurrency(sub.amount)}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(sub.status)}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell className="text-right pr-4 py-4">
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => {
                            setSelectedSub(sub);
                            setEditTier(sub.tier === 'premium' ? 'premium' : 'basic');
                            setEditCycle(sub.amount > 50 ? 'annual' : 'monthly');
                            setIsUpdateDialogOpen(true);
                          }}
                          disabled={sub.status === 'canceled'}
                          className={`p-2 rounded-xl transition-all ${
                            sub.status === 'canceled' 
                              ? 'opacity-40 cursor-not-allowed text-slate-300 bg-slate-50' 
                              : 'text-blue-600 bg-blue-50 hover:bg-blue-100 hover:scale-105 active:scale-95'
                          }`}
                          title="Alterar Plano/Ciclo (Upgrade)"
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedSub(sub);
                            setActionType('cancel');
                            setIsConfirmDialogOpen(true);
                          }}
                          disabled={sub.status === 'canceled'}
                          className={`p-2 rounded-xl transition-all ${
                            sub.status === 'canceled' 
                              ? 'opacity-40 cursor-not-allowed text-slate-300 bg-slate-50' 
                              : 'text-amber-600 bg-amber-50 hover:bg-amber-100 hover:scale-105 active:scale-95'
                          }`}
                          title="Cancelar assinatura"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedSub(sub);
                            setActionType('delete');
                            setIsConfirmDialogOpen(true);
                          }}
                          className="p-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 hover:scale-105 active:scale-95 transition-all"
                          title="Excluir pagamento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {isConfirmDialogOpen && (
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent className="sm:max-w-[420px] rounded-3xl border border-slate-100 shadow-2xl p-6 bg-white">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                {actionType === 'cancel' ? (
                  <>
                    <Ban className="h-5 w-5 text-amber-600" />
                    Cancelar Assinatura
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5 text-red-600" />
                    Apagar Pagamento
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500 leading-relaxed">
                {actionType === 'cancel' ? (
                  <>
                    Tem certeza de que deseja cancelar a assinatura de <strong>{selectedSub?.users?.name || 'Sem nome'}</strong>? 
                    Isso atualizará o status do pagamento para <span className="text-amber-600 font-bold">cancelado</span> e revogará os benefícios premium do fiel imediatamente.
                  </>
                ) : (
                  <>
                    Tem certeza de que deseja apagar permanentemente o pagamento de <strong>{selectedSub?.users?.name || 'Sem nome'}</strong>?
                    Esta ação excluirá o registro de pagamento e revogará os benefícios premium do fiel imediatamente. <span className="text-red-600 font-bold">Esta ação não pode ser desfeita.</span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 flex flex-row gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsConfirmDialogOpen(false)}
                disabled={actionLoading}
                className="flex-1 sm:flex-none h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-all"
              >
                Voltar
              </Button>
              <Button
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`flex-1 sm:flex-none h-11 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 ${
                  actionType === 'cancel' 
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-100' 
                    : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100'
                }`}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : actionType === 'cancel' ? (
                  'Confirmar Cancelamento'
                ) : (
                  'Confirmar Exclusão'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isFilterDialogOpen && (
        <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
          <DialogContent className="sm:max-w-[460px] rounded-3xl border border-slate-100 shadow-2xl p-6 bg-white">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Filtrar Período
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500 leading-relaxed">
                Selecione um dos atalhos rápidos ou defina um intervalo de datas personalizado para recalcular os dados financeiros.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 my-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Atalhos Rápidos</p>
                <div className="grid grid-cols-2 gap-2">
                  <PresetButton preset="mes_atual" label="Mês Atual" current={activeFilter} onClick={() => handlePresetSelect('mes_atual', 'Mês Atual')} />
                  <PresetButton preset="ultima_semana" label="Última Semana" current={activeFilter} onClick={() => handlePresetSelect('ultima_semana', 'Última Semana')} />
                  <PresetButton preset="15_dias" label="Últimos 15 Dias" current={activeFilter} onClick={() => handlePresetSelect('15_dias', 'Últimos 15 Dias')} />
                  <PresetButton preset="30_dias" label="Últimos 30 Dias" current={activeFilter} onClick={() => handlePresetSelect('30_dias', 'Últimos 30 Dias')} />
                  <PresetButton preset="3_meses" label="Últimos 3 Meses" current={activeFilter} onClick={() => handlePresetSelect('3_meses', 'Últimos 3 Meses')} />
                  <PresetButton preset="6_meses" label="Últimos 6 Meses" current={activeFilter} onClick={() => handlePresetSelect('6_meses', 'Últimos 6 Meses')} />
                  <PresetButton preset="ultimo_ano" label="Último Ano" current={activeFilter} onClick={() => handlePresetSelect('ultimo_ano', 'Último Ano')} />
                  <PresetButton preset="todo_periodo" label="Todo o Período" current={activeFilter} onClick={() => handlePresetSelect('todo_periodo', 'Todo o Período')} />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Período Personalizado</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Início</label>
                    <input 
                      type="date" 
                      value={tempStart}
                      onChange={(e) => setTempStart(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Fim</label>
                    <input 
                      type="date" 
                      value={tempEnd}
                      onChange={(e) => setTempEnd(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleApplyCustom}
                  className="w-full h-11 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Aplicar Período Customizado
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isUpdateDialogOpen && (
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent className="sm:max-w-[460px] rounded-3xl border border-slate-100 shadow-2xl p-6 bg-white">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-blue-600" />
                Alterar Plano / Ciclo (Upgrade)
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500 leading-relaxed">
                Atualize o plano ou a recorrência da assinatura de <strong>{selectedSub?.users?.name || 'Sem nome'}</strong> diretamente no Asaas.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 my-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Escolha o Plano</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditTier('basic')}
                    className={`h-16 px-4 rounded-2xl border font-bold transition-all text-left flex flex-col justify-center gap-0.5 ${
                      editTier === 'basic'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm shadow-blue-50'
                        : 'bg-slate-50/50 text-slate-600 border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm">Plano Básico</span>
                    <span className="text-xs font-medium text-slate-400">R$ 14,99 / R$ 154,80</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTier('premium')}
                    className={`h-16 px-4 rounded-2xl border font-bold transition-all text-left flex flex-col justify-center gap-0.5 ${
                      editTier === 'premium'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm shadow-blue-50'
                        : 'bg-slate-50/50 text-slate-600 border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm">Plano Premium</span>
                    <span className="text-xs font-medium text-slate-400">R$ 29,90 / R$ 322,80</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Ciclo de Cobrança</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditCycle('monthly')}
                    className={`h-14 px-4 rounded-2xl border font-bold transition-all text-left flex flex-col justify-center ${
                      editCycle === 'monthly'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm shadow-blue-50'
                        : 'bg-slate-50/50 text-slate-600 border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm">Mensal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditCycle('annual')}
                    className={`h-14 px-4 rounded-2xl border font-bold transition-all text-left flex flex-col justify-center ${
                      editCycle === 'annual'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm shadow-blue-50'
                        : 'bg-slate-50/50 text-slate-600 border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm">Anual (Economize)</span>
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 flex flex-row gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsUpdateDialogOpen(false)}
                disabled={updateLoading}
                className="flex-1 sm:flex-none h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-all"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateSubscription}
                disabled={updateLoading}
                className="flex-1 sm:flex-none h-11 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100"
              >
                {updateLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
  )
}

function FinanceCard({ title, value, icon, color, description }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl ${color} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-black text-slate-800">{value}</p>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 font-bold">{description}</p>
    </div>
  )
}

function PresetButton({ preset, label, current, onClick }: { preset: string, label: string, current: string, onClick: () => void }) {
  const active = current === preset;
  return (
    <button
      onClick={onClick}
      className={`h-10 px-3 rounded-xl text-[11px] font-bold border transition-all text-left flex items-center justify-between ${
        active 
          ? 'bg-blue-50 text-primary border-primary/30 shadow-sm' 
          : 'bg-slate-50/50 text-slate-600 border-slate-100 hover:bg-slate-50 hover:border-slate-200 hover:scale-[1.02] active:scale-[0.98]'
      }`}
    >
      <span>{label}</span>
      {active && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
    </button>
  );
}


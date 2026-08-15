import { useState, useEffect } from 'react'
import { API_URL } from '../lib/api'

import { MainLayout } from '../components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Database, Activity, DollarSign, Terminal, Calendar } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function LogsPage() {
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [usageLogs, setUsageLogs] = useState<any[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para Filtro de Período
  const [activeFilter, setActiveFilter] = useState<'mes_atual' | 'ultima_semana' | '15_dias' | '30_dias' | '3_meses' | '6_meses' | 'ultimo_ano' | 'todo_periodo' | 'custom'>('mes_atual');
  const [activeFilterLabel, setActiveFilterLabel] = useState('Mês Atual');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  // Datas temporárias para o formulário customizado
  const [tempStart, setTempStart] = useState<string>('');
  const [tempEnd, setTempEnd] = useState<string>('');

  // Estados para a modal de visualização de JSON de Webhook
  const [selectedJson, setSelectedJson] = useState<any>(null);
  const [isJsonOpen, setIsJsonOpen] = useState(false);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      let statsUrl = `${API_URL}/panel/stats/daily`;
      let usageUrl = `${API_URL}/panel/logs/usage?limit=50`;
      let webhookUrl = `${API_URL}/panel/logs/webhooks?limit=50`;

      const params = [];
      if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
      if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);

      if (params.length > 0) {
        const queryStr = params.join('&');
        statsUrl += `?${queryStr}`;
        usageUrl += `&${queryStr}`;
        webhookUrl += `&${queryStr}`;
      }

      const [statsRes, usageRes, webhookRes] = await Promise.all([
        fetch(statsUrl),
        fetch(usageUrl),
        fetch(webhookUrl)
      ]);

      const statsData = await statsRes.json();
      const usageData = await usageRes.json();
      const webhookData = await webhookRes.json();

      setDailyStats(statsData);
      setUsageLogs(usageData.data || []);
      setWebhookLogs(webhookData.data || []);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toast.error('Erro ao carregar dados de telemetria');
    } finally {
      setLoading(false);
    }
  };

  // Inicializa dados e usuário
  useEffect(() => {
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
      fetchData();
    }
  }, [startDate, endDate]);

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
    <MainLayout title="Dados e Logs" subtitle="Análise estatística e auditoria técnica do sistema.">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Período Ativo:</span>
          <span className="text-xs font-extrabold text-blue-700 bg-blue-50/70 border border-blue-100 px-3 py-1 rounded-full">{activeFilterLabel}</span>
        </div>
        <button 
          onClick={() => setIsFilterDialogOpen(true)}
          className="flex items-center gap-2 text-primary text-xs sm:text-sm font-bold bg-blue-50 hover:bg-blue-100/80 px-4 py-2 rounded-full transition-all border border-blue-100 hover:scale-105 active:scale-95 shadow-sm"
        >
          <Calendar className="h-4 w-4" />
          Filtrar Período
        </button>
      </div>

      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-auto gap-1">
          <TabsTrigger value="stats" className="rounded-lg py-2 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-slate-500">
            <Activity size={16} className="mr-2" />
            Estatísticas
          </TabsTrigger>
          <TabsTrigger value="usage" className="rounded-lg py-2 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-slate-500">
            <Database size={16} className="mr-2" />
            Logs de Uso
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="rounded-lg py-2 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-slate-500">
            <Terminal size={16} className="mr-2" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-6 outline-none">
          {loading ? (
            <div className="text-center py-20 text-slate-400 font-medium bg-white rounded-3xl border border-slate-100 shadow-sm">Carregando estatísticas do período...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-white border-b border-slate-50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-primary rounded-xl">
                      <Activity size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-800">Consumo de Tokens</CardTitle>
                      <CardDescription className="text-slate-400 font-medium">Volume total processado por dia</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 px-2">
                  <div className="h-[300px] w-full">
                    {dailyStats.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 font-bold text-sm">Nenhum consumo de tokens registrado no período.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyStats}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}} 
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}} 
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                            itemStyle={{ fontSize: '12px', fontWeight: '800' }}
                            cursor={{ stroke: '#0047AB', strokeWidth: 1, strokeDasharray: '4 4' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="tokens" 
                            stroke="#0047AB" 
                            strokeWidth={4} 
                            dot={{ r: 4, fill: '#0047AB', strokeWidth: 2, stroke: '#fff' }} 
                            activeDot={{ r: 6, strokeWidth: 0 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-white border-b border-slate-50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-800">Custos (USD/BRL)</CardTitle>
                      <CardDescription className="text-slate-400 font-medium">Investimento diário em processamento</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 px-2">
                  <div className="h-[300px] w-full">
                    {dailyStats.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 font-bold text-sm">Nenhum custo registrado no período.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyStats}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}} 
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}} 
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                            itemStyle={{ fontSize: '12px', fontWeight: '800' }}
                            cursor={{ fill: '#f8fafc' }}
                            formatter={(value: any, name: any) => [
                              name === 'costUsd' ? `$${Number(value).toFixed(4)}` : `R$ ${Number(value).toFixed(4)}`,
                              name === 'costUsd' ? 'Custo USD' : 'Custo BRL'
                            ]}
                          />
                          <Bar dataKey="costUsd" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                          <Bar dataKey="costBrl" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="usage" className="outline-none">
          <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-800">Logs de Uso</CardTitle>
                  <CardDescription className="text-slate-500 font-medium">Histórico de chamadas à API de IA</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold px-3 py-1">
                  {usageLogs.length} registros no período
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="font-bold py-4 pl-8">Data</TableHead>
                    <TableHead className="font-bold">Usuário</TableHead>
                    <TableHead className="font-bold">Modelo</TableHead>
                    <TableHead className="font-bold">Tokens</TableHead>
                    <TableHead className="text-right font-bold pr-8">Custo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-slate-400">Carregando logs...</TableCell>
                    </TableRow>
                  ) : usageLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-slate-400">Nenhum log de uso encontrado neste período.</TableCell>
                    </TableRow>
                  ) : (
                    usageLogs.map((log) => (
                      <TableRow key={log.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="text-slate-500 font-medium pl-8 py-4">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-bold text-slate-700">{log.users?.name || 'Sistema/Cron'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px] border-slate-200 text-slate-500 bg-white">
                            {log.model}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-600">{log.total_tokens.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-black text-green-600 pr-8">
                          ${Number(log.cost).toFixed(6)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="outline-none">
          <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
                  <Terminal size={20} />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-800">Webhook Logs</CardTitle>
                  <CardDescription className="text-slate-500 font-medium">Eventos recebidos do Uazapi em tempo real</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="font-bold py-4 pl-8">Data</TableHead>
                    <TableHead className="font-bold">Evento</TableHead>
                    <TableHead className="font-bold">Payload Resumido</TableHead>
                    <TableHead className="text-right font-bold pr-8">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-slate-400">Carregando webhooks...</TableCell>
                    </TableRow>
                  ) : webhookLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-slate-400">Nenhum webhook recebido no período.</TableCell>
                    </TableRow>
                  ) : (
                    webhookLogs.map((log) => (
                      <TableRow key={log.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <TableCell className="text-slate-500 font-medium pl-8 py-4">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none font-bold">
                            {log.event_type || 'message'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[400px] truncate font-mono text-[11px] text-slate-400 bg-slate-50/50 rounded p-1">
                          {JSON.stringify(log.payload)}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary font-bold hover:bg-blue-50 rounded-lg transition-all"
                            onClick={() => {
                              setSelectedJson(log.payload);
                              setIsJsonOpen(true);
                            }}
                          >
                            Ver JSON
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isFilterDialogOpen && (
        <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
          <DialogContent className="sm:max-w-[460px] rounded-3xl border border-slate-100 shadow-2xl p-6 bg-white">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Filtrar Período
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500 leading-relaxed">
                Selecione um dos atalhos rápidos ou defina um intervalo de datas personalizado para refinar os dados e logs de telemetria.
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

      {isJsonOpen && (
        <Dialog open={isJsonOpen} onOpenChange={setIsJsonOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-3xl border border-slate-100 shadow-2xl p-6 bg-white">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                Payload do Webhook
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500">
                Payload JSON completo enviado pela API do Uazapi.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4">
              <div className="bg-slate-950 text-slate-100 p-5 rounded-2xl max-h-[450px] overflow-y-auto font-mono text-xs leading-relaxed border border-slate-900 shadow-inner">
                <pre className="whitespace-pre-wrap">{JSON.stringify(selectedJson, null, 2)}</pre>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setIsJsonOpen(false)}
                className="w-full sm:w-auto h-11 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border-none font-bold transition-all"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
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

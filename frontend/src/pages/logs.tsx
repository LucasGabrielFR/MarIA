import { useState, useEffect } from 'react'
import { MainLayout } from '../components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Database, Activity, DollarSign, Terminal, Filter, Download } from 'lucide-react'
import { Button } from "@/components/ui/button"

export default function LogsPage() {
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [usageLogs, setUsageLogs] = useState<any[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usageRes, webhookRes] = await Promise.all([
          fetch('http://localhost:3000/admin/stats/daily'),
          fetch('http://localhost:3000/admin/logs/usage?limit=20'),
          fetch('http://localhost:3000/admin/logs/webhooks?limit=20')
        ]);

        const statsData = await statsRes.json();
        const usageData = await usageRes.json();
        const webhookData = await webhookRes.json();

        setDailyStats(statsData);
        setUsageLogs(usageData.data || []);
        setWebhookLogs(webhookData.data || []);
      } catch (error) {
        console.error('Erro ao buscar logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <MainLayout title="Dados e Logs" subtitle="Análise estatística e auditoria técnica do sistema.">
      <div className="flex justify-end gap-3 mb-6">
        <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 gap-2 font-bold">
          <Filter size={16} />
          Filtrar
        </Button>
        <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 gap-2 font-bold">
          <Download size={16} />
          Exportar CSV
        </Button>
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
                        formatter={(value: any, name: string) => [
                          name === 'costUsd' ? `$${Number(value).toFixed(2)}` : `R$ ${Number(value).toFixed(2)}`,
                          name === 'costUsd' ? 'Custo USD' : 'Custo BRL'
                        ]}
                      />
                      <Bar dataKey="costUsd" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                      <Bar dataKey="costBrl" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
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
                  {usageLogs.length} registros recentes
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
                  {usageLogs.map((log) => (
                    <TableRow key={log.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="text-slate-500 font-medium pl-8 py-4">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-bold text-slate-700">{log.users?.name || 'Sistema'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] border-slate-200 text-slate-500 bg-white">
                          {log.model}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-600">{log.total_tokens.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-black text-green-600 pr-8">
                        ${Number(log.cost).toFixed(4)}
                      </TableCell>
                    </TableRow>
                  ))}
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
                  {webhookLogs.map((log) => (
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
                        <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-blue-50 rounded-lg">
                          Ver JSON
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  )
}

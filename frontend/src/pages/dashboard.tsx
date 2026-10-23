import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../lib/api'

import { StatsCards } from '../components/dashboard/stats-cards'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MainLayout } from '../components/layout/main-layout'
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [waUsers, setWaUsers] = useState<any[]>([]);
  const [isMonthlyView, setIsMonthlyView] = useState(true);
  const [activeTab, setActiveTab] = useState<'total' | 'mobile' | 'chat'>('total');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/panel/stats`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      }
    };

    fetchStats();

    fetch(`${API_URL}/panel/wa-users`)
      .then((response) => response.json())
      .then((data) => setWaUsers(data))
      .catch((error) => console.error('Erro ao buscar usuários:', error));

  }, []);

  const recentUsers = (stats?.recentUsers || []).filter((user: any) => activeTab === 'mobile' ? user.origin === 'mobile' : activeTab === 'chat' ? user.origin === 'wpp' : true);
  const whatsappUsers = waUsers.filter((user: any) => user.origin === 'wpp');

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <MainLayout title="Dashboard Geral" subtitle="Bem-vindo ao painel de controle da MarIA.">
      <div className="flex flex-wrap gap-2 mb-6 rounded-xl bg-slate-100 p-1 w-fit" role="tablist" aria-label="Visão do dashboard">
        {([{ id: 'total', label: 'Total' }, { id: 'mobile', label: 'Mobile' }, { id: 'chat', label: 'Chat / WhatsApp' }] as const).map((tab) => <button key={tab.id} role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${activeTab === tab.id ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{tab.label}</button>)}
      </div>

      {activeTab === 'total' && <StatsCards stats={stats} variant="general" />}
      {activeTab === 'mobile' && <StatsCards stats={stats} variant="mobile" />}
      {activeTab === 'chat' && <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Usuários WhatsApp', value: whatsappUsers.length.toLocaleString('pt-BR'), detail: 'Somente origin = wpp', tone: 'blue' },
          { title: 'Mensagens dos usuários WPP', value: whatsappUsers.reduce((sum: number, user: any) => sum + (user.metrics?.total_messages || 0), 0).toLocaleString('pt-BR'), detail: 'Mensagens associadas a perfis WPP', tone: 'amber' },
          { title: 'Novos usuários WPP (30 dias)', value: whatsappUsers.filter((user: any) => new Date(user.created_at) >= new Date(Date.now() - 30 * 86400000)).length.toLocaleString('pt-BR'), detail: 'Cadastros recentes de WhatsApp', tone: 'green' },
        ].map((metric) => <div key={metric.title} className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white rounded-2xl p-6"><p className="text-sm font-semibold text-slate-500">{metric.title}</p><p className="text-3xl font-bold text-slate-800 mt-3">{metric.value}</p><p className="text-xs text-slate-500 mt-2 font-medium">{metric.detail}</p></div>)}
      </div>}

      {activeTab === 'chat' && <div className="mt-8 bg-white rounded-3xl shadow-sm p-8 border border-slate-100"><div className="mb-6"><h3 className="text-xl font-bold text-slate-800">Novos usuários do WhatsApp</h3><p className="text-sm text-slate-500 mt-1">Somente origin = wpp, do mais recente ao mais antigo</p></div><div className="overflow-hidden rounded-xl border border-slate-50"><Table><TableHeader className="bg-slate-50/50"><TableRow className="hover:bg-transparent border-slate-100"><TableHead className="font-bold">Usuário</TableHead><TableHead className="font-bold">Status</TableHead><TableHead className="text-right font-bold">Cadastro</TableHead></TableRow></TableHeader><TableBody>{recentUsers.map((user: any) => <TableRow key={user.id} className="border-slate-50 hover:bg-slate-50/50 transition-all"><TableCell className="font-bold flex items-center gap-3 py-4"><Avatar className="h-9 w-9 border border-slate-100 shadow-sm"><AvatarFallback className="bg-blue-50 text-primary text-xs font-bold">{(user.name || '?')[0]}</AvatarFallback></Avatar><div className="flex flex-col"><span>{user.name || 'Usuário sem nome'}</span><span className="text-[10px] text-slate-400 font-normal">{user.email || 'E-mail não informado'}</span></div></TableCell><TableCell><Badge className={user.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1' : 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3 py-1'}><span className={cn('h-1.5 w-1.5 rounded-full mr-2', user.status === 'active' ? 'bg-green-600' : 'bg-amber-600')}></span>{user.status === 'active' ? 'Ativo' : 'Inativo'}</Badge></TableCell><TableCell className="text-right text-slate-400 text-sm font-medium">{formatTime(user.created_at)}</TableCell></TableRow>)}{recentUsers.length === 0 && <TableRow><TableCell colSpan={3} className="py-8 text-center text-slate-500">Nenhum usuário encontrado.</TableCell></TableRow>}</TableBody></Table></div></div>}

      {activeTab === 'total' && <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm p-8 border border-slate-100">
          <div className="flex justify-between items-center mb-8"><div><h3 className="text-xl font-bold text-slate-800">Conversas Recentes</h3><p className="text-sm text-slate-500 mt-1">Atividade mais recente dos usuários</p></div><button onClick={() => navigate('/wa-users')} className="text-primary text-sm font-bold hover:underline bg-blue-50 px-4 py-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Ver todas</button></div>
          <div className="overflow-hidden rounded-xl border border-slate-50"><Table><TableHeader className="bg-slate-50/50"><TableRow className="hover:bg-transparent border-slate-100"><TableHead className="font-bold">Usuário</TableHead><TableHead className="font-bold">Tipo</TableHead><TableHead className="font-bold">Status</TableHead><TableHead className="text-right font-bold">Última msg</TableHead></TableRow></TableHeader><TableBody>
            {(stats?.recentConversations || []).map((conv: any) => <TableRow key={conv.id} role="button" tabIndex={0} onClick={() => navigate('/wa-users', { state: { userId: conv.userId } })} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate('/wa-users', { state: { userId: conv.userId } }); } }} className="border-slate-50 hover:bg-slate-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary transition-all duration-200 cursor-pointer group"><TableCell className="font-bold flex items-center gap-3 py-4"><Avatar className="h-9 w-9 border border-slate-100 shadow-sm"><AvatarFallback className="bg-blue-50 text-primary text-xs font-bold">{(conv.user || '?')[0]}</AvatarFallback></Avatar><div className="flex flex-col min-w-0"><span className="group-hover:text-primary transition-colors">{conv.user}</span><span className="text-[10px] text-slate-400 font-normal line-clamp-1 max-w-[280px]">{conv.content}</span></div></TableCell><TableCell><Badge variant="outline" className="font-medium text-slate-600 bg-slate-50 border-slate-200 px-3 py-1">{conv.role === 'user' ? 'Pergunta' : 'Resposta'}</Badge></TableCell><TableCell><Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1"><span className="h-1.5 w-1.5 rounded-full mr-2 bg-green-600" />{conv.status || 'Ativo'}</Badge></TableCell><TableCell className="text-right text-slate-400 text-sm font-medium">{formatTime(conv.time)}</TableCell></TableRow>)}
            {(stats?.recentConversations || []).length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-slate-500">Nenhuma conversa recente.</TableCell></TableRow>}
          </TableBody></Table></div>
        </div>
        <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100 flex flex-col">
          <h3 className="text-xl font-bold text-slate-800 mb-8">Saúde do Sistema</h3>
          <div className="space-y-6 flex-1">
            <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100"><div className="flex justify-between items-center mb-2"><p className="text-sm font-bold text-primary">Status da Persona</p><span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">ONLINE</span></div><p className="text-xs text-slate-500 mb-4 font-medium">Persona {stats?.health?.prompts || '—'} ativa e operante.</p><div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden"><div className="h-full bg-primary w-full rounded-full" /></div></div>
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100"><div className="flex justify-between items-center mb-2"><p className="text-sm font-bold text-secondary">Banco de Dados</p><span className="text-[10px] bg-secondary text-white px-2 py-0.5 rounded-full font-bold">{stats?.health?.database || '—'}</span></div><p className="text-xs text-slate-500 mb-4 font-medium">Conexão com Supabase estável.</p><div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden"><div className="h-full bg-secondary w-full rounded-full" /></div></div>
            <div className="p-5 rounded-2xl bg-green-50/50 border border-green-100"><p className="text-sm font-bold text-green-700 mb-1">Status Geral</p><p className="text-xs text-slate-500 font-medium">Sistema operando em modo: {stats?.health?.status || '—'}</p></div>
          </div>
          <button onClick={() => navigate('/settings')} className="w-full mt-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Ir para Configurações</button>
        </div>
      </div>}

      {activeTab === 'total' && <div className="mt-8 bg-white rounded-3xl shadow-sm p-8 border border-slate-100">
        <div className="mb-6"><h3 className="text-xl font-bold text-slate-800">Novos usuários</h3><p className="text-sm text-slate-500 mt-1">Todos os canais, do cadastro mais recente ao mais antigo</p></div>
        <div className="overflow-hidden rounded-xl border border-slate-50"><Table><TableHeader className="bg-slate-50/50"><TableRow className="hover:bg-transparent border-slate-100"><TableHead className="font-bold">Usuário</TableHead><TableHead className="font-bold">Origem</TableHead><TableHead className="font-bold">Status</TableHead><TableHead className="text-right font-bold">Cadastro</TableHead></TableRow></TableHeader><TableBody>
          {(stats?.recentUsers || []).map((user: any) => <TableRow key={user.id} role="button" tabIndex={0} onClick={() => navigate('/wa-users', { state: { userId: user.id } })} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate('/wa-users', { state: { userId: user.id } }); } }} className="border-slate-50 hover:bg-slate-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary transition-all duration-200 cursor-pointer group"><TableCell className="font-bold flex items-center gap-3 py-4"><Avatar className="h-9 w-9 border border-slate-100 shadow-sm"><AvatarFallback className="bg-blue-50 text-primary text-xs font-bold">{(user.name || '?')[0]}</AvatarFallback></Avatar><div className="flex flex-col"><span className="group-hover:text-primary transition-colors">{user.name || 'Usuário sem nome'}</span><span className="text-[10px] text-slate-400 font-normal">{user.email || 'E-mail não informado'}</span></div></TableCell><TableCell><Badge variant="outline" className="font-medium text-slate-600 bg-slate-50 border-slate-200 px-3 py-1">{user.origin === 'mobile' ? 'Mobile' : user.origin === 'wpp' ? 'WhatsApp' : user.origin || 'Não informada'}</Badge></TableCell><TableCell><Badge className={user.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1' : 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3 py-1'}><span className={cn('h-1.5 w-1.5 rounded-full mr-2', user.status === 'active' ? 'bg-green-600' : 'bg-amber-600')}></span>{user.status === 'active' ? 'Ativo' : 'Inativo'}</Badge></TableCell><TableCell className="text-right text-slate-400 text-sm font-medium">{formatTime(user.created_at)}</TableCell></TableRow>)}
        </TableBody></Table></div>
      </div>}

      {activeTab === 'mobile' && <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm p-8 border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Novos usuários</h3>
              <p className="text-sm text-slate-500 mt-1">Cadastros mais recentes primeiro</p>
            </div>
            <button 
              onClick={() => navigate('/mobile-curation')}
              className="text-primary text-sm font-bold hover:underline bg-blue-50 px-4 py-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Curadoria mobile
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-50">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="font-bold">Usuário</TableHead>
                  <TableHead className="font-bold">Tipo</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user: any) => (
                  <TableRow role="button" tabIndex={0}
                    key={user.id}
                    onClick={() => navigate('/users', { state: { userId: user.id } })}
                    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate('/users', { state: { userId: user.id } }); } }}
                    className="border-slate-50 hover:bg-slate-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary transition-all duration-200 cursor-pointer group"
                  >
                    <TableCell className="font-bold flex items-center gap-3 py-4">
                      <Avatar className="h-9 w-9 border border-slate-100 shadow-sm">
                        <AvatarFallback className="bg-blue-50 text-primary text-xs font-bold">{(user.name || '?')[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="group-hover:text-primary transition-colors">{user.name || 'Usuário sem nome'}</span>
                        <span className="text-[10px] text-slate-400 font-normal line-clamp-1 max-w-[200px]">{user.email || 'E-mail não informado'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium text-slate-600 bg-slate-50 border-slate-200 px-3 py-1">
                        {user.origin === 'mobile' ? 'Mobile' : user.origin === 'wpp' ? 'WhatsApp' : user.origin}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={user.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1' : 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3 py-1'}>
                        <span className={cn("h-1.5 w-1.5 rounded-full mr-2", user.status === 'active' ? "bg-green-600" : "bg-amber-600")}></span>
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-slate-400 text-sm font-medium">{formatTime(user.created_at)}</TableCell>
                  </TableRow>
                ))}
                {recentUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-slate-500">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100 flex flex-col">
          <h3 className="text-xl font-bold text-slate-800 mb-8">Uso do aplicativo</h3>
          <div className="space-y-6 flex-1">
            <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 hover:border-primary/30 transition-all group">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-bold text-primary">Telas mais acessadas</p>
                <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">30 DIAS</span>
              </div>
              <div className="space-y-2">{stats?.mobile?.topScreens?.length ? stats.mobile.topScreens.slice(0, 3).map((screen: any) => <div key={screen.screen} className="flex justify-between text-xs text-slate-600"><span className="truncate max-w-[150px]">{screen.screen}</span><strong>{screen.views}</strong></div>) : <p className="text-xs text-slate-500">Aguardando eventos do app.</p>}</div>
            </div>
            
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 hover:border-secondary/30 transition-all group">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-bold text-secondary">Estabilidade do app</p>
                <span className="text-[10px] bg-secondary text-white px-2 py-0.5 rounded-full font-bold">30 DIAS</span>
              </div>
              <p className="text-xs text-slate-500 mb-2 font-medium">{stats?.mobile?.crashes || 0} erro(s) reportado(s)</p>
              <p className="text-xs text-slate-500 font-medium">Versão principal: {stats?.mobile?.appVersions?.[0]?.version || '—'}</p>
            </div>

            <div className="p-5 rounded-2xl bg-green-50/50 border border-green-100 hover:border-green-300 transition-all">
              <p className="text-sm font-bold text-green-700 mb-1">Dados protegidos</p>
              <p className="text-xs text-slate-500 font-medium">Telemetria sem conteúdo de conversas ou dados sensíveis.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/settings')}
            className="w-full mt-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Ir para Configurações
          </button>
        </div>
      </div>}

      {activeTab === 'total' && <div className="mt-10 bg-white rounded-3xl shadow-sm p-8 border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-8">Análise Detalhada de IA</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats?.modelBreakdown?.map((item: any) => (
            <div key={item.model} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/30 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{item.name}</p>
                  <p className="text-lg font-bold text-slate-700">{item.tokens.toLocaleString()} tokens</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="text-xs font-bold italic">AI</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[11px] bg-white p-2 rounded-lg border border-slate-50">
                  <span className="text-slate-400 font-bold uppercase tracking-tight">Entrada (Prompt)</span>
                  <span className="text-slate-700 font-black">{item.promptTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] bg-white p-2 rounded-lg border border-slate-50">
                  <span className="text-slate-400 font-bold uppercase tracking-tight">Saída (Completion)</span>
                  <span className="text-slate-700 font-black">{item.completionTokens.toLocaleString()}</span>
                </div>
                
                <div className="pt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Custo USD</span>
                    <span className="text-slate-700 font-bold">${item.costUsd}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Custo BRL</span>
                    <span className="text-green-600 font-bold">R$ {item.costBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-4">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${Math.min((item.tokens / (stats?.totalTokens || 1)) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-400 text-center font-bold">
                  Representa {Math.round((item.tokens / (stats?.totalTokens || 1)) * 100)}% do volume total
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>}

      {activeTab !== 'mobile' && <div className="mt-10 bg-white rounded-3xl shadow-sm p-8 border border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold text-slate-800">Controle de Uso de IA por Usuário</h3>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${isMonthlyView ? 'text-primary' : 'text-slate-500'}`}>Mensal</span>
            <button 
              onClick={() => setIsMonthlyView(!isMonthlyView)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              style={{ backgroundColor: '#0047AB' }}
            >
              <span 
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${!isMonthlyView ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
            <span className={`text-sm font-medium ${!isMonthlyView ? 'text-primary' : 'text-slate-500'}`}>Total</span>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-50">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-bold">Usuário (Telefone)</TableHead>
                <TableHead className="font-bold">Plano</TableHead>
                <TableHead className="text-center font-bold">Membro Desde</TableHead>
                <TableHead className="text-center font-bold">Mensagens IA Utilizadas ({isMonthlyView ? 'Mês' : 'Total'})</TableHead>
                <TableHead className="text-center font-bold">Limite ({isMonthlyView ? 'Mês' : 'Total'})</TableHead>
                <TableHead className="text-center font-bold">Status de Uso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...(activeTab === 'chat' ? whatsappUsers : waUsers)].sort((a: any, b: any) => {
                const aUsed = isMonthlyView ? (a.metrics?.monthly_ai_messages || 0) : (a.metrics?.total_ai_messages || 0);
                const bUsed = isMonthlyView ? (b.metrics?.monthly_ai_messages || 0) : (b.metrics?.total_ai_messages || 0);
                return bUsed - aUsed;
              }).slice(0, 50).map((user: any) => {
                const planId = user.subscription_tier || 'free';
                let limit: number | string = 20;
                let planName = 'Gratuito';
                if (planId === 'basic') {
                  limit = 100;
                  planName = 'Básico';
                } else if (planId === 'premium') {
                  limit = 300;
                  planName = 'Premium';
                } else if (planId === 'unlimited') {
                  limit = '∞';
                  planName = 'Ilimitado';
                } else if (planId === 'admin') {
                  limit = '∞';
                  planName = 'Admin';
                }
                const used = isMonthlyView ? (user.metrics?.monthly_ai_messages || 0) : (user.metrics?.total_ai_messages || 0);
                const exceeded = typeof limit === 'number' ? used >= limit : false;
                const nearLimit = typeof limit === 'number' ? used >= limit * 0.8 && !exceeded : false;
                const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-';

                return (
                  <TableRow key={user.id} className="border-slate-50 hover:bg-slate-50/50 transition-all">
                    <TableCell className="font-bold text-slate-700">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-slate-100 shadow-sm"><AvatarFallback className="bg-blue-50 text-primary text-xs font-bold">{(user.name || user.phone || user.phone_number || '?')[0]}</AvatarFallback></Avatar>
                        <div className="flex flex-col"><span>{user.name || 'Usuário'}</span><span className="text-[10px] text-slate-400 font-normal">{user.phone || user.phone_number || 'Telefone não informado'}</span></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium text-slate-600 bg-slate-50 border-slate-200">
                        {planName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-slate-500 font-medium">
                      {createdAt}
                    </TableCell>
                    <TableCell className="text-center font-black text-slate-700">
                      {used}
                    </TableCell>
                    <TableCell className="text-center text-slate-500 font-medium">
                      {limit}
                    </TableCell>
                    <TableCell className="text-center">
                      {exceeded ? (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none px-3 py-1">
                          Excedido
                        </Badge>
                      ) : nearLimit ? (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3 py-1">
                          Próximo
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1">
                          Normal
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(activeTab === 'chat' ? whatsappUsers : waUsers).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>}
    </MainLayout>
  )
}

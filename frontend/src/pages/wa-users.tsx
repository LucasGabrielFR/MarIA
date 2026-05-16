import { useState, useEffect } from 'react'
import { API_URL } from '../lib/api'

import { MainLayout } from '../components/layout/main-layout'
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Search, 
  MessageSquare, 
  TrendingUp, 
  Filter
} from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Activity, 
  Settings,
  Heart,
  BrainCircuit,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { toast } from 'sonner'
import { cn } from "@/lib/utils"

interface WaUser {
  id: string
  name: string
  phone: string
  wa_chatid: string
  status: string
  created_at: string
  credits: number
  context?: {
    general_summary: string
    interests: string[]
    updated_at: string
  }
  subscription_tier: string
  subscription_expires_at: string | null
  metrics: {
    total_tokens: number
    total_cost_usd: number
    breakdown: Array<{
      model: string
      tokens: number
      promptTokens: number
      completionTokens: number
      costUsd: number
    }>
    total_messages: number
    total_user_messages: number
    total_assistant_messages: number
    engagement: string
  }
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

const WaUsersPage = () => {
  const [users, setUsers] = useState<WaUser[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<WaUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string>('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/wa-users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      if (!response.ok) throw new Error('Falha ao carregar usuários')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      toast.error('Erro ao buscar usuários do WhatsApp')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (userId: string) => {
    setShowHistory(false)
    try {
      const response = await fetch(`${API_URL}/admin/wa-users/${userId}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      if (!response.ok) throw new Error('Falha ao carregar histórico')
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      toast.error('Erro ao buscar histórico de conversas')
    }
  }

  const handleClearData = async () => {
    if (!selectedUser) return
    
    setDeleting(true)
    try {
      const response = await fetch(`${API_URL}/admin/wa-users/${selectedUser.id}/clear-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      
      if (!response.ok) throw new Error('Falha ao apagar dados')
      
      toast.success('Todos os dados pessoais e conversas foram apagados')
      setShowDeleteConfirm(false)
      
      // Atualizar a lista e fechar o modal principal ou atualizar o selecionado
      await fetchUsers()
      setSelectedUser(null)
    } catch (error) {
      toast.error('Erro ao processar solicitação de exclusão')
    } finally {
      setDeleting(false)
    }
  }

  const getChartData = () => {
    if (!messages.length) return []
    
    const last30Days = []
    const now = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      const fullDateStr = date.toDateString()
      
      const count = messages.filter(m => 
        m.role === 'user' && 
        new Date(m.created_at).toDateString() === fullDateStr
      ).length
      
      last30Days.push({ date: dateStr, count })
    }
    
    return last30Days
  }

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.phone?.includes(searchTerm) ||
    user.wa_chatid?.includes(searchTerm)
  )

  const handleUserClick = (user: WaUser) => {
    console.log('Selected User Data:', user);
    setSelectedUser(user)
    setSubscriptionExpiresAt(user.subscription_expires_at ? user.subscription_expires_at.split('T')[0] : '')
    fetchMessages(user.id)
  }

  const handleUpdateSubscription = async (userId: string, tier: string) => {
    try {
      const response = await fetch(`${API_URL}/admin/wa-users/${userId}/subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tier, expiresAt: subscriptionExpiresAt || null })
      })

      if (!response.ok) throw new Error('Falha ao atualizar assinatura')
      
      toast.success(`Assinatura atualizada para ${tier}`)
      await fetchUsers()
      
      // Atualizar o selectedUser localmente para refletir no modal aberto
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, subscription_tier: tier })
      }
    } catch (error) {
      toast.error('Erro ao atualizar assinatura')
    }
  }

  const handleRecordPayment = async (userId: string, tier: string) => {
    const amount = tier === 'premium' ? 14.90 : tier === 'patron' ? 29.90 : 0;
    if (amount === 0) {
       toast.info('Apenas planos pagos podem ter pagamentos registrados.');
       return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/finance/record-manual`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, tier, amount })
      })

      if (!response.ok) throw new Error('Falha ao registrar pagamento')
      
      toast.success(`Pagamento de R$ ${amount.toFixed(2)} registrado com sucesso!`)
      await fetchUsers()
      
      // Atualizar o selectedUser localmente
      if (selectedUser && selectedUser.id === userId) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        setSelectedUser({ 
          ...selectedUser, 
          subscription_tier: tier, 
          subscription_expires_at: expiresAt.toISOString() 
        })
        setSubscriptionExpiresAt(expiresAt.toISOString().split('T')[0]);
      }
    } catch (error) {
      toast.error('Erro ao registrar pagamento')
    }
  }

  return (
    <MainLayout 
      title="Gestão de Fiéis" 
      subtitle="Monitore as interações, interesses e consumo de tokens dos usuários."
    >
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nome ou telefone..." 
              className="pl-10 bg-white border-slate-200 rounded-2xl focus-visible:ring-primary h-12 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button variant="outline" className="rounded-2xl border-slate-200 bg-white shadow-sm hover:bg-slate-50 h-12 px-6 font-bold text-slate-600">
            <Filter className="h-4 w-4 mr-2" />
            Filtros Avançados
          </Button>
        </div>

        <Card className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="font-bold text-slate-800 py-5 pl-8">Usuário</TableHead>
                    <TableHead className="font-bold text-slate-800 py-5">Status</TableHead>
                    <TableHead className="font-bold text-slate-800 py-5">Interesses</TableHead>
                    <TableHead className="font-bold text-slate-800 py-5">Assinatura</TableHead>
                    <TableHead className="font-bold text-slate-800 py-5">Tokens Totais</TableHead>
                    <TableHead className="font-bold text-slate-800 py-5">Última Atividade</TableHead>
                    <TableHead className="text-right font-bold text-slate-800 py-5 pr-8">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-slate-400 font-medium">
                        Carregando fiéis...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-slate-400 font-medium">
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow 
                        key={user.id} 
                        className="border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-all duration-200 group"
                        onClick={() => handleUserClick(user)}
                      >
                        <TableCell className="py-5 pl-8">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-slate-100 shadow-sm">
                              <AvatarFallback className="bg-blue-50 text-primary text-xs font-bold">
                                {user.name ? user.name[0] : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-slate-800 group-hover:text-primary transition-colors">
                                {user.name || 'Sem nome'}
                              </p>
                              <p className="text-xs text-slate-500 font-medium">{user.phone || user.wa_chatid}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={cn(
                              "px-3 py-1 border-none",
                              user.status === 'active' 
                                ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                                : user.status === 'disabled'
                                ? 'bg-slate-100 text-slate-500 hover:bg-slate-100'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                            )}
                          >
                            <span className={cn(
                              "h-1.5 w-1.5 rounded-full mr-2",
                              user.status === 'active' ? "bg-green-600" : user.status === 'disabled' ? "bg-slate-400" : "bg-amber-600"
                            )}></span>
                            {user.status === 'active' ? 'Ativo' : user.status === 'disabled' ? 'Desativado' : 'Triagem'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.context?.interests?.map((interest, i) => (
                              <Badge key={i} variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] font-medium">
                                {interest}
                              </Badge>
                            )) || <span className="text-xs text-slate-400 font-medium italic">Nenhum</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "px-3 py-1 border-none",
                              user.subscription_tier === 'premium' ? 'bg-amber-100 text-amber-700' : 
                              user.subscription_tier === 'patron' ? 'bg-purple-100 text-purple-700' : 
                              'bg-slate-100 text-slate-500'
                            )}
                          >
                            {user.subscription_tier === 'premium' ? 'Premium' : 
                             user.subscription_tier === 'patron' ? 'Patrono' : 'Grátis'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-bold text-slate-700 text-sm">{user.metrics.total_tokens.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm font-medium">
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Button variant="ghost" size="icon" className="text-slate-400 group-hover:text-primary transition-colors">
                            <MessageSquare className="h-5 w-5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Details Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="bg-slate-50 border-none sm:max-w-[1400px] w-[95vw] h-[92vh] overflow-hidden p-0 rounded-[2.5rem] shadow-2xl flex flex-col transition-all duration-300">
          {selectedUser && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header Section */}
              <div className="p-6 md:p-8 bg-white border-b border-slate-100 rounded-b-[3rem] shadow-sm relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <Avatar className="h-20 w-20 border-4 border-white shadow-xl ring-1 ring-slate-100 transition-transform duration-500 group-hover:scale-105">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white text-2xl font-black">
                          {selectedUser.name ? selectedUser.name[0] : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "absolute bottom-0.5 right-0.5 h-5 w-5 rounded-full border-2 border-white shadow-md",
                        selectedUser.status === 'active' ? "bg-green-500" : selectedUser.status === 'disabled' ? "bg-slate-400" : "bg-amber-500 animate-pulse"
                      )} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                          {selectedUser.name || 'Fiel sem nome'}
                        </DialogTitle>
                        <Badge variant="outline" className={cn(
                          "rounded-full px-3 py-1 border-none font-black text-[10px] uppercase tracking-tighter shadow-sm",
                          selectedUser.status === 'active' 
                            ? "bg-green-100 text-green-700" 
                            : selectedUser.status === 'disabled'
                            ? "bg-slate-100 text-slate-500"
                            : "bg-amber-100 text-amber-700"
                        )}>
                          {selectedUser.status === 'active' ? 'ATIVO' : selectedUser.status === 'disabled' ? 'DESATIVADO' : 'TRIAGEM'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 font-bold text-sm">
                        <span>{selectedUser.phone}</span>
                        <span>ID: {selectedUser.wa_chatid.split('@')[0]}</span>
                        <span>Desde {new Date(selectedUser.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="rounded-xl border-red-100 font-black h-11 px-6 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 shadow-sm transition-all hover:scale-105 active:scale-95"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir dados
                      </Button>
                      <Button variant="outline" className="rounded-xl border-slate-200 font-black h-11 px-6 text-xs hover:bg-slate-50 shadow-sm transition-all hover:scale-105 active:scale-95">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurações
                      </Button>
                    </div>
                </div>

                {/* Quick Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 px-1">
                  {[
                    { label: 'Assinatura', value: selectedUser.subscription_tier === 'premium' ? 'Premium' : selectedUser.subscription_tier === 'patron' ? 'Patrono' : selectedUser.subscription_tier === 'unlimited' ? 'Ilimitado' : 'Grátis', unit: 'nível', icon: Heart, color: selectedUser.subscription_tier === 'free' ? 'slate' : 'amber' },
                    { label: 'Consumo Total', value: selectedUser.metrics.total_tokens.toLocaleString(), unit: 'tokens', icon: TrendingUp, color: 'blue' },
                    { label: 'Custo Total (IA)', value: `$${selectedUser.metrics.total_cost_usd?.toFixed(3)}`, unit: 'USD', icon: TrendingUp, color: 'green' },
                    { label: 'Total Mensagens', value: selectedUser.metrics.total_messages.toLocaleString(), unit: 'mensagens', icon: MessageSquare, color: 'amber' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100/50 hover:bg-white hover:shadow-lg hover:border-white transition-all duration-300 group">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        <stat.icon className={cn("h-4 w-4 transition-colors", {
                          'text-blue-500': stat.color === 'blue',
                          'text-green-500': stat.color === 'green',
                          'text-amber-500': stat.color === 'amber',
                          'text-pink-500': stat.color === 'pink',
                          'text-slate-400': stat.color === 'slate',
                        })} />
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-slate-900 tracking-tighter">{stat.value}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{stat.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content area */}
              <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 custom-scrollbar">
                <div className="max-w-7xl mx-auto space-y-8">
                  {/* Chart Section */}
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-8">
                      <Activity className="h-6 w-6 text-primary" />
                      <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Atividade Diária</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Últimos 30 dias</p>
                      </div>
                    </div>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getChartData()}>
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" hide />
                          <YAxis hide />
                          <Tooltip />
                          <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Analysis Column */}
                    <div className="lg:col-span-7 space-y-8">
                      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-8">
                          <BrainCircuit className="h-6 w-6 text-primary" />
                          <h3 className="text-xl font-black text-slate-800 tracking-tight">Análise Pastoral</h3>
                        </div>
                        <p className="text-base text-slate-600 italic font-semibold leading-relaxed">
                          "{selectedUser.context?.general_summary || 'Resumo em processamento...'}"
                        </p>
                        <div className="mt-8 flex flex-wrap gap-2">
                          {(selectedUser.context?.interests || []).map((interest, i) => (
                            <Badge key={i} variant="secondary" className="rounded-xl px-4 py-1.5 font-black text-[10px] uppercase">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                        <h3 className="text-lg font-black text-slate-800 mb-6">Gestão de Assinatura</h3>
                        
                        <div className="mb-6">
                          <Label className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2 block">Data de Expiração</Label>
                          <Input 
                            type="date" 
                            value={subscriptionExpiresAt}
                            onChange={(e) => setSubscriptionExpiresAt(e.target.value)}
                            className="rounded-2xl border-slate-100 bg-slate-50/50"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'free', label: 'Grátis', color: 'bg-slate-100 text-slate-600', price: 0 },
                            { id: 'premium', label: 'Premium (300m)', color: 'bg-amber-100 text-amber-700', price: 14.90 },
                            { id: 'patron', label: 'Patrono (600m)', color: 'bg-purple-100 text-purple-700', price: 29.90 },
                            { id: 'unlimited', label: 'Ilimitado', color: 'bg-blue-100 text-blue-700', price: 0 }
                          ].map((plan) => (
                            <div key={plan.id} className="space-y-2">
                              <button
                                onClick={() => handleUpdateSubscription(selectedUser.id, plan.id)}
                                className={cn(
                                  "w-full p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                                  selectedUser.subscription_tier === plan.id 
                                    ? "border-primary bg-primary/5 ring-4 ring-primary/10" 
                                    : "border-slate-50 hover:border-slate-200 bg-slate-50/50"
                                )}
                              >
                                <span className={cn("px-2 py-0.5 rounded-lg text-[8px] font-black uppercase", plan.color)}>
                                  {plan.label}
                                </span>
                                {selectedUser.subscription_tier === plan.id && (
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                )}
                              </button>
                              {plan.price > 0 && (
                                <button
                                  onClick={() => handleRecordPayment(selectedUser.id, plan.id)}
                                  className="w-full py-2 bg-green-50 text-green-600 text-[9px] font-black uppercase rounded-xl hover:bg-green-100 transition-colors border border-green-100"
                                >
                                  Registrar R$ {plan.price.toFixed(2)}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase text-center">
                          Clique em um plano para alterar o nível de acesso do fiel
                        </p>
                      </div>

                      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                        <h3 className="text-lg font-black text-slate-800 mb-6">Consumo por Modelo</h3>
                        <div className="space-y-6">
                          {selectedUser.metrics.breakdown.map((item: any) => (
                            <div key={item.model} className="group/item">
                              <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                                <div className="flex flex-col">
                                  <span className="text-slate-800">{item.model}</span>
                                  <span className="text-slate-400 font-bold">${item.costUsd?.toFixed(4)} USD</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-primary">{item.tokens.toLocaleString()} tokens</span>
                                  <div className="flex gap-2 justify-end text-[8px] text-slate-400 font-bold uppercase mt-0.5">
                                    <span>IN: {item.promptTokens?.toLocaleString()}</span>
                                    <span>OUT: {item.completionTokens?.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${(item.tokens / selectedUser.metrics.total_tokens) * 100}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Messages Column */}
                    <div className="lg:col-span-5">
                      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-[600px] overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                          <h3 className="text-lg font-black text-slate-800">Mensagens</h3>
                          <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}>
                            {showHistory ? 'Ocultar' : 'Revelar'}
                          </Button>
                        </div>
                        <div className={cn("flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar", !showHistory && "blur-xl select-none")}>
                          {messages.map((msg, i) => (
                            <div key={i} className={cn("flex flex-col", msg.role === 'user' ? 'items-end' : 'items-start')}>
                              <div className={cn("max-w-[85%] px-4 py-3 rounded-2xl text-sm font-semibold", msg.role === 'user' ? "bg-primary text-white" : "bg-slate-100 text-slate-800")}>
                                {msg.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(false)}>
        <DialogContent className="bg-white border-none sm:max-w-[450px] p-8 rounded-[2rem] shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="h-20 w-20 bg-red-50 rounded-3xl flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                Apagar dados de {selectedUser?.name}?
              </DialogTitle>
              <p className="text-sm font-bold text-slate-500 leading-relaxed">
                Esta ação irá apagar permanentemente todas as mensagens, resumos pastorais, interesses e métricas de consumo. 
                <span className="block mt-2 text-red-500 uppercase text-[10px] tracking-widest font-black">
                  Nome e Telefone serão preservados.
                </span>
              </p>
            </div>

            <div className="flex flex-col w-full gap-3">
              <Button 
                onClick={handleClearData}
                disabled={deleting}
                className="bg-red-500 hover:bg-red-600 text-white rounded-2xl h-14 font-black shadow-lg shadow-red-200/50 transition-all hover:scale-[1.02] active:scale-95"
              >
                {deleting ? 'Apagando...' : 'Sim, Apagar Tudo'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowDeleteConfirm(false)}
                className="text-slate-400 font-bold hover:bg-slate-50 h-12 rounded-2xl"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}

export default WaUsersPage

import React, { useState, useEffect } from 'react'
import { MainLayout } from '../components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Search, 
  MessageSquare, 
  User, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  Filter
} from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog"
import { 
  History, 
  LayoutDashboard, 
  Activity, 
  Settings,
  Heart,
  BrainCircuit,
  Database
} from 'lucide-react'
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
  metrics: {
    total_tokens: number
    breakdown: Record<string, number>
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
  const [loadingMessages, setLoadingMessages] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3000/admin/wa-users', {
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
    setLoadingMessages(true)
    setShowHistory(false)
    try {
      const response = await fetch(`http://localhost:3000/admin/wa-users/${userId}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      if (!response.ok) throw new Error('Falha ao carregar histórico')
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      toast.error('Erro ao buscar histórico de conversas')
    } finally {
      setLoadingMessages(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.phone?.includes(searchTerm) ||
    user.wa_chatid?.includes(searchTerm)
  )

  const handleUserClick = (user: WaUser) => {
    console.log('Selected User Data:', user);
    setSelectedUser(user)
    fetchMessages(user.id)
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
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                            )}
                          >
                            <span className={cn(
                              "h-1.5 w-1.5 rounded-full mr-2",
                              user.status === 'active' ? "bg-green-600" : "bg-amber-600"
                            )}></span>
                            {user.status === 'active' ? 'Ativo' : 'Triagem'}
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
              {/* Header Section - More Compact & Horizontal */}
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
                        selectedUser.status === 'active' ? "bg-green-500" : "bg-amber-500 animate-pulse"
                      )} />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                          {selectedUser.name || 'Fiel sem nome'}
                        </DialogTitle>
                        <Badge variant="outline" className={cn(
                          "rounded-full px-3 py-1 border-none font-black text-[10px] uppercase tracking-tighter shadow-sm",
                          selectedUser.status === 'active' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {selectedUser.status === 'active' ? 'Ativo' : 'Em Triagem'}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 font-bold text-sm">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/30" />
                          <span>{selectedUser.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/30" />
                          <span>ID: {selectedUser.wa_chatid.split('@')[0]}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/30" />
                          <span>Desde {new Date(selectedUser.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl border-slate-200 font-black h-11 px-6 text-xs hover:bg-slate-50 shadow-sm transition-all hover:scale-105 active:scale-95">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurações
                    </Button>
                  </div>
                </div>

                {/* Performance Stats Cards - Unified and clean */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 px-1">
                  {[
                    { label: 'Consumo Total', value: selectedUser.metrics.total_tokens.toLocaleString(), unit: 'tokens', icon: TrendingUp, color: 'blue' },
                    { label: 'Saldo Mensagens', value: selectedUser.credits, unit: 'créditos', icon: MessageSquare, color: 'green' },
                    { label: 'Frequência', value: '84%', unit: 'retorno', icon: Activity, color: 'amber' },
                    { label: 'Interação', value: 'Engajado', unit: 'perfil', icon: Heart, color: 'pink' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100/50 hover:bg-white hover:shadow-lg hover:border-white transition-all duration-300 group">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        <stat.icon className={cn("h-4 w-4 group-hover:scale-110 transition-transform", {
                          'text-blue-500': stat.color === 'blue',
                          'text-green-500': stat.color === 'green',
                          'text-amber-500': stat.color === 'amber',
                          'text-pink-500': stat.color === 'pink',
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

              {/* Scrollable Content Section */}
              <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto items-start">
                  
                  {/* Left Section: AI Analysis & Context (7 columns) */}
                  <div className="lg:col-span-7 space-y-8">
                    {/* Bio Section */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6">
                        <Badge className="bg-blue-50 text-primary border-none font-black text-[9px] tracking-widest px-3 py-0.5">MARIA AI ENGINE</Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform">
                          <BrainCircuit className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-800 tracking-tight">Análise Pastoral</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Perfil Teológico Gerado</p>
                        </div>
                      </div>
                      
                      <div className="relative pl-5">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-blue-300 to-transparent rounded-full shadow-[0_0_8px_rgba(0,71,171,0.15)]" />
                        <p className="text-base text-slate-600 leading-relaxed font-semibold italic">
                          "{selectedUser.context?.general_summary || 
                           (Array.isArray((selectedUser as any).user_contexts) && (selectedUser as any).user_contexts[0]?.general_summary) ||
                           'O sistema ainda está processando as interações para gerar um resumo pastoral completo.'}"
                        </p>
                      </div>

                      {/* Interests Chips */}
                      <div className="mt-10 pt-8 border-t border-slate-50">
                        <div className="flex items-center justify-between mb-5">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Heart className="h-3.5 w-3.5 text-pink-500" />
                            Interesses & Curiosidade
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {((selectedUser.context?.interests || (Array.isArray((selectedUser as any).user_contexts) && (selectedUser as any).user_contexts[0]?.interests) || []) as string[]).length > 0 ? (
                            ((selectedUser.context?.interests || (Array.isArray((selectedUser as any).user_contexts) && (selectedUser as any).user_contexts[0]?.interests) || []) as string[]).map((interest, i) => (
                              <Badge key={i} className="bg-slate-50 text-slate-600 border border-slate-200 hover:bg-primary hover:text-white hover:border-primary px-4 py-2 font-black text-[10px] rounded-xl transition-all duration-300 cursor-default">
                                {interest}
                              </Badge>
                            ))
                          ) : (
                            <div className="w-full p-6 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                              <p className="text-xs text-slate-400 font-bold">Nenhum interesse específico mapeado.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* LLM Models Usage */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 overflow-hidden relative">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center shadow-inner">
                          <LayoutDashboard className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-800 tracking-tight">Infraestrutura IA</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Distribuição de Processamento</p>
                        </div>
                      </div>

                      <div className="space-y-8">
                        {Object.entries(selectedUser.metrics.breakdown).length > 0 ? (
                          Object.entries(selectedUser.metrics.breakdown).map(([model, count]) => (
                            <div key={model} className="group">
                              <div className="flex justify-between items-end mb-3 px-1">
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-0.5">{model}</span>
                                  <span className="text-xl font-black text-slate-800 tracking-tighter">
                                    {count.toLocaleString()} 
                                    <span className="text-[10px] font-bold text-slate-400 ml-1.5 uppercase tracking-tighter">tokens consumidos</span>
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-2xl font-black text-primary drop-shadow-sm">
                                    {Math.round((count / selectedUser.metrics.total_tokens) * 100)}%
                                  </span>
                                </div>
                              </div>
                              <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                                <div 
                                  className="h-full bg-gradient-to-r from-primary via-blue-500 to-blue-300 rounded-full transition-all duration-1000 ease-out" 
                                  style={{ width: `${(count / selectedUser.metrics.total_tokens) * 100}%` }}
                                />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <Activity className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhum dado de uso</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Messages History (5 columns) - Limited Size */}
                  <div className="lg:col-span-5 h-[650px]">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden group">
                      <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center">
                            <History className="h-5 w-5 text-slate-600" />
                          </div>
                          <h3 className="text-lg font-black text-slate-800 tracking-tight">Mensagens</h3>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowHistory(!showHistory)}
                          className={cn(
                            "text-[10px] font-black transition-all duration-300 rounded-xl px-4 h-9 shadow-sm",
                            showHistory 
                              ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                              : "bg-slate-900 text-white hover:bg-black shadow-lg"
                          )}
                        >
                          {showHistory ? <EyeOff className="h-3.5 w-3.5 mr-1.5" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />}
                          {showHistory ? 'Ocultar' : 'Revelar'}
                        </Button>
                      </div>

                      <div className="flex-1 relative flex flex-col overflow-hidden">
                        <div className={cn(
                          "flex-1 overflow-y-auto p-6 space-y-6 transition-all duration-1000 custom-scrollbar",
                          !showHistory && "filter blur-[40px] select-none pointer-events-none opacity-10 grayscale"
                        )}>
                          {loadingMessages ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-5">
                              <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-lg" />
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando...</p>
                            </div>
                          ) : messages.length === 0 ? (
                            <div className="text-center py-32 opacity-40">
                              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-200" />
                              <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Sem conversas</p>
                            </div>
                          ) : (
                            messages.map((msg, idx) => (
                              <div 
                                key={msg.id || idx} 
                                className={cn("flex flex-col group", msg.role === 'user' ? 'items-end' : 'items-start')}
                              >
                                <div 
                                  className={cn(
                                    "max-w-[90%] rounded-2xl px-5 py-4 text-sm font-semibold shadow-sm leading-relaxed transition-all group-hover:shadow-md",
                                    msg.role === 'user' 
                                      ? 'bg-primary text-white rounded-tr-none shadow-blue-100' 
                                      : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100'
                                  )}
                                >
                                  {msg.content}
                                </div>
                                <span className="text-[9px] font-black text-slate-400 mt-2 px-2 uppercase tracking-widest opacity-60">
                                  {msg.role === 'user' ? 'Fiel' : 'MarIA'} • {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ))
                          )}
                        </div>

                        {!showHistory && (
                          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 text-center">
                            <div className="p-8 bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/50 max-w-xs transform transition-all hover:scale-105">
                              <div className="h-16 w-16 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-inner">
                                <ShieldAlert className="h-10 w-10 text-amber-500" />
                              </div>
                              <p className="text-xl font-black text-slate-900 mb-2 tracking-tight">Privacidade</p>
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-loose mb-8 px-2">
                                Conversa protegida por sigilo pastoral e criptografia.
                              </p>
                              <Button 
                                onClick={() => setShowHistory(true)}
                                className="w-full rounded-xl bg-primary text-white font-black h-12 text-sm shadow-xl shadow-primary/30 hover:shadow-2xl transition-all"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Revelar Histórico
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer Protection Info */}
                      <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                        <div className="flex items-center justify-center gap-2 opacity-40">
                          <Database className="h-3.5 w-3.5" />
                          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Vault Secured</span>
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
    </MainLayout>
  )
}

export default WaUsersPage

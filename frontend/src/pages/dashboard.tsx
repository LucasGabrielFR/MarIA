import { StatsCards } from '../components/dashboard/stats-cards'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MainLayout } from '../components/layout/main-layout'
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const recentConversations = [
    { id: 1, user: "Lucas Gabriel", status: "Ativo", time: "2 min atrás", type: "Teológico" },
    { id: 2, user: "Maria Silva", status: "Finalizado", time: "15 min atrás", type: "Acolhimento" },
    { id: 3, user: "João Bento", status: "Ativo", time: "1 hora atrás", type: "Doutrina" },
    { id: 4, user: "Ana Paula", status: "Ativo", time: "3 horas atrás", type: "Acolhimento" },
  ];

  return (
    <MainLayout title="Dashboard Geral" subtitle="Bem-vindo ao painel de controle da MarIA.">
      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm p-8 border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-slate-800">Conversas Recentes</h3>
            <button className="text-primary text-sm font-bold hover:underline bg-blue-50 px-4 py-2 rounded-full transition-colors">
              Ver todas
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-50">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="font-bold">Usuário</TableHead>
                  <TableHead className="font-bold">Tipo</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">Última msg</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentConversations.map((conv) => (
                  <TableRow key={conv.id} className="border-slate-50 hover:bg-slate-50/50 transition-all duration-200 cursor-pointer group">
                    <TableCell className="font-bold flex items-center gap-3 py-4">
                      <Avatar className="h-9 w-9 border border-slate-100 shadow-sm">
                        <AvatarFallback className="bg-blue-50 text-primary text-xs font-bold">{conv.user[0]}</AvatarFallback>
                      </Avatar>
                      <span className="group-hover:text-primary transition-colors">{conv.user}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium text-slate-600 bg-slate-50 border-slate-200 px-3 py-1">
                        {conv.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={conv.status === 'Ativo' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1' : 'bg-slate-100 text-slate-700 hover:bg-slate-100 border-none px-3 py-1'}>
                        <span className={cn("h-1.5 w-1.5 rounded-full mr-2", conv.status === 'Ativo' ? "bg-green-600" : "bg-slate-400")}></span>
                        {conv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-slate-400 text-sm font-medium">{conv.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100 flex flex-col">
          <h3 className="text-xl font-bold text-slate-800 mb-8">Saúde do Sistema</h3>
          <div className="space-y-6 flex-1">
            <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 hover:border-primary/30 transition-all group">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-bold text-primary">Status da Persona</p>
                <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">ONLINE</span>
              </div>
              <p className="text-xs text-slate-500 mb-4 font-medium">Nossa Senhora (Acolhedora) ativa e respondendo.</p>
              <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[92%] rounded-full shadow-[0_0_8px_rgba(0,71,171,0.4)]"></div>
              </div>
            </div>
            
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 hover:border-secondary/30 transition-all group">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-bold text-secondary">Limite de API</p>
                <span className="text-[10px] bg-secondary text-white px-2 py-0.5 rounded-full font-bold">OK</span>
              </div>
              <p className="text-xs text-slate-500 mb-4 font-medium">Consumo de tokens dentro da margem segura.</p>
              <div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden">
                <div className="h-full bg-secondary w-[35%] rounded-full shadow-[0_0_8px_rgba(212,175,55,0.4)]"></div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-green-50/50 border border-green-100 hover:border-green-300 transition-all">
              <p className="text-sm font-bold text-green-700 mb-1">WhatsApp Cloud</p>
              <p className="text-xs text-slate-500 font-medium">Instância conectada via Uazapi.</p>
            </div>
          </div>
          <button className="w-full mt-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
            Ir para Configurações
          </button>
        </div>
      </div>
    </MainLayout>
  )
}

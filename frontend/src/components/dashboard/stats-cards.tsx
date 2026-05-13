import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MessageCircle, DollarSign, Coins } from "lucide-react"

interface StatsCardsProps {
  stats: {
    totalUsers: number;
    totalMessages: number;
    totalTokens: number;
    totalCostUsd: number;
    totalCostBrl: number;
  } | null;
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-none shadow-sm bg-white animate-pulse">
            <div className="h-32"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-slate-500 group-hover:text-primary transition-colors">Total de Usuários</CardTitle>
          <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
            <Users className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-800">{stats.totalUsers.toLocaleString('pt-BR')}</div>
          <p className="text-xs text-slate-500 flex items-center mt-2 font-medium">
            Fiéis cadastrados na base
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-slate-500 group-hover:text-primary transition-colors">Mensagens Recebidas</CardTitle>
          <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
            <MessageCircle className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-800">{stats.totalMessages.toLocaleString('pt-BR')}</div>
          <p className="text-xs text-slate-500 flex items-center mt-2 font-medium">
            Total de interações dos usuários
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-slate-500 group-hover:text-amber-600 transition-colors">Consumo (Tokens)</CardTitle>
          <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
            <Coins className="h-4 w-4 text-amber-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-800">
            {stats.totalTokens >= 1000000 
              ? `${(stats.totalTokens / 1000000).toFixed(2)}M` 
              : stats.totalTokens.toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Total processado por todos os modelos
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-slate-500 group-hover:text-green-600 transition-colors">Custo Total (API)</CardTitle>
          <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
            <DollarSign className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-800">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalCostBrl)}
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Aprox. {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalCostUsd)} (USD)
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

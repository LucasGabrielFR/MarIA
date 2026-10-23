import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MessageCircle, DollarSign, Coins, Activity, Smartphone, Timer } from "lucide-react"

interface StatsCardsProps {
  variant?: 'general' | 'mobile';
  stats: {
    totalUsers: number;
    totalMessages: number;
    totalTokens: number;
    totalCostUsd: number;
    totalCostBrl: number;
    mobile?: {
      totalUsers: number;
      newUsersLast30Days: number;
      dau: number;
      mau: number;
      sessions: number;
      averageScreenTimeMs: number;
    };
  } | null;
}

export function StatsCards({ stats, variant = 'general' }: StatsCardsProps) {
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

  if (variant === 'general') {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total de Usuários" value={stats.totalUsers.toLocaleString('pt-BR')} detail="Todos os perfis cadastrados" icon={<Users className="h-4 w-4 text-primary" />} />
        <MetricCard title="Total de Mensagens" value={stats.totalMessages.toLocaleString('pt-BR')} detail="Interações registradas" icon={<MessageCircle className="h-4 w-4 text-primary" />} />
        <MetricCard title="Consumo (Tokens)" value={stats.totalTokens >= 1000000 ? `${(stats.totalTokens / 1000000).toFixed(2)}M` : stats.totalTokens.toLocaleString('pt-BR')} detail="Processados por todos os modelos" icon={<Coins className="h-4 w-4 text-amber-600" />} />
        <MetricCard title="Custo Total (API)" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalCostBrl)} detail={`Aprox. ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalCostUsd)} (USD)`} icon={<DollarSign className="h-4 w-4 text-green-600" />} />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-slate-500 group-hover:text-primary transition-colors">Usuários mobile</CardTitle>
          <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
            <Users className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-800">{(stats.mobile?.totalUsers || 0).toLocaleString('pt-BR')}</div>
          <p className="text-xs text-slate-500 flex items-center mt-2 font-medium">
            {(stats.mobile?.newUsersLast30Days || 0).toLocaleString('pt-BR')} novos nos últimos 30 dias
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-slate-500 group-hover:text-primary transition-colors">Usuários ativos</CardTitle>
          <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
            <Activity className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-800">{(stats.mobile?.dau || 0).toLocaleString('pt-BR')}</div>
          <p className="text-xs text-slate-500 flex items-center mt-2 font-medium">
            DAU · {(stats.mobile?.mau || 0).toLocaleString('pt-BR')} ativos em 30 dias
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-slate-500 group-hover:text-amber-600 transition-colors">Sessões no app</CardTitle>
          <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
            <Smartphone className="h-4 w-4 text-amber-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-800">
            {(stats.mobile?.sessions || 0).toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Sessões registradas nos últimos 30 dias
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-slate-500 group-hover:text-green-600 transition-colors">Tempo médio em tela</CardTitle>
          <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
            <Timer className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-800">
            {formatDuration(stats.mobile?.averageScreenTimeMs || 0)}
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Média por permanência em tela
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ title, value, detail, icon }: { title: string; value: string; detail: string; icon: React.ReactNode }) {
  return <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white group"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-semibold text-slate-500">{title}</CardTitle><div className="p-2 bg-blue-50 rounded-lg">{icon}</div></CardHeader><CardContent><div className="text-3xl font-bold text-slate-800">{value}</div><p className="text-xs text-slate-500 mt-2 font-medium">{detail}</p></CardContent></Card>;
}

function formatDuration(durationMs: number) {
  if (!durationMs) return '—';
  const seconds = Math.round(durationMs / 1000);
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}min ${seconds % 60}s`;
}

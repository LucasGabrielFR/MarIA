import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MessageCircle, TrendingUp, DollarSign } from "lucide-react"

export function StatsCards() {
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
          <div className="text-3xl font-bold text-slate-800">1.284</div>
          <p className="text-xs text-green-500 flex items-center mt-2 font-medium">
            <TrendingUp size={12} className="mr-1" />
            +12% desde ontem
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-slate-500 group-hover:text-primary transition-colors">Mensagens Enviadas</CardTitle>
          <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
            <MessageCircle className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-800">42.892</div>
          <p className="text-xs text-green-500 flex items-center mt-2 font-medium">
            <TrendingUp size={12} className="mr-1" />
            +8.2% este mês
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-slate-500 group-hover:text-secondary transition-colors">Receita Estimada</CardTitle>
          <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
            <DollarSign className="h-4 w-4 text-secondary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-800">R$ 12.450</div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Conversão: 14% de assinantes
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-slate-500 group-hover:text-destructive transition-colors">Custo API (LLM)</CardTitle>
          <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
            <TrendingUp className="h-4 w-4 text-destructive" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-800">$124,50</div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Média: $0.04 / usuário / mês
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

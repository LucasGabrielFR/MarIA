import { useState, useEffect } from 'react'
import { API_URL } from '../lib/api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MainLayout } from '../components/layout/main-layout'
import { DollarSign, TrendingUp, CreditCard, AlertCircle, Calendar } from 'lucide-react'

export default function FinancePage() {
  const [summary, setSummary] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        const [sumRes, subRes] = await Promise.all([
          fetch(`${API_URL}/admin/finance/summary`),
          fetch(`${API_URL}/admin/finance/subscriptions?limit=20`)
        ]);
        
        if (sumRes.ok) setSummary(await sumRes.json());
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscriptions(subData.data || []);
        }
      } catch (error) {
        console.error('Erro ao buscar dados financeiros:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFinanceData();
  }, []);

  const formatCurrency = (val: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
          <button className="flex items-center gap-2 text-primary text-sm font-bold hover:underline bg-blue-50 px-4 py-2 rounded-full transition-colors">
            <Calendar className="h-4 w-4" />
            Filtrar Período
          </button>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-400">Carregando dados...</TableCell>
                </TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-400">Nenhuma assinatura registrada ainda.</TableCell>
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
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1 capitalize">
                      {sub.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
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

import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, MessageSquare, Activity, Cpu } from 'lucide-react';
import { api } from '../lib/api';

interface AnalyticsData {
  totalTokens: number;
  totalCost: number;
  interactionsCount: number;
  recentLogs: any[];
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { name: 'Total de Interações', value: data?.interactionsCount || 0, icon: MessageSquare, color: 'text-blue-500' },
    { name: 'Tokens Consumidos', value: data?.totalTokens?.toLocaleString() || 0, icon: Cpu, color: 'text-purple-500' },
    { name: 'Custo Estimado', value: `USD ${data?.totalCost?.toFixed(4) || '0.0000'}`, icon: DollarSign, color: 'text-emerald-500' },
    { name: 'Taxa de Atividade', value: '+12.5%', icon: TrendingUp, color: 'text-amber-500' },
  ];

  return (
    <div className="flex-1 overflow-auto bg-neutral-900 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-neutral-400 mt-1">Acompanhe o desempenho e custos da MarIA.</p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat) => (
                <div key={stat.name} className="bg-neutral-800/50 border border-neutral-800 p-6 rounded-2xl backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg bg-neutral-900 border border-neutral-700 ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <Activity className="w-4 h-4 text-neutral-600" />
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-neutral-500 mt-1">{stat.name}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Chart Placeholder / Recent Activity */}
              <div className="bg-neutral-800/50 border border-neutral-800 p-6 rounded-2xl backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span>Atividade Recente</span>
                </h3>
                <div className="space-y-4">
                  {data?.recentLogs.map((log: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/50 border border-neutral-800">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                        <div className="text-sm text-neutral-300">
                          Interação via <span className="text-white font-medium">{log.model || 'LLM'}</span>
                        </div>
                      </div>
                      <div className="text-xs text-neutral-500">
                        {log.total_tokens} tokens
                      </div>
                    </div>
                  ))}
                  {data?.recentLogs.length === 0 && (
                    <div className="text-center py-8 text-neutral-500">Nenhuma atividade registrada.</div>
                  )}
                </div>
              </div>

              {/* Cost Distribution Placeholder */}
              <div className="bg-neutral-800/50 border border-neutral-800 p-6 rounded-2xl backdrop-blur-sm flex flex-col items-center justify-center min-h-[300px]">
                <BarChart3 className="w-12 h-12 text-neutral-700 mb-4" />
                <p className="text-neutral-500 text-center max-w-xs">
                  Gráficos de distribuição de custos e uso de modelos aparecerão aqui conforme os dados forem populados.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react'
import { MainLayout } from '../components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, DollarSign, BrainCircuit, Loader2, Copy, Link as LinkIcon, MessageCircle } from 'lucide-react'
import { API_URL } from '../lib/api'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

const FRONTEND_URL = window.location.origin;
const WA_NUMBER = "5562981949980";

export default function AffiliateDashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [affiliate, setAffiliate] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [insights, setInsights] = useState<any>(null)
  const [waMessageTemplate, setWaMessageTemplate] = useState("Olá, gostaria de assinar [ref:{{code}}]")

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const userStr = localStorage.getItem('maria_user')
      if (!userStr) {
        navigate('/')
        return
      }

      const user = JSON.parse(userStr)
      if (user.role !== 'affiliate') {
        toast.error('Acesso negado. Apenas afiliados podem acessar este painel.')
        navigate('/')
        return
      }

      // Fetch affiliate details by code (since they login with their credentials)
      const resProfile = await fetch(`${API_URL}/affiliates/code/${user.code}`)
      const profileData = await resProfile.json()
      
      if (!profileData.success || !profileData.affiliate) {
        toast.error('Perfil de afiliado não encontrado.')
        setLoading(false)
        return
      }

      const aff = profileData.affiliate
      setAffiliate(aff)

      // Fetch Stats
      const resStats = await fetch(`${API_URL}/affiliates/${aff.id}/dashboard`)
      const statsData = await resStats.json()
      setStats(statsData)

      // Fetch Insights if allowed
      if (aff.can_view_insights) {
        const resInsights = await fetch(`${API_URL}/affiliates/${aff.id}/insights`)
        const insightsData = await resInsights.json()
        setInsights(insightsData)
      }

      // Fetch WA Template
      try {
        const resSetting = await fetch(`${API_URL}/panel/settings/public/wa_message_template`)
        if (resSetting.ok) {
          const settingData = await resSetting.json()
          if (settingData && settingData.value) {
            setWaMessageTemplate(settingData.value)
          }
        }
      } catch (e) {
        console.error('Erro ao buscar template WA', e)
      }

    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar o dashboard')
    } finally {
      setLoading(false)
    }
  }

  const generateWaLink = (code: string) => {
    const msg = waMessageTemplate.replace('{{code}}', code)
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`
  }

  const generateWebLink = (code: string) => {
    return `${FRONTEND_URL}/?ref=${code}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Link copiado!')
  }

  if (loading) {
    return (
      <MainLayout title="Dashboard Afiliado">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </div>
      </MainLayout>
    )
  }

  if (!affiliate) {
    return (
      <MainLayout title="Dashboard Afiliado">
        <div className="text-center p-12 text-slate-500">
          Perfil de afiliado não configurado.
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Meu Painel">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Olá, {affiliate.name}
        </h1>
        <p className="text-slate-500 mt-2">Acompanhe seus resultados e indicações.</p>
      </div>

      <Card className="mb-8 border-none shadow-md bg-white">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LinkIcon className="text-primary w-5 h-5" /> Seus Links de Indicação
          </CardTitle>
          <CardDescription>
            Compartilhe esses links para receber suas comissões por indicações bem sucedidas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <p className="font-semibold text-sm text-slate-700 flex items-center gap-1.5 mb-1">
                <LinkIcon size={14} /> Link do Site (Landing Page)
              </p>
              <code className="text-xs bg-slate-200/50 px-2 py-1 rounded text-slate-600 block max-w-full overflow-hidden text-ellipsis md:max-w-md">
                {generateWebLink(affiliate.code)}
              </code>
            </div>
            <Button onClick={() => copyToClipboard(generateWebLink(affiliate.code))} variant="outline" size="sm" className="whitespace-nowrap w-full md:w-auto">
              <Copy className="w-4 h-4 mr-2" /> Copiar Link
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-4 bg-green-50 rounded-lg border border-green-100">
            <div>
              <p className="font-semibold text-sm text-green-700 flex items-center gap-1.5 mb-1">
                <MessageCircle size={14} /> Link Direto para WhatsApp
              </p>
              <code className="text-xs bg-green-100/50 px-2 py-1 rounded text-green-700 block max-w-full overflow-hidden text-ellipsis md:max-w-md">
                {generateWaLink(affiliate.code)}
              </code>
            </div>
            <Button onClick={() => copyToClipboard(generateWaLink(affiliate.code))} variant="default" size="sm" className="bg-green-600 hover:bg-green-700 whitespace-nowrap w-full md:w-auto text-white">
              <Copy className="w-4 h-4 mr-2" /> Copiar Link WA
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Total de Indicações</CardTitle>
            <Users className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{stats?.total_signups || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Pessoas que usaram seu link</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Assinaturas Ativas</CardTitle>
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{stats?.active_subscribers || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Elegíveis para comissão</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-blue-700">Estimativa Mensal</CardTitle>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.estimated_monthly_earnings || 0)}
            </div>
            <p className="text-xs text-blue-600 mt-1">Baseado nos planos ativos hoje</p>
          </CardContent>
        </Card>
      </div>

      {affiliate.can_view_insights && (
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="text-primary w-5 h-5" />
              Interesses da sua Comunidade
            </CardTitle>
            <CardDescription>
              Resumo gerado por IA sobre os temas mais buscados pelas pessoas que você indicou.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {insights && insights.top_interests && insights.top_interests.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {insights.top_interests.map((interest: any, idx: number) => (
                    <div key={idx} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-sm font-medium border border-slate-200">
                      {interest.name}
                      <span className="ml-2 text-xs text-slate-400 bg-white px-1.5 py-0.5 rounded-full">
                        {interest.count}x
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 italic">
                  * Os dados são totalmente anônimos e não contêm informações pessoais de identificação, respeitando a privacidade dos usuários.
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                Ainda não há dados suficientes para gerar insights da sua comunidade.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </MainLayout>
  )
}

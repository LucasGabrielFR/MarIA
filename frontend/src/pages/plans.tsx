import { useState, useEffect } from 'react'
import { API_URL } from '../lib/api'
import { MainLayout } from '../components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Save, Loader2, ListTree, Power } from 'lucide-react'

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Nova configuração para ativar/desativar o plano premium na landing page
  const [premiumActive, setPremiumActive] = useState<boolean>(false)
  const [updatingPremiumToggle, setUpdatingPremiumToggle] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const storedUser = localStorage.getItem('maria_user')
      const adminId = storedUser ? JSON.parse(storedUser)?.id : ''

      const [plansResponse, settingsResponse] = await Promise.all([
        fetch(`${API_URL}/plans`),
        fetch(`${API_URL}/admin/settings`, { headers: { 'x-admin-id': adminId } })
      ])
      
      const plansData = await plansResponse.json()
      setPlans(plansData || [])

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        const premiumSetting = settingsData.find((s: any) => s.key === 'premium_plan_active')
        setPremiumActive(premiumSetting?.value === 'true')
      }
    } catch (err) {
      console.error(err)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePlan = (index: number, field: string, value: any) => {
    const updated = [...plans]
    updated[index] = { ...updated[index], [field]: value }
    setPlans(updated)
  }

  const savePlan = async (plan: any) => {
    setSaving(true)
    try {
      const storedUser = localStorage.getItem('maria_user')
      const adminId = storedUser ? JSON.parse(storedUser)?.id : ''

      const response = await fetch(`${API_URL}/admin/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-id': adminId
        },
        body: JSON.stringify(plan)
      })
      if (!response.ok) throw new Error('Falha ao salvar plano')
      toast.success(`Plano ${plan.name} salvo com sucesso!`)
    } catch (err) {
      console.error(err)
      toast.error(`Erro ao salvar plano ${plan.name}`)
    } finally {
      setSaving(false)
    }
  }

  const togglePremiumPlan = async () => {
    setUpdatingPremiumToggle(true)
    const newValue = !premiumActive
    try {
      const storedUser = localStorage.getItem('maria_user')
      const adminId = storedUser ? JSON.parse(storedUser)?.id : ''

      const response = await fetch(`${API_URL}/admin/settings/premium_plan_active`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-id': adminId
        },
        body: JSON.stringify({ value: newValue ? 'true' : 'false' })
      })

      if (response.ok) {
        setPremiumActive(newValue)
        toast.success(`Plano Premium ${newValue ? 'ativado' : 'desativado'} na Landing Page!`)
      } else {
        throw new Error()
      }
    } catch (error) {
      toast.error("Erro ao atualizar o status do plano premium")
    } finally {
      setUpdatingPremiumToggle(false)
    }
  }

  return (
    <MainLayout title="Planos e Preços">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <ListTree className="text-[#0047AB]" size={32} />
            Planos e Preços
          </h1>
          <p className="text-slate-500 mt-2">Gerencie os planos, ciclos e preços oferecidos no aplicativo e na landing page.</p>
        </div>
        
        {/* Toggle Premium Card */}
        {!loading && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div>
              <p className="text-sm font-bold text-slate-800">Plano Premium (Landing Page)</p>
              <p className="text-xs text-slate-500">{premiumActive ? 'Visível para novos usuários' : 'Oculto temporariamente'}</p>
            </div>
            <Button 
              onClick={togglePremiumPlan} 
              disabled={updatingPremiumToggle}
              variant={premiumActive ? "default" : "secondary"}
              className={`rounded-xl font-bold gap-2 ${premiumActive ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
            >
              {updatingPremiumToggle ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
              {premiumActive ? 'Ativo' : 'Inativo'}
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#0047AB]" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan, i) => (
            <Card key={plan.id} className="border-slate-200 relative overflow-hidden">
              {plan.tier === 'premium' && !premiumActive && (
                <div className="absolute top-4 right-4 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                  Oculto na Landing
                </div>
              )}
              <CardHeader>
                <CardTitle className="capitalize">{plan.name} - {plan.cycle}</CardTitle>
                <CardDescription>Plano: {plan.name}, Ciclo: {plan.cycle}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Preço (R$)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={plan.price} 
                    onChange={e => handleUpdatePlan(i, 'price', parseFloat(e.target.value))} 
                  />
                </div>
                <div>
                  <Label>Limite de Mensagens (IA)</Label>
                  <Input 
                    type="number" 
                    value={plan.messages_limit || 0} 
                    onChange={e => handleUpdatePlan(i, 'messages_limit', parseInt(e.target.value, 10))} 
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input 
                    value={plan.description || ''} 
                    onChange={e => handleUpdatePlan(i, 'description', e.target.value)} 
                  />
                </div>
                <Button className="w-full" onClick={() => savePlan(plan)} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </MainLayout>
  )
}


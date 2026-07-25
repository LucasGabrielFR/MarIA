import { useState, useEffect } from 'react'
import { API_URL } from '../lib/api'
import { MainLayout } from '../components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Save, Loader2, ListTree } from 'lucide-react'

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/plans`)
      const data = await response.json()
      // ensure we show only basic and premium, maybe allow adding new but we just need basic and premium monthly/annual
      // for this MVP let's just display all and edit them
      setPlans(data || [])
    } catch (err) {
      console.error(err)
      toast.error("Erro ao carregar planos")
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
      const response = await fetch(`${API_URL}/plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <MainLayout title="Planos e Preços">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
          <ListTree className="text-[#0047AB]" size={32} />
          Planos e Preços
        </h1>
        <p className="text-slate-500 mt-2">Gerencie os planos, ciclos e preços oferecidos no aplicativo e na landing page.</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#0047AB]" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan, i) => (
            <Card key={plan.id} className="border-slate-200">
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

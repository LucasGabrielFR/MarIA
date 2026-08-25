import { useState, useEffect } from 'react'
import { API_URL } from '../lib/api'
import { MainLayout } from '../components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Save, Loader2, ListTree, Power, Plus } from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"

interface GroupedPlan {
  tier: string;
  name: string;
  is_active: boolean;
  messages_limit: number;
  magisterium_limit: number;
  monthlyId?: string;
  annualId?: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string;
  highlight: string;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<GroupedPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newPlan, setNewPlan] = useState({
    tier: '',
    name: '',
    monthlyPrice: 0,
    annualPrice: 0,
    messages_limit: 0,
    magisterium_limit: 0,
    features: '',
    highlight: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/plans`)
      const plansData = await response.json()
      
      const tiers = Array.from(new Set(plansData.map((p: any) => p.tier)))
      const grouped: GroupedPlan[] = tiers.map(tier => {
        const monthly = plansData.find((p: any) => p.tier === tier && p.cycle === 'monthly') || {}
        const annual = plansData.find((p: any) => p.tier === tier && p.cycle === 'annual') || {}
        
        let features = '';
        let highlight = '';
        const rawDesc = monthly.description || annual.description || '';
        try {
          const parsed = JSON.parse(rawDesc);
          if (parsed && typeof parsed === 'object') {
            features = Array.isArray(parsed.features) ? parsed.features.join('\n') : rawDesc;
            highlight = parsed.highlight || '';
          } else {
            features = rawDesc;
          }
        } catch {
          features = rawDesc;
        }

        return {
          tier: tier as string,
          name: monthly.name || annual.name || tier as string,
          is_active: monthly.is_active !== false && annual.is_active !== false,
          messages_limit: monthly.messages_limit || annual.messages_limit || 0,
          magisterium_limit: monthly.magisterium_limit || annual.magisterium_limit || 0,
          monthlyId: monthly.id,
          annualId: annual.id,
          monthlyPrice: monthly.price || 0,
          annualPrice: annual.price || 0,
          features,
          highlight
        }
      })
      
      setPlans(grouped)
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

  const togglePlanActive = (index: number) => {
    const updated = [...plans]
    updated[index] = { ...updated[index], is_active: !updated[index].is_active }
    setPlans(updated)
  }

  const savePlan = async (plan: GroupedPlan) => {
    setSaving(prev => ({ ...prev, [plan.tier]: true }))
    try {
      const storedUser = localStorage.getItem('maria_user')
      const adminId = storedUser ? JSON.parse(storedUser)?.id : ''
      const headers = { 
        'x-admin-id': adminId,
        'Content-Type': 'application/json'
      }

      const descJson = JSON.stringify({
        features: plan.features.split('\n').map(f => f.trim()).filter(f => f !== ''),
        highlight: plan.highlight
      })

      const updates: Promise<any>[] = []
      
      if (plan.monthlyId) {
        updates.push(fetch(`${API_URL}/panel/plans/${plan.monthlyId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            name: plan.name,
            price: plan.monthlyPrice,
            messages_limit: plan.messages_limit,
            magisterium_limit: plan.magisterium_limit,
            description: descJson,
            is_active: plan.is_active
          })
        }))
      }
      
      if (plan.annualId) {
        updates.push(fetch(`${API_URL}/panel/plans/${plan.annualId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            name: plan.name,
            price: plan.annualPrice,
            messages_limit: plan.messages_limit,
            magisterium_limit: plan.magisterium_limit,
            description: descJson,
            is_active: plan.is_active
          })
        }))
      }

      const results = await Promise.all(updates)
      if (results.some(r => !r.ok)) throw new Error('Falha ao salvar')
      
      toast.success(`Plano ${plan.name} salvo com sucesso!`)
    } catch (err) {
      console.error(err)
      toast.error(`Erro ao salvar plano ${plan.name}`)
    } finally {
      setSaving(prev => ({ ...prev, [plan.tier]: false }))
    }
  }

  const handleCreatePlan = async () => {
    if (!newPlan.tier || !newPlan.name || newPlan.monthlyPrice <= 0 || newPlan.annualPrice <= 0) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    setCreating(true)
    try {
      const storedUser = localStorage.getItem('maria_user')
      const adminId = storedUser ? JSON.parse(storedUser)?.id : ''
      const headers = { 'Content-Type': 'application/json', 'x-admin-id': adminId }

      const descJson = JSON.stringify({
        features: newPlan.features.split('\n').map(f => f.trim()).filter(f => f !== ''),
        highlight: newPlan.highlight
      })

      const createMonthly = fetch(`${API_URL}/panel/plans`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tier: newPlan.tier,
          cycle: 'monthly',
          name: newPlan.name,
          price: newPlan.monthlyPrice,
          messages_limit: newPlan.messages_limit,
          magisterium_limit: newPlan.magisterium_limit,
          description: descJson,
          is_active: true
        })
      })

      const createAnnual = fetch(`${API_URL}/panel/plans`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tier: newPlan.tier,
          cycle: 'annual',
          name: newPlan.name,
          price: newPlan.annualPrice,
          messages_limit: newPlan.messages_limit,
          magisterium_limit: newPlan.magisterium_limit,
          description: descJson,
          is_active: true
        })
      })
      
      const results = await Promise.all([createMonthly, createAnnual])
      if (results.some(r => !r.ok)) throw new Error('Falha ao criar plano')
      
      toast.success('Plano criado com sucesso!')
      setIsCreateModalOpen(false)
      fetchData() // Recarrega os planos
    } catch (err) {
      console.error(err)
      toast.error("Erro ao criar plano")
    } finally {
      setCreating(false)
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
        
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#0047AB] hover:bg-blue-800 text-white font-bold gap-2"
        >
          <Plus size={16} />
          Criar Novo Plano
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#0047AB]" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan, i) => (
            <Card key={plan.tier} className={`border-slate-200 relative overflow-hidden transition-all ${!plan.is_active ? 'opacity-70' : ''}`}>
              {!plan.is_active && (
                <div className="absolute top-4 right-4 bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider z-10">
                  Inativo
                </div>
              )}
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="capitalize">{plan.name}</CardTitle>
                    <CardDescription>Tier: {plan.tier}</CardDescription>
                  </div>
                  <Button 
                    onClick={() => togglePlanActive(i)} 
                    variant={plan.is_active ? "default" : "secondary"}
                    className={`rounded-xl font-bold gap-2 h-8 text-xs ${plan.is_active ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                  >
                    <Power size={14} />
                    {plan.is_active ? 'Ativo' : 'Inativo'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nome de Exibição do Plano</Label>
                  <Input 
                    value={plan.name} 
                    onChange={e => handleUpdatePlan(i, 'name', e.target.value)} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Preço Mensal (R$)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={plan.monthlyPrice} 
                      onChange={e => handleUpdatePlan(i, 'monthlyPrice', parseFloat(e.target.value))} 
                    />
                  </div>
                  <div>
                    <Label>Preço Anual (R$)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={plan.annualPrice} 
                      onChange={e => handleUpdatePlan(i, 'annualPrice', parseFloat(e.target.value))} 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Limite Mensagens (IA)</Label>
                    <Input 
                      type="number" 
                      value={plan.messages_limit || 0} 
                      onChange={e => handleUpdatePlan(i, 'messages_limit', parseInt(e.target.value, 10))} 
                    />
                  </div>
                  <div>
                    <Label>Limite Magisterium</Label>
                    <Input 
                      type="number" 
                      value={plan.magisterium_limit || 0} 
                      onChange={e => handleUpdatePlan(i, 'magisterium_limit', parseInt(e.target.value, 10))} 
                    />
                  </div>
                </div>
                
                <div className="pt-2 border-t border-slate-100">
                  <Label>Tópicos do Plano (Um por linha)</Label>
                  <Textarea 
                    className="min-h-[100px] mt-1 text-sm"
                    placeholder="Reflexão da Liturgia Diária&#10;História do Santo do Dia"
                    value={plan.features} 
                    onChange={e => handleUpdatePlan(i, 'features', e.target.value)} 
                  />
                </div>
                
                <div>
                  <Label>Mensagem de Destaque (Quadradinho na Landing Page)</Label>
                  <Input 
                    className="mt-1"
                    placeholder="💭 20 mensagens iniciais para testar a IA"
                    value={plan.highlight} 
                    onChange={e => handleUpdatePlan(i, 'highlight', e.target.value)} 
                  />
                </div>
                
                <Button className="w-full mt-2" onClick={() => savePlan(plan)} disabled={saving[plan.tier]}>
                  {saving[plan.tier] ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar Alterações
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Nova Assinatura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Tier (Identificador único)</Label>
              <Input 
                placeholder="ex: basic, premium, pro" 
                value={newPlan.tier}
                onChange={e => setNewPlan({...newPlan, tier: e.target.value.toLowerCase()})}
              />
            </div>
            
            <div>
              <Label>Nome de Exibição do Plano</Label>
              <Input 
                placeholder="ex: Plano Ouro"
                value={newPlan.name}
                onChange={e => setNewPlan({...newPlan, name: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço Mensal (R$)</Label>
                <Input 
                  type="number" step="0.01"
                  value={newPlan.monthlyPrice || ''}
                  onChange={e => setNewPlan({...newPlan, monthlyPrice: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Preço Anual (R$)</Label>
                <Input 
                  type="number" step="0.01"
                  value={newPlan.annualPrice || ''}
                  onChange={e => setNewPlan({...newPlan, annualPrice: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Limite Mensagens</Label>
                <Input 
                  type="number"
                  value={newPlan.messages_limit || ''}
                  onChange={e => setNewPlan({...newPlan, messages_limit: parseInt(e.target.value, 10)})}
                />
              </div>
              <div>
                <Label>Limite Magisterium</Label>
                <Input 
                  type="number"
                  value={newPlan.magisterium_limit || ''}
                  onChange={e => setNewPlan({...newPlan, magisterium_limit: parseInt(e.target.value, 10)})}
                />
              </div>
            </div>
            
            <div>
              <Label>Tópicos do Plano (Um por linha)</Label>
              <Textarea 
                className="min-h-[100px] text-sm"
                placeholder="Benefício 1&#10;Benefício 2"
                value={newPlan.features}
                onChange={e => setNewPlan({...newPlan, features: e.target.value})}
              />
            </div>
            
            <div>
              <Label>Mensagem de Destaque</Label>
              <Input 
                placeholder="💭 Recursos Exclusivos"
                value={newPlan.highlight}
                onChange={e => setNewPlan({...newPlan, highlight: e.target.value})}
              />
            </div>

            <Button 
              className="w-full bg-[#0047AB] hover:bg-blue-800 mt-4" 
              onClick={handleCreatePlan}
              disabled={creating}
            >
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Criar Assinatura
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </MainLayout>
  )
}


import { useState, useEffect } from 'react'
import { API_URL } from '../lib/api'
import { MainLayout } from '../components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Handshake, Loader2, Plus, Copy, Tag, Trash } from 'lucide-react'

// Define the API url for WA link generation
const FRONTEND_URL = window.location.origin;

export default function AffiliatesPage() {
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newAffiliate, setNewAffiliate] = useState({ name: '', code: '' })
  
  // States for promotions
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null)
  const [promotions, setPromotions] = useState<any[]>([])
  const [loadingPromos, setLoadingPromos] = useState(false)

  const [newPromo, setNewPromo] = useState({ plan_tier: 'premium', plan_cycle: 'monthly', promotional_price: '' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [affRes, plansRes] = await Promise.all([
        fetch(`${API_URL}/affiliates`),
        fetch(`${API_URL}/plans`)
      ])
      const affData = await affRes.json()
      const plansData = await plansRes.json()
      setAffiliates(affData || [])
      setPlans(plansData || [])
    } catch (err) {
      console.error(err)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAffiliate = async () => {
    if (!newAffiliate.name || !newAffiliate.code) {
      toast.error("Preencha o nome e o código do afiliado.")
      return
    }
    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/affiliates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAffiliate, is_active: true })
      })
      if (!response.ok) throw new Error('Falha ao criar afiliado')
      const created = await response.json()
      setAffiliates([...affiliates, created])
      setNewAffiliate({ name: '', code: '' })
      toast.success('Afiliado criado com sucesso!')
    } catch (err) {
      console.error(err)
      toast.error("Erro ao criar afiliado")
    } finally {
      setSaving(false)
    }
  }

  const toggleAffiliateStatus = async (affiliate: any) => {
    try {
      const response = await fetch(`${API_URL}/affiliates/${affiliate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !affiliate.is_active })
      })
      if (!response.ok) throw new Error('Falha ao atualizar afiliado')
      const updated = await response.json()
      setAffiliates(affiliates.map(a => a.id === affiliate.id ? updated : a))
      toast.success('Status do afiliado atualizado!')
    } catch (err) {
      console.error(err)
      toast.error("Erro ao atualizar afiliado")
    }
  }

  const loadPromotions = async (affiliate: any) => {
    setSelectedAffiliate(affiliate)
    setLoadingPromos(true)
    try {
      const response = await fetch(`${API_URL}/affiliates/${affiliate.id}/promotions`)
      const data = await response.json()
      setPromotions(data || [])
    } catch (err) {
      console.error(err)
      toast.error("Erro ao carregar promoções")
    } finally {
      setLoadingPromos(false)
    }
  }

  const handleCreatePromo = async () => {
    if (!newPromo.promotional_price || !selectedAffiliate) return
    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/affiliates/${selectedAffiliate.id}/promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_tier: newPromo.plan_tier,
          plan_cycle: newPromo.plan_cycle,
          promotional_price: parseFloat(newPromo.promotional_price),
          is_active: true
        })
      })
      if (!response.ok) throw new Error('Falha ao salvar promoção')
      toast.success('Promoção salva com sucesso!')
      loadPromotions(selectedAffiliate)
      setNewPromo({ ...newPromo, promotional_price: '' })
    } catch (err) {
      console.error(err)
      toast.error("Erro ao salvar promoção")
    } finally {
      setSaving(false)
    }
  }

  const togglePromoStatus = async (promo: any) => {
    try {
      const response = await fetch(`${API_URL}/affiliates/${selectedAffiliate.id}/promotions`, {
        method: 'POST', // the backend upserts
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_tier: promo.plan_tier,
          plan_cycle: promo.plan_cycle,
          promotional_price: promo.promotional_price,
          is_active: !promo.is_active
        })
      })
      if (!response.ok) throw new Error('Falha ao atualizar promoção')
      loadPromotions(selectedAffiliate)
      toast.success('Status da promoção atualizado!')
    } catch (err) {
      console.error(err)
      toast.error("Erro ao atualizar promoção")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Link copiado!')
  }

  const WA_NUMBER = "5562981949980";
  const generateWaLink = (code: string) => {
    const msg = `Olá, gostaria de assinar [ref:${code}]`
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`
  }

  const generateWebLink = (code: string) => {
    return `${FRONTEND_URL}/?ref=${code}`
  }

  return (
    <MainLayout title="Afiliados">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
          <Handshake className="text-[#0047AB]" size={32} />
          Afiliados
        </h1>
        <p className="text-slate-500 mt-2">Gerencie seus parceiros, links de indicação e comissionamentos customizados.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: List and Create */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Novo Afiliado</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4 items-end">
              <div className="flex-1">
                <Label>Nome do Afiliado</Label>
                <Input value={newAffiliate.name} onChange={e => setNewAffiliate({...newAffiliate, name: e.target.value})} placeholder="Ex: João Silva" />
              </div>
              <div className="flex-1">
                <Label>Código (Único)</Label>
                <Input value={newAffiliate.code} onChange={e => setNewAffiliate({...newAffiliate, code: e.target.value})} placeholder="Ex: joao123" />
              </div>
              <Button onClick={handleCreateAffiliate} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} Adicionar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Afiliados</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div>
              ) : affiliates.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum afiliado cadastrado.</p>
              ) : (
                <div className="space-y-4">
                  {affiliates.map(aff => (
                    <div key={aff.id} className={`p-4 border rounded-lg flex flex-col sm:flex-row justify-between gap-4 transition-all ${selectedAffiliate?.id === aff.id ? 'border-primary bg-blue-50/50' : 'border-slate-200'}`}>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                          {aff.name}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${aff.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {aff.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </h3>
                        <p className="text-sm text-slate-500 font-mono mt-1">Código: {aff.code}</p>
                        
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-slate-700 w-20">Link WA:</span>
                            <code className="bg-slate-100 px-2 py-1 rounded truncate max-w-[200px]">{generateWaLink(aff.code)}</code>
                            <button onClick={() => copyToClipboard(generateWaLink(aff.code))} className="text-primary hover:text-blue-700"><Copy size={14} /></button>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-slate-700 w-20">Link Site:</span>
                            <code className="bg-slate-100 px-2 py-1 rounded truncate max-w-[200px]">{generateWebLink(aff.code)}</code>
                            <button onClick={() => copyToClipboard(generateWebLink(aff.code))} className="text-primary hover:text-blue-700"><Copy size={14} /></button>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 justify-start sm:items-end">
                        <Button variant="outline" size="sm" onClick={() => loadPromotions(aff)}>
                          <Tag className="w-4 h-4 mr-2" /> Promoções
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => toggleAffiliateStatus(aff)} className={aff.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}>
                          {aff.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Promotions */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Promoções</CardTitle>
              <CardDescription>
                {selectedAffiliate ? `Configurando para: ${selectedAffiliate.name}` : 'Selecione um afiliado para gerenciar.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedAffiliate ? (
                <div className="text-center py-8 text-slate-400">
                  <Handshake size={48} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Selecione um afiliado na lista ao lado.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Create new promo */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                    <h4 className="font-semibold text-sm">Nova Regra de Preço</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Plano (Tier)</Label>
                        <select className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={newPromo.plan_tier} onChange={e => setNewPromo({...newPromo, plan_tier: e.target.value})}>
                          <option value="basic">Basic</option>
                          <option value="premium">Premium</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Ciclo</Label>
                        <select className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={newPromo.plan_cycle} onChange={e => setNewPromo({...newPromo, plan_cycle: e.target.value})}>
                          <option value="monthly">Mensal</option>
                          <option value="annual">Anual</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Preço Promocional (R$)</Label>
                      <Input type="number" step="0.01" value={newPromo.promotional_price} onChange={e => setNewPromo({...newPromo, promotional_price: e.target.value})} placeholder="Ex: 19.90" />
                    </div>
                    <Button size="sm" className="w-full" onClick={handleCreatePromo} disabled={saving || !newPromo.promotional_price}>
                      Salvar Regra
                    </Button>
                  </div>

                  {/* List promos */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Regras Atuais</h4>
                    {loadingPromos ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                    ) : promotions.length === 0 ? (
                      <p className="text-xs text-slate-500">Sem regras de preço específicas (será usado o valor original do plano).</p>
                    ) : (
                      <div className="space-y-2">
                        {promotions.map(promo => {
                          const basePlan = plans.find(p => p.tier === promo.plan_tier && p.cycle === promo.plan_cycle)
                          return (
                            <div key={promo.id} className="flex items-center justify-between p-3 border rounded-md bg-white text-sm">
                              <div>
                                <p className="font-medium capitalize">{promo.plan_tier} - {promo.plan_cycle}</p>
                                <div className="flex gap-2 items-center mt-1">
                                  <span className="text-xs line-through text-slate-400">R$ {basePlan?.price || '?'}</span>
                                  <span className="text-green-600 font-bold">R$ {promo.promotional_price}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${promo.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {promo.is_active ? 'Ativo' : 'Inativo'}
                                </span>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePromoStatus(promo)}>
                                  <Trash className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}

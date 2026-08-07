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
  const [editingAffiliateId, setEditingAffiliateId] = useState<string | null>(null)
  const [newAffiliate, setNewAffiliate] = useState({ 
    name: '', 
    code: '', 
    email: '', 
    password: '', 
    commission_type: 'percentage', 
    commission_value: '', 
    commission_duration_months: '', 
    can_view_insights: false 
  })
  
  // States for promotions
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null)
  const [promotions, setPromotions] = useState<any[]>([])
  const [loadingPromos, setLoadingPromos] = useState(false)

  const [newPromo, setNewPromo] = useState({ plan_tier: 'premium', plan_cycle: 'monthly', discount_percentage: '' })

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

  const handleSaveAffiliate = async () => {
    if (!newAffiliate.name || !newAffiliate.code) {
      toast.error("Preencha o nome e o código do afiliado.")
      return
    }
    setSaving(true)
    try {
      const affiliateEmail = newAffiliate.email.includes('@') || newAffiliate.email === '' 
        ? newAffiliate.email 
        : `${newAffiliate.email}@acutistech.com.br`;

      const payload = {
        ...newAffiliate,
        email: affiliateEmail,
        commission_value: newAffiliate.commission_value ? parseFloat(newAffiliate.commission_value.toString()) : 0,
        commission_duration_months: newAffiliate.commission_duration_months ? parseInt(newAffiliate.commission_duration_months.toString()) : null,
      }
      
      let response;
      if (editingAffiliateId) {
        response = await fetch(`${API_URL}/affiliates/${editingAffiliateId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        response = await fetch(`${API_URL}/affiliates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, is_active: true })
        })
      }

      if (!response.ok) throw new Error(editingAffiliateId ? 'Falha ao atualizar afiliado' : 'Falha ao criar afiliado')
      
      const saved = await response.json()
      
      if (editingAffiliateId) {
        setAffiliates(affiliates.map(a => a.id === editingAffiliateId ? saved : a))
        toast.success('Afiliado atualizado com sucesso!')
      } else {
        setAffiliates([...affiliates, saved])
        toast.success('Afiliado criado com sucesso!')
      }

      cancelEdit()
    } catch (err) {
      console.error(err)
      toast.error(editingAffiliateId ? "Erro ao atualizar afiliado" : "Erro ao criar afiliado")
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditingAffiliateId(null)
    setNewAffiliate({ 
      name: '', code: '', email: '', password: '', 
      commission_type: 'percentage', commission_value: '', 
      commission_duration_months: '', can_view_insights: false 
    })
  }

  const startEdit = (affiliate: any) => {
    setEditingAffiliateId(affiliate.id)
    setNewAffiliate({
      name: affiliate.name || '',
      code: affiliate.code || '',
      email: affiliate.email || '',
      password: '', // Don't populate password for security, let them type a new one if they want to change it (assuming backend handles empty password as "don't change")
      commission_type: affiliate.commission_type || 'percentage',
      commission_value: affiliate.commission_value?.toString() || '',
      commission_duration_months: affiliate.commission_duration_months?.toString() || '',
      can_view_insights: affiliate.can_view_insights || false
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    if (!newPromo.discount_percentage || !selectedAffiliate) return
    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/affiliates/${selectedAffiliate.id}/promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_tier: newPromo.plan_tier,
          plan_cycle: newPromo.plan_cycle,
          discount_percentage: parseFloat(newPromo.discount_percentage),
          is_active: true
        })
      })
      if (!response.ok) throw new Error('Falha ao salvar promoção')
      toast.success('Promoção salva com sucesso!')
      loadPromotions(selectedAffiliate)
      setNewPromo({ ...newPromo, discount_percentage: '' })
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
          discount_percentage: promo.discount_percentage,
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
              <CardTitle>{editingAffiliateId ? 'Editar Afiliado' : 'Novo Afiliado'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Afiliado *</Label>
                  <Input value={newAffiliate.name} onChange={e => setNewAffiliate({...newAffiliate, name: e.target.value})} placeholder="Ex: João Silva" />
                </div>
                <div>
                  <Label>Código (Único) *</Label>
                  <Input value={newAffiliate.code} onChange={e => setNewAffiliate({...newAffiliate, code: e.target.value})} placeholder="Ex: joao123" />
                </div>
                <div>
                  <Label>Usuário ou E-mail (Para Login no Dashboard)</Label>
                  <Input type="text" value={newAffiliate.email} onChange={e => setNewAffiliate({...newAffiliate, email: e.target.value.toLowerCase().trim()})} placeholder="Ex: joao123 ou joao@email.com" />
                </div>
                <div>
                  <Label>Senha (Para Login no Dashboard)</Label>
                  <Input type="password" value={newAffiliate.password} onChange={e => setNewAffiliate({...newAffiliate, password: e.target.value})} placeholder="Senha inicial" />
                </div>
                <div>
                  <Label>Tipo de Comissão</Label>
                  <select className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={newAffiliate.commission_type} onChange={e => setNewAffiliate({...newAffiliate, commission_type: e.target.value})}>
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <Label>Valor da Comissão</Label>
                  <Input type="number" step="0.01" value={newAffiliate.commission_value} onChange={e => setNewAffiliate({...newAffiliate, commission_value: e.target.value})} placeholder="Ex: 20" />
                </div>
                <div>
                  <Label>Duração da Comissão (Meses)</Label>
                  <Input type="number" step="1" value={newAffiliate.commission_duration_months} onChange={e => setNewAffiliate({...newAffiliate, commission_duration_months: e.target.value})} placeholder="Ex: 12 (Vazio = vitalício)" />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input type="checkbox" id="insights" checked={newAffiliate.can_view_insights} onChange={e => setNewAffiliate({...newAffiliate, can_view_insights: e.target.checked})} className="w-4 h-4" />
                  <Label htmlFor="insights">Permitir ver Insights da IA</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                {editingAffiliateId && (
                  <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                    Cancelar
                  </Button>
                )}
                <Button onClick={handleSaveAffiliate} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} 
                  {editingAffiliateId ? 'Salvar Alterações' : 'Adicionar Afiliado'}
                </Button>
              </div>
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
                          <div className="grid grid-cols-2 gap-2 mt-2 p-2 bg-slate-50 rounded text-xs border border-slate-100">
                            <div><span className="font-medium">Comissão:</span> {aff.commission_type === 'percentage' ? `${aff.commission_value || 0}%` : `R$ ${aff.commission_value || 0}`}</div>
                            <div><span className="font-medium">Duração:</span> {aff.commission_duration_months ? `${aff.commission_duration_months} meses` : 'Vitalício'}</div>
                            <div><span className="font-medium">Insights:</span> {aff.can_view_insights ? 'Sim' : 'Não'}</div>
                            <div><span className="font-medium">Acesso Dashboard:</span> {aff.admin_id ? 'Ativo' : 'Não'}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 justify-start sm:items-end">
                        <Button variant="outline" size="sm" onClick={() => startEdit(aff)}>
                          Editar
                        </Button>
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
                      <Label className="text-xs">Desconto (%)</Label>
                      <Input type="number" step="1" value={newPromo.discount_percentage} onChange={e => setNewPromo({...newPromo, discount_percentage: e.target.value})} placeholder="Ex: 15" />
                    </div>
                    <Button size="sm" className="w-full" onClick={handleCreatePromo} disabled={saving || !newPromo.discount_percentage}>
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
                                  <span className="text-green-600 font-bold">{promo.discount_percentage}% OFF</span>
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

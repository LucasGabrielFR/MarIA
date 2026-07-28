import { useState, useEffect } from 'react'
import { API_URL } from '../lib/api'
import { MainLayout } from '../components/layout/main-layout'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

import { toast } from "sonner"
import { Save, Loader2, CalendarClock, Plus, Trash2, Settings2, Users } from 'lucide-react'

export default function ScheduledMessagesPage() {
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const storedUser = localStorage.getItem('maria_user');
      const adminId = storedUser ? JSON.parse(storedUser)?.id : '';
      const res = await fetch(`${API_URL}/admin/scheduled-messages`, {
        headers: { 'x-admin-id': adminId }
      })
      if (!res.ok) throw new Error('Falha ao carregar agendamentos.')
      
      const data = await res.json()
      setCampaigns(data)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar os agendamentos.')
    } finally {
      setLoading(false)
    }
  }

  const addNewCampaign = async () => {
    try {
      const storedUser = localStorage.getItem('maria_user');
      const adminId = storedUser ? JSON.parse(storedUser)?.id : '';
      const newCampaign = {
        name: 'Nova Mensagem Agendada',
        time: '08:00',
        prompt: '',
        audience: ['basic', 'premium', 'unlimited'],
        tools: [],
        is_active: true
      };
      
      const response = await fetch(`${API_URL}/admin/scheduled-messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-id': adminId
        },
        body: JSON.stringify(newCampaign)
      });
      
      if (!response.ok) throw new Error('Erro ao criar campanha');
      const data = await response.json();
      setCampaigns([data, ...campaigns]);
      toast.success('Nova campanha criada!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao criar nova campanha.');
    }
  }

  const saveCampaign = async (campaign: any) => {
    setSavingId(campaign.id)
    try {
      const storedUser = localStorage.getItem('maria_user');
      const adminId = storedUser ? JSON.parse(storedUser)?.id : '';
      const response = await fetch(`${API_URL}/admin/scheduled-messages/${campaign.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-id': adminId
        },
        body: JSON.stringify(campaign)
      });
      if (!response.ok) throw new Error('Erro ao salvar campanha');
      toast.success('Campanha salva com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar a campanha.');
    } finally {
      setSavingId(null)
    }
  }

  const removeCampaign = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta campanha?')) return;
    try {
      const storedUser = localStorage.getItem('maria_user');
      const adminId = storedUser ? JSON.parse(storedUser)?.id : '';
      const response = await fetch(`${API_URL}/admin/scheduled-messages/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-id': adminId }
      });
      if (!response.ok) throw new Error('Erro ao remover campanha');
      setCampaigns(campaigns.filter(c => c.id !== id));
      toast.success('Campanha removida com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao remover a campanha.');
    }
  }

  const updateCampaign = (id: string, field: string, value: any) => {
    setCampaigns(campaigns.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  const toggleAudience = (id: string, plan: string, checked: boolean) => {
    setCampaigns(campaigns.map(c => {
      if (c.id !== id) return c;
      let newAudience = [...(c.audience || [])];
      if (checked && !newAudience.includes(plan)) newAudience.push(plan);
      if (!checked) newAudience = newAudience.filter(p => p !== plan);
      return { ...c, audience: newAudience };
    }))
  }

  const updateTool = (id: string, type: string, option: string) => {
    setCampaigns(campaigns.map(c => {
      if (c.id !== id) return c;
      // For now we allow only one tool of a specific type
      const otherTools = (c.tools || []).filter((t: any) => t.type !== type);
      if (option === 'none') {
        return { ...c, tools: otherTools };
      } else {
        return { ...c, tools: [...otherTools, { type, option }] };
      }
    }))
  }

  const getToolOption = (id: string, type: string) => {
    const campaign = campaigns.find(c => c.id === id);
    if (!campaign) return 'none';
    const tool = (campaign.tools || []).find((t: any) => t.type === type);
    return tool ? (tool.option || 'default') : 'none';
  }

  if (loading) {
    return (
      <MainLayout title="Mensagens Agendadas">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Mensagens Agendadas (IA)">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <CalendarClock className="text-[#0047AB]" size={32} />
            Mensagens Agendadas (IA)
          </h1>
          <p className="text-slate-500 mt-2">
            Configure campanhas proativas, escolha os públicos-alvo e anexe ferramentas da IA (como a Liturgia Interativa).
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={addNewCampaign} className="bg-[#0047AB] hover:bg-[#002D6E] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nova Campanha
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {campaigns.length === 0 && (
          <div className="text-center p-12 bg-white rounded-lg border border-dashed border-slate-300 text-slate-500">
            Nenhuma campanha configurada no momento.
          </div>
        )}

        {campaigns.map((camp) => (
          <Card key={camp.id} className="border-slate-200 shadow-sm relative overflow-visible">
            <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-lg pb-4">
              <div className="flex justify-between items-center">
                <div className="flex-1 flex gap-4">
                  <div className="w-1/2">
                    <Label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Nome da Campanha</Label>
                    <Input 
                      value={camp.name} 
                      onChange={(e) => updateCampaign(camp.id, 'name', e.target.value)} 
                      className="font-semibold text-lg border-transparent hover:border-slate-300 focus:border-[#0047AB] bg-transparent focus:bg-white transition-all -ml-3 px-3 h-10 mt-1 shadow-none"
                    />
                  </div>
                  <div className="w-32">
                    <Label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Horário</Label>
                    <Input 
                      type="time" 
                      value={camp.time} 
                      onChange={(e) => updateCampaign(camp.id, 'time', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="w-32 flex flex-col justify-end">
                    <Label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Status</Label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox"
                        className="w-4 h-4 text-[#0047AB] bg-white border-slate-300 rounded focus:ring-[#0047AB]"
                        id={`status-${camp.id}`} 
                        checked={camp.is_active !== false}
                        onChange={(e) => updateCampaign(camp.id, 'is_active', e.target.checked)}
                      />
                      <Label htmlFor={`status-${camp.id}`} className="cursor-pointer">
                        {camp.is_active !== false ? 'Ativo' : 'Pausado'}
                      </Label>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeCampaign(camp.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                  <Trash2 size={18} />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6 grid md:grid-cols-12 gap-8">
              {/* Esquerda: Configurações */}
              <div className="md:col-span-4 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-700">
                    <Users size={16} /> Público-Alvo
                  </h4>
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-md border border-slate-100">
                    {['free', 'basic', 'premium', 'unlimited'].map(plan => (
                      <div key={plan} className="flex items-center space-x-2">
                        <input 
                          type="checkbox"
                          className="w-4 h-4 text-[#0047AB] bg-white border-slate-300 rounded focus:ring-[#0047AB]"
                          id={`${camp.id}-${plan}`} 
                          checked={(camp.audience || []).includes(plan)}
                          onChange={(e) => toggleAudience(camp.id, plan, e.target.checked)}
                        />
                        <Label htmlFor={`${camp.id}-${plan}`} className="capitalize cursor-pointer">
                          {plan === 'free' ? 'Gratuito' : plan === 'basic' ? 'Básico' : plan}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-700">
                    <Settings2 size={16} /> Ferramentas Anexadas
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500">Ferramenta: Liturgia Diária</Label>
                      <select 
                        className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 ring-offset-white focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={getToolOption(camp.id, 'liturgy')}
                        onChange={(e) => updateTool(camp.id, 'liturgy', e.target.value)}
                      >
                        <option value="none">Não utilizar</option>
                        <option value="menu">Menu Interativo (Botões)</option>
                        <option value="short">Injetar Liturgia Resumida</option>
                        <option value="full">Injetar Liturgia Completa</option>
                      </select>
                      {getToolOption(camp.id, 'liturgy') !== 'none' && getToolOption(camp.id, 'liturgy') !== 'menu' && (
                        <p className="text-xs text-blue-600 mt-1">Use {'{liturgia}'} no prompt.</p>
                      )}
                      {getToolOption(camp.id, 'liturgy') === 'menu' && (
                        <p className="text-xs text-amber-600 mt-1">Os botões de liturgia serão enviados junto com a resposta da IA.</p>
                      )}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <Label className="text-xs text-slate-500">Ferramenta: Memória (Contexto)</Label>
                      <select 
                        className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 ring-offset-white focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={getToolOption(camp.id, 'context')}
                        onChange={(e) => updateTool(camp.id, 'context', e.target.value)}
                      >
                        <option value="none">Não utilizar</option>
                        <option value="default">Injetar 10 últimas mensagens</option>
                      </select>
                      {getToolOption(camp.id, 'context') !== 'none' && (
                        <p className="text-xs text-blue-600 mt-1">Use {'{contexto}'} no prompt.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Direita: Prompt */}
              <div className="md:col-span-8 flex flex-col">
                <Label className="text-sm font-semibold mb-2 text-slate-700">Prompt / Instrução para IA</Label>
                <Textarea 
                  className="flex-1 min-h-[250px] resize-y bg-slate-50 focus:bg-white mb-4"
                  value={camp.prompt} 
                  onChange={(e) => updateCampaign(camp.id, 'prompt', e.target.value)} 
                  placeholder="Ex: Aja como um conselheiro amigável. Deseje um bom dia ao usuário."
                />
                
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button 
                    onClick={() => saveCampaign(camp)} 
                    disabled={savingId === camp.id} 
                    className="bg-[#0047AB] hover:bg-[#002D6E] text-white"
                  >
                    {savingId === camp.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Salvar Esta Campanha
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  )
}

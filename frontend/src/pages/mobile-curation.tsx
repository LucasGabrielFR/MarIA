import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { BellRing, BookOpen, CalendarClock, Check, ChevronRight, CirclePlus, LoaderCircle, Megaphone, Pencil, Send, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { MainLayout } from '../components/layout/main-layout'
import { API_URL } from '../lib/api'

type Highlight = { id: string; title: string; subtitle: string; target_path: string; sort_order: number; is_active: boolean }
type Campaign = { id: string; title: string; body: string; status: string; scheduled_at: string; sent_at: string | null; recipient_count: number; failure_count: number }
type StoredSession = { access_token?: string; refresh_token?: string }
type RefreshedSession = { user: Record<string, unknown>; session: StoredSession }

let refreshInFlight: Promise<RefreshedSession> | null = null

function refreshAdminSession(refreshToken: string) {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).then(async response => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Sua sessão expirou. Entre novamente.')
      return data as RefreshedSession
    }).finally(() => { refreshInFlight = null })
  }
  return refreshInFlight
}

function readStoredValue<T>(key: string): T {
  try { return JSON.parse(localStorage.getItem(key) || '{}') as T } catch { return {} as T }
}

const destinations = [
  { value: '/mobile/', label: 'Santuário / início' },
  { value: '/mobile/liturgy', label: 'Liturgia diária' },
  { value: '/mobile/prayers', label: 'Orações e terço' },
  { value: '/mobile/novenas', label: 'Novenas' },
]

const blankHighlight = { title: '', subtitle: '', targetPath: '/mobile/', sortOrder: 0, active: true }

export default function MobileCurationPage() {
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [highlight, setHighlight] = useState(blankHighlight)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [campaign, setCampaign] = useState({ title: '', body: '', targetPath: '/mobile/', scheduledAt: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    const send = (token: string, adminId: string) => fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId, Authorization: `Bearer ${token}`, ...init.headers },
    })
    let session = readStoredValue<StoredSession>('maria_session')
    let user = readStoredValue<{ id?: string }>('maria_user')
    let response = await send(session.access_token || '', user.id || '')

    if (response.status === 401 && session.refresh_token) {
      try {
        const refreshed = await refreshAdminSession(session.refresh_token)
        session = refreshed.session
        user = refreshed.user as { id?: string }
        localStorage.setItem('maria_session', JSON.stringify(session))
        localStorage.setItem('maria_user', JSON.stringify(user))
        response = await send(session.access_token || '', user.id || '')
      } catch (error) {
        localStorage.removeItem('maria_session')
        localStorage.removeItem('maria_user')
        toast.error(error instanceof Error ? error.message : 'Sua sessão expirou. Entre novamente.')
        window.location.assign('/admin/')
        throw error
      }
    }

    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Não foi possível concluir a operação.')
    return data
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [items, sends] = await Promise.all([
        request('/panel/mobile/highlights'),
        request('/panel/mobile/campaigns'),
      ])
      setHighlights(items)
      setCampaigns(sends)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao carregar a central mobile.')
    } finally { setLoading(false) }
  }, [request])

  useEffect(() => {
    let isCurrent = true
    const load = async () => {
      try {
        const [items, sends] = await Promise.all([
          request('/panel/mobile/highlights'),
          request('/panel/mobile/campaigns'),
        ])
        if (isCurrent) {
          setHighlights(items)
          setCampaigns(sends)
        }
      } catch (error) {
        if (isCurrent) toast.error(error instanceof Error ? error.message : 'Falha ao carregar a central mobile.')
      } finally {
        if (isCurrent) setLoading(false)
      }
    }
    void load()
    return () => { isCurrent = false }
  }, [request])

  const saveHighlight = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await request('/panel/mobile/highlights', {
        method: 'POST',
        body: JSON.stringify({ ...highlight, ...(editingId ? { id: editingId } : {}) }),
      })
      toast.success(editingId ? 'Destaque atualizado.' : 'Destaque publicado na Home mobile.')
      setHighlight(blankHighlight)
      setEditingId(null)
      await refresh()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Falha ao salvar destaque.') }
    finally { setSaving(false) }
  }

  const removeHighlight = async (id: string) => {
    try {
      await request(`/panel/mobile/highlights/${id}`, { method: 'DELETE' })
      toast.success('Destaque removido.')
      await refresh()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Falha ao remover destaque.') }
  }

  const sendCampaign = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await request('/panel/mobile/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          ...campaign,
          scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString() : undefined,
        }),
      })
      toast.success(campaign.scheduledAt ? 'Campanha agendada para os fiéis com push ativo.' : 'Campanha enviada para os fiéis com push ativo.')
      setCampaign({ title: '', body: '', targetPath: '/mobile/', scheduledAt: '' })
      await refresh()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Falha no envio da campanha.') }
    finally { setSaving(false) }
  }

  return <MainLayout title="Central Mobile · Curadoria" subtitle="Destaques da Home e comunicação devocional por push remoto.">
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <div className="flex items-center gap-2 font-semibold"><BellRing size={17} /> Push remoto</div>
      <p className="mt-1 text-amber-800">Campanhas alcançam somente instalações que ativaram os avisos no aplicativo. O serviço FCM precisa estar configurado no backend.</p>
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700"><Sparkles size={20} /></div><div><h2 className="font-bold text-slate-900">Destaques do Santuário</h2><p className="text-sm text-slate-500">Curadoria horizontal exibida na Home mobile.</p></div></div>
        <form className="grid gap-3 rounded-xl bg-slate-50 p-4" onSubmit={saveHighlight}>
          <input required maxLength={80} placeholder="Título do destaque" value={highlight.title} onChange={e => setHighlight({ ...highlight, title: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400" />
          <textarea required maxLength={180} rows={2} placeholder="Uma frase breve para convidar o fiel" value={highlight.subtitle} onChange={e => setHighlight({ ...highlight, subtitle: e.target.value })} className="resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400" />
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <select value={highlight.targetPath} onChange={e => setHighlight({ ...highlight, targetPath: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">{destinations.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            <input aria-label="Ordem" type="number" min={0} max={99} value={highlight.sortOrder} onChange={e => setHighlight({ ...highlight, sortOrder: Number(e.target.value) })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={highlight.active} onChange={e => setHighlight({ ...highlight, active: e.target.checked })} /> Visível na Home</label>
          <div className="flex gap-2"><button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"><CirclePlus size={16} />{editingId ? 'Salvar edição' : 'Publicar destaque'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setHighlight(blankHighlight) }} className="rounded-lg px-3 py-2 text-sm text-slate-600">Cancelar</button>}</div>
        </form>
        <div className="mt-5 space-y-3">
          {loading ? <div className="flex justify-center p-8 text-slate-400"><LoaderCircle className="animate-spin" /></div> : highlights.map(item => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-4"><BookOpen className="shrink-0 text-indigo-600" size={19} /><div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-800">{item.title} {!item.is_active && <span className="text-xs font-normal text-slate-400">· pausado</span>}</p><p className="truncate text-sm text-slate-500">{item.subtitle}</p></div><button title="Editar" onClick={() => { setEditingId(item.id); setHighlight({ title: item.title, subtitle: item.subtitle, targetPath: item.target_path, sortOrder: item.sort_order, active: item.is_active }) }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil size={16} /></button><button title="Remover" onClick={() => void removeHighlight(item.id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button></div>)}
          {!loading && highlights.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-400">Nenhum destaque cadastrado.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-amber-50 p-2.5 text-amber-700"><Megaphone size={20} /></div><div><h2 className="font-bold text-slate-900">Campanha devocional</h2><p className="text-sm text-slate-500">Envio agora ou agendamento para opt-ins ativos.</p></div></div>
        <form className="space-y-3" onSubmit={sendCampaign}>
          <input required maxLength={80} placeholder="Título da notificação" value={campaign.title} onChange={e => setCampaign({ ...campaign, title: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <textarea required maxLength={240} rows={4} placeholder="Mensagem breve (até 240 caracteres)" value={campaign.body} onChange={e => setCampaign({ ...campaign, body: e.target.value })} className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <select value={campaign.targetPath} onChange={e => setCampaign({ ...campaign, targetPath: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">{destinations.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Agendar (opcional)</label>
          <input type="datetime-local" value={campaign.scheduledAt} onChange={e => setCampaign({ ...campaign, scheduledAt: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#002D6E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0047AB] disabled:opacity-60">{campaign.scheduledAt ? <CalendarClock size={16} /> : <Send size={16} />}{campaign.scheduledAt ? 'Agendar campanha' : 'Enviar campanha'}</button>
        </form>
        <div className="mt-7 border-t border-slate-100 pt-5"><h3 className="mb-3 text-sm font-bold text-slate-800">Atividade recente</h3><div className="space-y-2">
          {campaigns.slice(0, 8).map(item => <div key={item.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm"><span className="shrink-0">{item.status === 'sent' ? <Check size={16} className="text-emerald-600" /> : <ChevronRight size={16} className="text-slate-400" />}</span><div className="min-w-0 flex-1"><p className="truncate font-medium text-slate-700">{item.title}</p><p className="text-xs text-slate-500">{item.status === 'sent' ? `${item.recipient_count} enviados · ${item.failure_count} falhas` : item.status === 'scheduled' ? `Agendado para ${new Date(item.scheduled_at).toLocaleString('pt-BR')}` : item.status === 'failed' ? 'Falha no envio — verifique FCM' : item.status}</p></div></div>)}
          {!loading && campaigns.length === 0 && <p className="text-sm text-slate-400">Nenhuma campanha ainda.</p>}
        </div></div>
      </section>
    </div>
  </MainLayout>
}

import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Search, Check, Ticket, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn, formatMoney, toDateKey } from '@/lib/utils'
import type { Profile, SubscriptionPlan } from '@/types'

interface ActiveSub {
  user_id: string
  plan_id: string
  expires_at: string
  classes_left: number | null
  subscription_plans: { name_ru: string; name_ro: string; name_en: string } | null
}

export function AdminClientsPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language

  const [clients, setClients] = useState<Profile[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [subs, setSubs] = useState<Record<string, ActiveSub>>({})
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [{ data: cl }, { data: pl }, { data: sb }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'user').order('created_at', { ascending: false }),
      supabase.from('subscription_plans').select('*').eq('is_active', true).order('sort_order'),
      supabase
        .from('subscriptions')
        .select('user_id,plan_id,expires_at,classes_left,subscription_plans(name_ru,name_ro,name_en)')
        .eq('status', 'active'),
    ])
    setClients((cl as Profile[]) ?? [])
    setPlans((pl as SubscriptionPlan[]) ?? [])
    const map: Record<string, ActiveSub> = {}
    ;((sb as unknown as ActiveSub[]) ?? []).forEach((s) => {
      map[s.user_id] = s
    })
    setSubs(map)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function planName(p: { name_ru: string; name_ro: string; name_en: string } | null) {
    if (!p) return '—'
    return lang === 'ro' ? p.name_ro : lang === 'en' ? p.name_en : p.name_ru
  }

  async function assign(clientId: string, plan: SubscriptionPlan) {
    setBusy(true)
    const started = new Date()
    const expires = new Date(started)
    expires.setDate(started.getDate() + plan.duration_days)
    // прошлый активный абонемент завершаем
    await supabase.from('subscriptions').update({ status: 'expired' }).eq('user_id', clientId).eq('status', 'active')
    await supabase.from('subscriptions').insert({
      user_id: clientId,
      plan_id: plan.id,
      started_at: toDateKey(started),
      expires_at: toDateKey(expires),
      classes_left: plan.classes_count,
      status: 'active',
    })
    await load()
    setBusy(false)
  }

  const filtered = clients.filter((c) => {
    const s = `${c.first_name} ${c.last_name} ${c.phone ?? ''} ${c.id}`.toLowerCase()
    return s.includes(query.toLowerCase())
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t('admin.clientsPage.title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('admin.clientsPage.subtitle')}</p>

      <div className="relative mt-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('admin.clientsPage.search')}
          className="input-base pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {filtered.map((c) => {
            const sub = subs[c.id]
            const open = openId === c.id
            return (
              <div key={c.id} className="rounded-2xl border border-border bg-card">
                <button
                  onClick={() => setOpenId(open ? null : c.id)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left"
                >
                  <div>
                    <p className="font-medium">
                      {c.first_name} {c.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.phone || '—'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {sub ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <Ticket size={12} /> {planName(sub.subscription_plans)}
                        {sub.classes_left != null && ` · ${sub.classes_left}`}
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                        {t('admin.clientsPage.noSub')}
                      </span>
                    )}
                    <ChevronDown size={16} className={cn('text-muted-foreground transition-transform', open && 'rotate-180')} />
                  </div>
                </button>

                {open && (
                  <div className="border-t border-border p-4">
                    {sub && (
                      <p className="mb-3 text-xs text-muted-foreground">
                        {t('admin.clientsPage.current')}: <b>{planName(sub.subscription_plans)}</b> ·{' '}
                        {t('admin.clientsPage.until')} {sub.expires_at}
                        {sub.classes_left != null && ` · ${t('admin.clientsPage.left')}: ${sub.classes_left}`}
                      </p>
                    )}
                    <p className="mb-2 text-sm font-medium">{t('admin.clientsPage.assign')}</p>
                    <div className="flex flex-wrap gap-2">
                      {plans.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => assign(c.id, p)}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-medium transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary disabled:opacity-50"
                        >
                          <Check size={13} /> {planName(p)} · {formatMoney(p.price_mdl, lang)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
              {t('admin.clientsPage.noResults')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

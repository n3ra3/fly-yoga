import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Phone, Check, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn, formatDate, formatTime } from '@/lib/utils'
import type { IndividualRequest } from '@/types'

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-yellow-100 text-yellow-700',
  contacted: 'bg-sky-100 text-sky-700',
  done: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-muted text-muted-foreground',
}

export function AdminRequestsPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [items, setItems] = useState<IndividualRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'new' | 'all'>('new')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('individual_requests')
      .select('*')
      .order('created_at', { ascending: false })
    setItems((data as IndividualRequest[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function setStatus(id: string, status: IndividualRequest['status']) {
    setBusyId(id)
    await supabase.from('individual_requests').update({ status }).eq('id', id)
    await load()
    setBusyId(null)
  }

  const newCount = items.filter((r) => r.status === 'new').length
  const filtered = tab === 'new' ? items.filter((r) => r.status === 'new') : items

  function serviceLabel(s: string | null) {
    if (s === 'group') return t('services.book.service.group')
    if (s === 'individual') return t('services.book.service.individual')
    return '—'
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t('admin.requestsPage.title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('admin.requestsPage.subtitle')}</p>

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setTab('new')}
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
            tab === 'new' ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground/70 hover:border-primary/40',
          )}
        >
          {t('admin.requestsPage.new')}
          {newCount > 0 && (
            <span className={cn('rounded-full px-1.5 text-xs', tab === 'new' ? 'bg-white/25' : 'bg-yellow-100 text-yellow-700')}>
              {newCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('all')}
          className={cn(
            'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
            tab === 'all' ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground/70 hover:border-primary/40',
          )}
        >
          {t('admin.requestsPage.all')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
          {tab === 'new' ? t('admin.requestsPage.noNew') : t('admin.requestsPage.empty')}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{r.name || t('admin.requestsPage.noName')}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground/70">
                      {serviceLabel(r.service)}
                    </span>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLE[r.status])}>
                      {t(`admin.requestsPage.status.${r.status}`)}
                    </span>
                  </div>
                  <a
                    href={`tel:${r.phone}`}
                    className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <Phone size={13} /> {r.phone}
                  </a>
                  {r.comment && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{r.comment}</p>}
                  <p className="mt-2 text-xs text-muted-foreground/70">
                    {formatDate(r.created_at, lang)}, {formatTime(r.created_at, lang)}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  {r.status === 'new' && (
                    <button
                      onClick={() => setStatus(r.id, 'contacted')}
                      disabled={busyId === r.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-600 disabled:opacity-50"
                    >
                      <Phone size={13} /> {t('admin.requestsPage.markContacted')}
                    </button>
                  )}
                  {(r.status === 'new' || r.status === 'contacted') && (
                    <button
                      onClick={() => setStatus(r.id, 'done')}
                      disabled={busyId === r.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Check size={13} /> {t('admin.requestsPage.markDone')}
                    </button>
                  )}
                  {r.status === 'done' && (
                    <button
                      onClick={() => setStatus(r.id, 'new')}
                      disabled={busyId === r.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
                    >
                      <Clock size={13} /> {t('admin.requestsPage.reopen')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

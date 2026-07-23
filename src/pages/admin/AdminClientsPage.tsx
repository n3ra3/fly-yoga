import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Search, Check, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

export function AdminClientsPage() {
  const { t } = useTranslation()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'pending' | 'all'>('pending')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('role', 'admin')
      .order('created_at', { ascending: false })
    setProfiles((data as Profile[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function setApproved(id: string, value: boolean) {
    setBusyId(id)
    await supabase.from('profiles').update({ is_approved: value }).eq('id', id)
    await load()
    setBusyId(null)
  }

  const pendingCount = profiles.filter((p) => !p.is_approved).length

  const filtered = profiles
    .filter((p) => (tab === 'pending' ? !p.is_approved : true))
    .filter((p) => `${p.first_name} ${p.last_name} ${p.phone ?? ''}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t('admin.clientsPage.title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('admin.clientsPage.subtitle')}</p>

      {/* Вкладки */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setTab('pending')}
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
            tab === 'pending'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-foreground/70 hover:border-primary/40',
          )}
        >
          {t('admin.clientsPage.pending')}
          {pendingCount > 0 && (
            <span
              className={cn(
                'rounded-full px-1.5 text-xs',
                tab === 'pending' ? 'bg-white/25' : 'bg-yellow-100 text-yellow-700',
              )}
            >
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('all')}
          className={cn(
            'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
            tab === 'all'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-foreground/70 hover:border-primary/40',
          )}
        >
          {t('admin.clientsPage.all')}
        </button>
      </div>

      <div className="relative mt-4 max-w-sm">
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
        <div className="mt-6 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">{t('admin.clientsPage.name')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.clientsPage.status')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {p.first_name} {p.last_name}
                    </p>
                    {p.phone && <p className="text-xs text-muted-foreground">{p.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {p.is_approved ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <Check size={12} /> {t('admin.clientsPage.approved')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
                        <Clock size={12} /> {t('admin.clientsPage.waiting')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.is_approved ? (
                      <button
                        onClick={() => setApproved(p.id, false)}
                        disabled={busyId === p.id}
                        className="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
                      >
                        {t('admin.clientsPage.revoke')}
                      </button>
                    ) : (
                      <button
                        onClick={() => setApproved(p.id, true)}
                        disabled={busyId === p.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Check size={14} /> {t('admin.clientsPage.approve')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">
                    {tab === 'pending' ? t('admin.clientsPage.noPending') : t('admin.clientsPage.noResults')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

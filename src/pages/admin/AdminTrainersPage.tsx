import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Search, GraduationCap, UserMinus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

export function AdminTrainersPage() {
  const { t } = useTranslation()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setProfiles((data as Profile[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function promote(p: Profile) {
    setBusyId(p.id)
    // 1. роль → trainer
    await supabase.from('profiles').update({ role: 'trainer' }).eq('id', p.id)
    // 2. карточка тренера: реактивировать существующую или создать
    const { data: existing } = await supabase
      .from('trainers')
      .select('id')
      .eq('profile_id', p.id)
      .maybeSingle()
    if (existing) {
      await supabase.from('trainers').update({ is_active: true }).eq('id', existing.id)
    } else {
      await supabase.from('trainers').insert({
        profile_id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        photo_url: p.avatar_url,
      })
    }
    await load()
    setBusyId(null)
  }

  async function demote(p: Profile) {
    setBusyId(p.id)
    await supabase.from('profiles').update({ role: 'user' }).eq('id', p.id)
    // отвязываем и скрываем карточку, чтобы доступ тренера пропал
    await supabase.from('trainers').update({ is_active: false, profile_id: null }).eq('profile_id', p.id)
    await load()
    setBusyId(null)
  }

  const filtered = profiles.filter((p) => {
    const s = `${p.first_name} ${p.last_name} ${p.phone ?? ''}`.toLowerCase()
    return s.includes(query.toLowerCase())
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t('admin.trainersPage.title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('admin.trainersPage.subtitle')}</p>

      <div className="relative mt-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('admin.trainersPage.search')}
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
                <th className="px-4 py-3 font-medium">{t('admin.trainersPage.name')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.trainersPage.role')}</th>
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
                    <RoleBadge role={p.role} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.role === 'user' && (
                      <button
                        onClick={() => promote(p)}
                        disabled={busyId === p.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                      >
                        <GraduationCap size={14} /> {t('admin.trainersPage.promote')}
                      </button>
                    )}
                    {p.role === 'trainer' && (
                      <button
                        onClick={() => demote(p)}
                        disabled={busyId === p.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
                      >
                        <UserMinus size={14} /> {t('admin.trainersPage.demote')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">
                    {t('admin.trainersPage.noResults')}
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

function RoleBadge({ role }: { role: string }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-xs font-medium',
        role === 'admin' && 'bg-foreground/10 text-foreground',
        role === 'trainer' && 'bg-primary/15 text-primary',
        role === 'user' && 'bg-muted text-muted-foreground',
      )}
    >
      {t(`admin.trainersPage.roles.${role}`)}
    </span>
  )
}

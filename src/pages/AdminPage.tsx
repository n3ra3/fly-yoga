import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, CalendarDays, Ticket, Wallet, TrendingUp, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatMoney, formatDate, formatTime } from '@/lib/utils'

interface Stats {
  clients: number
  trainers: number
  trainingsToday: number
  bookingsToday: number
  revenueToday: number
  revenueTotal: number
}

interface RecentBooking {
  id: string
  booked_at: string
  profiles: { first_name: string; last_name: string } | null
  schedule: {
    starts_at: string
    classes: { name_ru: string; name_ro: string; name_en: string } | null
  } | null
}

export function AdminPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<RecentBooking[]>([])

  useEffect(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const startIso = start.toISOString()
    const endIso = new Date(start.getTime() + 86400000).toISOString()

    async function loadStats() {
      const head = { count: 'exact' as const, head: true }

      const [
        clients,
        trainers,
        trainingsToday,
        bookingsToday,
        subs,
        paidBookings,
        recentRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id', head).eq('role', 'user'),
        supabase.from('profiles').select('id', head).eq('role', 'trainer'),
        supabase
          .from('schedule')
          .select('id', head)
          .eq('is_cancelled', false)
          .gte('starts_at', startIso)
          .lt('starts_at', endIso),
        supabase
          .from('bookings')
          .select('id', head)
          .eq('status', 'confirmed')
          .gte('booked_at', startIso)
          .lt('booked_at', endIso),
        supabase.from('subscriptions').select('started_at, subscription_plans(price_mdl)'),
        supabase.from('bookings').select('booked_at, schedule(price_mdl)').in('status', ['confirmed', 'attended']),
        supabase
          .from('bookings')
          .select('id, booked_at, profiles(first_name,last_name), schedule(starts_at, classes(name_ru,name_ro,name_en))')
          .order('booked_at', { ascending: false })
          .limit(8),
      ])

      const todayKey = startIso.slice(0, 10)
      let revenueToday = 0
      let revenueTotal = 0

      ;(subs.data ?? []).forEach((s: any) => {
        const price = Number(s.subscription_plans?.price_mdl ?? 0)
        revenueTotal += price
        if (String(s.started_at).slice(0, 10) === todayKey) revenueToday += price
      })
      ;(paidBookings.data ?? []).forEach((b: any) => {
        const price = Number(b.schedule?.price_mdl ?? 0)
        revenueTotal += price
        if (String(b.booked_at).slice(0, 10) === todayKey) revenueToday += price
      })

      setStats({
        clients: clients.count ?? 0,
        trainers: trainers.count ?? 0,
        trainingsToday: trainingsToday.count ?? 0,
        bookingsToday: bookingsToday.count ?? 0,
        revenueToday,
        revenueTotal,
      })
      setRecent((recentRes.data as unknown as RecentBooking[]) ?? [])
    }

    loadStats()
  }, [])

  function className(c: { name_ru: string; name_ro: string; name_en: string } | null) {
    if (!c) return '—'
    return lang === 'ro' ? c.name_ro : lang === 'en' ? c.name_en : c.name_ru
  }

  if (!stats) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t('admin.dashboard.title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('admin.dashboard.subtitle')}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard Icon={Users} label={t('admin.dashboard.clients')} value={stats.clients} />
        <StatCard Icon={Users} label={t('admin.dashboard.trainers')} value={stats.trainers} />
        <StatCard Icon={CalendarDays} label={t('admin.dashboard.trainingsToday')} value={stats.trainingsToday} />
        <StatCard Icon={Ticket} label={t('admin.dashboard.bookingsToday')} value={stats.bookingsToday} />
        <StatCard Icon={Wallet} label={t('admin.dashboard.revenueToday')} value={formatMoney(stats.revenueToday, lang)} highlight />
        <StatCard Icon={TrendingUp} label={t('admin.dashboard.revenueTotal')} value={formatMoney(stats.revenueTotal, lang)} />
      </div>

      <h2 className="mt-10 text-lg font-semibold">{t('admin.dashboard.recent')}</h2>
      {recent.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t('admin.dashboard.noRecent')}</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <tbody>
              {recent.map((b) => (
                <tr key={b.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {b.profiles ? `${b.profiles.first_name} ${b.profiles.last_name}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{className(b.schedule?.classes ?? null)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {b.schedule ? `${formatDate(b.schedule.starts_at, lang)}, ${formatTime(b.schedule.starts_at, lang)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatCard({
  Icon,
  label,
  value,
  highlight,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div
      className={
        highlight
          ? 'rounded-2xl border border-primary/30 bg-primary/5 p-5'
          : 'rounded-2xl border border-border bg-card p-5'
      }
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon size={16} className={highlight ? 'text-primary' : ''} />
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, User, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatTime, cn } from '@/lib/utils'
import type { BookingWithSchedule } from '@/types'

export function BookingsPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const lang = i18n.language

  const [bookings, setBookings] = useState<BookingWithSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('bookings')
      .select(
        '*, schedule(*, classes(id,name_ru,name_ro,name_en,duration_min,level,color), trainers(id,first_name,last_name,photo_url))',
      )
      .eq('user_id', user.id)
      .order('booked_at', { ascending: false })
    setBookings((data as BookingWithSchedule[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  async function cancel(id: string) {
    setBusyId(id)
    await supabase
      .from('bookings')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', id)
    await load()
    setBusyId(null)
  }

  function className(b: BookingWithSchedule) {
    const c = b.schedule.classes
    return lang === 'ro' ? c.name_ro : lang === 'en' ? c.name_en : c.name_ru
  }

  const active = bookings.filter(
    (b) => b.status === 'confirmed' && new Date(b.schedule.starts_at) > new Date(),
  )
  const past = bookings.filter((b) => !active.includes(b))

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">{t('dashboard.bookings.title')}</h2>

      {bookings.length === 0 ? (
        <div className="mt-6">
          <p className="text-muted-foreground">{t('dashboard.bookings.empty')}</p>
          <Link to="/schedule" className="mt-4 inline-block text-sm text-primary hover:underline">
            {t('dashboard.bookings.goToSchedule')}
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          <Section title={t('dashboard.bookings.upcoming')} empty={t('dashboard.bookings.noUpcoming')}>
            {active.map((b) => (
              <Row key={b.id} title={className(b)} schedule={b.schedule} lang={lang}>
                <button
                  onClick={() => cancel(b.id)}
                  disabled={busyId === b.id}
                  className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
                >
                  {busyId === b.id ? '…' : t('schedule.cancel')}
                </button>
              </Row>
            ))}
          </Section>

          {past.length > 0 && (
            <Section title={t('dashboard.bookings.history')}>
              {past.map((b) => (
                <Row key={b.id} title={className(b)} schedule={b.schedule} lang={lang} muted>
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium',
                      b.status === 'cancelled'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {t(`dashboard.bookings.status.${b.status}`)}
                  </span>
                </Row>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function Section({
  title,
  empty,
  children,
}: {
  title: string
  empty?: string
  children: React.ReactNode
}) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0)
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {isEmpty && empty ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="flex flex-col gap-3">{children}</div>
      )}
    </div>
  )
}

function Row({
  title,
  schedule,
  lang,
  muted,
  children,
}: {
  title: string
  schedule: BookingWithSchedule['schedule']
  lang: string
  muted?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4',
        muted && 'opacity-70',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-1 h-9 w-1.5 shrink-0 rounded-full"
          style={{ background: schedule.classes.color ?? 'hsl(var(--primary))' }}
        />
        <div>
          <p className="font-medium">{title}</p>
          <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
            <span>{formatDate(schedule.starts_at, lang)}</span>
            <span className="inline-flex items-center gap-1">
              <Clock size={13} /> {formatTime(schedule.starts_at, lang)}
            </span>
            <span className="inline-flex items-center gap-1">
              <User size={13} /> {schedule.trainers.first_name} {schedule.trainers.last_name}
            </span>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}

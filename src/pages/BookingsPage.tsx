import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatTime, cn } from '@/lib/utils'
import { SESSION_MINUTES, minutesToTime } from '@/data/schedule'

interface ClassBooking {
  id: string
  starts_at: string
  kind: string | null
  status: 'confirmed' | 'cancelled'
}

const KIND_LABEL: Record<string, string> = {
  groupRu: 'schedule.calendar.groupRu',
  groupRo: 'schedule.calendar.groupRo',
}

export function BookingsPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const lang = i18n.language

  const [items, setItems] = useState<ClassBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('class_bookings')
      .select('id,starts_at,kind,status')
      .eq('user_id', user.id)
      .order('starts_at', { ascending: false })
    setItems((data as ClassBooking[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  async function cancel(id: string) {
    setBusyId(id)
    await supabase.from('class_bookings').update({ status: 'cancelled' }).eq('id', id)
    await load()
    setBusyId(null)
  }

  function endTime(startISO: string) {
    const s = new Date(startISO)
    return minutesToTime(s.getHours() * 60 + s.getMinutes() + SESSION_MINUTES)
  }

  const upcoming = items.filter((b) => b.status === 'confirmed' && new Date(b.starts_at) > new Date())
  const past = items.filter((b) => !upcoming.includes(b))

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

      {items.length === 0 ? (
        <div className="mt-6">
          <p className="text-muted-foreground">{t('dashboard.bookings.empty')}</p>
          <Link to="/schedule" className="mt-4 inline-block text-sm text-primary hover:underline">
            {t('dashboard.bookings.goToSchedule')}
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          <Section title={t('dashboard.bookings.upcoming')} empty={t('dashboard.bookings.noUpcoming')}>
            {upcoming.map((b) => (
              <Row key={b.id} booking={b} lang={lang} endTime={endTime}>
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
                <Row key={b.id} booking={b} lang={lang} endTime={endTime} muted>
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium',
                      b.status === 'cancelled'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {b.status === 'cancelled'
                      ? t('dashboard.bookings.status.cancelled')
                      : t('dashboard.bookings.status.attended')}
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
  booking,
  lang,
  endTime,
  muted,
  children,
}: {
  booking: ClassBooking
  lang: string
  endTime: (iso: string) => string
  muted?: boolean
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  const label = booking.kind && KIND_LABEL[booking.kind] ? t(KIND_LABEL[booking.kind]) : t('schedule.calendar.groupRu')
  const accent = booking.kind === 'groupRo' ? 'bg-sky-500' : 'bg-primary'

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4',
        muted && 'opacity-70',
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('mt-1 h-9 w-1.5 shrink-0 rounded-full', accent)} />
        <div>
          <p className="font-medium">{label}</p>
          <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
            <span>{formatDate(booking.starts_at, lang)}</span>
            <span className="inline-flex items-center gap-1">
              <Clock size={13} /> {formatTime(booking.starts_at, lang)}–{endTime(booking.starts_at)}
            </span>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}

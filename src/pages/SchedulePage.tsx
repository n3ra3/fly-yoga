import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, User, Users, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatTime, formatMoney, cn } from '@/lib/utils'
import type { ScheduleWithRelations } from '@/types'

export function SchedulePage() {
  const { t, i18n } = useTranslation()
  const { user, session } = useAuth()
  const lang = i18n.language

  const [sessions, setSessions] = useState<ScheduleWithRelations[]>([])
  const [myBookings, setMyBookings] = useState<Record<string, string>>({}) // schedule_id -> booking_id
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('schedule')
      .select(
        '*, classes(id,name_ru,name_ro,name_en,duration_min,level,color), trainers(id,first_name,last_name,photo_url)',
      )
      .eq('is_cancelled', false)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at')
    setSessions((data as ScheduleWithRelations[]) ?? [])

    if (user) {
      const { data: bk } = await supabase
        .from('bookings')
        .select('id, schedule_id')
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
      const map: Record<string, string> = {}
      ;(bk ?? []).forEach((b: { id: string; schedule_id: string }) => {
        map[b.schedule_id] = b.id
      })
      setMyBookings(map)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  async function book(scheduleId: string) {
    if (!user) return
    setBusyId(scheduleId)
    await supabase.from('bookings').insert({ user_id: user.id, schedule_id: scheduleId })
    await load()
    setBusyId(null)
  }

  async function cancel(scheduleId: string) {
    const bookingId = myBookings[scheduleId]
    if (!bookingId) return
    setBusyId(scheduleId)
    await supabase
      .from('bookings')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', bookingId)
    await load()
    setBusyId(null)
  }

  // группировка по дню
  const grouped = useMemo(() => {
    const groups: { key: string; label: string; items: ScheduleWithRelations[] }[] = []
    for (const s of sessions) {
      const key = new Date(s.starts_at).toDateString()
      let g = groups.find((x) => x.key === key)
      if (!g) {
        g = { key, label: formatDate(s.starts_at, lang), items: [] }
        groups.push(g)
      }
      g.items.push(s)
    }
    return groups
  }, [sessions, lang])

  function className(s: ScheduleWithRelations) {
    const c = s.classes
    return lang === 'ro' ? c.name_ro : lang === 'en' ? c.name_en : c.name_ru
  }

  return (
    <section className="section-padding">
      <div className="container-yoga">
        <h1 className="text-3xl font-semibold tracking-tight">{t('schedule.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('schedule.subtitle')}</p>

        {loading ? (
          <div className="flex justify-center py-24 text-muted-foreground">
            <Loader2 className="animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
            {t('schedule.empty')}
          </div>
        ) : (
          <div className="mt-10 flex flex-col gap-10">
            {grouped.map((group) => (
              <div key={group.key}>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
                  {group.label}
                </h2>
                <div className="grid gap-3">
                  {group.items.map((s) => {
                    const seatsLeft = s.total_seats - s.booked_seats
                    const isBooked = !!myBookings[s.id]
                    const isFull = seatsLeft <= 0
                    const busy = busyId === s.id
                    return (
                      <div
                        key={s.id}
                        className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className="mt-1 h-10 w-1.5 shrink-0 rounded-full"
                            style={{ background: s.classes.color ?? 'hsl(var(--primary))' }}
                          />
                          <div>
                            <p className="font-semibold">{className(s)}</p>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Clock size={14} /> {formatTime(s.starts_at, lang)}–{formatTime(s.ends_at, lang)}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <User size={14} /> {s.trainers.first_name} {s.trainers.last_name}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Users size={14} /> {isFull ? t('schedule.full') : t('schedule.seatsLeft', { count: seatsLeft })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
                          {s.price_mdl > 0 && (
                            <span className="text-sm font-medium">{formatMoney(s.price_mdl, lang)}</span>
                          )}
                          {!session ? (
                            <Link
                              to="/login"
                              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              {t('schedule.loginToBook')}
                            </Link>
                          ) : isBooked ? (
                            <button
                              onClick={() => cancel(s.id)}
                              disabled={busy}
                              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
                            >
                              {busy ? '…' : t('schedule.cancel')}
                            </button>
                          ) : (
                            <button
                              onClick={() => book(s.id)}
                              disabled={busy || isFull}
                              className={cn(
                                'rounded-full px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50',
                                isFull
                                  ? 'cursor-not-allowed bg-muted text-muted-foreground'
                                  : 'bg-primary text-primary-foreground hover:bg-primary/90',
                              )}
                            >
                              {busy ? '…' : isFull ? t('schedule.full') : t('schedule.book')}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

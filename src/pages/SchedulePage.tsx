import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Check, Users, Hourglass } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import {
  weeklyGroupSchedule,
  getMoldovaHoliday,
  SESSION_MINUTES,
  CLASS_CAPACITY,
  timeToMinutes,
  minutesToTime,
  type GroupKind,
} from '@/data/schedule'

const LOCALES: Record<string, string> = { ru: 'ru-RU', ro: 'ro-RO', en: 'en-US' }

const KIND_LABEL: Record<GroupKind, string> = {
  groupRu: 'schedule.calendar.groupRu',
  groupRo: 'schedule.calendar.groupRo',
}
const KIND_ACCENT: Record<GroupKind, string> = {
  groupRu: 'bg-primary',
  groupRo: 'bg-sky-500',
}

interface ClassBooking {
  id: string
  user_id: string
  starts_at: string
}

function isoDay(d: Date) {
  return ((d.getDay() + 6) % 7) + 1
}
function startOfWeek(d: Date) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  r.setDate(r.getDate() - (isoDay(r) - 1))
  return r
}
function isSameDate(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}
function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(d.getDate() + n)
  return r
}
/** Date конкретного занятия: день + время начала */
function classDate(day: Date, time: string) {
  const d = new Date(day)
  const [h, m] = time.split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return d
}

export function SchedulePage() {
  const { t, i18n } = useTranslation()
  const { user, session, isApproved } = useAuth()
  const locale = LOCALES[i18n.language] ?? 'ru-RU'
  const now = new Date()

  const [weekStart, setWeekStart] = useState(() => startOfWeek(now))
  const [bookings, setBookings] = useState<ClassBooking[]>([])
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart])
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('class_bookings')
      .select('id,user_id,starts_at')
      .neq('status', 'cancelled')
      .gte('starts_at', weekStart.toISOString())
      .lt('starts_at', weekEnd.toISOString())
    setBookings((data as ClassBooking[]) ?? [])
  }, [weekStart, weekEnd])

  useEffect(() => {
    load()
  }, [load])

  /** все брони конкретного занятия (по точному времени старта) */
  function bookingsFor(startISO: string) {
    return bookings.filter((b) => new Date(b.starts_at).getTime() === new Date(startISO).getTime())
  }

  async function book(day: Date, time: string, kind: GroupKind) {
    if (!user) return
    const starts = classDate(day, time)
    const key = starts.toISOString()
    setBusyKey(key)
    const { error } = await supabase.from('class_bookings').insert({
      user_id: user.id,
      starts_at: key,
      kind,
    })
    await load()
    setBusyKey(null)
    if (error && !/duplicate|unique/i.test(error.message)) alert(error.message)
  }

  async function cancel(id: string, key: string) {
    setBusyKey(key)
    await supabase.from('class_bookings').update({ status: 'cancelled' }).eq('id', id)
    await load()
    setBusyKey(null)
  }

  const weekLabel = `${weekStart.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} – ${addDays(
    weekStart,
    6,
  ).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}`

  return (
    <section className="section-padding">
      <div className="container-yoga">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{t('schedule.title')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('schedule.week.groupHint')}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setWeekStart((w) => addDays(w, -7))}
              aria-label={t('schedule.week.prev')}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="w-36 text-center text-sm font-semibold">{weekLabel}</span>
            <button
              onClick={() => setWeekStart((w) => addDays(w, 7))}
              aria-label={t('schedule.week.next')}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setWeekStart(startOfWeek(now))}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              {t('schedule.week.thisWeek')}
            </button>
          </div>
        </div>

        {/* Легенда */}
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <LegendDot className="bg-primary" label={t('schedule.calendar.groupRu')} />
          <LegendDot className="bg-sky-500" label={t('schedule.calendar.groupRo')} />
          <LegendDot className="bg-emerald-500" label={t('schedule.week.yourBooking')} />
        </div>

        {/* Баннер: аккаунт ещё не одобрен */}
        {session && !isApproved && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <Hourglass size={18} className="mt-0.5 shrink-0" />
            <p>{t('schedule.notApprovedBanner')}</p>
          </div>
        )}

        {/* Недельная сетка */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {days.map((day) => {
            const holiday = getMoldovaHoliday(day)
            const weekend = isoDay(day) >= 6
            const isToday = isSameDate(day, now)
            const groups = weeklyGroupSchedule[isoDay(day)] ?? []

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'flex flex-col rounded-2xl border bg-card p-3',
                  isToday ? 'border-primary/50 ring-1 ring-primary/30' : 'border-border',
                )}
              >
                <div className="mb-3">
                  <p className={cn('text-sm font-semibold capitalize', weekend && 'text-destructive/80')}>
                    {day.toLocaleDateString(locale, { weekday: 'short' })}, {day.getDate()}
                  </p>
                  {holiday && <p className="text-[11px] font-medium text-destructive">{holiday}</p>}
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  {groups.length === 0 && (
                    <p className="text-xs text-muted-foreground">{t('schedule.week.noClasses')}</p>
                  )}

                  {groups.map((s, i) => {
                    const starts = classDate(day, s.time)
                    const key = starts.toISOString()
                    const classBookings = bookingsFor(key)
                    const taken = classBookings.length
                    const seatsLeft = CLASS_CAPACITY - taken
                    const mine = user ? classBookings.find((b) => b.user_id === user.id) : undefined
                    const isPast = starts < now
                    const isFull = seatsLeft <= 0
                    const busy = busyKey === key

                    return (
                      <div key={i} className="rounded-xl border border-border p-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className={cn('h-2 w-2 shrink-0 rounded-full', KIND_ACCENT[s.kind])} />
                          <span className="text-xs font-semibold">
                            {s.time}–{minutesToTime(timeToMinutes(s.time) + SESSION_MINUTES)}
                          </span>
                        </div>
                        <p className="mt-0.5 pl-3.5 text-[11px] text-muted-foreground">{t(KIND_LABEL[s.kind])}</p>

                        {/* места */}
                        {!isPast && (
                          <p className="mt-1 pl-3.5 text-[11px] text-muted-foreground">
                            <Users size={11} className="mb-0.5 mr-1 inline" />
                            {isFull ? t('schedule.full') : t('schedule.seatsLeft', { count: seatsLeft })}
                          </p>
                        )}

                        {/* действие */}
                        <div className="mt-2">
                          {isPast ? (
                            <p className="whitespace-nowrap text-center text-xs text-muted-foreground/60">
                              {t('schedule.week.passed')}
                            </p>
                          ) : mine ? (
                            <button
                              onClick={() => cancel(mine.id, key)}
                              disabled={busy}
                              className="flex w-full items-center justify-center gap-1 whitespace-nowrap rounded-full bg-emerald-100 px-2 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-200 disabled:opacity-50"
                            >
                              {busy ? '…' : (
                                <>
                                  <Check size={12} /> {t('schedule.booked')}
                                </>
                              )}
                            </button>
                          ) : !session ? (
                            <Link
                              to="/login"
                              className="flex w-full items-center justify-center whitespace-nowrap rounded-full border border-border px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              {t('nav.login')}
                            </Link>
                          ) : !isApproved ? (
                            <p
                              title={t('schedule.notApprovedHint')}
                              className="whitespace-nowrap rounded-full bg-yellow-100 px-2 py-1.5 text-center text-xs font-medium text-yellow-700"
                            >
                              {t('schedule.notApproved')}
                            </p>
                          ) : isFull ? (
                            <div className="flex w-full items-center justify-center whitespace-nowrap rounded-full bg-muted px-2 py-1.5 text-xs font-medium text-muted-foreground">
                              {t('schedule.full')}
                            </div>
                          ) : (
                            <button
                              onClick={() => book(day, s.time, s.kind)}
                              disabled={busy}
                              className="flex w-full items-center justify-center whitespace-nowrap rounded-full bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                            >
                              {busy ? '…' : t('schedule.book')}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-3 w-3 rounded-full', className)} /> {label}
    </span>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Clock, Users, ChevronDown, X, Loader2, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatTime, formatMoney, cn } from '@/lib/utils'
import type { Class, ScheduleWithRelations, BookingWithUser } from '@/types'

export function TrainerSchedulePage() {
  const { t, i18n } = useTranslation()
  const { trainerId } = useAuth()
  const lang = i18n.language

  const [classes, setClasses] = useState<Class[]>([])
  const [sessions, setSessions] = useState<ScheduleWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    if (!trainerId) {
      setLoading(false)
      return
    }
    const [{ data: cls }, { data: sch }] = await Promise.all([
      supabase.from('classes').select('*').eq('is_active', true).order('name_ru'),
      supabase
        .from('schedule')
        .select(
          '*, classes(id,name_ru,name_ro,name_en,duration_min,level,color), trainers(id,first_name,last_name,photo_url)',
        )
        .eq('trainer_id', trainerId)
        .gte('starts_at', new Date(Date.now() - 86400000).toISOString())
        .order('starts_at'),
    ])
    setClasses((cls as Class[]) ?? [])
    setSessions((sch as ScheduleWithRelations[]) ?? [])
    setLoading(false)
  }, [trainerId])

  useEffect(() => {
    load()
  }, [load])

  function className(c: { name_ru: string; name_ro: string; name_en: string }) {
    return lang === 'ro' ? c.name_ro : lang === 'en' ? c.name_en : c.name_ru
  }

  if (!trainerId) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
        {t('trainer.noProfile')}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('trainer.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('trainer.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus size={16} /> {t('trainer.add')}
        </button>
      </div>

      {showForm && (
        <AddTrainingForm
          classes={classes}
          trainerId={trainerId}
          lang={lang}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            load()
          }}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
          {t('trainer.empty')}
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {sessions.map((s) => (
            <SessionRow key={s.id} s={s} title={className(s.classes)} lang={lang} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  )
}

function SessionRow({
  s,
  title,
  lang,
  onChanged,
}: {
  s: ScheduleWithRelations
  title: string
  lang: string
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [roster, setRoster] = useState<BookingWithUser[] | null>(null)
  const [busy, setBusy] = useState(false)

  async function toggle() {
    setOpen((v) => !v)
    if (roster === null) {
      const { data } = await supabase
        .from('bookings')
        .select('*, profiles(id,first_name,last_name,phone,avatar_url)')
        .eq('schedule_id', s.id)
        .eq('status', 'confirmed')
      setRoster((data as BookingWithUser[]) ?? [])
    }
  }

  async function cancelSession() {
    if (!confirm(t('trainer.confirmCancel'))) return
    setBusy(true)
    await supabase.from('schedule').update({ is_cancelled: true }).eq('id', s.id)
    onChanged()
  }

  const isPast = new Date(s.starts_at) < new Date()

  return (
    <div className={cn('rounded-2xl border border-border bg-card', isPast && 'opacity-70')}>
      <div className="flex items-center justify-between gap-4 p-5">
        <div className="flex items-start gap-4">
          <div
            className="mt-1 h-10 w-1.5 shrink-0 rounded-full"
            style={{ background: s.classes.color ?? 'hsl(var(--primary))' }}
          />
          <div>
            <p className="font-semibold">{title}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>{formatDate(s.starts_at, lang)}</span>
              <span className="inline-flex items-center gap-1">
                <Clock size={14} /> {formatTime(s.starts_at, lang)}–{formatTime(s.ends_at, lang)}
              </span>
              {s.price_mdl > 0 && <span>{formatMoney(s.price_mdl, lang)}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Users size={14} /> {s.booked_seats}/{s.total_seats}
            <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
          </button>
          {!isPast && (
            <button
              onClick={cancelSession}
              disabled={busy}
              aria-label={t('trainer.cancelSession')}
              className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-border px-5 py-4">
          {roster === null ? (
            <Loader2 className="animate-spin text-muted-foreground" size={16} />
          ) : roster.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('trainer.noBookings')}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {roster.map((b) => (
                <li key={b.id} className="flex items-center justify-between text-sm">
                  <span>
                    {b.profiles.first_name} {b.profiles.last_name}
                  </span>
                  {b.profiles.phone && (
                    <span className="text-muted-foreground">{b.profiles.phone}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function AddTrainingForm({
  classes,
  trainerId,
  lang,
  onClose,
  onSaved,
}: {
  classes: Class[]
  trainerId: string
  lang: string
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [classId, setClassId] = useState(classes[0]?.id ?? '')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('18:00')
  const [seats, setSeats] = useState('10')
  const [price, setPrice] = useState('150')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function className(c: Class) {
    return lang === 'ro' ? c.name_ro : lang === 'en' ? c.name_en : c.name_ru
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const cls = classes.find((c) => c.id === classId)
    if (!cls || !date) {
      setError(t('trainer.form.fillAll'))
      return
    }
    const startsAt = new Date(`${date}T${time}:00`)
    const endsAt = new Date(startsAt.getTime() + cls.duration_min * 60000)
    setSaving(true)
    const { error } = await supabase.from('schedule').insert({
      class_id: classId,
      trainer_id: trainerId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      total_seats: parseInt(seats) || 1,
      price_mdl: parseFloat(price) || 0,
    })
    setSaving(false)
    if (error) setError(error.message)
    else onSaved()
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">{t('trainer.form.title')}</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium">{t('trainer.form.class')}</span>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="input-base">
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {className(c)} · {c.duration_min} {t('common.minutes')}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t('trainer.form.date')}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-base" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t('trainer.form.time')}</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input-base" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t('trainer.form.seats')}</span>
          <input type="number" min="1" value={seats} onChange={(e) => setSeats(e.target.value)} className="input-base" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t('trainer.form.price')}</span>
          <input type="number" min="0" step="10" value={price} onChange={(e) => setPrice(e.target.value)} className="input-base" />
        </label>

        {error && (
          <p className="sm:col-span-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="sm:col-span-2 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground">
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  )
}

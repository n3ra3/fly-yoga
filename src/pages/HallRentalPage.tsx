import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Users, Maximize, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const HALLS = ['small', 'big'] as const
type Hall = (typeof HALLS)[number]

export function HallRentalPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const initialHall = (params.get('hall') === 'small' ? 'small' : 'big') as Hall

  const [hall, setHall] = useState<Hall>(initialHall)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    preferred_date: '',
    event_description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.from('hall_rental_requests').insert({ hall, ...form })
    setLoading(false)
    if (error) setError(t('hallRental.form.error'))
    else setDone(true)
  }

  return (
    <div>
      {/* Заголовок */}
      <section className="bg-secondary/40">
        <div className="container-yoga py-14 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t('services.rental.eyebrow')}
          </p>
          <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            {t('hallRental.title')}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            {t('hallRental.subtitle')}
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-yoga grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
          {/* Форма */}
          <div>
            {done ? (
              <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-secondary/30 px-8 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle2 size={28} />
                </div>
                <h2 className="font-display text-2xl tracking-tight">{t('hallRental.form.successTitle')}</h2>
                <p className="max-w-sm text-sm text-muted-foreground">{t('hallRental.form.success')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Выбор зала */}
                <div>
                  <label className="mb-2 block text-sm font-medium">{t('hallRental.form.chooseHall')}</label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {HALLS.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHall(h)}
                        className={cn(
                          'flex flex-col gap-1 rounded-2xl border p-4 text-left transition-colors',
                          hall === h
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                            : 'border-border hover:border-primary/40',
                        )}
                      >
                        <span className="flex items-center justify-between font-medium">
                          {t(`services.rental.${h}.name`)}
                          {hall === h && <Check size={16} className="text-primary" />}
                        </span>
                        <span className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Users size={12} /> {t(`services.rental.${h}.capacity`)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Maximize size={12} /> {t(`services.rental.${h}.area`)}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={t('hallRental.form.name')}>
                    <input name="name" required value={form.name} onChange={handleChange} className="input-base" />
                  </Field>
                  <Field label={t('hallRental.form.phone')}>
                    <input
                      name="phone"
                      type="tel"
                      required
                      value={form.phone}
                      onChange={handleChange}
                      className="input-base"
                      placeholder="+373 XX XXX XXX"
                    />
                  </Field>
                  <Field label={t('hallRental.form.email')}>
                    <input
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      className="input-base"
                      placeholder="you@example.com"
                    />
                  </Field>
                  <Field label={t('hallRental.form.preferredDate')}>
                    <input
                      name="preferred_date"
                      type="date"
                      required
                      value={form.preferred_date}
                      onChange={handleChange}
                      className="input-base"
                    />
                  </Field>
                </div>

                <Field label={t('hallRental.form.eventDescription')}>
                  <textarea
                    name="event_description"
                    required
                    rows={4}
                    value={form.event_description}
                    onChange={handleChange}
                    className="input-base resize-none"
                    placeholder={t('hallRental.form.eventPlaceholder')}
                  />
                </Field>

                {error && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {t('hallRental.form.submit')}
                </button>
              </form>
            )}
          </div>

          {/* Инфо-панель */}
          <aside className="flex h-fit flex-col gap-4 rounded-3xl border border-border bg-secondary/30 p-7">
            <h3 className="font-display text-xl tracking-tight">{t('hallRental.info.title')}</h3>
            <ul className="flex flex-col gap-3">
              {['a', 'b', 'c'].map((k) => (
                <li key={k} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <Check size={16} className="mt-0.5 shrink-0 text-primary" />
                  {t(`hallRental.info.points.${k}`)}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">{t('hallRental.info.note')}</p>
          </aside>
        </div>
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}

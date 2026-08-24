import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check, Users, Maximize, CalendarDays, Phone, Loader2, CheckCircle2, LogIn } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { Photo } from '@/components/Photo'
import { PhotoStrip } from '@/components/PhotoStrip'
import { FEATURES } from '@/config/features'

const GALLERY = [
  '/images/gallery-1.jpg',
  '/images/gallery-2.jpg',
  '/images/gallery-3.jpg',
  '/images/gallery-4.jpg',
  '/images/gallery-5.jpg',
  '/images/gallery-6.jpg',
]

const HALLS = [
  { key: 'small', img: '/images/hall-small.jpg' },
  { key: 'big', img: '/images/hall-big.jpg' },
] as const

export function ServicesPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const preselect = params.get('service') // напр. ?service=trial

  return (
    <div>
      {/* Заголовок страницы */}
      <section className="bg-secondary/40">
        <div className="container-yoga py-14 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t('services.eyebrow')}
          </p>
          <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            {t('services.title')}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            {t('services.subtitle')}
          </p>
        </div>
      </section>

      {/* ── Fly Yoga: что это ── */}
      <section className="section-padding">
        <div className="container-yoga">
          <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {t('services.flyYoga.eyebrow')}
              </p>
              <h2 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
                {t('services.flyYoga.title')}
              </h2>
              <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">
                {t('services.flyYoga.description')}
              </p>
            </div>

            <ul className="flex flex-col justify-center gap-3 rounded-3xl border border-border bg-secondary/30 p-7">
              {['a', 'b', 'c', 'd'].map((k) => (
                <li key={k} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <Check size={16} className="mt-0.5 shrink-0 text-primary" />
                  {t(`services.flyYoga.features.${k}`)}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12">
            <PhotoStrip images={GALLERY} hint={t('services.gallery.hint')} />
          </div>
        </div>
      </section>

      {/* ── Записаться (заявка на звонок, выбор индивидуальная/групповая) ── */}
      <section id="call" className="scroll-mt-24 pb-16 md:pb-20">
        <div className="container-yoga grid gap-10 lg:grid-cols-[1fr_420px] lg:gap-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {t('services.book.eyebrow')}
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
              {t('services.book.title')}
            </h2>
            <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">
              {t('services.book.description')}
            </p>
            <ul className="mt-7 flex flex-col gap-3">
              {['a', 'b', 'c'].map((k) => (
                <li key={k} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <Check size={16} className="mt-0.5 shrink-0 text-primary" />
                  {t(`services.book.points.${k}`)}
                </li>
              ))}
            </ul>
          </div>

          <CallbackForm initial={preselect} />
        </div>
      </section>

      {/* ── Групповые занятия → расписание (скрыто, пока расписание отключено) ── */}
      {FEATURES.schedule && (
      <section className="pb-16 md:pb-24">
        <div className="container-yoga">
          <div className="grid items-center gap-8 overflow-hidden rounded-3xl border border-border bg-secondary/40 p-8 md:grid-cols-2 md:p-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {t('services.group.eyebrow')}
              </p>
              <h2 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
                {t('services.group.title')}
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">{t('services.group.description')}</p>
              <Link
                to="/schedule"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg"
              >
                <CalendarDays size={16} />
                {t('services.group.cta')}
              </Link>
            </div>
            <ul className="flex flex-col gap-3">
              {['a', 'b', 'c'].map((k) => (
                <li key={k} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <Check size={16} className="mt-0.5 shrink-0 text-primary" />
                  {t(`services.group.points.${k}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      )}

      {/* ── Аренда зала (временно скрыт, см. config/features.ts) ── */}
      {FEATURES.hallRental && (
        <section className="section-padding bg-secondary/40">
          <div className="container-yoga">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {t('services.rental.eyebrow')}
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
              {t('services.rental.title')}
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {HALLS.map(({ key, img }) => (
                <article key={key} className="flex flex-col overflow-hidden rounded-3xl border border-border bg-background">
                  <Photo src={img} alt={t(`services.rental.${key}.name`)} className="aspect-[16/10]" />
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-2xl tracking-tight">{t(`services.rental.${key}.name`)}</h3>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Users size={14} className="text-primary" /> {t(`services.rental.${key}.capacity`)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Maximize size={14} className="text-primary" /> {t(`services.rental.${key}.area`)}
                      </span>
                    </div>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {t(`services.rental.${key}.description`)}
                    </p>
                    <Link
                      to={`/hall-rental?hall=${key}`}
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      {t('services.rental.cta')}
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

const SERVICES = ['trial', 'group', 'individual'] as const
type ServiceKind = (typeof SERVICES)[number]

function CallbackForm({ initial }: { initial?: string | null }) {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const [service, setService] = useState<ServiceKind>(
    (SERVICES as readonly string[]).includes(initial ?? '') ? (initial as ServiceKind) : 'trial',
  )
  const fullName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : ''
  const [form, setForm] = useState({ name: '', phone: '', comment: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // подставляем имя/телефон из профиля
  useEffect(() => {
    setForm((f) => ({
      ...f,
      name: f.name || fullName,
      phone: f.phone || profile?.phone || '',
    }))
  }, [fullName, profile?.phone])

  function change(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(null)
    setLoading(true)
    const { error } = await supabase.from('individual_requests').insert({
      user_id: user.id,
      service,
      name: form.name || fullName || null,
      phone: form.phone,
      comment: form.comment || null,
    })
    setLoading(false)
    if (error) setError(t('services.individual.form.error'))
    else setDone(true)
  }

  // не вошёл — предлагаем зарегистрироваться/войти
  if (!user) {
    return (
      <div className="flex h-fit flex-col items-center gap-4 rounded-3xl border border-border bg-secondary/30 px-8 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LogIn size={26} />
        </div>
        <h3 className="font-display text-xl tracking-tight">{t('services.book.loginTitle')}</h3>
        <p className="max-w-xs text-sm text-muted-foreground">{t('services.book.loginText')}</p>
        <div className="mt-1 flex flex-col gap-2 self-stretch">
          <Link
            to="/register"
            className="rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t('services.book.registerCta')}
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-border py-3 text-sm font-medium text-foreground/70 transition-colors hover:border-primary/40 hover:text-primary"
          >
            {t('services.book.loginCta')}
          </Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex h-fit flex-col items-center gap-4 rounded-3xl border border-border bg-secondary/30 px-8 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 size={28} />
        </div>
        <h3 className="font-display text-2xl tracking-tight">{t('services.individual.form.successTitle')}</h3>
        <p className="max-w-xs text-sm text-muted-foreground">{t('services.individual.form.success')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex h-fit flex-col gap-5 rounded-3xl border border-border bg-secondary/30 p-7">
      <div className="flex items-center gap-2 text-primary">
        <Phone size={18} />
        <h3 className="font-medium text-foreground">{t('services.individual.form.title')}</h3>
      </div>

      {/* Что интересует: индивидуальная или групповая */}
      <div>
        <label className="mb-2 block text-sm font-medium">{t('services.book.chooseService')}</label>
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setService(s)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                service === s
                  ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/30'
                  : 'border-border text-foreground/70 hover:border-primary/40',
              )}
            >
              {t(`services.book.service.${s}`)}
            </button>
          ))}
        </div>
      </div>

      <Field label={`${t('services.individual.form.name')} (${t('common.optional')})`}>
        <input name="name" value={form.name} onChange={change} className="input-base" />
      </Field>
      <Field label={t('services.individual.form.phone')}>
        <input
          name="phone"
          type="tel"
          required
          value={form.phone}
          onChange={change}
          className="input-base"
          placeholder="+373 XX XXX XXX"
        />
      </Field>
      <Field label={`${t('services.individual.form.comment')} (${t('common.optional')})`}>
        <textarea
          name="comment"
          rows={3}
          value={form.comment}
          onChange={change}
          className="input-base resize-none"
          placeholder={t('services.individual.form.commentPlaceholder')}
        />
      </Field>

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        {t('services.individual.form.submit')}
      </button>
      <p className="text-xs text-muted-foreground">{t('services.individual.form.note')}</p>
    </form>
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

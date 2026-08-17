import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Sparkles,
  Leaf,
  HeartPulse,
  Feather,
  Check,
  Sun,
  Moon,
  Home,
  BadgeCheck,
  ShieldCheck,
  Users,
  MapPin,
} from 'lucide-react'
import { Photo } from '@/components/Photo'
import { ReviewsCarousel } from '@/components/ReviewsCarousel'
import { reviews } from '@/data/reviews'
import { getSlotGroups, type GroupKind, type ScheduleCategory } from '@/data/schedule'
import { FEATURES as FLAGS } from '@/config/features'

/** Куда ведёт кнопка призыва: пока расписание скрыто — на форму звонка */
const CTA_TO = FLAGS.schedule ? '/schedule' : '/services#call'

const FEATURES = [
  { key: 'body', Icon: Leaf },
  { key: 'stress', Icon: Sparkles },
  { key: 'back', Icon: HeartPulse },
  { key: 'fly', Icon: Feather },
] as const

const DIRECTIONS: { key: ScheduleCategory; img: string; Icon: typeof Sun }[] = [
  { key: 'morning', img: '/images/morning.jpg', Icon: Sun },
  { key: 'evening', img: '/images/evening.jpg', Icon: Moon },
  { key: 'weekend', img: '/images/weekend.jpg', Icon: Leaf },
]

const KIND_SHORT: Record<GroupKind, string> = {
  groupRu: 'schedule.calendar.langRu',
  groupRo: 'schedule.calendar.langRo',
}

const LOCALES: Record<string, string> = { ru: 'ru-RU', ro: 'ro-RO', en: 'en-US' }

/** [2,4] → "вт, чт" на текущем языке */
function formatDays(days: number[], locale: string) {
  const monday = new Date(2024, 0, 1) // это понедельник
  return days
    .map((d) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + d - 1)
      return date.toLocaleDateString(locale, { weekday: 'short' }).replace('.', '')
    })
    .join(', ')
}

const WHY = [
  { key: 'studio', Icon: Home },
  { key: 'trainers', Icon: BadgeCheck },
  { key: 'equipment', Icon: ShieldCheck },
  { key: 'groups', Icon: Users },
  { key: 'location', Icon: MapPin },
] as const

export function HomePage() {
  const { t, i18n } = useTranslation()
  const locale = LOCALES[i18n.language] ?? 'ru-RU'

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-secondary/40">
        <div className="container-yoga grid items-center gap-10 py-16 md:py-24 lg:grid-cols-2 lg:gap-14">
          <div className="max-w-xl">
            <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              {t('home.hero.line1')}
              <br />
              <span className="text-primary">{t('home.hero.line2')}</span>
              <br />
              {t('home.hero.line3')}
            </h1>
            <p className="mt-7 max-w-md text-base leading-relaxed text-muted-foreground">
              {t('home.hero.description')}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                to={CTA_TO}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg"
              >
                {t('home.hero.cta')}
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/services"
                className="text-sm font-medium text-foreground/70 underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                {t('home.hero.ctaSecondary')}
              </Link>
            </div>
          </div>

          <Photo
            src="/images/hero.jpg"
            alt={t('home.hero.line1')}
            className="aspect-[4/5] rounded-3xl lg:aspect-[3/4]"
          />
        </div>
      </section>

      {/* ── Преимущества ── */}
      <section className="container-yoga -mt-8 relative z-10">
        <div className="grid gap-8 rounded-3xl border border-border bg-background p-8 shadow-sm sm:grid-cols-2 lg:grid-cols-4 lg:p-10">
          {FEATURES.map(({ key, Icon }) => (
            <div key={key} className="flex flex-col items-center gap-3 text-center">
              <Icon size={26} strokeWidth={1.25} className="text-primary" />
              <p className="text-sm font-semibold">{t(`home.features.${key}.title`)}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t(`home.features.${key}.text`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Направления (скрыто, пока расписание отключено) ── */}
      {FLAGS.schedule && (
      <section className="section-padding">
        <div className="container-yoga grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t('home.directions.eyebrow')}
            </p>
            <h2 className="mt-4 font-display text-4xl leading-tight tracking-tight">
              {t('home.directions.title')}
            </h2>
            <div className="mt-6 h-px w-12 bg-border" />
            <Link
              to="/schedule"
              className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t('home.directions.cta')}
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {DIRECTIONS.map(({ key, img, Icon }) => (
              <article
                key={key}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
              >
                <Photo
                  src={img}
                  alt={t(`home.directions.items.${key}.title`)}
                  className="aspect-[4/3]"
                  imgClassName="transition-transform duration-500 group-hover:scale-105"
                />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2">
                    <Icon size={16} strokeWidth={1.5} className="shrink-0 text-primary" />
                    <h3 className="font-medium leading-snug">
                      {t(`home.directions.items.${key}.title`)}
                    </h3>
                  </div>

                  <ul className="mt-4 flex flex-1 flex-col gap-2">
                    {getSlotGroups(key).map((g, i) => (
                      <li key={i} className="flex items-baseline gap-1.5 text-xs leading-snug">
                        <span className="capitalize text-muted-foreground">
                          {formatDays(g.days, locale)}
                        </span>
                        <span className="text-muted-foreground">—</span>
                        <span className="font-semibold text-foreground">{g.time}</span>
                        <span className="text-muted-foreground">({t(KIND_SHORT[g.kind])})</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/schedule"
                    className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-primary"
                  >
                    {t('common.more')} <ArrowRight size={12} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── Пробное занятие (фото слева, текст справа — мозаика) ── */}
      <section className="pb-16 md:pb-24">
        <div className="container-yoga grid items-center gap-8 lg:grid-cols-[minmax(0,400px)_1fr]">
          {/* Фото-постер вертикальный (9:16) — показываем целиком, без обрезки */}
          <Photo
            src="/images/studio.jpg"
            alt={t('home.trial.title')}
            className="mx-auto aspect-[9/16] w-full max-w-[340px] rounded-3xl lg:max-w-none"
          />

          <div className="rounded-3xl border border-border bg-secondary/40 p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t('home.trial.eyebrow')}
            </p>
            <h2 className="mt-4 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
              {t('home.trial.title')}
            </h2>
            <ul className="mt-7 flex flex-col gap-3">
              {['a', 'b', 'c'].map((k) => (
                <li key={k} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <Check size={16} className="mt-0.5 shrink-0 text-primary" />
                  {t(`home.trial.points.${k}`)}
                </li>
              ))}
            </ul>
            <Link
              to={CTA_TO}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg"
            >
              {t('home.trial.cta')}
              <ArrowRight size={15} />
            </Link>
            <p className="mt-4 text-xs text-muted-foreground">{t('home.trial.note')}</p>
          </div>
        </div>
      </section>

      {/* ── Почему выбирают нас ── */}
      <section className="pb-16 md:pb-24">
        <div className="container-yoga">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t('home.why.eyebrow')}
          </p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight tracking-tight sm:text-4xl">
            {t('home.why.title')}
          </h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {WHY.map(({ key, Icon }) => (
              <div
                key={key}
                className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-secondary/30 p-6 text-center transition-colors hover:border-primary/30"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-primary">
                  <Icon size={20} strokeWidth={1.5} />
                </span>
                <p className="text-xs leading-relaxed text-foreground/75">{t(`home.why.items.${key}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Отзывы ── */}
      <section className="pb-16 md:pb-24">
        <div className="container-yoga">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t('home.reviews.subtitle')}
          </p>
          <h2 className="mt-4 font-display text-4xl leading-tight tracking-tight">
            {t('home.reviews.title')}
          </h2>
          <ReviewsCarousel reviews={reviews} />
        </div>
      </section>

      {/* ── Финальный CTA ── */}
      <section className="pb-16 md:pb-24">
        <div className="container-yoga">
          <div className="relative overflow-hidden rounded-3xl">
            <Photo src="/images/cta.jpg" alt="" className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0 bg-primary/80" />
            <div className="relative px-8 py-16 text-center text-primary-foreground sm:py-20">
              <h2 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
                {t('home.cta.title')}
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-primary-foreground/85">
                {t('home.cta.description')}
              </p>
              <Link
                to={CTA_TO}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-medium text-primary transition-all hover:bg-white/90 hover:shadow-lg"
              >
                {t('home.cta.button')}
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

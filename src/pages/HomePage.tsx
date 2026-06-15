import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { ReviewsCarousel } from '@/components/ReviewsCarousel'
import { reviews } from '@/data/reviews'

export function HomePage() {
  const { t } = useTranslation()

  const services = [
    {
      key: 'flyYoga',
      emoji: '🪢',
      to: '/services',
    },
    {
      key: 'yoga',
      emoji: '🧘',
      to: '/services',
    },
    {
      key: 'private',
      emoji: '✨',
      to: '/services',
    },
    {
      key: 'rental',
      emoji: '🏛️',
      to: '/hall-rental',
    },
  ] as const

  const benefits = ['trainers', 'atmosphere', 'schedule'] as const

  const placeholderTrainers = [
    { initials: 'АМ', name: 'Анна М.', spec: 'Fly Yoga, Хатха' },
    { initials: 'ОК', name: 'Ольга К.', spec: 'Виньяса, Инь йога' },
    { initials: 'НД', name: 'Наталья Д.', spec: 'Fly Yoga, Пилатес' },
  ]

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden text-center">
        {/* Subtle background pattern */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(145,25%,92%)_0%,transparent_70%)]"
        />

        <div className="container-yoga relative z-10 max-w-3xl px-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
            {t('home.hero.eyebrow')}
          </p>

          <h1 className="mt-4 text-[2.75rem] font-semibold leading-[1.1] tracking-tight text-foreground sm:text-6xl md:text-7xl">
            {t('home.hero.title')}
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t('home.hero.description')}
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/schedule"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md sm:w-auto"
            >
              {t('home.hero.cta')}
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/schedule"
              className="inline-flex w-full items-center justify-center rounded-full border border-border px-8 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:w-auto"
            >
              {t('home.hero.ctaSecondary')}
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div aria-hidden className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="h-10 w-px bg-gradient-to-b from-border to-transparent" />
        </div>
      </section>

      {/* ── Services ── */}
      <section className="section-padding bg-muted/30">
        <div className="container-yoga">
          <SectionHeader
            title={t('home.services.title')}
            subtitle={t('home.services.subtitle')}
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <Link
                key={s.key}
                to={s.to}
                className="group flex flex-col gap-4 rounded-2xl border border-border bg-background p-6 transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <span className="text-3xl">{s.emoji}</span>
                <div>
                  <p className="font-medium leading-snug">
                    {t(`services.${s.key}.name`)}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {t(`services.${s.key}.description`)}
                  </p>
                </div>
                <span className="mt-auto flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  {t('home.services.cta')} <ArrowRight size={12} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="section-padding">
        <div className="container-yoga">
          <SectionHeader title={t('home.benefits.title')} />

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {benefits.map((key, i) => (
              <div key={key} className="flex flex-col gap-3">
                <span className="text-4xl font-light text-muted-foreground/30 tabular-nums">
                  0{i + 1}
                </span>
                <h3 className="text-lg font-medium">
                  {t(`home.benefits.items.${key}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`home.benefits.items.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trainers preview ── */}
      <section className="section-padding bg-muted/30">
        <div className="container-yoga">
          <div className="flex items-end justify-between">
            <SectionHeader
              title={t('home.trainers.title')}
              subtitle={t('home.trainers.subtitle')}
            />
            <Link
              to="/trainers"
              className="mb-1 hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
            >
              {t('home.trainers.cta')} <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {placeholderTrainers.map((trainer) => (
              <div
                key={trainer.initials}
                className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-background p-8 text-center"
              >
                {/* Avatar placeholder */}
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-xl font-medium text-accent-foreground">
                  {trainer.initials}
                </div>
                <div>
                  <p className="font-medium">{trainer.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{trainer.spec}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link
              to="/trainers"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t('home.trainers.cta')} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="section-padding">
        <div className="container-yoga">
          <SectionHeader
            title={t('home.reviews.title')}
            subtitle={t('home.reviews.subtitle')}
          />

          <ReviewsCarousel reviews={reviews} />
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="section-padding">
        <div className="container-yoga">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground sm:py-20">
            {/* Subtle inner glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_-20%,rgba(255,255,255,0.12),transparent)]"
            />
            <div className="relative">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t('home.cta.title')}
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
                {t('home.cta.description')}
              </p>
              <Link
                to="/schedule"
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

function SectionHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {subtitle && (
        <p className="mt-2 text-base text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )
}

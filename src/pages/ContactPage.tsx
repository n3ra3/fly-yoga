import { useTranslation } from 'react-i18next'
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, ExternalLink } from 'lucide-react'

const INSTAGRAM_URL = 'https://www.instagram.com/fly_yoga_studio/'
const FACEBOOK_URL  = 'https://www.facebook.com/flyogastudio'

// Strada 31 August 1989, 110, Chișinău
const LAT = 47.0300758945097
const LON = 28.818675748781875

// Google Maps embed — привычный, плавный зум/перетаскивание, без API-ключа.
const MAP_URL = `https://www.google.com/maps?q=${LAT},${LON}&z=17&hl=ru&output=embed`

const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${LAT},${LON}`

export function ContactPage() {
  const { t } = useTranslation()

  const hours = [
    {
      day: t('contact.hours.weekdays'),
      time: t('contact.hours.weekdaysHours'),
      isToday: isWeekday(),
    },
    {
      day: t('contact.hours.saturday'),
      time: t('contact.hours.saturdayHours'),
      isToday: isSaturday(),
    },
    {
      day: t('contact.hours.sunday'),
      time: t('contact.hours.sundayHours'),
      isToday: isSunday(),
    },
  ]

  return (
    <div>
      {/* ── Header ── */}
      <section className="section-padding pb-10 md:pb-12">
        <div className="container-yoga">
          <p className="text-sm font-medium uppercase tracking-[0.15em] text-primary">
            {t('contact.title')}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t('contact.subtitle')}
          </h1>
        </div>
      </section>

      {/* ── Main grid: info + map ── */}
      <section className="pb-0">
        <div className="container-yoga">
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Left — contact cards */}
            <div className="flex flex-col gap-4">

              {/* Address */}
              <ContactCard
                icon={<MapPin size={18} className="text-primary" />}
                label={t('contact.address.label')}
              >
                <p className="text-sm leading-relaxed">{t('contact.address.value')}</p>
                <a
                  href={MAP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  {t('contact.map')} <ExternalLink size={11} />
                </a>
              </ContactCard>

              {/* Phone */}
              <ContactCard
                icon={<Phone size={18} className="text-primary" />}
                label={t('contact.phone.label')}
              >
                <a
                  href={`tel:${t('contact.phone.value').replace(/\s/g, '')}`}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  {t('contact.phone.value')}
                </a>
              </ContactCard>

              {/* Email */}
              <ContactCard
                icon={<Mail size={18} className="text-primary" />}
                label={t('contact.email.label')}
              >
                <a
                  href={`mailto:${t('contact.email.value')}`}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  {t('contact.email.value')}
                </a>
              </ContactCard>

              {/* Social */}
              <ContactCard
                icon={<ExternalLink size={18} className="text-primary" />}
                label={t('contact.social.label')}
              >
                <div className="flex gap-3">
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <Instagram size={15} className="text-primary" />
                    Instagram
                  </a>
                  <a
                    href={FACEBOOK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <Facebook size={15} className="text-primary" />
                    Facebook
                  </a>
                </div>
              </ContactCard>
            </div>

            {/* Right — map */}
            <div className="overflow-hidden rounded-2xl border border-border" style={{ minHeight: 380 }}>
              <iframe
                src={MAP_URL}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: 380, display: 'block' }}
                loading="lazy"
                title="Fly Yoga Studio на карте"
                aria-label="Карта расположения студии"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Working hours ── */}
      <section className="section-padding pt-10 md:pt-14">
        <div className="container-yoga">
          <div className="flex items-center gap-2.5 mb-6">
            <Clock size={18} className="text-primary" />
            <h2 className="text-xl font-semibold">{t('contact.hours.label')}</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {hours.map(({ day, time, isToday }) => (
              <div
                key={day}
                className={`rounded-2xl border p-5 transition-colors ${
                  isToday
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>
                    {day}
                  </p>
                  {isToday && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                      Сегодня
                    </span>
                  )}
                </div>
                <p className="mt-2 text-2xl font-light tracking-tight text-foreground">
                  {time}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function ContactCard({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {children}
      </div>
    </div>
  )
}

function isWeekday() {
  const d = new Date().getDay()
  return d >= 1 && d <= 5
}

function isSaturday() {
  return new Date().getDay() === 6
}

function isSunday() {
  return new Date().getDay() === 0
}

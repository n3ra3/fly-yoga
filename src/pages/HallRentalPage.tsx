import { useTranslation } from 'react-i18next'

export function HallRentalPage() {
  const { t } = useTranslation()
  return (
    <section className="section-padding">
      <div className="container-yoga">
        <h1 className="text-3xl font-semibold">{t('hallRental.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('hallRental.subtitle')}</p>
      </div>
    </section>
  )
}

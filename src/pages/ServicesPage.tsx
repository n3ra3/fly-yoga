import { useTranslation } from 'react-i18next'

export function ServicesPage() {
  const { t } = useTranslation()
  return (
    <section className="section-padding">
      <div className="container-yoga">
        <h1 className="text-3xl font-semibold">{t('services.title')}</h1>
      </div>
    </section>
  )
}

import { useTranslation } from 'react-i18next'

export function TrainersPage() {
  const { t } = useTranslation()
  return (
    <section className="section-padding">
      <div className="container-yoga">
        <h1 className="text-3xl font-semibold">{t('trainers.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('trainers.subtitle')}</p>
      </div>
    </section>
  )
}

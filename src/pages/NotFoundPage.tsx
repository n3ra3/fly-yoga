import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center section-padding">
      <p className="text-6xl font-semibold text-muted-foreground/30">404</p>
      <p className="mt-4 text-lg font-medium">{t('common.error')}</p>
      <Link to="/" className="mt-6 text-sm text-primary hover:underline">
        {t('common.back')}
      </Link>
    </div>
  )
}

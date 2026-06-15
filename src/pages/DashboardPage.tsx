import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function DashboardPage() {
  const { t } = useTranslation()
  const { profile } = useAuth()

  return (
    <div>
      <h1 className="text-2xl font-semibold">
        {t('dashboard.title')}{profile ? `, ${profile.first_name}` : ''}
      </h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          to="/dashboard/bookings"
          className="rounded-xl border border-border p-5 hover:bg-muted/50 transition-colors"
        >
          <p className="font-medium">{t('dashboard.bookings.title')}</p>
        </Link>
        <Link
          to="/dashboard/profile"
          className="rounded-xl border border-border p-5 hover:bg-muted/50 transition-colors"
        >
          <p className="font-medium">{t('dashboard.profile.title')}</p>
        </Link>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const { resetPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await resetPassword(email)
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center section-padding">
        <div className="max-w-sm text-center">
          <p className="text-base">{t('auth.resetPassword.success')}</p>
          <Link to="/login" className="mt-4 inline-block text-sm text-primary hover:underline">
            {t('auth.resetPassword.backToLogin')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center section-padding">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold">{t('auth.resetPassword.title')}</h1>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">{t('auth.resetPassword.email')}</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('auth.resetPassword.submit')}
          </button>
        </form>
        <Link to="/login" className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground">
          {t('auth.resetPassword.backToLogin')}
        </Link>
      </div>
    </div>
  )
}

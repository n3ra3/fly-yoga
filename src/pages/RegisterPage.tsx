import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Logo } from '@/components/Logo'

export function RegisterPage() {
  const { t } = useTranslation()
  const { signUp, session } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exists, setExists] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/dashboard" replace />

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setExists(false)
    setLoading(true)
    const { error, alreadyExists, hasSession } = await signUp({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone || undefined,
    })
    setLoading(false)

    if (alreadyExists) {
      setExists(true)
      return
    }
    if (error) {
      setError(t('auth.register.error'))
      return
    }
    // подтверждение email выключено — пользователь уже вошёл
    if (hasSession) {
      navigate('/dashboard')
      return
    }
    // подтверждение включено — показываем экран «проверьте почту»
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mb-3 text-4xl">✉️</div>
          <h2 className="text-xl font-semibold">{t('auth.register.checkEmail')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('auth.register.success')}</p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t('auth.register.login')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <Logo variant="dark" showText imgClassName="h-16 w-16" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('auth.register.title')}
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('auth.register.firstName')}>
                <input
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={form.firstName}
                  onChange={handleChange}
                  className="input-base"
                />
              </Field>
              <Field label={t('auth.register.lastName')}>
                <input
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={form.lastName}
                  onChange={handleChange}
                  className="input-base"
                />
              </Field>
            </div>

            <Field label={t('auth.register.email')}>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                className="input-base"
                placeholder="you@example.com"
              />
            </Field>

            <Field label={`${t('auth.register.phone')} (${t('common.optional')})`}>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={handleChange}
                className="input-base"
                placeholder="+373 XX XXX XXX"
              />
            </Field>

            <Field label={t('auth.register.password')}>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={handleChange}
                  className="input-base pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {exists && (
              <div className="rounded-lg bg-secondary px-3 py-2.5 text-sm">
                <p className="text-foreground/80">{t('auth.register.exists')}</p>
                <Link to="/login" className="mt-0.5 inline-block font-medium text-primary hover:underline">
                  {t('auth.register.goToLogin')}
                </Link>
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('auth.register.submit')}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('auth.register.hasAccount')}{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t('auth.register.login')}
          </Link>
        </p>
      </div>
    </div>
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

import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, MailCheck, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Logo } from '@/components/Logo'
import { CodeInput } from '@/components/CodeInput'

export function RegisterPage() {
  const { t } = useTranslation()
  const { signUp, verifyCode, resendCode, session } = useAuth()
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
  const [codeStep, setCodeStep] = useState(false)
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
    // подтверждение включено — показываем экран ввода кода из письма
    setCodeStep(true)
  }

  if (codeStep) {
    return (
      <CodeStep
        email={form.email}
        onVerify={verifyCode}
        onResend={resendCode}
        onDone={() => navigate('/dashboard')}
        onBack={() => setCodeStep(false)}
      />
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

function CodeStep({
  email,
  onVerify,
  onResend,
  onDone,
  onBack,
}: {
  email: string
  onVerify: (email: string, code: string) => Promise<{ error: string | null }>
  onResend: (email: string) => Promise<{ error: string | null }>
  onDone: () => void
  onBack: () => void
}) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resent, setResent] = useState(false)

  async function verify(value: string) {
    if (verifying) return
    setError(null)
    setVerifying(true)
    const { error } = await onVerify(email, value)
    setVerifying(false)
    if (error) setError(t('auth.code.wrong'))
    else onDone()
  }

  async function resend() {
    setError(null)
    setResent(false)
    const { error } = await onResend(email)
    if (error) setError(error)
    else setResent(true)
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4">
          <Logo variant="dark" showText imgClassName="h-16 w-16" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck size={26} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">{t('auth.code.title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('auth.code.subtitle')} <span className="font-medium text-foreground">{email}</span>
          </p>

          <div className="mt-7">
            <CodeInput
              onChange={(c) => {
                setCode(c)
                setError(null)
              }}
              onComplete={verify}
              disabled={verifying}
            />
          </div>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          {resent && !error && <p className="mt-4 text-sm text-primary">{t('auth.code.resent')}</p>}

          <button
            onClick={() => verify(code)}
            disabled={verifying || code.length < 6}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md disabled:opacity-50"
          >
            {verifying ? <Loader2 size={16} className="animate-spin" /> : null}
            {t('auth.code.submit')}
          </button>

          <button
            onClick={resend}
            disabled={verifying}
            className="mt-4 text-sm text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
          >
            {t('auth.code.resend')}
          </button>
        </div>

        <button
          onClick={onBack}
          className="mt-6 inline-flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} /> {t('auth.code.back')}
        </button>
      </div>
    </div>
  )
}

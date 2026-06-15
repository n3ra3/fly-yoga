import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export function ProfilePage() {
  const { t } = useTranslation()
  const { profile, user, refreshProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<{
    first_name: string
    last_name: string
    phone: string | null
  }>({ first_name: '', last_name: '', phone: null })

  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
      })
      setAvatarPreview(profile.avatar_url)
    }
  }, [profile])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value || null }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update(form).eq('id', profile.id)
    await refreshProfile()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Файл слишком большой. Максимум 5 МБ.')
      return
    }

    setPhotoError(null)
    setUploadingPhoto(true)

    // Optimistic preview
    const localUrl = URL.createObjectURL(file)
    setAvatarPreview(localUrl)

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${profile.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setPhotoError(t('dashboard.profile.uploadError'))
      setAvatarPreview(profile.avatar_url)
      setUploadingPhoto(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    // Add cache-buster so the browser doesn't show the old photo
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`

    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
    await refreshProfile()
    setAvatarPreview(publicUrl)
    setUploadingPhoto(false)
  }

  const initials = profile
    ? `${profile.first_name[0] ?? ''}${profile.last_name[0] ?? ''}`.toUpperCase()
    : '?'

  const fields = [
    { name: 'first_name', label: t('auth.register.firstName'), type: 'text', autoComplete: 'given-name' },
    { name: 'last_name', label: t('auth.register.lastName'), type: 'text', autoComplete: 'family-name' },
    { name: 'phone', label: t('auth.register.phone'), type: 'tel', autoComplete: 'tel' },
  ] as const

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">{t('dashboard.profile.title')}</h1>

      <div className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr]">

        {/* Avatar card */}
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 sm:w-44">
          <div className="relative">
            {/* Avatar circle */}
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-accent">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-medium text-accent-foreground">
                  {initials}
                </span>
              )}
              {uploadingPhoto && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>

            {/* Camera button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow transition-transform hover:scale-110 disabled:opacity-50"
            >
              <Camera size={14} />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoChange}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
          >
            {avatarPreview
              ? t('dashboard.profile.changePhoto')
              : t('dashboard.profile.uploadPhoto')}
          </button>

          {photoError && (
            <p className="text-center text-xs text-destructive">{photoError}</p>
          )}
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <form onSubmit={handleSave} className="flex flex-col gap-5">

            {/* Read-only email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                {t('dashboard.profile.email')}
              </label>
              <input
                type="email"
                value={user?.email ?? ''}
                readOnly
                className="input-base cursor-default bg-muted/50 text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">{t('dashboard.profile.emailHint')}</p>
            </div>

            {/* Editable fields */}
            {fields.map(({ name, label, type, autoComplete }) => (
              <div key={name} className="flex flex-col gap-1.5">
                <label htmlFor={name} className="text-sm font-medium text-foreground">
                  {label}
                </label>
                <input
                  id={name}
                  name={name}
                  type={type}
                  autoComplete={autoComplete}
                  value={form[name] ?? ''}
                  onChange={handleChange}
                  className="input-base"
                />
              </div>
            ))}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md disabled:opacity-50"
              >
                {saving ? t('common.loading') : t('dashboard.profile.save')}
              </button>

              {saved && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
                  <CheckCircle2 size={16} />
                  {t('dashboard.profile.saved')}
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

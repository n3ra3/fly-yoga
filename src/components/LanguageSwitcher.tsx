import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Language } from '@/types'

const LANGUAGES: { code: Language; label: string; full: string }[] = [
  { code: 'ru', label: 'RU', full: 'Русский' },
  { code: 'ro', label: 'RO', full: 'Română' },
  { code: 'en', label: 'EN', full: 'English' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language.slice(0, 2) as Language
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Язык / Language"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-primary/40 hover:text-primary"
      >
        <Globe size={15} />
        <span className="uppercase">{current}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-36 overflow-hidden rounded-xl border border-border bg-background py-1 shadow-lg">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                i18n.changeLanguage(l.code)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-muted',
                current === l.code ? 'font-medium text-primary' : 'text-foreground/80',
              )}
            >
              <span>
                {l.full} <span className="text-xs text-muted-foreground">· {l.label}</span>
              </span>
              {current === l.code && <Check size={14} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

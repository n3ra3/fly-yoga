import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { Language } from '@/types'

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'ru', label: 'RU' },
  { code: 'ro', label: 'RO' },
  { code: 'en', label: 'EN' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language.slice(0, 2) as Language

  return (
    <div className="flex items-center gap-1 text-xs">
      {LANGUAGES.map((lang, idx) => (
        <span key={lang.code} className="flex items-center gap-1">
          <button
            onClick={() => i18n.changeLanguage(lang.code)}
            className={cn(
              'transition-colors',
              current === lang.code
                ? 'font-semibold text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {lang.label}
          </button>
          {idx < LANGUAGES.length - 1 && (
            <span className="text-muted-foreground/40">/</span>
          )}
        </span>
      ))}
    </div>
  )
}

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const LOCALE_MAP: Record<string, string> = { ru: 'ru-RU', ro: 'ro-RO', en: 'en-US' }

function resolveLocale(lang?: string) {
  return LOCALE_MAP[lang ?? 'ru'] ?? 'ru-RU'
}

/** "пн, 14 июн" */
export function formatDate(iso: string, lang?: string) {
  return new Date(iso).toLocaleDateString(resolveLocale(lang), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

/** "18:30" */
export function formatTime(iso: string, lang?: string) {
  return new Date(iso).toLocaleTimeString(resolveLocale(lang), {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "1 400 MDL" */
export function formatMoney(amount: number | string, lang?: string) {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  return `${new Intl.NumberFormat(resolveLocale(lang)).format(n)} MDL`
}

/** YYYY-MM-DD для <input type="date"> сравнений */
export function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function isSameDay(iso: string, date: Date) {
  const d = new Date(iso)
  return (
    d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate()
  )
}

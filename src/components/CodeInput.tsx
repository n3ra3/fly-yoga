import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Ввод 6-значного кода: отдельные клетки, авто-переход, вставка целиком.
 * onComplete срабатывает, когда введены все 6 цифр.
 */
export function CodeInput({
  length = 6,
  onChange,
  onComplete,
  disabled,
}: {
  length?: number
  onChange?: (code: string) => void
  onComplete?: (code: string) => void
  disabled?: boolean
}) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''))
  const refs = useRef<(HTMLInputElement | null)[]>([])

  function emit(next: string[]) {
    setValues(next)
    const code = next.join('')
    onChange?.(code)
    if (code.length === length && !next.includes('')) onComplete?.(code)
  }

  function handleChange(i: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1)
    const next = [...values]
    next[i] = digit
    emit(next)
    if (digit && i < length - 1) refs.current[i + 1]?.focus()
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !values[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length).split('')
    if (!digits.length) return
    const next = Array(length)
      .fill('')
      .map((_, idx) => digits[idx] ?? '')
    emit(next)
    refs.current[Math.min(digits.length, length - 1)]?.focus()
  }

  return (
    <div className="flex justify-center gap-2" onPaste={handlePaste}>
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={v}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-12 w-11 rounded-xl border text-center text-xl font-semibold text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50',
            v ? 'border-primary bg-primary/5' : 'border-border bg-background',
          )}
        />
      ))}
    </div>
  )
}

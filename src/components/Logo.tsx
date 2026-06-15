import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  imgClassName?: string
  /** 'dark' = лого на светлом фоне (navbar), 'light' = на тёмном (CTA/футер) */
  variant?: 'dark' | 'light'
  showText?: boolean
}

export function Logo({ className, imgClassName, variant = 'dark', showText = false }: LogoProps) {
  return (
    <Link
      to="/"
      className={cn('flex items-center gap-2.5 shrink-0', className)}
      aria-label="Fly Yoga Studio"
    >
      <img
        src="/logo.png"
        alt="Fly Yoga Studio"
        className={cn(
          // логотип — прозрачный PNG с лотосом
          'h-10 w-10 object-contain',
          variant === 'light' && 'brightness-0 invert',
          imgClassName,
        )}
      />
      {showText && (
        <span className="flex flex-col leading-none">
          <span className="text-lg font-semibold tracking-tight">Fly Yoga</span>
          <span
            className={cn(
              'mt-1 text-[0.65rem] font-normal uppercase tracking-[0.3em]',
              variant === 'light' ? 'text-white/70' : 'text-muted-foreground',
            )}
          >
            Studio
          </span>
        </span>
      )}
    </Link>
  )
}

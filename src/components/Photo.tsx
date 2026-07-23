import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Фото с мягким запасным плейсхолдером.
 * Пока файла нет в /public/images — показывается градиент в палитре студии,
 * как только файл появится, картинка подхватится сама.
 */
export function Photo({
  src,
  alt,
  className,
  imgClassName,
}: {
  src: string
  alt: string
  className?: string
  imgClassName?: string
}) {
  const [failed, setFailed] = useState(false)

  return (
    <div className={cn('relative overflow-hidden bg-secondary', className)}>
      {!failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn('h-full w-full object-cover', imgClassName)}
        />
      ) : (
        <div
          aria-label={alt}
          className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,hsl(var(--secondary)),hsl(var(--muted)))]"
        >
          <img src="/logo.png" alt="" className="h-12 w-12 opacity-15" />
        </div>
      )}
    </div>
  )
}

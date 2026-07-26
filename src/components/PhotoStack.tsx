import { useRef, useState } from 'react'
import { Photo } from '@/components/Photo'
import { cn } from '@/lib/utils'

/**
 * Стопка фотографий: карточки лежат друг на друге.
 * По клику на верхнюю она «улетает» и открывает следующую (по кругу).
 */
export function PhotoStack({ photos, alt }: { photos: string[]; alt: string }) {
  const [index, setIndex] = useState(0)
  const [anim, setAnim] = useState(false)
  // ref, чтобы не сработать дважды: transitionEnd летит по каждому свойству
  const animating = useRef(false)
  const n = photos.length

  if (n === 0) return null

  function next() {
    if (animating.current || n <= 1) return
    animating.current = true
    setAnim(true)
  }

  // когда анимация «улёта» завершилась — показываем следующее фото
  function handleEnd() {
    if (!animating.current) return
    animating.current = false
    setIndex((i) => (i + 1) % n)
    setAnim(false)
  }

  const back1 = photos[(index + 1) % n]
  const back2 = photos[(index + 2) % n]

  return (
    <div className="mx-auto w-full max-w-xl select-none">
      <div className="relative aspect-[4/3] w-full">
        {/* декоративные карточки сзади — создают вид стопки */}
        {n > 2 && (
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl shadow-md"
            style={{ transform: 'translateY(24px) scale(0.90) rotate(-3deg)', zIndex: 10 }}
          >
            <Photo src={back2} alt="" className="h-full w-full" />
            <div className="absolute inset-0 bg-foreground/25" />
          </div>
        )}
        {n > 1 && (
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl shadow-md"
            style={{ transform: 'translateY(12px) scale(0.95) rotate(2deg)', zIndex: 20 }}
          >
            <Photo src={back1} alt="" className="h-full w-full" />
            <div className="absolute inset-0 bg-foreground/12" />
          </div>
        )}

        {/* верхняя — кликабельная */}
        <button
          type="button"
          onClick={next}
          onTransitionEnd={handleEnd}
          aria-label={alt}
          className={cn(
            'absolute inset-0 overflow-hidden rounded-2xl shadow-xl transition-all duration-300 ease-out',
            n > 1 && 'cursor-pointer',
            anim ? '-translate-x-16 -rotate-12 opacity-0' : 'translate-x-0 rotate-0 opacity-100',
          )}
          style={{ zIndex: 30 }}
        >
          <Photo src={photos[index]} alt={alt} className="h-full w-full" />
        </button>
      </div>

      {/* счётчик + подсказка */}
      {n > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <div className="flex gap-1.5">
            {photos.map((_, i) => (
              <span
                key={i}
                className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-5 bg-primary' : 'w-1.5 bg-border')}
              />
            ))}
          </div>
          <span className="tabular-nums">
            {index + 1} / {n}
          </span>
        </div>
      )}
    </div>
  )
}

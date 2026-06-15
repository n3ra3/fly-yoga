import { useEffect, useRef, useState, useCallback } from 'react'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ReviewItem {
  name: string
  text: string
  rating?: number
}

const AUTOPLAY_MS = 4500

function useItemsPerView() {
  const [n, setN] = useState(1)
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      setN(w >= 1024 ? 3 : w >= 640 ? 2 : 1)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return n
}

export function ReviewsCarousel({ reviews }: { reviews: ReviewItem[] }) {
  const perView = useItemsPerView()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const maxIndex = Math.max(0, reviews.length - perView)
  const canSlide = reviews.length > perView

  // держим индекс в допустимых пределах при ресайзе
  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex))
  }, [maxIndex])

  const next = useCallback(() => {
    setIndex((i) => (i >= maxIndex ? 0 : i + 1))
  }, [maxIndex])

  const prev = useCallback(() => {
    setIndex((i) => (i <= 0 ? maxIndex : i - 1))
  }, [maxIndex])

  // автопрокрутка
  useEffect(() => {
    if (!canSlide || paused) return
    const id = setInterval(next, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [canSlide, paused, next])

  // свайп на тач-устройствах
  const touchX = useRef<number | null>(null)
  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)()
    touchX.current = null
  }

  return (
    <div
      className="mt-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * (100 / perView)}%)` }}
        >
          {reviews.map((review, i) => (
            <div
              key={i}
              className="shrink-0 px-3 first:pl-0 last:pr-0"
              style={{ flexBasis: `${100 / perView}%`, maxWidth: `${100 / perView}%` }}
            >
              <figure className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-background p-6">
                <Quote size={22} className="text-primary/30" />
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, si) => (
                    <Star
                      key={si}
                      size={14}
                      className={cn(
                        si < (review.rating ?? 5)
                          ? 'fill-primary text-primary'
                          : 'fill-muted text-muted',
                      )}
                    />
                  ))}
                </div>
                <blockquote className="line-clamp-[7] text-sm leading-relaxed text-foreground/80">
                  {review.text}
                </blockquote>
                <figcaption className="mt-auto pt-2 text-sm font-medium">{review.name}</figcaption>
              </figure>
            </div>
          ))}
        </div>
      </div>

      {canSlide && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={prev}
            aria-label="Предыдущий отзыв"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Отзыв ${i + 1}`}
                className={cn(
                  'h-2 rounded-full transition-all',
                  i === index ? 'w-6 bg-primary' : 'w-2 bg-border hover:bg-primary/40',
                )}
              />
            ))}
          </div>

          <button
            onClick={next}
            aria-label="Следующий отзыв"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

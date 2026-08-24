import { useEffect, useRef, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Photo } from '@/components/Photo'
import { Lightbox } from '@/components/Lightbox'
import { cn } from '@/lib/utils'

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

/**
 * Фото-карусель — тот же свайпер, что для отзывов на главной:
 * стрелки и точки снизу по центру, автопрокрутка, пауза при наведении, тач-свайп.
 */
export function PhotoStrip({ images, hint }: { images: string[]; hint?: string }) {
  const perView = useItemsPerView()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [zoom, setZoom] = useState<number | null>(null) // индекс открытого фото

  const maxIndex = Math.max(0, images.length - perView)
  const canSlide = images.length > perView

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex))
  }, [maxIndex])

  const next = useCallback(() => setIndex((i) => (i >= maxIndex ? 0 : i + 1)), [maxIndex])
  const prev = useCallback(() => setIndex((i) => (i <= 0 ? maxIndex : i - 1)), [maxIndex])

  useEffect(() => {
    if (!canSlide || paused) return
    const id = setInterval(next, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [canSlide, paused, next])

  const touchX = useRef<number | null>(null)
  const swiped = useRef(false)
  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX
    swiped.current = false
  }
  function onTouchMove(e: React.TouchEvent) {
    if (touchX.current !== null && Math.abs(e.touches[0].clientX - touchX.current) > 10) swiped.current = true
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)()
    touchX.current = null
  }

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {hint && <p className="mb-4 text-sm font-medium text-muted-foreground">{hint}</p>}

      <div className="overflow-hidden" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * (100 / perView)}%)` }}
        >
          {images.map((src, i) => (
            <div
              key={i}
              className="shrink-0 px-2.5 first:pl-0 last:pr-0"
              style={{ flexBasis: `${100 / perView}%`, maxWidth: `${100 / perView}%` }}
            >
              <button
                type="button"
                onClick={() => {
                  if (!swiped.current) setZoom(i)
                }}
                className="block w-full cursor-zoom-in"
                aria-label={`Открыть фото ${i + 1}`}
              >
                <Photo
                  src={src}
                  alt={`Fly Yoga ${i + 1}`}
                  className="aspect-[3/4] w-full rounded-2xl"
                  imgClassName="transition-transform duration-300 hover:scale-[1.04]"
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {canSlide && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={prev}
            aria-label="Назад"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Фото ${i + 1}`}
                className={cn(
                  'h-2 rounded-full transition-all',
                  i === index ? 'w-6 bg-primary' : 'w-2 bg-border hover:bg-primary/40',
                )}
              />
            ))}
          </div>

          <button
            onClick={next}
            aria-label="Вперёд"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {zoom !== null && (
        <Lightbox images={images} index={zoom} onClose={() => setZoom(null)} onIndex={setZoom} />
      )}
    </div>
  )
}

import { useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Полноэкранный просмотр фото. Открывается кликом по картинке.
 * Закрытие: крестик, клик по фону, Esc. Навигация: стрелки на экране и клавиши ←/→.
 */
export function Lightbox({
  images,
  index,
  onClose,
  onIndex,
}: {
  images: string[]
  index: number
  onClose: () => void
  onIndex: (i: number) => void
}) {
  const multiple = images.length > 1
  const prev = useCallback(() => onIndex((index - 1 + images.length) % images.length), [index, images.length, onIndex])
  const next = useCallback(() => onIndex((index + 1) % images.length), [index, images.length, onIndex])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', onKey)
    // блокируем прокрутку страницы под оверлеем
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, prev, next])

  const btn =
    'flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр фото"
    >
      <button onClick={onClose} aria-label="Закрыть" className={`${btn} absolute right-4 top-4`}>
        <X size={20} />
      </button>

      {multiple && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            prev()
          }}
          aria-label="Предыдущее"
          className={`${btn} absolute left-3 sm:left-5`}
        >
          <ChevronLeft size={22} />
        </button>
      )}

      <img
        src={images[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
      />

      {multiple && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            next()
          }}
          aria-label="Следующее"
          className={`${btn} absolute right-3 sm:right-5`}
        >
          <ChevronRight size={22} />
        </button>
      )}

      {multiple && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  )
}

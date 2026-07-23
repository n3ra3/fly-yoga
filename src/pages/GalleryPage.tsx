import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Photo } from '@/components/Photo'
import { GALLERY_CATEGORIES, photosOf } from '@/data/gallery'
import { cn } from '@/lib/utils'

export function GalleryPage() {
  const { t } = useTranslation()
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState<number | null>(null)

  const category = GALLERY_CATEGORIES[active]
  const photos = photosOf(category)

  // управление просмотром с клавиатуры
  useEffect(() => {
    if (lightbox === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') setLightbox((i) => (i === null ? i : (i + 1) % photos.length))
      if (e.key === 'ArrowLeft') setLightbox((i) => (i === null ? i : (i - 1 + photos.length) % photos.length))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [lightbox, photos.length])

  return (
    <div>
      {/* Заголовок */}
      <section className="bg-secondary/40">
        <div className="container-yoga py-14 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t('gallery.eyebrow')}
          </p>
          <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            {t('gallery.title')}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            {t('gallery.subtitle')}
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-yoga">
          {/* Вкладки категорий */}
          <div className="flex flex-wrap gap-2">
            {GALLERY_CATEGORIES.map((c, i) => (
              <button
                key={c.key}
                onClick={() => {
                  setActive(i)
                  setLightbox(null)
                }}
                className={cn(
                  'rounded-full border px-5 py-2.5 text-sm font-medium transition-colors',
                  i === active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-foreground/70 hover:border-primary/40 hover:text-primary',
                )}
              >
                {t(`gallery.categories.${c.key}`)}
              </button>
            ))}
          </div>

          {/* Сетка фото */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((src, i) => (
              <button
                key={src}
                onClick={() => setLightbox(i)}
                className="group overflow-hidden rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                aria-label={`${t(`gallery.categories.${category.key}`)} ${i + 1}`}
              >
                <Photo
                  src={src}
                  alt={`${t(`gallery.categories.${category.key}`)} ${i + 1}`}
                  className="aspect-[4/3] w-full"
                  imgClassName="transition-transform duration-500 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Просмотр фото */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label={t('common.close')}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X size={20} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setLightbox((i) => (i === null ? i : (i - 1 + photos.length) % photos.length))
            }}
            aria-label={t('common.back')}
            className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <ChevronLeft size={22} />
          </button>

          <figure className="max-h-full" onClick={(e) => e.stopPropagation()}>
            <Photo
              src={photos[lightbox]}
              alt={`${t(`gallery.categories.${category.key}`)} ${lightbox + 1}`}
              className="aspect-[4/3] max-h-[78vh] w-[min(90vw,900px)] rounded-2xl bg-black/20"
              imgClassName="object-contain"
            />
            <figcaption className="mt-3 text-center text-sm text-white/70">
              {t(`gallery.categories.${category.key}`)} · {lightbox + 1} / {photos.length}
            </figcaption>
          </figure>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setLightbox((i) => (i === null ? i : (i + 1) % photos.length))
            }}
            aria-label={t('common.next')}
            className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      )}
    </div>
  )
}

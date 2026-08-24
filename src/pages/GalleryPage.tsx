import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhotoStrip } from '@/components/PhotoStrip'
import { GALLERY_CATEGORIES, photosOf } from '@/data/gallery'
import { cn } from '@/lib/utils'

export function GalleryPage() {
  const { t } = useTranslation()
  const [active, setActive] = useState(0)

  const category = GALLERY_CATEGORIES[active]
  const photos = photosOf(category)

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
          <div className="flex flex-wrap justify-center gap-2">
            {GALLERY_CATEGORIES.map((c, i) => (
              <button
                key={c.key}
                onClick={() => setActive(i)}
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

          {/* Фото-скроллер (тот же, что на «Услугах») */}
          {/* key = категория, чтобы карусель сбрасывалась на 1-е фото при смене вкладки */}
          <div className="mt-12">
            <PhotoStrip key={category.key} images={photos} />
          </div>
        </div>
      </section>
    </div>
  )
}

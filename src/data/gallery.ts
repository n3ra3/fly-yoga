/**
 * Галерея студии. Фото кладём в public/images/gallery/
 * по схеме: <folder>-1.webp … <folder>-6.webp
 * Например: hall-big-1.webp, kitchen-3.webp
 * Если файла нет — на его месте показывается аккуратный плейсхолдер.
 */

export interface GalleryCategory {
  /** ключ перевода: gallery.categories.<key> */
  key: string
  /** префикс имени файлов в public/images/gallery/ */
  folder: string
  /** сколько фото в категории */
  count: number
}

// count = сколько реальных фото лежит в public/images/gallery/ для категории.
// Ставим ровно столько, сколько есть, — тогда в карусели нет пустых карточек.
// Добавил фото? Обнови count (и прогони `npm run optimize:images`).
export const GALLERY_CATEGORIES: GalleryCategory[] = [
  { key: 'hallBig', folder: 'hall-big', count: 4 },
  { key: 'hallSmall', folder: 'hall-small', count: 3 },
  { key: 'changing', folder: 'changing', count: 3 },
]

export function photosOf(category: GalleryCategory): string[] {
  return Array.from({ length: category.count }, (_, i) => `/images/gallery/${category.folder}-${i + 1}.webp`)
}

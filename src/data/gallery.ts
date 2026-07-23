/**
 * Галерея студии. Фото кладём в public/images/gallery/
 * по схеме: <folder>-1.jpg … <folder>-6.jpg
 * Например: hall-big-1.jpg, kitchen-3.jpg
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

export const GALLERY_CATEGORIES: GalleryCategory[] = [
  { key: 'hallBig', folder: 'hall-big', count: 6 },
  { key: 'hallSmall', folder: 'hall-small', count: 6 },
  { key: 'kitchen', folder: 'kitchen', count: 6 },
  { key: 'changing', folder: 'changing', count: 6 },
  { key: 'toilet', folder: 'toilet', count: 6 },
]

export function photosOf(category: GalleryCategory): string[] {
  return Array.from({ length: category.count }, (_, i) => `/images/gallery/${category.folder}-${i + 1}.jpg`)
}

// Оптимизация фотографий студии.
// Ресайз до MAX по длинной стороне + перевод в WebP + авто-поворот по EXIF.
// Оригинальные .jpg/.jpeg заменяются лёгкими .webp с тем же именем.
//
// Запуск:  node scripts/optimize-images.mjs
import sharp from 'sharp'
import { readdir, stat, unlink } from 'node:fs/promises'
import { join, extname } from 'node:path'

const ROOT = 'public/images'
const MAX = 1600 // максимум по длинной стороне, px
const QUALITY = 80

async function walk(dir) {
  const out = []
  for (const name of await readdir(dir)) {
    const p = join(dir, name)
    const s = await stat(p)
    if (s.isDirectory()) out.push(...(await walk(p)))
    else if (/\.jpe?g$/i.test(name)) out.push(p)
  }
  return out
}

const kb = (n) => Math.round(n / 1024)

const files = await walk(ROOT)
let before = 0
let after = 0

for (const file of files) {
  const src = (await stat(file)).size
  const dest = file.replace(extname(file), '.webp')
  const info = await sharp(file)
    .rotate() // применяем EXIF-ориентацию, затем метаданные отбрасываются
    .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(dest)
  await unlink(file) // убираем тяжёлый оригинал
  before += src
  after += info.size
  console.log(`${file}  ${kb(src)}KB → ${kb(info.size)}KB  (${info.width}×${info.height})`)
}

console.log(`\nИтого: ${kb(before)}KB → ${kb(after)}KB  (${files.length} фото, экономия ${Math.round((1 - after / before) * 100)}%)`)

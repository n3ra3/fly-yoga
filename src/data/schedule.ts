// Еженедельное расписание ГРУППОВЫХ занятий Fly Yoga Studio.
// Повторяется каждую неделю. Чтобы изменить — правь этот файл.
// kind: 'groupRu' — занятие на русском, 'groupRo' — на румынском.

// Занятия различаются языком ведения: русский или румынский.
export type GroupKind = 'groupRu' | 'groupRo'

export interface GroupSlot {
  time: string // 'ЧЧ:ММ' — начало; длительность всегда SESSION_MINUTES (75 мин)
  kind: GroupKind
  /**
   * Необязательная пометка «блока дней» — влияет ТОЛЬКО на то, как занятия
   * склеиваются в строки на главной. Занятия с разной пометкой не объединяются.
   * Пример: 18:45 (рус.) идёт все будни, но студия показывает его двумя строками —
   * «Пн, Ср, Пт» и «Вт, Чт», поэтому у них разные пометки.
   */
  pattern?: string
}

// Ключ — день недели по ISO: 1 = Понедельник … 7 = Воскресенье
export const weeklyGroupSchedule: Record<number, GroupSlot[]> = {
  // Понедельник
  1: [
    { time: '17:30', kind: 'groupRo' }, // 17:30 – 18:45
    { time: '18:45', kind: 'groupRu', pattern: 'mwf' }, // 18:45 – 20:00
  ],
  // Вторник
  2: [
    { time: '09:00', kind: 'groupRo' }, // 09:00 – 10:15
    { time: '17:00', kind: 'groupRu' }, // 17:00 – 18:15
    { time: '18:45', kind: 'groupRu', pattern: 'tt' }, // 18:45 – 20:00
  ],
  // Среда
  3: [
    { time: '10:00', kind: 'groupRu' }, // 10:00 – 11:15
    { time: '17:30', kind: 'groupRo' }, // 17:30 – 18:45
    { time: '18:45', kind: 'groupRu', pattern: 'mwf' }, // 18:45 – 20:00
  ],
  // Четверг
  4: [
    { time: '09:00', kind: 'groupRo' }, // 09:00 – 10:15
    { time: '17:00', kind: 'groupRu' }, // 17:00 – 18:15
    { time: '18:45', kind: 'groupRu', pattern: 'tt' }, // 18:45 – 20:00
  ],
  // Пятница
  5: [
    { time: '10:00', kind: 'groupRu' }, // 10:00 – 11:15
    { time: '17:30', kind: 'groupRo' }, // 17:30 – 18:45
    { time: '18:45', kind: 'groupRu', pattern: 'mwf' }, // 18:45 – 20:00
  ],
  // Суббота
  6: [
    { time: '09:00', kind: 'groupRu' }, // 09:00 – 10:15
    { time: '10:30', kind: 'groupRu' }, // 10:30 – 11:45
    { time: '14:00', kind: 'groupRo' }, // 14:00 – 15:15
  ],
  // Воскресенье
  7: [
    { time: '11:00', kind: 'groupRu' }, // 11:00 – 12:15
    { time: '12:30', kind: 'groupRu' }, // 12:30 – 13:45
  ],
}

// Рабочее время студии и длительность одного занятия (минуты)
export const WORK_HOURS = { open: '06:00', close: '21:30' }
export const SESSION_MINUTES = 75

// Сколько человек помещается в одну группу (мест на занятие).
// ВАЖНО: поставь реальное число мест студии.
export const CLASS_CAPACITY = 10

/** '09:00' -> минуты от полуночи */
export function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** минуты от полуночи -> '09:00' */
export function minutesToTime(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Праздники Молдовы с фиксированной датой (ММ-ДД).
const FIXED_HOLIDAYS: Record<string, string> = {
  '01-01': 'Новый год',
  '01-07': 'Рождество (ст. ст.)',
  '01-08': 'Рождество',
  '03-08': 'Международный женский день',
  '05-01': 'День труда',
  '05-09': 'День Победы и Европы',
  '06-01': 'День защиты детей',
  '08-27': 'День независимости',
  '08-31': 'Лимба ноастрэ',
  '12-25': 'Рождество (н. ст.)',
}

// Праздники, зависящие от православной Пасхи — задаются по годам.
// ОБНОВЛЯТЬ ЕЖЕГОДНО. Ниже — даты для 2026 года (Пасха 12 апреля 2026).
const EASTER_HOLIDAYS: Record<string, string> = {
  '2026-04-12': 'Пасха',
  '2026-04-13': 'Пасха (2-й день)',
  '2026-04-21': 'Радоница (Пасха Блаженных)',
  '2027-05-02': 'Пасха',
  '2027-05-03': 'Пасха (2-й день)',
  '2027-05-11': 'Радоница (Пасха Блаженных)',
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

// ─── Группировка занятий по категориям (для блока на главной) ───

export type ScheduleCategory = 'morning' | 'evening' | 'weekend'

export interface SlotGroup {
  days: number[] // ISO-дни: 1 = Пн … 7 = Вс
  time: string
  kind: GroupKind
}

/**
 * Собирает занятия категории, объединяя одинаковые время+язык в одну строку.
 * Например Вт 09:00 (рум.) + Чт 09:00 (рум.) → { days: [2,4], time: '09:00' }.
 * Источник правды — weeklyGroupSchedule выше, дублировать списки не нужно.
 */
export function getSlotGroups(category: ScheduleCategory): SlotGroup[] {
  const matches = (day: number, time: string) => {
    if (category === 'weekend') return day >= 6
    if (day >= 6) return false
    const beforeNoon = timeToMinutes(time) < 12 * 60
    return category === 'morning' ? beforeNoon : !beforeNoon
  }

  const byKey = new Map<string, SlotGroup>()
  for (let day = 1; day <= 7; day++) {
    for (const slot of weeklyGroupSchedule[day] ?? []) {
      if (!matches(day, slot.time)) continue
      // pattern разделяет строки, которые студия показывает отдельно
      const key = `${slot.time}|${slot.kind}|${slot.pattern ?? ''}`
      const existing = byKey.get(key)
      if (existing) existing.days.push(day)
      else byKey.set(key, { days: [day], time: slot.time, kind: slot.kind })
    }
  }

  const groups = [...byKey.values()]
  // выходные читаются удобнее по дням (сначала суббота), будни — по времени
  return category === 'weekend'
    ? groups.sort((a, b) => a.days[0] - b.days[0] || timeToMinutes(a.time) - timeToMinutes(b.time))
    : groups.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time) || a.days[0] - b.days[0])
}

/** Возвращает название праздника Молдовы для даты или null. */
export function getMoldovaHoliday(date: Date): string | null {
  const mmdd = `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const ymd = `${date.getFullYear()}-${mmdd}`
  return EASTER_HOLIDAYS[ymd] ?? FIXED_HOLIDAYS[mmdd] ?? null
}

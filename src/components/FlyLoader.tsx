import { useEffect, useState, type CSSProperties } from 'react'

// Лепестки лотоса (тот же путь, что в дизайн-макете).
const FLY_PATHS = [
  'M515 421 Q576.0 309.0 515 197 Q454.0 309.0 515 421 Z',
  'M515 421 Q566.6 301.1 455 201 Q435.4 336.9 515 421 Z',
  'M515 421 Q594.6 336.9 575 201 Q463.4 301.1 515 421 Z',
  'M515 421 Q508.7 280.5 357 258 Q395.3 390.5 515 421 Z',
  'M515 421 Q635.4 390.8 675 258 Q522.6 280.2 515 421 Z',
  'M515 421 Q469.5 268.3 305 350 Q410.5 442.7 515 421 Z',
  'M515 421 Q620.6 441.4 726 348 Q560.4 267.6 515 421 Z',
]

/**
 * Стартовый экран загрузки Fly Yoga.
 * Лотос «раскрывается на вдохе», дышит, затем «улетает» вверх, открывая сайт.
 * Показывается один раз при первом заходе.
 */
export function FlyLoader() {
  const [mounted, setMounted] = useState(true)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    // Даём лотосу полностью распуститься и вдохнуть, затем — полёт вверх.
    const hide = window.setTimeout(() => setExiting(true), 1150)
    const remove = window.setTimeout(() => setMounted(false), 1750)
    return () => {
      window.clearTimeout(hide)
      window.clearTimeout(remove)
    }
  }, [])

  if (!mounted) return null

  return (
    <div className={`fly-overlay${exiting ? ' is-exiting' : ''}`}>
      <svg className="fly-mark" viewBox="290 176 450 300" xmlns="http://www.w3.org/2000/svg" aria-label="Загрузка">
        <g className="fly-breathe">
          <ellipse className="fly-base" cx="515" cy="444" rx="82" ry="8" />
          {FLY_PATHS.map((d, i) => (
            <path key={i} className="fly-petal" style={{ '--i': i } as CSSProperties} d={d} />
          ))}
        </g>
      </svg>
    </div>
  )
}

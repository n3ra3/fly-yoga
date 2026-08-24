import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useLocation } from 'react-router-dom'

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

// Тайминги: первый заход — полный, «дышащий»; переходы — короткие.
const INITIAL = { show: 1150, fly: 600 }
const ROUTE = { show: 480, fly: 340 }

/**
 * Экран загрузки Fly Yoga.
 * Лотос «раскрывается на вдохе» и «улетает» вверх, открывая контент.
 * Полный вариант — при первом заходе; быстрый — при переходах между страницами
 * (прячет рывок смены страницы и прокрутки наверх).
 */
export function FlyLoader() {
  const { pathname } = useLocation()
  const isFirst = useRef(true)
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)
  const [quick, setQuick] = useState(false)
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    const first = isFirst.current
    isFirst.current = false
    const timing = first ? INITIAL : ROUTE

    setQuick(!first)
    setExiting(false)
    setVisible(true)
    setRunId((n) => n + 1) // перезапустить анимацию распускания

    const hide = window.setTimeout(() => setExiting(true), timing.show)
    const remove = window.setTimeout(() => setVisible(false), timing.show + timing.fly)
    return () => {
      window.clearTimeout(hide)
      window.clearTimeout(remove)
    }
  }, [pathname])

  if (!visible) return null

  return (
    <div key={runId} className={`fly-overlay${exiting ? ' is-exiting' : ''}${quick ? ' fly-quick' : ''}`}>
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

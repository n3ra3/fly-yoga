import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Сбрасывает прокрутку наверх при переходе на другую страницу.
 * Без этого React Router оставляет позицию с прошлой страницы —
 * новая вкладка открывается «где-то внизу».
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return null
}

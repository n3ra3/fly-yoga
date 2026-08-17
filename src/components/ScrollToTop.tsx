import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * При переходе на другую страницу прокручивает наверх.
 * Если в ссылке есть якорь (#call) — плавно прокручивает к этому блоку.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      // ждём, пока новая страница смонтируется, затем скроллим к якорю
      const id = hash.slice(1)
      const t = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 60)
      return () => clearTimeout(t)
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash])

  return null
}

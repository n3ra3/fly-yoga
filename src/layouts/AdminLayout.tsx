import { Outlet, Navigate, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Navbar } from '@/components/Navbar'

export function AdminLayout() {
  const { isAdmin, isLoading } = useAuth()
  const { t } = useTranslation()

  if (isLoading) return null
  if (!isAdmin) return <Navigate to="/" replace />

  const links = [
    { to: '/admin', label: t('admin.dashboard.nav'), end: true },
    { to: '/admin/requests', label: t('admin.requests') },
    { to: '/admin/clients', label: t('admin.clients') },
    { to: '/admin/trainers', label: t('admin.trainers') },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="container-yoga flex flex-1 gap-8 py-8">
        <aside className="hidden w-52 shrink-0 md:block">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('admin.title')}
          </p>
          <nav className="flex flex-col gap-1 text-sm">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 transition-colors ${isActive ? 'bg-accent font-medium' : 'hover:bg-muted'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

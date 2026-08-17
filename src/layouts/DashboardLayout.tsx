import { Outlet, Navigate, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarDays, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Navbar } from '@/components/Navbar'
import { FEATURES } from '@/config/features'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  ...(FEATURES.schedule
    ? [{ to: '/dashboard/bookings', labelKey: 'dashboard.bookings.title', Icon: CalendarDays }]
    : []),
  { to: '/dashboard/profile', labelKey: 'dashboard.profile.title', Icon: User },
] as const

export function DashboardLayout() {
  const { session, isLoading } = useAuth()
  const { t } = useTranslation()

  if (isLoading) return null
  if (!session) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Navbar />

      {/* Mobile tab bar */}
      <div className="sticky top-16 z-40 border-b border-border bg-background md:hidden">
        <nav className="container-yoga flex gap-1 py-1">
          {NAV_ITEMS.map(({ to, labelKey, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} className={isActive ? 'text-primary' : ''} />
                  {t(labelKey)}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="container-yoga flex flex-1 gap-8 py-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-52 shrink-0 md:block">
          <div className="sticky top-24">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('dashboard.title')}
            </p>
            <nav className="mt-3 flex flex-col gap-0.5">
              {NAV_ITEMS.map(({ to, labelKey, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors',
                      isActive
                        ? 'bg-accent font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={16} className={isActive ? 'text-primary' : ''} />
                      {t(labelKey)}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, UserRound, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { FEATURES } from '@/config/features'
import { Logo } from '@/components/Logo'
import { cn } from '@/lib/utils'

const publicLinks = [
  { to: '/schedule', key: 'nav.schedule', show: FEATURES.schedule },
  { to: '/trainers', key: 'nav.trainers', show: FEATURES.trainers },
  { to: '/services', key: 'nav.services', show: true },
  { to: '/gallery', key: 'nav.gallery', show: true },
  { to: '/hall-rental', key: 'nav.hallRental', show: FEATURES.hallRental },
  { to: '/contact', key: 'nav.contact', show: true },
].filter((l) => l.show)

export function Navbar() {
  const { t } = useTranslation()
  const { session, isAdmin, isTrainer, isLoading, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'whitespace-nowrap text-[0.95rem] font-medium transition-colors hover:text-primary',
      isActive ? 'text-primary' : 'text-foreground/80',
    )

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
      <div className="container-yoga flex h-20 items-center justify-between">
        <Logo variant="dark" showText imgClassName="h-16 w-16" />

        {/* Desktop nav */}
        <nav className="mx-6 hidden flex-1 items-center justify-center gap-5 xl:gap-6 lg:flex">
          {publicLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {t(link.key)}
            </NavLink>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-4 lg:flex">
          <LanguageSwitcher />
          {isLoading ? (
            /* пока проверяем сессию — держим место, чтобы шапка не дёргалась */
            <div className="h-9 w-[104px]" aria-hidden />
          ) : session ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="whitespace-nowrap text-[0.95rem] font-medium text-foreground/80 transition-colors hover:text-primary">
                  {t('nav.admin')}
                </Link>
              )}
              {isTrainer && (
                <Link to="/trainer" className="whitespace-nowrap text-[0.95rem] font-medium text-foreground/80 transition-colors hover:text-primary">
                  {t('nav.trainer')}
                </Link>
              )}
              <Link
                to="/dashboard"
                aria-label={t('nav.dashboard')}
                title={t('nav.dashboard')}
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted hover:text-primary"
              >
                <UserRound size={19} />
              </Link>
              <button
                onClick={handleSignOut}
                aria-label={t('nav.logout')}
                title={t('nav.logout')}
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted hover:text-destructive"
              >
                <LogOut size={19} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="whitespace-nowrap text-[0.95rem] font-medium text-foreground/80 transition-colors hover:text-primary">
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className="whitespace-nowrap rounded-full bg-primary px-5 py-2 text-[0.95rem] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="lg:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-border/50 bg-background lg:hidden">
          <nav className="container-yoga flex flex-col gap-4 py-4">
            {publicLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={linkClass}
                onClick={() => setMenuOpen(false)}
              >
                {t(link.key)}
              </NavLink>
            ))}
            <div className="mt-2 flex flex-col gap-3 border-t border-border/50 pt-4">
              <LanguageSwitcher />
              {session ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" className="text-sm" onClick={() => setMenuOpen(false)}>
                      {t('nav.admin')}
                    </Link>
                  )}
                  {isTrainer && (
                    <Link to="/trainer" className="text-sm" onClick={() => setMenuOpen(false)}>
                      {t('nav.trainer')}
                    </Link>
                  )}
                  <Link to="/dashboard" className="text-sm" onClick={() => setMenuOpen(false)}>
                    {t('nav.dashboard')}
                  </Link>
                  <button onClick={handleSignOut} className="text-left text-sm">
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm" onClick={() => setMenuOpen(false)}>
                    {t('nav.login')}
                  </Link>
                  <Link to="/register" className="text-sm" onClick={() => setMenuOpen(false)}>
                    {t('nav.register')}
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

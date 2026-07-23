import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Instagram, Facebook } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { FEATURES } from '@/config/features'

const INSTAGRAM_URL = 'https://www.instagram.com/fly_yoga_studio/'
const FACEBOOK_URL  = 'https://www.facebook.com/flyogastudio'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-border/50 bg-muted/30">
      <div className="container-yoga py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">

          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Logo variant="dark" showText imgClassName="h-12 w-12" />
            <p className="text-sm text-muted-foreground">Strada 31 August 1989, 110<br />Chișinău, Moldova</p>
            <div className="flex gap-3">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Instagram size={14} />
              </a>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Facebook size={14} />
              </a>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
            <Link to="/schedule" className="hover:text-foreground transition-colors">{t('nav.schedule')}</Link>
            {FEATURES.trainers && (
              <Link to="/trainers" className="hover:text-foreground transition-colors">{t('nav.trainers')}</Link>
            )}
            <Link to="/services" className="hover:text-foreground transition-colors">{t('nav.services')}</Link>
            <Link to="/gallery" className="hover:text-foreground transition-colors">{t('nav.gallery')}</Link>
            {FEATURES.hallRental && (
              <Link to="/hall-rental" className="hover:text-foreground transition-colors">{t('nav.hallRental')}</Link>
            )}
            <Link to="/contact" className="hover:text-foreground transition-colors">{t('nav.contact')}</Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-border/50 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {t('footer.studio')}. {t('footer.rights')}.
        </div>
      </div>
    </footer>
  )
}

import { Link } from '@tanstack/react-router'
import { MapPin } from 'lucide-react'
import { CLUB, ITINERAIRE, SAISON } from '../content/club'
import { useNavigation } from './navigation'
import { Container, FacebookIcon } from './ui'

export function Footer() {
  const navigation = useNavigation()
  return (
    <footer className="bg-ink text-white/75">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <img src="/logo-judo-condat.png" alt="" className="size-12 rounded-full" width={48} height={48} />
            <div>
              <p className="text-lg font-bold text-white">{CLUB.nomComplet}</p>
              <p className="text-sm">Judo · Jujitsu · Taïso</p>
            </div>
          </div>
          <a
            href={ITINERAIRE.openStreetMap}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-start gap-2 text-sm hover:text-white"
          >
            <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
            <span>
              {CLUB.dojo.nom}
              <br />
              {ITINERAIRE.adresse}
            </span>
          </a>
          <p className="mt-3 text-sm">{SAISON.resume}, hors vacances scolaires et jours fériés.</p>
        </div>

        <nav aria-label="Pied de page">
          <p className="mb-3 text-sm font-semibold text-white">Le site</p>
          <ul className="space-y-2 text-sm">
            {navigation.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="hover:text-white">
                  {item.libelle}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/mentions-legales" className="hover:text-white">
                Mentions légales
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className="mb-3 text-sm font-semibold text-white">Suivre le club</p>
          <a
            href={CLUB.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm hover:text-white"
          >
            <FacebookIcon className="size-4" /> Facebook
          </a>
          <a
            href="https://www.ffjudo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block"
            aria-label="Club affilié à France Judo"
          >
            <span className="mb-2 block text-xs">Club affilié à</span>
            <img src="/logo-france-judo-blanc.png" alt="France Judo" className="h-9 w-auto" width={94} height={36} />
          </a>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-1 py-5 text-xs text-white/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {CLUB.nomComplet}</p>
          <p>Version {__APP_VERSION__}</p>
        </Container>
      </div>
    </footer>
  )
}

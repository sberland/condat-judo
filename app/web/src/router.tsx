import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { Layout } from './components/Layout'
import { ClubPage } from './pages/ClubPage'
import { CompetitionPage } from './pages/CompetitionPage'
import { CompetitionsPage } from './pages/CompetitionsPage'
import { ConnexionPage } from './pages/ConnexionPage'
import { ContactPage } from './pages/ContactPage'
import { DisciplinesPage } from './pages/DisciplinesPage'
import { DonneesPersonnellesPage } from './pages/DonneesPersonnellesPage'
import { HomePage } from './pages/HomePage'
import { HorairesTarifsPage } from './pages/HorairesTarifsPage'
import { MentionsLegalesPage } from './pages/MentionsLegalesPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ReglementPage } from './pages/ReglementPage'
import { AdherentFichePage } from './pages/espace/AdherentFichePage'
import { AdherentNouveauPage } from './pages/espace/AdherentNouveauPage'
import { AdherentsPage } from './pages/espace/AdherentsPage'
import { AdhesionsPage } from './pages/espace/AdhesionsPage'
import { AidePage } from './pages/espace/AidePage'
import { CompetitionGestionPage } from './pages/espace/CompetitionGestionPage'
import { CompetitionsGestionPage } from './pages/espace/CompetitionsGestionPage'
import { ComptesPage } from './pages/espace/ComptesPage'
import { EspaceAccueilPage } from './pages/espace/EspaceAccueilPage'
import { FamillePage } from './pages/espace/FamillePage'

const rootRoute = createRootRoute({ component: Layout, notFoundComponent: NotFoundPage })
const getParentRoute = () => rootRoute

// Routes déclarées une à une : TanStack Router garde le type exact de chaque chemin,
// ce qui fait vérifier chaque <Link to="…"> par TypeScript.
const routeTree = rootRoute.addChildren([
  createRoute({ getParentRoute, path: '/', component: HomePage }),
  createRoute({ getParentRoute, path: '/disciplines', component: DisciplinesPage }),
  createRoute({ getParentRoute, path: '/horaires-tarifs', component: HorairesTarifsPage }),
  createRoute({ getParentRoute, path: '/club', component: ClubPage }),
  createRoute({ getParentRoute, path: '/reglement', component: ReglementPage }),
  createRoute({ getParentRoute, path: '/contact', component: ContactPage }),
  createRoute({ getParentRoute, path: '/mentions-legales', component: MentionsLegalesPage }),
  createRoute({ getParentRoute, path: '/donnees-personnelles', component: DonneesPersonnellesPage }),
  // Compétitions (spec 009) : informations publiques, inscription réservée aux responsables connectés.
  createRoute({ getParentRoute, path: '/competitions', component: CompetitionsPage }),
  createRoute({ getParentRoute, path: '/competitions/$id', component: CompetitionPage }),
  // Connexion par lien personnel (spec 005a) : /connexion#<jeton>.
  createRoute({ getParentRoute, path: '/connexion', component: ConnexionPage }),
  // Espace connecté (spec 004) — les droits sont vérifiés par l'API, les pages ne font que masquer.
  createRoute({ getParentRoute, path: '/espace', component: EspaceAccueilPage }),
  createRoute({ getParentRoute, path: '/espace/famille', component: FamillePage }),
  createRoute({ getParentRoute, path: '/espace/adherents', component: AdherentsPage }),
  createRoute({ getParentRoute, path: '/espace/adherents/nouveau', component: AdherentNouveauPage }),
  createRoute({ getParentRoute, path: '/espace/adherents/$id', component: AdherentFichePage }),
  createRoute({ getParentRoute, path: '/espace/comptes', component: ComptesPage }),
  createRoute({ getParentRoute, path: '/espace/adhesions', component: AdhesionsPage }),
  createRoute({ getParentRoute, path: '/espace/competitions', component: CompetitionsGestionPage }),
  createRoute({ getParentRoute, path: '/espace/competitions/$id', component: CompetitionGestionPage }),
  createRoute({ getParentRoute, path: '/espace/aide', component: AidePage }),
])

// scrollRestoration : haut de page à chaque navigation, position conservée au retour arrière.
export const router = createRouter({ routeTree, scrollRestoration: true })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

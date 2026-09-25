import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
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
import { InscriptionsPage } from './pages/espace/InscriptionsPage'
import { DossierFamillePage } from './pages/espace/DossierFamillePage'
import { TresorerieFamillePage } from './pages/espace/TresorerieFamillePage'
import { TresoreriePage } from './pages/espace/TresoreriePage'
import { RgpdPage } from './pages/espace/RgpdPage'
import { GarderieBureauPage } from './pages/espace/GarderieBureauPage'
import { GarderieJourPage } from './pages/espace/GarderieJourPage'
import { ContenuPage } from './pages/espace/ContenuPage'
import { ActualitePage, ActualitesPage } from './pages/ActualitesPage'
import { ActualiteGestionPage, ActualitesGestionPage } from './pages/espace/ActualitesGestionPage'
import { ContenusPage } from './pages/espace/ContenusPage'
import { GarderiePage } from './pages/espace/GarderiePage'
import { SaisonPage } from './pages/espace/SaisonPage'
import { SaisonsPage } from './pages/espace/SaisonsPage'

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
  // Événements (specs 009, 021) : informations publiques, inscription réservée aux comptes connectés.
  createRoute({ getParentRoute, path: '/evenements', component: CompetitionsPage }),
  createRoute({ getParentRoute, path: '/evenements/$id', component: CompetitionPage }),
  // Anciennes adresses (liens déjà partagés sur WhatsApp) → événements.
  createRoute({
    getParentRoute,
    path: '/competitions',
    beforeLoad: () => {
      throw redirect({ to: '/evenements' })
    },
  }),
  createRoute({
    getParentRoute,
    path: '/competitions/$id',
    beforeLoad: ({ params }) => {
      throw redirect({ to: '/evenements/$id', params })
    },
  }),
  // Actualités (spec 013) : publiques, ou réservées aux familles connectées.
  createRoute({ getParentRoute, path: '/actualites', component: ActualitesPage }),
  createRoute({ getParentRoute, path: '/actualites/$id', component: ActualitePage }),
  // Connexion par lien personnel (spec 005a) : /connexion#<jeton>.
  createRoute({ getParentRoute, path: '/connexion', component: ConnexionPage }),
  // Espace connecté (spec 004) — les droits sont vérifiés par l'API, les pages ne font que masquer.
  createRoute({ getParentRoute, path: '/espace', component: EspaceAccueilPage }),
  createRoute({ getParentRoute, path: '/espace/famille', component: FamillePage }),
  // Dossier d'adhésion rempli en ligne par les familles (spec 010b).
  createRoute({ getParentRoute, path: '/espace/inscriptions', component: InscriptionsPage }),
  createRoute({ getParentRoute, path: '/espace/inscriptions/$id', component: DossierFamillePage }),
  createRoute({ getParentRoute, path: '/espace/adherents', component: AdherentsPage }),
  createRoute({ getParentRoute, path: '/espace/adherents/nouveau', component: AdherentNouveauPage }),
  createRoute({ getParentRoute, path: '/espace/adherents/$id', component: AdherentFichePage }),
  createRoute({ getParentRoute, path: '/espace/comptes', component: ComptesPage }),
  createRoute({ getParentRoute, path: '/espace/adhesions', component: AdhesionsPage }),
  createRoute({ getParentRoute, path: '/espace/evenements', component: CompetitionsGestionPage }),
  createRoute({ getParentRoute, path: '/espace/evenements/$id', component: CompetitionGestionPage }),
  // Trésorerie (spec 011) : trésorier et administrateur.
  createRoute({ getParentRoute, path: '/espace/tresorerie', component: TresoreriePage }),
  createRoute({ getParentRoute, path: '/espace/tresorerie/familles/$id', component: TresorerieFamillePage }),
  // Garderie du mercredi (spec 012a) : familles, puis suivi du bureau.
  createRoute({ getParentRoute, path: '/espace/mercredis', component: GarderiePage }),
  createRoute({ getParentRoute, path: '/espace/garderie', component: GarderieBureauPage }),
  // Liste du jour de l'encadrant (spec 012b) : encadrant, bureau, administrateur.
  createRoute({ getParentRoute, path: '/espace/garderie-du-jour', component: GarderieJourPage }),
  // Saisons et référentiels (spec 003) : bureau.
  createRoute({ getParentRoute, path: '/espace/saisons', component: SaisonsPage }),
  createRoute({ getParentRoute, path: '/espace/saisons/$id', component: SaisonPage }),
  // Actualités (spec 013) : bureau, gestion du site, admin.
  createRoute({ getParentRoute, path: '/espace/actualites', component: ActualitesGestionPage }),
  createRoute({ getParentRoute, path: '/espace/actualites/$id', component: ActualiteGestionPage }),
  // Contenu du site (spec 014) : rôles contenu et admin.
  createRoute({ getParentRoute, path: '/espace/contenu', component: ContenusPage }),
  createRoute({ getParentRoute, path: '/espace/contenu/$cle', component: ContenuPage }),
  // Données personnelles (spec 019) : administrateur.
  createRoute({ getParentRoute, path: '/espace/rgpd', component: RgpdPage }),
  createRoute({ getParentRoute, path: '/espace/aide', component: AidePage }),
])

// scrollRestoration : haut de page à chaque navigation, position conservée au retour arrière.
export const router = createRouter({ routeTree, scrollRestoration: true })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

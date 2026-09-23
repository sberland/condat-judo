import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { Layout } from './components/Layout'
import { ClubPage } from './pages/ClubPage'
import { ContactPage } from './pages/ContactPage'
import { DisciplinesPage } from './pages/DisciplinesPage'
import { HomePage } from './pages/HomePage'
import { MentionsLegalesPage } from './pages/MentionsLegalesPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ReglementPage } from './pages/ReglementPage'

const rootRoute = createRootRoute({ component: Layout, notFoundComponent: NotFoundPage })
const getParentRoute = () => rootRoute

// Routes déclarées une à une : TanStack Router garde le type exact de chaque chemin,
// ce qui fait vérifier chaque <Link to="…"> par TypeScript.
const routeTree = rootRoute.addChildren([
  createRoute({ getParentRoute, path: '/', component: HomePage }),
  createRoute({ getParentRoute, path: '/disciplines', component: DisciplinesPage }),
  createRoute({ getParentRoute, path: '/club', component: ClubPage }),
  createRoute({ getParentRoute, path: '/reglement', component: ReglementPage }),
  createRoute({ getParentRoute, path: '/contact', component: ContactPage }),
  createRoute({ getParentRoute, path: '/mentions-legales', component: MentionsLegalesPage }),
])

// scrollRestoration : haut de page à chaque navigation, position conservée au retour arrière.
export const router = createRouter({ routeTree, scrollRestoration: true })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

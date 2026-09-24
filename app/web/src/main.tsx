import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@fontsource-variable/inter' // police auto-hébergée (aucune requête vers un site tiers)
import { router } from './router'
import { lireCache, requeteContenu } from './lib/contenu'
import './index.css'

const queryClient = new QueryClient()

// Première visite : le contenu du site (spec 014) est attendu un court instant, pour ne pas
// afficher l'ancien contenu du code puis le remplacer. Ensuite, le cache du navigateur suffit.
async function demarrer() {
  if (!lireCache()) await Promise.race([queryClient.prefetchQuery(requeteContenu), new Promise((ok) => setTimeout(ok, 1500))])
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}

void demarrer()

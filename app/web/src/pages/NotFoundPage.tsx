import { ArrowRight } from 'lucide-react'
import { BoutonLien, Container } from '../components/ui'
import { usePageMeta } from '../lib/usePageMeta'

export function NotFoundPage() {
  usePageMeta('Page introuvable', 'Cette page n’existe pas.')

  return (
    <Container className="flex flex-col items-center py-24 text-center">
      <p className="text-7xl font-black text-brand">404</p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Cette page n’existe pas</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Elle a peut-être été déplacée depuis l’ancien site du club.
      </p>
      <div className="mt-8">
        <BoutonLien to="/">
          Retour à l’accueil <ArrowRight className="size-4" />
        </BoutonLien>
      </div>
    </Container>
  )
}

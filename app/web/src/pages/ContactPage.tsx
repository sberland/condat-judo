import { IdCard, MapPin, Navigation } from 'lucide-react'
import { CLUB, ITINERAIRE, SAISON } from '../content/club'
import { BoutonExterne, Card, Container, FacebookIcon, PageHeader } from '../components/ui'
import { usePageMeta } from '../lib/usePageMeta'

export function ContactPage() {
  usePageMeta(
    'Contact',
    'Contacter le club Judo Condat-sur-Vienne : dojo 9 rue Jules Ferry à Condat-sur-Vienne, page Facebook, prise de licence.',
  )

  return (
    <div className="animate-apparition">
      <PageHeader surtitre="Contact" titre="Joindre le club">
        Le plus simple pour poser une question : la page Facebook du club, ou directement au dojo
        aux heures de cours.
      </PageHeader>

      <Container className="grid gap-4 py-12 sm:py-16 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <span className="flex size-12 items-center justify-center rounded-full bg-[#1877f2] text-white">
            <FacebookIcon />
          </span>
          <h2 className="mt-5 text-xl font-bold">Sur Facebook</h2>
          <p className="mt-2 flex-1 text-muted-foreground">
            Actualités, compétitions et messages : la page du club est le meilleur moyen de nous écrire.
          </p>
          <div className="mt-6">
            <BoutonExterne href={CLUB.facebook}>Écrire au club</BoutonExterne>
          </div>
        </Card>

        <Card className="flex flex-col">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand text-white">
            <MapPin className="size-5" aria-hidden />
          </span>
          <h2 className="mt-5 text-xl font-bold">Au dojo</h2>
          <p className="mt-2 flex-1 text-muted-foreground">
            {CLUB.dojo.nom}
            <br />
            {ITINERAIRE.adresse}
            <br />
            <span className="text-sm">{SAISON.resume}, hors vacances scolaires et jours fériés.</span>
          </p>
          <div className="mt-6">
            <BoutonExterne href={ITINERAIRE.googleMaps}>
              <Navigation className="size-4" aria-hidden /> Itinéraire
            </BoutonExterne>
          </div>
        </Card>

        <Card className="flex flex-col md:col-span-2 lg:col-span-1">
          <span className="flex size-12 items-center justify-center rounded-full bg-ink text-white">
            <IdCard className="size-5" aria-hidden />
          </span>
          <h2 className="mt-5 text-xl font-bold">La licence</h2>
          <p className="mt-2 flex-1 text-muted-foreground">
            La licence France Judo est obligatoire pour pratiquer. Elle se prend en ligne, sur
            l’espace licencié de la fédération.
          </p>
          <div className="mt-6">
            <BoutonExterne href="https://moncompte.ffjudo.com/prise-licence" variante="contour">
              Prendre sa licence
            </BoutonExterne>
          </div>
        </Card>
      </Container>
    </div>
  )
}

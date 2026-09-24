import { IdCard, Mail, MapPin, Navigation, Phone } from 'lucide-react'
import { itineraire, type Contact } from '../content/contenu'
import { Provisoire } from '../components/Provisoire'
import { useContenu } from '../lib/contenu'
import { BoutonExterne, Card, Container, FacebookIcon, PageHeader } from '../components/ui'
import { usePageMeta } from '../lib/usePageMeta'

export function ContactPage() {
  usePageMeta(
    'Contact',
    'Contacter le club Judo Condat-sur-Vienne : dojo 9 rue Jules Ferry à Condat-sur-Vienne, page Facebook, prise de licence.',
  )
  const c = useContenu()
  const iti = itineraire(c.club)

  return (
    <div className="animate-apparition">
      <PageHeader surtitre="Contact" titre="Joindre le club">
        Le plus simple pour poser une question : la page Facebook du club, ou directement au dojo
        aux heures de cours.
      </PageHeader>

      <Container className="grid gap-4 py-12 sm:py-16 md:grid-cols-2 lg:grid-cols-3">
        {c.statuts.contact === 'a_completer' ? (
          <Provisoire className="md:col-span-2 lg:col-span-3">
            <CarteCoordonnees contact={c.contact} />
          </Provisoire>
        ) : (
          <div className="md:col-span-2 lg:col-span-3">
            <CarteCoordonnees contact={c.contact} />
          </div>
        )}

        <Card className="flex flex-col">
          <span className="flex size-12 items-center justify-center rounded-full bg-[#1877f2] text-white">
            <FacebookIcon />
          </span>
          <h2 className="mt-5 text-xl font-bold">Sur Facebook</h2>
          <p className="mt-2 flex-1 text-muted-foreground">
            Actualités, compétitions et messages : la page du club est le meilleur moyen de nous écrire.
          </p>
          <div className="mt-6">
            <BoutonExterne href={c.club.facebook}>Écrire au club</BoutonExterne>
          </div>
        </Card>

        <Card className="flex flex-col">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand text-white">
            <MapPin className="size-5" aria-hidden />
          </span>
          <h2 className="mt-5 text-xl font-bold">Au dojo</h2>
          <p className="mt-2 flex-1 text-muted-foreground">
            {c.club.nomDojo}
            <br />
            {iti.adresse}
            <br />
            <span className="text-sm">{c.club.saisonResume}, hors vacances scolaires et jours fériés.</span>
          </p>
          <div className="mt-6">
            <BoutonExterne href={iti.googleMaps}>
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

function CarteCoordonnees({ contact }: { contact: Contact }) {
  return (
    <Card className="grid gap-4 sm:grid-cols-2">
      <a href={`mailto:${contact.email}`} className="flex items-center gap-4 rounded-xl p-2 hover:bg-surface">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Mail className="size-5" aria-hidden />
        </span>
        <span>
          <span className="block text-sm text-muted-foreground">E-mail</span>
          <span className="block font-semibold break-all">{contact.email}</span>
        </span>
      </a>
      <a href={`tel:${contact.telephone.replace(/\s/g, '')}`} className="flex items-center gap-4 rounded-xl p-2 hover:bg-surface">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Phone className="size-5" aria-hidden />
        </span>
        <span>
          <span className="block text-sm text-muted-foreground">Téléphone</span>
          <span className="block font-semibold">{contact.telephone}</span>
        </span>
      </a>
    </Card>
  )
}

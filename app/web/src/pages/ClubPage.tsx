import { ArrowUpRight, HandHeart, HeartHandshake, MapPin, Navigation, Smile, UsersRound } from 'lucide-react'
import { CLUB } from '../content/club'
import { itineraire } from '../content/contenu'
import { Provisoire, SelonStatut, useProvisoireVisible } from '../components/Provisoire'
import { useAffichable, useContenu } from '../lib/contenu'
import { BoutonExterne, Card, Container, PageHeader, Section, SectionTitle } from '../components/ui'
import { usePageMeta } from '../lib/usePageMeta'

// Icônes des valeurs de l'esprit du club, dans l'ordre (convivial, familial, ouvert à tous, bénévole).
const ICONES_ESPRIT = [Smile, UsersRound, HeartHandshake, HandHeart]

const initiales = (nom: string) =>
  nom
    .split(' ')
    .map((m) => m[0])
    .join('')

export function ClubPage() {
  usePageMeta(
    'Le club',
    'Le club Judo Condat-sur-Vienne : un club convivial, familial et ouvert à tous — équipe, dojo, partenaires et liens utiles.',
  )

  const c = useContenu()
  const affichable = useAffichable()
  const iti = itineraire(c.club)
  const personnes = [c.equipe.professeur, ...c.equipe.bureau]
  const provisoireVisible = useProvisoireVisible()
  const partenaires = affichable(c.statuts.partenaires) ? c.partenaires.partenaires.filter((p) => !p.provisoire || provisoireVisible) : []

  return (
    <div className="animate-apparition">
      <PageHeader surtitre="Le club" titre={CLUB.nomComplet}>
        Une association affiliée à France Judo, au dojo de Condat-sur-Vienne.
      </PageHeader>

      {affichable(c.statuts.equipe) && (
        <Section id="equipe">
          <SelonStatut statut={c.statuts.equipe}>
            <SectionTitle surtitre="L’équipe" titre="Qui fait vivre le club">
              Les cours sont assurés par le professeur du club ; le bureau fait vivre l’association.
            </SectionTitle>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {personnes.map((p, i) => (
                <li key={i}>
                  <Card className="flex items-center gap-4">
                    <span
                      className={`flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                        i === 0 ? 'bg-brand text-white' : 'bg-ink text-white'
                      }`}
                      aria-hidden
                    >
                      {initiales(p.nom)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-brand">{p.role}</p>
                      <p className="text-lg font-bold">{p.nom}</p>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </SelonStatut>
        </Section>
      )}

      <section id="dojo" className="bg-surface py-14 sm:py-20">
        <Container className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <SectionTitle surtitre="Le dojo" titre="Où se trouve le club" />
            <p className="flex items-start gap-3 text-lg">
              <MapPin className="mt-1 size-5 shrink-0 text-brand" aria-hidden />
              <span>
                <strong>{c.club.nomDojo}</strong>
                <br />
                {iti.adresse}
              </span>
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <BoutonExterne href={iti.googleMaps}>
                <Navigation className="size-4" aria-hidden /> Itinéraire Google Maps
              </BoutonExterne>
              <BoutonExterne href={iti.openStreetMap} variante="contour">
                OpenStreetMap
              </BoutonExterne>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-ink p-8 text-white sm:p-10">
            <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-brand/30 blur-2xl" />
            <p className="relative text-sm font-semibold tracking-wider text-brand uppercase">Saison sportive</p>
            <p className="relative mt-3 text-2xl font-bold">{c.club.saisonResume}</p>
            <p className="relative mt-2 text-white/75">Pas de cours pendant les vacances scolaires et les jours fériés.</p>
          </div>
        </Container>
      </section>

      {affichable(c.statuts.esprit) && (
        <Section id="esprit">
          <SelonStatut statut={c.statuts.esprit}>
            <SectionTitle surtitre="L’esprit du club" titre={c.esprit.titre}>
              {c.esprit.intro}
            </SectionTitle>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {c.esprit.valeurs.map((v, i) => {
                const Icone = ICONES_ESPRIT[i % ICONES_ESPRIT.length] ?? Smile
                return (
                  <li key={i}>
                    <Card className="h-full">
                      <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
                        <Icone className="size-6" aria-hidden />
                      </span>
                      <h3 className="mt-4 text-xl font-bold">{v.nom}</h3>
                      <p className="mt-2 text-muted-foreground">{v.texte}</p>
                    </Card>
                  </li>
                )
              })}
            </ul>
          </SelonStatut>
        </Section>
      )}

      <section id="partenaires" className="bg-surface py-14 sm:py-20">
        <Container className={`grid gap-10 ${partenaires.length > 0 && affichable(c.statuts.liens) ? 'lg:grid-cols-2' : ''}`}>
          {partenaires.length > 0 && (
            <SelonStatut statut={c.statuts.partenaires}>
              <div>
                <SectionTitle surtitre="Partenaires" titre="Ils soutiennent le club" />
                <ul className="space-y-6">
                  {partenaires.map((p) => {
                    const carte = (
                      <Card>
                        <p className="text-xl font-bold">{p.nom}</p>
                        <p className="mt-1 text-muted-foreground">{p.activite}</p>
                        <p className="mt-3 flex items-center gap-2 text-sm">
                          <MapPin className="size-4 shrink-0 text-brand" aria-hidden /> {p.adresse}
                        </p>
                      </Card>
                    )
                    return <li key={p.nom}>{p.provisoire ? <Provisoire>{carte}</Provisoire> : carte}</li>
                  })}
                </ul>
              </div>
            </SelonStatut>
          )}
          {affichable(c.statuts.liens) && (
            <SelonStatut statut={c.statuts.liens}>
              <div>
                <SectionTitle surtitre="Liens utiles" titre="Pour aller plus loin" />
                <ul className="divide-y rounded-2xl border bg-white">
                  {c.liens.liens.map((l) => (
                    <li key={l.url}>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface"
                      >
                        <span>
                          <span className="block font-semibold group-hover:text-brand">{l.libelle}</span>
                          <span className="block text-sm text-muted-foreground">{l.description}</span>
                        </span>
                        <ArrowUpRight className="size-5 shrink-0 text-muted-foreground group-hover:text-brand" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </SelonStatut>
          )}
        </Container>
      </section>
    </div>
  )
}

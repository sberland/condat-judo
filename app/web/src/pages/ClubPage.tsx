import { ArrowUpRight, MapPin, Navigation } from 'lucide-react'
import { CLUB, CODE_MORAL, EQUIPE, ITINERAIRE, LIENS_UTILES, PARTENAIRES } from '../content/club'
import { Provisoire, useProvisoireVisible } from '../components/Provisoire'
import { BoutonExterne, Card, Container, PageHeader, Section, SectionTitle } from '../components/ui'
import { usePageMeta } from '../lib/usePageMeta'

const initiales = (nom: string) =>
  nom
    .split(' ')
    .map((m) => m[0])
    .join('')

export function ClubPage() {
  usePageMeta(
    'Le club',
    'Le club Judo Condat-sur-Vienne : professeur, bureau, dojo, code moral du judo, partenaires et liens utiles.',
  )

  const personnes = [EQUIPE.professeur, ...EQUIPE.bureau]
  const provisoireVisible = useProvisoireVisible()
  const partenaires = PARTENAIRES.filter((p) => !p.provisoire || provisoireVisible)

  return (
    <div className="animate-apparition">
      <PageHeader surtitre="Le club" titre={CLUB.nomComplet}>
        Une association affiliée à France Judo, au dojo de Condat-sur-Vienne.
      </PageHeader>

      <Section id="equipe">
        <SectionTitle surtitre="L’équipe" titre="Qui fait vivre le club">
          Les cours sont assurés par le professeur du club ; le bureau fait vivre l’association.
        </SectionTitle>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {personnes.map((p) => (
            <li key={p.role}>
              <Card className="flex items-center gap-4">
                <span
                  className={`flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                    p.role === 'Professeur' ? 'bg-brand text-white' : 'bg-ink text-white'
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
      </Section>

      <section id="dojo" className="bg-surface py-14 sm:py-20">
        <Container className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <SectionTitle surtitre="Le dojo" titre="Où se trouve le club" />
            <p className="flex items-start gap-3 text-lg">
              <MapPin className="mt-1 size-5 shrink-0 text-brand" aria-hidden />
              <span>
                <strong>{CLUB.dojo.nom}</strong>
                <br />
                {ITINERAIRE.adresse}
              </span>
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <BoutonExterne href={ITINERAIRE.googleMaps}>
                <Navigation className="size-4" aria-hidden /> Itinéraire Google Maps
              </BoutonExterne>
              <BoutonExterne href={ITINERAIRE.openStreetMap} variante="contour">
                OpenStreetMap
              </BoutonExterne>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-ink p-8 text-white sm:p-10">
            <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-brand/30 blur-2xl" />
            <p className="relative text-sm font-semibold tracking-wider text-brand uppercase">Saison sportive</p>
            <p className="relative mt-3 text-2xl font-bold">De septembre à juin</p>
            <p className="relative mt-2 text-white/75">Pas de cours pendant les vacances scolaires et les jours fériés.</p>
          </div>
        </Container>
      </section>

      <Section id="code-moral">
        <SectionTitle surtitre="Le code moral du judo" titre="Les 8 valeurs du judoka">
          Le code moral est un élément essentiel de la pratique du judo : il aide chacun à grandir,
          sur le tatami comme dans la vie.
        </SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CODE_MORAL.map((v, i) => (
            <Card key={v.nom} className="relative">
              <span className="absolute top-5 right-5 text-3xl font-black text-brand/15" aria-hidden>
                {i + 1}
              </span>
              <h3 className="text-xl font-bold">{v.nom}</h3>
              <p className="mt-1 font-semibold text-brand">{v.definition}</p>
              {v.lignes.map((l) => (
                <p key={l} className="mt-2 text-sm text-muted-foreground">
                  {l}
                </p>
              ))}
            </Card>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Source :{' '}
          <a
            href="https://www.ffjudo.com/le-code-moral-du-judo"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-brand"
          >
            France Judo — le code moral du judo
          </a>
        </p>
      </Section>

      <section id="partenaires" className="bg-surface py-14 sm:py-20">
        <Container className={`grid gap-10 ${partenaires.length > 0 ? 'lg:grid-cols-2' : ''}`}>
          {partenaires.length > 0 && (
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
          )}
          <div>
            <SectionTitle surtitre="Liens utiles" titre="Pour aller plus loin" />
            <ul className="divide-y rounded-2xl border bg-white">
              {LIENS_UTILES.map((l) => (
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
        </Container>
      </section>
    </div>
  )
}

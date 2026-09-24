import type { ReactNode } from 'react'
import { ArrowRight, BadgeEuro, BadgeMinus, BadgePlus, Clock, CreditCard } from 'lucide-react'
import { coursTries, heure } from '../content/referentiel'
import type { Formule } from '../content/tarifs'
import { disciplineDe, IllustrationDiscipline } from '../components/IllustrationDiscipline'
import { Provisoire, useProvisoireVisible } from '../components/Provisoire'
import { BoutonLien, Card, Container, PageHeader } from '../components/ui'
import { useContenu } from '../lib/contenu'
import { useSaisonCourante } from '../lib/saison'
import { euros, totalFormule } from '../lib/tarifs'
import { usePageMeta } from '../lib/usePageMeta'

export function HorairesTarifsPage() {
  const provisoireVisible = useProvisoireVisible()
  // Horaires et grille : référentiel de la saison courante (spec 003).
  const { data: saison, isError } = useSaisonCourante()
  const periode = useContenu().club.saisonResume
  const r = saison?.referentiel
  const horairesVisibles = !!r && (!r.horaires.provisoire || provisoireVisible)
  const tarifsVisibles = !!r && (!r.tarifs.provisoire || provisoireVisible)
  const titre = !r || horairesVisibles ? 'Horaires et tarifs' : 'Tarifs'

  usePageMeta(titre, `Tarifs de la saison ${saison?.libelle ?? ''} du club Judo Condat-sur-Vienne : judo, taïso et yoga, licence comprise, paiement en 3 fois.`)

  return (
    <div className="animate-apparition">
      <PageHeader surtitre={saison ? `Saison ${saison.libelle}` : 'Saison'} titre={titre}>
        {periode}, hors vacances scolaires et jours fériés. Licence France Judo comprise.
      </PageHeader>

      <Container className="space-y-14 py-12 sm:py-16">
        {!r && !isError && <p className="text-muted-foreground">Chargement…</p>}
        {(isError || (r && !horairesVisibles && !tarifsVisibles)) && (
          <Card className="text-center">
            <p className="text-lg font-bold">Horaires et tarifs bientôt en ligne</p>
            <p className="mt-2 text-muted-foreground">En attendant, le club répond à vos questions.</p>
            <div className="mt-6">
              <BoutonLien to="/contact">
                Nous contacter <ArrowRight className="size-4" />
              </BoutonLien>
            </div>
          </Card>
        )}

        {r && horairesVisibles && (
          <BlocProvisoire provisoire={r.horaires.provisoire}>
            <section aria-labelledby="titre-horaires">
              <TitreBloc id="titre-horaires" icone={<Clock className="size-6 text-brand" aria-hidden />}>
                Horaires des cours
              </TitreBloc>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {coursTries(r.horaires.cours).map((c) => (
                  <li key={`${c.jour}-${c.debut}-${c.cours}`} className="relative rounded-2xl border bg-white p-5 shadow-sm">
                    <IllustrationDiscipline id={disciplineDe(c.cours) ?? ''} className="absolute top-4 right-4 size-12" />
                    <p className="text-sm font-semibold text-brand capitalize">{c.jour}</p>
                    <p className="mt-1 text-xl font-bold">
                      {heure(c.debut)} – {heure(c.fin)}
                    </p>
                    <p className="mt-2 pr-14 font-semibold">{c.cours}</p>
                    <p className="text-sm text-muted-foreground">{c.public}</p>
                  </li>
                ))}
              </ul>
            </section>
          </BlocProvisoire>
        )}

        {r && tarifsVisibles && (
          <BlocProvisoire provisoire={r.tarifs.provisoire}>
            <div className="space-y-12">
              {r.tarifs.groupes.map((g) => (
                <section key={g.titre} aria-labelledby={`tarifs-${g.titre}`}>
                  <TitreBloc id={`tarifs-${g.titre}`} icone={<BadgeEuro className="size-6 text-brand" aria-hidden />}>
                    {g.titre}
                  </TitreBloc>
                  <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {g.formules.map((f) => (
                      <li key={f.id}>
                        <CarteFormule formule={f} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    <BadgePlus className="size-5 text-brand" aria-hidden /> Suppléments et réductions
                  </h2>
                  <ul className="mt-4 divide-y">
                    <LigneAjustement libelle="Passeport sportif" precision={r.tarifs.passeport.precision} montant={`+ ${euros(r.tarifs.passeport.montant)}`} />
                    <LigneAjustement
                      libelle="Résident hors commune"
                      precision={r.tarifs.horsCommune.precision}
                      montant={`+ ${euros(r.tarifs.horsCommune.montant)}`}
                    />
                    <LigneAjustement
                      libelle="Réduction famille"
                      precision={r.tarifs.reductionFamille.precision}
                      montant={`− ${euros(r.tarifs.reductionFamille.montant)}`}
                      reduction
                    />
                  </ul>
                </Card>
                <Card>
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    <CreditCard className="size-5 text-brand" aria-hidden /> Paiement
                  </h2>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {r.tarifs.modesPaiement.map((m) => (
                      <li key={m} className="rounded-full bg-surface px-3 py-1.5 text-sm font-medium">
                        {m}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-muted-foreground">
                    Paiement possible en <strong className="text-foreground">3 fois</strong> : le premier versement
                    comprend la licence, les deux suivants le reste de l’activité (détail sur chaque formule).
                  </p>
                </Card>
              </div>
            </div>
          </BlocProvisoire>
        )}
      </Container>
    </div>
  )
}

function CarteFormule({ formule: f }: { formule: Formule }) {
  const [premier, deuxieme, troisieme] = f.echeancier
  return (
    <Card className="relative flex h-full flex-col">
      <IllustrationDiscipline id={disciplineDe(`${f.id} ${f.nom}`) ?? ''} className="absolute top-4 right-4 size-12" />
      <p className="pr-14 text-lg font-bold">{f.nom}</p>
      <p className="text-sm text-muted-foreground">{f.public}</p>
      <p className="mt-4 text-4xl font-extrabold tracking-tight">{euros(totalFormule(f))}</p>
      <p className="text-sm text-muted-foreground">par saison, licence comprise</p>
      <dl className="mt-4 space-y-1 border-t pt-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Participation à l’activité</dt>
          <dd className="font-medium">{euros(f.participation)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Licence France Judo</dt>
          <dd className="font-medium">{euros(f.licence)}</dd>
        </div>
      </dl>
      <p className="mt-auto pt-4 text-sm">
        <span className="font-semibold text-brand">En 3 fois :</span> {euros(premier)} + {euros(deuxieme)} +{' '}
        {euros(troisieme)}
      </p>
    </Card>
  )
}

function LigneAjustement({
  libelle,
  precision,
  montant,
  reduction = false,
}: {
  libelle: string
  precision: string
  montant: string
  reduction?: boolean
}) {
  return (
    <li className="flex items-start justify-between gap-4 py-3">
      <span>
        <span className="flex items-center gap-2 font-semibold">
          {reduction && <BadgeMinus className="size-4 text-brand" aria-hidden />}
          {libelle}
        </span>
        <span className="block text-sm text-muted-foreground">{precision}</span>
      </span>
      <span className={`shrink-0 font-bold whitespace-nowrap ${reduction ? 'text-brand' : ''}`}>{montant}</span>
    </li>
  )
}

function TitreBloc({ id, icone, children }: { id: string; icone: ReactNode; children: ReactNode }) {
  return (
    <h2 id={id} className="flex items-center gap-2 text-2xl font-bold tracking-tight">
      {icone} {children}
    </h2>
  )
}

function BlocProvisoire({ provisoire, children }: { provisoire: boolean; children: ReactNode }) {
  return provisoire ? <Provisoire className="p-1">{children}</Provisoire> : <>{children}</>
}

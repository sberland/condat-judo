import { ArrowRight, Clock, Euro } from 'lucide-react'
import { HORAIRES, SAISON, TARIFS } from '../content/club'
import { Provisoire, useProvisoireVisible } from '../components/Provisoire'
import { BoutonLien, Card, Container, PageHeader } from '../components/ui'
import { usePageMeta } from '../lib/usePageMeta'

export function HorairesTarifsPage() {
  usePageMeta('Horaires et tarifs', 'Horaires des cours et tarifs des cotisations du club Judo Condat-sur-Vienne.')
  const provisoireVisible = useProvisoireVisible()
  const horairesVisibles = !HORAIRES.provisoire || provisoireVisible
  const tarifsVisibles = !TARIFS.provisoire || provisoireVisible

  return (
    <div className="animate-apparition">
      <PageHeader surtitre="Infos pratiques" titre="Horaires et tarifs">
        {SAISON.resume}, hors vacances scolaires et jours fériés.
      </PageHeader>

      <Container className="space-y-12 py-12 sm:py-16">
        {!horairesVisibles && !tarifsVisibles && (
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

        {horairesVisibles && (
          <BlocProvisoire provisoire={HORAIRES.provisoire}>
            <section aria-labelledby="titre-horaires">
              <h2 id="titre-horaires" className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                <Clock className="size-6 text-brand" aria-hidden /> Horaires des cours
              </h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {HORAIRES.creneaux.map((c) => (
                  <li key={`${c.jour}-${c.horaire}`} className="rounded-2xl border bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-brand">{c.jour}</p>
                    <p className="mt-1 text-xl font-bold">{c.horaire}</p>
                    <p className="mt-2 font-semibold">{c.cours}</p>
                    <p className="text-sm text-muted-foreground">{c.public}</p>
                  </li>
                ))}
              </ul>
            </section>
          </BlocProvisoire>
        )}

        {tarifsVisibles && (
          <BlocProvisoire provisoire={TARIFS.provisoire}>
            <section aria-labelledby="titre-tarifs">
              <h2 id="titre-tarifs" className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                <Euro className="size-6 text-brand" aria-hidden /> Tarifs de la saison
              </h2>
              <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
                <table className="w-full text-left">
                  <tbody className="divide-y">
                    {TARIFS.lignes.map((t) => (
                      <tr key={t.formule}>
                        <th scope="row" className="px-5 py-4 font-medium">
                          {t.formule}
                        </th>
                        <td className="px-5 py-4 text-right text-lg font-bold whitespace-nowrap">{t.prix}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                {TARIFS.notes.map((n) => (
                  <li key={n}>• {n}</li>
                ))}
              </ul>
            </section>
          </BlocProvisoire>
        )}
      </Container>
    </div>
  )
}

function BlocProvisoire({ provisoire, children }: { provisoire: boolean; children: React.ReactNode }) {
  return provisoire ? <Provisoire className="p-1">{children}</Provisoire> : <>{children}</>
}

import { ChevronDown } from 'lucide-react'
import { IconeArticle } from '../components/IconeArticle'
import { SelonStatut } from '../components/Provisoire'
import { Container, PageHeader } from '../components/ui'
import { useAffichable, useContenu } from '../lib/contenu'
import { usePageMeta } from '../lib/usePageMeta'

export function ReglementPage() {
  usePageMeta(
    'Règlement intérieur',
    'Règlement intérieur du club Judo Condat-sur-Vienne : licence, formalités médicales (questionnaire de santé ou certificat), responsabilité des parents, tenue, hygiène, compétitions.',
  )
  const c = useContenu()
  const reglement = c.reglement
  const affichable = useAffichable()

  return (
    <div className="animate-apparition">
      <PageHeader surtitre="Règlement" titre="Règlement intérieur">
        Les règles du dojo, pour que chacun pratique en sécurité et dans de bonnes conditions.
      </PageHeader>

      <Container className="max-w-3xl py-12 sm:py-16">
        {!affichable(c.statuts.reglement) ? (
          <p className="text-muted-foreground">Le règlement est en cours de mise à jour : demandez-le au bureau du club.</p>
        ) : (
          <SelonStatut statut={c.statuts.reglement}>
            <div className="space-y-3">
              {reglement.articles.map((article, i) => (
                <details
                  key={i}
                  className="group rounded-2xl border bg-white shadow-sm open:shadow-md"
                  open={i === 0}
                >
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-lg font-bold [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                        <IconeArticle article={article} />
                      </span>
                      {article.titre}
                    </span>
                    <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="space-y-3 px-5 pb-5 text-muted-foreground sm:pl-16">
                    {article.paragraphes?.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                    {article.liste && (
                      <ul className="list-disc space-y-1 pl-5 marker:text-brand">
                        {article.liste.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                    {article.apresListe && <p>{article.apresListe}</p>}
                  </div>
                </details>
              ))}
            </div>
            <div className="mt-8 rounded-2xl bg-surface p-5 text-sm text-muted-foreground">
              <p>
                Mis à jour en {reglement.miseAJour} selon la réglementation de France Judo en vigueur :
              </p>
              <ul className="mt-2 space-y-1">
                {reglement.sources.map((l) => (
                  <li key={l.url}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand">
                      {l.libelle}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </SelonStatut>
        )}
      </Container>
    </div>
  )
}

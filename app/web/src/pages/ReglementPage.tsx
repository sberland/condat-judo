import { ChevronDown } from 'lucide-react'
import { REGLEMENT } from '../content/club'
import { Container, PageHeader } from '../components/ui'
import { usePageMeta } from '../lib/usePageMeta'

export function ReglementPage() {
  usePageMeta(
    'Règlement intérieur',
    'Règlement intérieur du club Judo Condat-sur-Vienne : licence, certificat médical, responsabilité des parents, tenue, hygiène, compétitions.',
  )

  return (
    <div className="animate-apparition">
      <PageHeader surtitre="Règlement" titre="Règlement intérieur">
        Les règles du dojo, pour que chacun pratique en sécurité et dans de bonnes conditions.
      </PageHeader>

      <Container className="max-w-3xl py-12 sm:py-16">
        <div className="space-y-3">
          {REGLEMENT.map((article, i) => (
            <details
              key={article.titre}
              className="group rounded-2xl border bg-white shadow-sm open:shadow-md"
              open={i === 0}
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-lg font-bold [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm text-brand">
                    {i + 1}
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
      </Container>
    </div>
  )
}

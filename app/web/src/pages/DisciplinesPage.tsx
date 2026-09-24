import { Link } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'
import { DISCIPLINES, enLettres, enumerer, LISTE_DISCIPLINES, majuscule, type Discipline } from '../content/club'
import { Provisoire, useProvisoireVisible } from '../components/Provisoire'
import { Container, PageHeader } from '../components/ui'
import { usePageMeta } from '../lib/usePageMeta'

export function DisciplinesPage() {
  usePageMeta(
    'Disciplines',
    `${majuscule(LISTE_DISCIPLINES)} au dojo de Condat-sur-Vienne (éveil judo dès 4 ans) : présentation de chaque discipline par le club.`,
  )
  const provisoireVisible = useProvisoireVisible()
  const disciplines = DISCIPLINES.filter((d) => !d.provisoire || provisoireVisible)

  return (
    <div className="animate-apparition">
      <PageHeader surtitre="Disciplines" titre={majuscule(enumerer(disciplines.map((d) => d.nom.toLocaleLowerCase('fr-FR'))))}>
        {enLettres(disciplines.length)} disciplines, un même esprit : progresser à son rythme, dans le respect des autres.
      </PageHeader>

      {/* Accès rapide (collant sous l'en-tête) */}
      <div className="sticky top-16 z-30 border-b bg-white/90 backdrop-blur sm:top-18">
        <Container className="flex gap-2 overflow-x-auto py-3">
          {disciplines.map((d) => (
            <Link
              key={d.id}
              to="/disciplines"
              hash={d.id}
              className="shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors hover:border-brand hover:text-brand"
            >
              {d.nom}
            </Link>
          ))}
        </Container>
      </div>

      <Container className="divide-y">
        {disciplines.map((d) =>
          d.provisoire ? (
            <Provisoire key={d.id} className="my-8">
              <ArticleDiscipline d={d} />
            </Provisoire>
          ) : (
            <ArticleDiscipline key={d.id} d={d} />
          ),
        )}
      </Container>
    </div>
  )
}

function ArticleDiscipline({ d }: { d: Discipline }) {
  return (
    <article id={d.id} className="grid gap-8 py-14 sm:py-20 lg:grid-cols-[1fr_2fr]">
      <header>
        <span className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
          {d.public}
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{d.nom}</h2>
        <p className="mt-3 text-lg font-medium text-muted-foreground">{d.accroche}</p>
      </header>
      <div className="space-y-4 text-lg leading-relaxed">
        {d.paragraphes.map((p) => (
          <p key={p}>{p}</p>
        ))}
        {d.liste && (
          <>
            <p>{d.liste.intro}</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {d.liste.items.map((item) => (
                <li key={item} className="flex gap-3 rounded-xl bg-surface px-4 py-3 text-base">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        {d.conclusion && <p className="font-medium">{d.conclusion}</p>}
        {d.encart && (
          <aside className="mt-6 rounded-2xl border border-brand/20 bg-brand-soft p-6">
            <p className="flex items-center gap-2 font-bold text-brand">
              <Sparkles className="size-5" aria-hidden /> {d.encart.titre}
            </p>
            <p className="mt-2 text-base">{d.encart.texte}</p>
          </aside>
        )}
      </div>
    </article>
  )
}

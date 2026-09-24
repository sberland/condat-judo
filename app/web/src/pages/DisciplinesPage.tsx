import { Link } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'
import { CODE_MORAL, enLettres, enumerer, majuscule, PRINCIPES_YOGA, type Valeur } from '../content/club'
import { listeDisciplines, type Discipline } from '../content/contenu'
import { useContenu } from '../lib/contenu'
import { IllustrationDiscipline } from '../components/IllustrationDiscipline'
import { Provisoire, useProvisoireVisible } from '../components/Provisoire'
import { Card, Container, PageHeader, SectionTitle } from '../components/ui'
import { usePageMeta } from '../lib/usePageMeta'

export function DisciplinesPage() {
  const toutes = useContenu().disciplines.disciplines
  usePageMeta(
    'Disciplines',
    `${majuscule(listeDisciplines(toutes))} au dojo de Condat-sur-Vienne (éveil judo dès 4 ans) : présentation de chaque discipline par le club.`,
  )
  const provisoireVisible = useProvisoireVisible()
  const disciplines = toutes.filter((d) => !d.provisoire || provisoireVisible)

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
              className="flex shrink-0 items-center gap-2 rounded-full border py-1 pr-4 pl-1 text-sm font-semibold transition-colors hover:border-brand hover:text-brand"
            >
              <IllustrationDiscipline id={d.id} className="size-8 shrink-0" />
              {d.nom}
            </Link>
          ))}
          <Link
            to="/disciplines"
            hash="valeurs"
            className="flex shrink-0 items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors hover:border-brand hover:text-brand"
          >
            Valeurs
          </Link>
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

      <Valeurs />
    </div>
  )
}

/** Les valeurs des disciplines (retours du club, spec 020) : code moral et principes du yoga. */
function Valeurs() {
  return (
    <section id="valeurs" className="bg-surface py-14 sm:py-20">
      <Container className="grid gap-16">
        <div>
          <div className="mb-4 flex gap-2" aria-hidden>
            {['judo', 'jujitsu', 'taiso'].map((id) => (
              <IllustrationDiscipline key={id} id={id} className="size-12" />
            ))}
          </div>
          <SectionTitle surtitre="Judo, jujitsu et taïso" titre="Le code moral : huit valeurs">
            Le code moral de France Judo guide la pratique du judo, du jujitsu et du taïso au club : il aide chacun à grandir, sur le
            tatami comme dans la vie.
          </SectionTitle>
          <CartesValeurs valeurs={CODE_MORAL} />
          <p className="mt-6 text-sm text-muted-foreground">
            Source :{' '}
            <a href="https://www.ffjudo.com/le-code-moral-du-judo" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand">
              France Judo — le code moral du judo
            </a>
          </p>
        </div>
        <div>
          <IllustrationDiscipline id="yoga" className="mb-4 size-12" />
          <SectionTitle surtitre="Yoga" titre="Les principes de vie du yoga">
            Le yoga s’appuie sur des principes de vie, les yamas, décrits il y a plus de deux mille ans dans les Yoga Sutras de
            Patanjali. En voici l’esprit, en mots simples.
          </SectionTitle>
          <CartesValeurs valeurs={PRINCIPES_YOGA} accent="text-[#12876a]" numero="text-[#12876a]/15" />
        </div>
      </Container>
    </section>
  )
}

function CartesValeurs({ valeurs, accent = 'text-brand', numero = 'text-brand/15' }: { valeurs: Valeur[]; accent?: string; numero?: string }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${valeurs.length % 4 === 0 ? 'lg:grid-cols-4' : 'lg:grid-cols-5'}`}>
      {valeurs.map((v, i) => (
        <Card key={v.nom} className="relative">
          <span className={`absolute top-5 right-5 text-3xl font-black ${numero}`} aria-hidden>
            {i + 1}
          </span>
          <h3 className="text-xl font-bold">{v.nom}</h3>
          {v.origine && <p className="text-sm text-muted-foreground italic">{v.origine}</p>}
          <p className={`mt-1 font-semibold ${accent}`}>{v.definition}</p>
          {v.lignes.map((l) => (
            <p key={l} className="mt-2 text-sm text-muted-foreground">
              {l}
            </p>
          ))}
        </Card>
      ))}
    </div>
  )
}

function ArticleDiscipline({ d }: { d: Discipline }) {
  return (
    <article id={d.id} className="grid gap-8 py-14 sm:py-20 lg:grid-cols-[1fr_2fr]">
      <header>
        <IllustrationDiscipline id={d.id} className="mb-5 size-28" />
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

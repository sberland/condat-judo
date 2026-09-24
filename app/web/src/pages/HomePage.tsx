import { Link } from '@tanstack/react-router'
import { ArrowRight, CalendarDays, IdCard, MapPin } from 'lucide-react'
import { CODE_MORAL, enLettres, enumerer, majuscule } from '../content/club'
import { disciplinesPubliques, itineraire, listeDisciplines } from '../content/contenu'
import { useContenu } from '../lib/contenu'
import { Provisoire, useProvisoireVisible } from '../components/Provisoire'
import { BoutonExterne, BoutonLien, Card, Container, FacebookIcon, Section, SectionTitle } from '../components/ui'
import { usePageMeta } from '../lib/usePageMeta'

export function HomePage() {
  const c = useContenu()
  const iti = itineraire(c.club)
  usePageMeta(
    null,
    `Club de ${listeDisciplines(c.disciplines.disciplines)} de Condat-sur-Vienne (Haute-Vienne). Éveil judo dès 4 ans, cours de septembre à juin au dojo, 9 rue Jules Ferry.`,
  )
  const provisoireVisible = useProvisoireVisible()
  const disciplines = c.disciplines.disciplines.filter((d) => !d.provisoire || provisoireVisible)

  return (
    <div className="animate-apparition">
      <Hero />

      <Section>
        <SectionTitle surtitre="Nos disciplines" titre={`${enLettres(disciplines.length)} façons de pratiquer au dojo`}>
          {enLettres(disciplines.length)} disciplines, un même esprit : progresser à son rythme, dans le respect des autres.
        </SectionTitle>
        <div className={`grid gap-4 sm:grid-cols-2 ${disciplines.length > 3 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {disciplines.map((d) => {
            const carte = (
              <Link
                to="/disciplines"
                hash={d.id}
                className="group flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
              >
                <span className="mb-4 inline-flex w-fit rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
                  {d.public}
                </span>
                <h3 className="text-2xl font-bold">{d.nom}</h3>
                <p className="mt-2 flex-1 text-muted-foreground">{d.accroche}</p>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                  En savoir plus <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            )
            return d.provisoire ? <Provisoire key={d.id}>{carte}</Provisoire> : <div key={d.id}>{carte}</div>
          })}
        </div>
      </Section>

      <section className="bg-surface py-14 sm:py-20">
        <Container>
          <SectionTitle surtitre="Le code moral du judo" titre="Huit valeurs, sur le tatami comme dans la vie" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {CODE_MORAL.map((v) => (
              <div key={v.nom} className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
                <p className="font-bold">{v.nom}</p>
                <p className="mt-1 text-sm text-muted-foreground">{v.definition}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <BoutonLien to="/club" hash="code-moral" variante="contour">
              Découvrir le code moral <ArrowRight className="size-4" />
            </BoutonLien>
          </div>
        </Container>
      </section>

      <Section>
        <SectionTitle surtitre="Infos pratiques" titre="Le club en bref" />
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <MapPin className="size-6 text-brand" aria-hidden />
            <h3 className="mt-4 text-lg font-bold">Le dojo</h3>
            <p className="mt-1 text-muted-foreground">
              {c.club.adresse}
              <br />
              {c.club.codePostal} {c.club.ville}
            </p>
            <a
              href={iti.googleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand"
            >
              Itinéraire <ArrowRight className="size-4" />
            </a>
          </Card>
          <Card>
            <CalendarDays className="size-6 text-brand" aria-hidden />
            <h3 className="mt-4 text-lg font-bold">La saison</h3>
            <p className="mt-1 text-muted-foreground">{c.club.saisonDetail}</p>
          </Card>
          <Card>
            <IdCard className="size-6 text-brand" aria-hidden />
            <h3 className="mt-4 text-lg font-bold">La licence</h3>
            <p className="mt-1 text-muted-foreground">
              Chaque pratiquant doit être licencié à France Judo, la fédération française de judo.
            </p>
            <a
              href="https://moncompte.ffjudo.com/prise-licence"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand"
            >
              Prendre sa licence <ArrowRight className="size-4" />
            </a>
          </Card>
        </div>
      </Section>

      <Section className="pt-0 sm:pt-0">
        <div className="relative overflow-hidden rounded-3xl bg-brand px-6 py-10 text-white sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute -right-16 -bottom-24 size-72 rounded-full bg-white/10" />
          <h2 className="relative max-w-xl text-3xl font-bold tracking-tight text-balance">
            Une question sur le club ou les cours ?
          </h2>
          <p className="relative mt-3 max-w-xl text-white/85">
            Retrouvez toutes les façons de joindre le club et de venir au dojo.
          </p>
          <div className="relative mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/contact"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 font-semibold text-brand transition-colors hover:bg-white/90"
            >
              Nous contacter <ArrowRight className="size-4" />
            </Link>
            <a
              href={c.club.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/40 px-6 font-semibold transition-colors hover:bg-white/10"
            >
              <FacebookIcon /> Suivre sur Facebook
            </a>
          </div>
        </div>
      </Section>
    </div>
  )
}

function Hero() {
  const c = useContenu()
  const iti = itineraire(c.club)
  return (
    <div className="relative overflow-hidden bg-ink text-white">
      <div className="pointer-events-none absolute -top-40 -left-40 size-[28rem] rounded-full bg-brand/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 size-80 rounded-full bg-brand/15 blur-3xl" />
      <Container className="relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.3fr_1fr] lg:py-28">
        <div className="order-2 lg:order-1">
          <p className="mb-4 inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-white/80">
            Club affilié à France Judo · Haute-Vienne
          </p>
          <h1 className="text-4xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {majuscule(listeDisciplines(c.disciplines.disciplines))} à <span className="whitespace-nowrap text-brand">Condat-sur-Vienne</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/75">
            Un sport éducatif et un vrai équilibre pour toute la famille : {enumerer(disciplinesPubliques(c.disciplines.disciplines).map((d) => d.enBref))}.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <BoutonLien to="/disciplines">
              Découvrir les disciplines <ArrowRight className="size-4" />
            </BoutonLien>
            <BoutonExterne href={iti.googleMaps} variante="secondaire">
              Venir au dojo
            </BoutonExterne>
          </div>
        </div>
        <div className="order-1 flex justify-center lg:order-2">
          <img
            src="/logo-judo-condat.png"
            alt="Logo du club Judo Condat-sur-Vienne"
            className="size-40 rounded-full shadow-[0_20px_60px_rgba(217,22,28,0.35)] sm:size-56 lg:size-80"
            width={320}
            height={320}
          />
        </div>
      </Container>
    </div>
  )
}

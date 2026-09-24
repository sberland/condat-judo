import { ChevronDown } from 'lucide-react'
import { Espace } from '../../components/espace/Garde'
import { LIBELLES_PROFIL, rubriquesPour } from '../../content/aide'
import { aUnRole } from '../../lib/api'

export function AidePage() {
  return (
    <Espace titre="Aide" retour={{ to: '/espace', libelle: 'Mon espace' }}>
      {(me) => {
        const rubriques = rubriquesPour(me.roles)
        // Les badges de profil n'aident que ceux qui voient plusieurs niveaux d'aide.
        const avecBadges = aUnRole(me, 'bureau', 'admin')
        return (
          <div className="grid gap-6">
            <p className="text-muted-foreground">
              Les réponses aux questions les plus courantes, selon votre profil. Une autre question ? Adressez-vous au bureau du club.
            </p>

            {/* Sommaire */}
            <nav aria-label="Sommaire de l’aide" className="flex flex-wrap gap-2">
              {rubriques.map((r) => (
                <a
                  key={r.id}
                  href={`#${r.id}`}
                  className="rounded-full border bg-white px-4 py-2 text-sm font-semibold transition-colors hover:border-brand hover:text-brand"
                >
                  {r.titre}
                </a>
              ))}
            </nav>

            {rubriques.map((r) => (
              <section key={r.id} id={r.id} className="scroll-mt-24 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-bold">{r.titre}</h2>
                  {avecBadges && r.profil !== 'famille' && (
                    <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white">{LIBELLES_PROFIL[r.profil]}</span>
                  )}
                </div>
                <div className="divide-y">
                  {r.questions.map((question) => (
                    <details key={question.q} className="group py-1">
                      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">
                        {question.q}
                        <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                      </summary>
                      <div className="grid gap-2 pb-4 text-muted-foreground">
                        {question.r.map((p) => (
                          <p key={p}>{p}</p>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )
      }}
    </Espace>
  )
}

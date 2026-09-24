import type { ReactNode } from 'react'
import { useContenu } from '../lib/contenu'
import { DUREES_TECHNIQUES, RGPD, texteConservation, TRAITEMENTS, type Valeur } from '../content/rgpd'
import { Container, PageHeader } from '../components/ui'
import { usePageMeta } from '../lib/usePageMeta'

// Information des personnes (art. 13 RGPD, spec 006). Contenu : content/rgpd.ts.

export function DonneesPersonnellesPage() {
  usePageMeta('Données personnelles', 'Comment le club Judo Condat-sur-Vienne traite les données des adhérents et de leurs familles, et comment exercer vos droits.')
  const ASSOCIATION = useContenu().association

  return (
    <div className="animate-apparition">
      <PageHeader surtitre="Informations" titre="Données personnelles">
        Ce que le club enregistre sur les adhérents et leurs familles, pourquoi, pour combien de temps, et vos droits.
      </PageHeader>
      <Container className="max-w-3xl space-y-10 py-12 sm:py-16">
        <Bloc titre="Qui est responsable ?">
          <p>
            <strong className="text-foreground">{ASSOCIATION.denomination}</strong>, {ASSOCIATION.forme.toLowerCase()} (siège :{' '}
            {ASSOCIATION.siege}), responsable du traitement des données de ses adhérents.
          </p>
          <p>
            Pour toute question ou demande : <ValeurClub v={RGPD.contact} />.
          </p>
        </Bloc>

        <Bloc titre="Quelles données, et pourquoi ?">
          <div className="grid gap-4">
            {TRAITEMENTS.map((t) => (
              <div key={t.titre} className="rounded-2xl border bg-white p-5">
                <h3 className="font-bold text-foreground">{t.titre}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {t.donnees.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                <p className="mt-3">
                  <span className="font-semibold text-foreground">Pour : </span>
                  {t.finalite}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Fondement : </span>
                  {t.base}
                </p>
              </div>
            ))}
          </div>
        </Bloc>

        <Bloc titre="Ce que nous ne collectons pas">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong className="text-foreground">Aucune donnée de santé</strong> : pour le certificat médical ou le questionnaire de santé,
              le club note seulement la date à laquelle l’attestation a été remise, jamais son contenu.
            </li>
            <li>Aucune mesure d’audience, aucune publicité, aucun cookie pour les visiteurs du site.</li>
            <li>Aucune revente ni cession des données.</li>
          </ul>
        </Bloc>

        <Bloc titre="Qui y a accès ?">
          <ul className="list-disc space-y-1 pl-5">
            <li>Les membres du bureau du club, chacun selon son rôle.</li>
            <li>Les responsables légaux d’un enfant : les informations de cet enfant, et le nom des autres responsables (jamais leurs coordonnées).</li>
            <li>
              En dehors du bureau : <ValeurClub v={RGPD.destinataires} liste />.
            </li>
            <li>
              Nos prestataires techniques, qui ne font qu’héberger : Cloudflare (le site ; données stockées dans l’Union européenne) et GitHub
              (sauvegardes chiffrées, illisibles sans la clé détenue par le club).
            </li>
          </ul>
        </Bloc>

        <Bloc titre="Combien de temps ?">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Données d’un adhérent et de ses responsables : pendant l’adhésion, puis{' '}
              <ValeurClub v={{ valeur: texteConservation(RGPD.conservationAdherents.valeur), provisoire: RGPD.conservationAdherents.provisoire }} /> ;
              ensuite, elles sont rendues anonymes automatiquement (le compte d’un responsable aussi, s’il n’a plus d’autre enfant au club).
            </li>
            {DUREES_TECHNIQUES.map((d) => (
              <li key={d.quoi}>
                {d.quoi} : {d.duree}.
              </li>
            ))}
          </ul>
        </Bloc>

        <Bloc titre="Vos droits">
          <p>
            Vous pouvez à tout moment consulter vos données et celles de vos enfants, les faire corriger ou effacer, vous opposer à un
            traitement ou en demander la limitation, les recevoir dans un format réutilisable, et <strong className="text-foreground">retirer un
            consentement</strong> (droit à l’image, groupe WhatsApp) sans avoir à vous justifier.
          </p>
          <p>
            <strong className="text-foreground">Depuis votre espace</strong> (« Mes enfants ») : télécharger toutes les données qui vous
            concernent, vous et vos enfants, et donner ou retirer votre accord pour le droit à l’image et le groupe WhatsApp.
          </p>
          <p>
            Pour le reste : <ValeurClub v={RGPD.contact} />. Pour un enfant mineur, ces droits sont exercés par ses responsables légaux.
            Réponse sous un mois.
          </p>
          <p>
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL (
            <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer" className="text-brand underline">
              cnil.fr
            </a>
            ).
          </p>
        </Bloc>

        <Bloc titre="Cookies">
          <p>
            Un seul cookie, déposé uniquement quand un membre se connecte : il garde la connexion ouverte (6 mois au plus). Strictement
            nécessaire au service, il ne demande pas de consentement ; aucun autre cookie n’est utilisé.
          </p>
        </Bloc>

        <Bloc titre="Sécurité">
          <ul className="list-disc space-y-1 pl-5">
            <li>Connexion sans mot de passe, par lien personnel à usage unique ; chacun ne voit que ce qui le concerne.</li>
            <li>Chaque consultation ou modification des coordonnées d’une famille par le bureau est enregistrée (conservé un an).</li>
            <li>Sauvegardes quotidiennes chiffrées, hors de l’hébergeur du site.</li>
            <li>Le site de test du club ne contient que des données rendues anonymes.</li>
          </ul>
        </Bloc>
      </Container>
    </div>
  )
}

function Bloc({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight">{titre}</h2>
      <div className="mt-3 space-y-2 leading-relaxed text-muted-foreground">{children}</div>
    </section>
  )
}

/**
 * Valeur donnée par le club. Tant qu'elle est provisoire : surlignée « à compléter » (le
 * déploiement en prod est bloqué dans ce cas, cf. deploy.yml).
 */
function ValeurClub({ v, liste = false }: { v: Valeur<string> | Valeur<string[]>; liste?: boolean }) {
  const texte = Array.isArray(v.valeur) ? v.valeur.join(' ; ') : v.valeur
  if (!v.provisoire) return <span className={liste ? '' : 'text-foreground'}>{texte}</span>
  return (
    <mark className="rounded bg-amber-100 px-1 text-amber-900" title="Réponse du club attendue">
      {texte} <span className="text-xs font-bold uppercase">(à compléter)</span>
    </mark>
  )
}

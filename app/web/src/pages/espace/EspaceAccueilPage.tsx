import type { ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  Baby,
  CalendarCheck,
  CalendarCog,
  CalendarDays,
  CalendarRange,
  ChevronRight,
  ClipboardList,
  ClipboardPen,
  Contact,
  FilePenLine,
  LogOut,
  Megaphone,
  ShieldCheck,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react'
import { useSaisonCourante, type SaisonPublique } from '../../lib/saison'
import { Espace } from '../../components/espace/Garde'
import { PropositionPasskey } from '../../components/espace/Passkeys'
import { Bouton } from '../../components/formulaire'
import { aUnRole, ROLES, seDeconnecter, type Me } from '../../lib/api'

// Accueil de l'espace (spec 023) : cartes rangées en rubriques, selon les rôles. Un parent sans
// rôle ne voit que « Ma famille », sans titre ; l'aide est le bouton de l'en-tête.

type Destination =
  | '/espace/famille'
  | '/espace/inscriptions'
  | '/espace/mercredis'
  | '/evenements'
  | '/espace/garderie-du-jour'
  | '/espace/garderie'
  | '/espace/adhesions'
  | '/espace/adherents'
  | '/espace/comptes'
  | '/espace/evenements'
  | '/espace/actualites'
  | '/espace/contenu'
  | '/espace/tresorerie'
  | '/espace/saisons'
  | '/espace/rgpd'

type Carte = { to: Destination; icone: ReactNode; titre: string; texte: string; visible: boolean }
type Rubrique = { titre: string; cartes: Carte[] }

/** Rubriques et cartes visibles pour cet utilisateur (le masquage n'est pas la sécurité : l'API vérifie). */
export function rubriquesEspace(me: Me, saison: SaisonPublique | undefined): Rubrique[] {
  const role = (...roles: Parameters<typeof aUnRole>[1][]) => aUnRole(me, ...roles)
  const bureau = role('bureau', 'admin')
  const rubriques: Rubrique[] = [
    {
      titre: 'Ma famille',
      cartes: [
        {
          to: '/espace/inscriptions',
          icone: <ClipboardPen className="size-5" />,
          titre: `Inscriptions ${saison?.inscriptions?.libelle ?? ''}`.trim(),
          texte: 'Remplir en ligne le dossier d’inscription de vos enfants — ou le vôtre.',
          visible: !!saison?.inscriptions,
        },
        {
          to: '/espace/famille',
          icone: <UsersRound className="size-5" />,
          titre: 'Mes enfants',
          texte: 'Leurs fiches, leurs responsables, les personnes autorisées à les récupérer, vos autorisations.',
          visible: true,
        },
        {
          to: '/espace/mercredis',
          icone: <Baby className="size-5" />,
          titre: 'Garderie du mercredi',
          texte: 'Demander que le club récupère votre enfant à la garderie, un mercredi ou tous les mercredis.',
          visible: true,
        },
        {
          to: '/evenements',
          icone: <CalendarDays className="size-5" />,
          titre: 'Événements',
          texte: 'Compétitions, stages, rencontres, repas… et l’inscription de vos enfants ou de votre famille.',
          visible: true,
        },
      ],
    },
    {
      titre: 'Mercredi (encadrement)',
      cartes: [
        {
          to: '/espace/garderie-du-jour',
          icone: <CalendarCheck className="size-5" />,
          titre: 'Mercredi du jour',
          texte: 'Les enfants à récupérer aujourd’hui à la garderie, leur photo, qui peut venir les chercher, le pointage.',
          visible: role('encadrant', 'bureau', 'admin'),
        },
        {
          to: '/espace/garderie',
          icone: <Baby className="size-5" />,
          titre: 'Garderie : liste des mercredis',
          texte: 'Les enfants à récupérer chaque mercredi, par lieu ; ajouter ou retirer un enfant.',
          visible: bureau,
        },
      ],
    },
    {
      titre: 'Adhérents',
      cartes: [
        {
          to: '/espace/adhesions',
          icone: <ClipboardList className="size-5" />,
          titre: 'Dossiers d’adhésion',
          texte: 'Dossiers de la saison — et des inscriptions en ligne : ce qui manque, montants, validation.',
          visible: bureau,
        },
        {
          to: '/espace/adherents',
          icone: <Users className="size-5" />,
          titre: 'Adhérents',
          texte: 'Fiches des pratiquants, responsables légaux, personnes autorisées.',
          visible: bureau,
        },
        {
          to: '/espace/comptes',
          icone: <Contact className="size-5" />,
          titre: 'Comptes',
          texte: `Parents, adhérents majeurs, bureau${role('admin') ? ' — et leurs rôles' : ''} ; liens de connexion.`,
          visible: bureau,
        },
      ],
    },
    {
      titre: 'Vie du club',
      cartes: [
        {
          to: '/espace/evenements',
          icone: <CalendarCog className="size-5" />,
          titre: 'Événements : gestion',
          texte: 'Créer un événement, partager le lien, suivre les inscriptions.',
          visible: bureau,
        },
        {
          to: '/espace/actualites',
          icone: <Megaphone className="size-5" />,
          titre: 'Actualités',
          texte: 'Rédiger et publier les nouvelles du club, avec une photo, puis les partager sur WhatsApp.',
          visible: role('bureau', 'contenu', 'admin'),
        },
        {
          to: '/espace/contenu',
          icone: <FilePenLine className="size-5" />,
          titre: 'Contenu du site',
          texte: 'Coordonnées, équipe, disciplines, partenaires, règlement, liens.',
          visible: role('contenu', 'admin'),
        },
      ],
    },
    {
      titre: 'Gestion',
      cartes: [
        {
          to: '/espace/tresorerie',
          icone: <Wallet className="size-5" />,
          titre: 'Trésorerie',
          texte: 'Cotisations : qui a payé quoi, ce qui reste dû, chèques à remettre en banque.',
          visible: role('tresorier', 'admin'),
        },
        {
          to: '/espace/saisons',
          icone: <CalendarRange className="size-5" />,
          titre: 'Saisons et tarifs',
          texte: 'Catégories d’âge, tarifs, horaires ; préparer la saison suivante, ouvrir les inscriptions.',
          visible: bureau,
        },
        {
          to: '/espace/rgpd',
          icone: <ShieldCheck className="size-5" />,
          titre: 'Données personnelles',
          texte: 'Durée de conservation, purge automatique, journal des accès aux coordonnées des familles.',
          visible: role('admin'),
        },
      ],
    },
  ]
  return rubriques.map((r) => ({ ...r, cartes: r.cartes.filter((c) => c.visible) })).filter((r) => r.cartes.length > 0)
}

export function EspaceAccueilPage() {
  const client = useQueryClient()
  const navigate = useNavigate()
  const { data: saison } = useSaisonCourante()
  return (
    <Espace titre="Mon espace" aide="toutes">
      {(me) => {
        const rubriques = rubriquesEspace(me, saison)
        const titres = rubriques.length > 1
        return (
          <div className="grid gap-6">
            <p className="text-lg">
              Bonjour <strong>{me.prenom}</strong>
              {me.roles.length > 0 && (
                <span className="text-muted-foreground"> · {me.roles.map((r) => ROLES[r]?.libelle ?? r).join(', ')}</span>
              )}
            </p>
            <PropositionPasskey />
            {/* Une carte par rubrique, une ligne par écran ; deux colonnes sur grand écran. */}
            <div className="grid items-start gap-6 lg:grid-cols-2">
              {rubriques.map((r) => (
                <section key={r.titre} aria-label={r.titre} className="grid gap-2">
                  {titres && <h2 className="px-1 text-sm font-bold tracking-wider text-muted-foreground uppercase">{r.titre}</h2>}
                  <ul className="divide-y overflow-hidden rounded-2xl border bg-white shadow-sm">
                    {r.cartes.map((c) => (
                      <li key={c.to}>
                        <Tuile to={c.to} icone={c.icone} titre={c.titre}>
                          {c.texte}
                        </Tuile>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            {/* L'utilisateur simulé du dev local n'a pas de session à fermer. */}
            {me.provider === 'app' && (
              <div>
                <Bouton
                  variante="secondaire"
                  onClick={async () => {
                    await seDeconnecter(client)
                    navigate({ to: '/' })
                  }}
                >
                  <LogOut className="size-4" aria-hidden /> Se déconnecter
                </Bouton>
              </div>
            )}
          </div>
        )
      }}
    </Espace>
  )
}

function Tuile({ to, icone, titre, children }: { to: Destination; icone: ReactNode; titre: string; children: ReactNode }) {
  return (
    <Link to={to} className="group flex items-start gap-3.5 px-4 py-3.5 transition-colors hover:bg-surface">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">{icone}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{titre}</span>
        <span className="block text-sm text-muted-foreground">{children}</span>
      </span>
      <ChevronRight className="mt-1 size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  )
}

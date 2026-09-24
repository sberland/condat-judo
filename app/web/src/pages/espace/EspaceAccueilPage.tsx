import type { ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Baby, CalendarCheck, CalendarRange, ChevronRight, CircleHelp, ClipboardList, Contact, LogOut, ShieldCheck, Trophy, Users, UsersRound, Wallet } from 'lucide-react'
import { useSaisonCourante } from '../../lib/saison'
import { Espace } from '../../components/espace/Garde'
import { Bouton } from '../../components/formulaire'
import { aUnRole, ROLES, seDeconnecter } from '../../lib/api'

export function EspaceAccueilPage() {
  const client = useQueryClient()
  const navigate = useNavigate()
  const { data: saison } = useSaisonCourante()
  return (
    <Espace titre="Mon espace">
      {(me) => (
        <div className="grid gap-6">
          <p className="text-lg">
            Bonjour <strong>{me.prenom}</strong>
            {me.roles.length > 0 && (
              <span className="text-muted-foreground"> · {me.roles.map((r) => ROLES[r]?.libelle ?? r).join(', ')}</span>
            )}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Tuile to="/espace/famille" icone={<UsersRound className="size-6" />} titre="Mes enfants">
              Leurs fiches, leurs responsables et les personnes autorisées à les récupérer.
            </Tuile>
            <Tuile to="/espace/mercredis" icone={<Baby className="size-6" />} titre="Garderie du mercredi">
              Demander que le club récupère votre enfant à la garderie, un mercredi ou tous les mercredis.
            </Tuile>
            {aUnRole(me, 'encadrant', 'bureau', 'admin') && (
              <Tuile to="/espace/garderie-du-jour" icone={<CalendarCheck className="size-6" />} titre="Mercredi du jour">
                Pour l’encadrant : les enfants à récupérer à la garderie, leur photo et qui peut venir les chercher.
              </Tuile>
            )}
            {aUnRole(me, 'bureau', 'admin') && (
              <Tuile to="/espace/garderie" icone={<Baby className="size-6" />} titre="Garderie : liste du mercredi">
                Les enfants à récupérer chaque mercredi, par lieu ; ajouter ou retirer un enfant.
              </Tuile>
            )}
            {aUnRole(me, 'bureau', 'admin') ? (
              <Tuile to="/espace/competitions" icone={<Trophy className="size-6" />} titre="Compétitions">
                Créer une compétition, partager son lien, suivre les inscrits et les ressaisir sur le site fédéral.
              </Tuile>
            ) : (
              <Tuile to="/competitions" icone={<Trophy className="size-6" />} titre="Compétitions">
                Les prochaines compétitions, et l’inscription de vos enfants.
              </Tuile>
            )}
            {aUnRole(me, 'tresorier', 'admin') && (
              <Tuile to="/espace/tresorerie" icone={<Wallet className="size-6" />} titre="Trésorerie">
                Cotisations de la saison : qui a payé quoi, ce qui reste dû, chèques à remettre en banque.
              </Tuile>
            )}
            {aUnRole(me, 'bureau', 'admin') && (
              <>
                <Tuile to="/espace/adhesions" icone={<ClipboardList className="size-6" />} titre={`Dossiers ${saison?.libelle ?? ''}`.trim()}>
                  Dossiers d’adhésion de la saison : ce qui manque, montants, validation.
                </Tuile>
                <Tuile to="/espace/adherents" icone={<Users className="size-6" />} titre="Adhérents">
                  Fiches des pratiquants, responsables légaux, personnes autorisées.
                </Tuile>
                <Tuile to="/espace/comptes" icone={<Contact className="size-6" />} titre="Comptes">
                  Parents, adhérents majeurs, bureau{aUnRole(me, 'admin') ? ' — et leurs rôles' : ''}.
                </Tuile>
                <Tuile to="/espace/saisons" icone={<CalendarRange className="size-6" />} titre="Saisons et tarifs">
                  Catégories d’âge, tarifs, paiement en 3 fois et horaires ; préparer la saison suivante.
                </Tuile>
              </>
            )}
            {aUnRole(me, 'admin') && (
              <Tuile to="/espace/rgpd" icone={<ShieldCheck className="size-6" />} titre="Données personnelles">
                Durée de conservation, purge automatique, journal des accès aux coordonnées des familles.
              </Tuile>
            )}
            <Tuile to="/espace/aide" icone={<CircleHelp className="size-6" />} titre="Aide">
              Les réponses aux questions courantes{aUnRole(me, 'bureau', 'admin') ? ', y compris pour le bureau' : ''}.
            </Tuile>
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
      )}
    </Espace>
  )
}

function Tuile({
  to,
  icone,
  titre,
  children,
}: {
  to: '/espace/famille' | '/espace/adherents' | '/espace/adhesions' | '/espace/comptes' | '/espace/aide' | '/espace/competitions' | '/competitions' | '/espace/tresorerie' | '/espace/rgpd' | '/espace/saisons' | '/espace/mercredis' | '/espace/garderie' | '/espace/garderie-du-jour'
  icone: ReactNode
  titre: string
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-4 rounded-2xl border bg-white p-5 shadow-sm transition hover:border-brand/40 hover:shadow-md"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">{icone}</span>
      <span className="flex-1">
        <span className="block text-lg font-bold">{titre}</span>
        <span className="block text-sm text-muted-foreground">{children}</span>
      </span>
      <ChevronRight className="mt-1 size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  )
}

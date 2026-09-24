import type { ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Contact, LogOut, Users, UsersRound } from 'lucide-react'
import { Espace } from '../../components/espace/Garde'
import { Bouton } from '../../components/formulaire'
import { aUnRole, ROLES, seDeconnecter } from '../../lib/api'

export function EspaceAccueilPage() {
  const client = useQueryClient()
  const navigate = useNavigate()
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
            {aUnRole(me, 'bureau', 'admin') && (
              <>
                <Tuile to="/espace/adherents" icone={<Users className="size-6" />} titre="Adhérents">
                  Fiches des pratiquants, responsables légaux, personnes autorisées.
                </Tuile>
                <Tuile to="/espace/comptes" icone={<Contact className="size-6" />} titre="Comptes">
                  Parents, adhérents majeurs, bureau{aUnRole(me, 'admin') ? ' — et leurs rôles' : ''}.
                </Tuile>
              </>
            )}
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
  to: '/espace/famille' | '/espace/adherents' | '/espace/comptes'
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

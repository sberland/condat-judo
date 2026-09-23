import type { ReactNode } from 'react'
import { useHealth, useMe } from '../lib/api'

// Page d'accueil du socle technique : état de l'API, version et utilisateur résolu par le
// seam d'identité. Remplacée par la page d'accueil du club (site vitrine) à la v1.
export function HomePage() {
  const health = useHealth()
  const me = useMe()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary">Bienvenue au Judo Condat</h1>
      <p className="text-muted-foreground">Le site du club est en construction.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Carte titre="Application">
          <Ligne libelle="Version (front)" valeur={__APP_VERSION__} />
          <Ligne
            libelle="Version (API)"
            valeur={health.isPending ? '…' : health.isError ? 'API injoignable' : health.data.version}
          />
          <Ligne libelle="Environnement" valeur={health.data?.environment ?? '…'} />
        </Carte>

        <Carte titre="Utilisateur connecté">
          {me.isPending && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {me.isError && <p className="text-sm text-accent">API injoignable</p>}
          {me.data?.etat === 'anonyme' && <p className="text-sm">Non connecté.</p>}
          {me.data?.etat === 'inconnu' && (
            <p className="text-sm">Compte non reconnu — contactez le bureau du club.</p>
          )}
          {me.data?.etat === 'ok' && (
            <>
              <Ligne libelle="Nom" valeur={`${me.data.me.prenom} ${me.data.me.nom}`} />
              <Ligne libelle="Rôle" valeur={me.data.me.role} />
              <Ligne libelle="Connexion via" valeur={me.data.me.provider} />
            </>
          )}
        </Carte>
      </div>
    </div>
  )
}

function Carte({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm">
      <h2 className="mb-3 font-semibold">{titre}</h2>
      <div className="space-y-1">{children}</div>
    </section>
  )
}

function Ligne({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{libelle}</span>
      <span className="font-medium">{valeur}</span>
    </div>
  )
}

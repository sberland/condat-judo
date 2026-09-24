import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Link2, MessageCircle } from 'lucide-react'
import { CLUB } from '../../content/club'
import { appel, dateHeureFr, ErreurApi, urlConnexion, urlWhatsApp } from '../../lib/api'
import { Alerte, Bouton, LienBouton } from '../formulaire'

/**
 * Création d'un lien de connexion personnel (spec 005a), à remettre par WhatsApp. Le lien
 * connecte À LA PLACE de la personne : l'API refuse au bureau les comptes qui ont un rôle.
 */
export function LienConnexion({ compte }: { compte: { id: number; prenom: string; telephone: string | null } }) {
  const client = useQueryClient()
  const [lien, setLien] = useState<{ url: string; expire_le: string } | null>(null)
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [copie, setCopie] = useState(false)

  async function creer() {
    setEnCours(true)
    setErreur('')
    try {
      const r = await appel<{ jeton: string; expire_le: string }>('POST', `/api/admin/comptes/${compte.id}/lien`)
      setLien({ url: urlConnexion(r.jeton), expire_le: r.expire_le })
      await client.invalidateQueries({ queryKey: ['admin'] })
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Création impossible, réessayez.')
    } finally {
      setEnCours(false)
    }
  }

  if (!lien) {
    return (
      <div className="grid gap-2">
        <Bouton variante="secondaire" enCours={enCours} onClick={creer}>
          <Link2 className="size-4" aria-hidden /> Créer un lien de connexion
        </Bouton>
        <p className="text-sm text-muted-foreground">À envoyer à {compte.prenom} : un geste suffit pour se connecter. Remplace le lien précédent.</p>
        <Alerte>{erreur}</Alerte>
      </div>
    )
  }

  const echeance = dateHeureFr(lien.expire_le)
  // Premier contact numérique avec la famille : on y joint l'information sur ses données (RGPD, spec 006).
  const message = `Bonjour ${compte.prenom}, voici votre lien personnel pour accéder à l’espace membres du ${CLUB.nom} : ${lien.url}\nIl fonctionne une seule fois, jusqu’au ${echeance}.\nCe que le club enregistre sur vous et vos enfants, et vos droits : ${window.location.origin}/donnees-personnelles`

  return (
    <div className="grid gap-3 rounded-xl border border-dashed p-4">
      <p className="font-semibold">Lien de connexion de {compte.prenom}</p>
      <input
        readOnly
        value={lien.url}
        aria-label="Lien de connexion"
        onFocus={(e) => e.currentTarget.select()}
        className="min-h-12 w-full rounded-xl border bg-surface px-3.5 font-mono text-sm"
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <LienBouton href={urlWhatsApp(message, compte.telephone)}>
          <MessageCircle className="size-4" aria-hidden /> Envoyer sur WhatsApp
        </LienBouton>
        <Bouton
          variante="secondaire"
          onClick={async () => {
            await navigator.clipboard.writeText(lien.url)
            setCopie(true)
          }}
        >
          {copie ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copie ? 'Lien copié' : 'Copier le lien'}
        </Bouton>
      </div>
      <p className="text-sm text-muted-foreground">
        Usage unique, valable jusqu’au {echeance}. À ne remettre qu’à {compte.prenom} : il ouvre une session sur son compte.
      </p>
    </div>
  )
}

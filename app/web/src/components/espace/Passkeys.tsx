// Passkey (spec 005c) : proposition après une connexion (jamais imposée, refus mémorisé sur ce
// téléphone) et gestion des passkeys du compte (retrait).
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Fingerprint, Trash2 } from 'lucide-react'
import { sendSignal } from '@simplewebauthn/browser'
import { Bloc } from './Garde'
import { Alerte, Bouton } from '../formulaire'
import { appel, dateFr, ErreurApi, type Me } from '../../lib/api'
import { activerPasskey, annule, choixPasskey, memoriserChoix, nomDeverrouillage, passkeyDisponible, type Passkey } from '../../lib/passkey'

const MESSAGE_ACTIVEE = 'C’est activé : la prochaine fois, sur la page Connexion, touchez « Se connecter avec '

function useDisponible() {
  const [disponible, setDisponible] = useState(false)
  useEffect(() => {
    let actif = true
    passkeyDisponible().then((d) => actif && setDisponible(d))
    return () => {
      actif = false
    }
  }, [])
  return disponible
}

async function activer(client: ReturnType<typeof useQueryClient>, setErreur: (m: string) => void): Promise<boolean> {
  try {
    await activerPasskey()
    await client.invalidateQueries({ queryKey: ['famille', 'passkeys'] })
    return true
  } catch (err) {
    if (!annule(err)) setErreur(err instanceof ErreurApi ? err.message : 'Activation impossible sur cet appareil.')
    return false
  }
}

/** Bandeau de l'espace : « Activer Face ID / l'empreinte sur ce téléphone ». */
export function PropositionPasskey() {
  const client = useQueryClient()
  const disponible = useDisponible()
  const [choix, setChoix] = useState(choixPasskey)
  const [fait, setFait] = useState(false)
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)
  const nom = nomDeverrouillage()

  if (fait) {
    return (
      <p className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900">
        <Check className="mt-0.5 size-5 shrink-0" aria-hidden />
        <span>
          {MESSAGE_ACTIVEE}
          {nom} ».
        </span>
      </p>
    )
  }
  if (!disponible || choix) return null

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-brand/30 bg-brand-soft p-5 sm:flex-row sm:items-start">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-brand">
        <Fingerprint className="size-6" aria-hidden />
      </span>
      <div className="grid flex-1 gap-3">
        <div>
          <h2 className="text-lg font-bold">Se reconnecter avec {nom} ?</h2>
          <p className="text-sm text-muted-foreground">
            Sur cet appareil, votre espace s’ouvrira ensuite d’un simple déverrouillage : plus besoin de lien. Votre visage ou votre
            empreinte ne quittent pas l’appareil.
          </p>
        </div>
        <Alerte>{erreur}</Alerte>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Bouton
            enCours={enCours}
            onClick={async () => {
              setErreur('')
              setEnCours(true)
              setFait(await activer(client, setErreur))
              setEnCours(false)
            }}
          >
            Activer {nom}
          </Bouton>
          <Bouton
            variante="secondaire"
            onClick={() => {
              memoriserChoix('refusee')
              setChoix('refusee')
            }}
          >
            Non merci
          </Bouton>
        </div>
      </div>
    </section>
  )
}

/** Identifiant d'utilisateur WebAuthn (même valeur que le Worker), en base64url. */
const userIdWebAuthn = (id: number) => btoa(`condat-judo-${id}`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

/** « Mes enfants » : passkeys du compte, activation sur ce téléphone, retrait. */
export function MesPasskeys({ me }: { me: Me }) {
  const client = useQueryClient()
  const disponible = useDisponible()
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [enCours, setEnCours] = useState('')
  const { data } = useQuery({
    queryKey: ['famille', 'passkeys'],
    queryFn: () => appel<Passkey[]>('GET', '/api/famille/passkeys'),
  })
  const nom = nomDeverrouillage()
  if (!data || (data.length === 0 && !disponible)) return null

  async function retirer(p: Passkey) {
    setErreur('')
    setMessage('')
    setEnCours(p.id)
    try {
      await appel('DELETE', `/api/famille/passkeys/${encodeURIComponent(p.id)}`)
      const restantes = data!.filter((x) => x.id !== p.id).map((x) => x.id)
      // Le téléphone qui la détient peut cesser de la proposer (navigateurs récents).
      sendSignal({ signalName: 'allAcceptedCredentials', rpID: window.location.hostname, userID: userIdWebAuthn(me.id), allAcceptedCredentialIDs: restantes }).catch(
        () => undefined,
      )
      await client.invalidateQueries({ queryKey: ['famille', 'passkeys'] })
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Retrait impossible.')
    } finally {
      setEnCours('')
    }
  }

  return (
    <Bloc
      titre="Connexion par Face ID / empreinte"
      action={
        disponible && (
          <Bouton
            variante="secondaire"
            enCours={enCours === 'activer'}
            onClick={async () => {
              setErreur('')
              setMessage('')
              setEnCours('activer')
              if (await activer(client, setErreur)) setMessage(`${MESSAGE_ACTIVEE}${nom} ».`)
              setEnCours('')
            }}
          >
            <Fingerprint className="size-4" aria-hidden /> Activer sur cet appareil
          </Bouton>
        )
      }
    >
      {data.length === 0 ? (
        <p className="text-muted-foreground">
          Pas encore activée : sur cet appareil, votre espace peut s’ouvrir d’un simple déverrouillage ({nom}), sans lien.
        </p>
      ) : (
        <ul className="grid gap-3">
          {data.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3">
              <span>
                <span className="block font-medium">{p.appareil ?? 'Appareil'}</span>
                <span className="block text-sm text-muted-foreground">
                  Activée le {dateFr(p.created_at.slice(0, 10))}
                  {p.derniere_utilisation ? ` · dernière connexion le ${dateFr(p.derniere_utilisation.slice(0, 10))}` : ''}
                </span>
              </span>
              <Bouton variante="danger" enCours={enCours === p.id} onClick={() => retirer(p)}>
                <Trash2 className="size-4" aria-hidden /> Retirer
              </Bouton>
            </li>
          ))}
        </ul>
      )}
      {message && <p className="mt-3 text-sm text-emerald-800">{message}</p>}
      <Alerte>{erreur}</Alerte>
      <p className="mt-3 text-sm text-muted-foreground">
        Téléphone perdu ou changé ? Retirez sa passkey ici, ou demandez au bureau de couper l’accès. Le lien de connexion reste
        toujours possible.
      </p>
    </Bloc>
  )
}

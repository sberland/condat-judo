// Connexion par passkey (spec 005c) : Face ID, empreinte ou code du téléphone, proposée après une
// connexion, jamais imposée. La clé privée reste dans le téléphone ; le Worker ne garde que la clé
// publique, rattachée au compte.
import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  sendSignal,
  startAuthentication,
  startRegistration,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser'
import { appel, ErreurApi } from './api'

export type Passkey = { id: string; appareil: string | null; created_at: string; derniere_utilisation: string | null }

// Choix mémorisé sur CE téléphone : passkey activée ici, ou proposition refusée (plus sollicité).
const CLE_CHOIX = 'condat-judo-passkey'
type Choix = 'activee' | 'refusee'

export function choixPasskey(): Choix | null {
  try {
    const v = localStorage.getItem(CLE_CHOIX)
    return v === 'activee' || v === 'refusee' ? v : null
  } catch {
    return null
  }
}

export function memoriserChoix(choix: Choix | null) {
  try {
    if (choix) localStorage.setItem(CLE_CHOIX, choix)
    else localStorage.removeItem(CLE_CHOIX)
  } catch {
    // Stockage indisponible (navigation privée) : la proposition reviendra, sans gravité.
  }
}

/** Ce navigateur sait-il utiliser le déverrouillage du téléphone (Face ID, empreinte, code) ? */
export async function passkeyDisponible(): Promise<boolean> {
  if (!browserSupportsWebAuthn()) return false
  try {
    return await platformAuthenticatorIsAvailable()
  } catch {
    return false
  }
}

/** Nom du déverrouillage à afficher : « Face ID » sur iPhone, « l’empreinte » ailleurs. */
export function nomDeverrouillage(ua = navigator.userAgent): string {
  if (/iPhone|iPad/.test(ua)) return 'Face ID'
  if (/Macintosh/.test(ua)) return 'Touch ID'
  if (/Windows/.test(ua)) return 'Windows Hello'
  return 'l’empreinte'
}

/** Libellé de l'appareil, déduit du navigateur (« iPhone · Safari ») : pour s'y retrouver au retrait. */
export function libelleAppareil(ua = navigator.userAgent): string {
  const appareil = /iPhone/.test(ua)
    ? 'iPhone'
    : /iPad/.test(ua)
      ? 'iPad'
      : /Android/.test(ua)
        ? 'Android'
        : /Macintosh/.test(ua)
          ? 'Mac'
          : /Windows/.test(ua)
            ? 'PC Windows'
            : /Linux/.test(ua)
              ? 'Linux'
              : 'Appareil'
  const navigateur = /Edg\//.test(ua)
    ? 'Edge'
    : /SamsungBrowser/.test(ua)
      ? 'Samsung Internet'
      : /Firefox|FxiOS/.test(ua)
        ? 'Firefox'
        : /Chrome|CriOS/.test(ua)
          ? 'Chrome'
          : /Safari/.test(ua)
            ? 'Safari'
            : ''
  return navigateur ? `${appareil} · ${navigateur}` : appareil
}

/** La personne a fermé la fenêtre du téléphone ou n'a pas répondu : rien à signaler. */
export function annule(err: unknown): boolean {
  return err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'AbortError')
}

/** Active une passkey sur ce téléphone pour le compte connecté. */
export async function activerPasskey(): Promise<void> {
  const optionsJSON = await appel<PublicKeyCredentialCreationOptionsJSON>('POST', '/api/auth/passkey/enregistrement/options')
  let reponse
  try {
    reponse = await startRegistration({ optionsJSON })
  } catch (err) {
    // Déjà activée sur ce téléphone pour ce compte : c'est ce qu'on voulait.
    if (err instanceof Error && 'code' in err && err.code === 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED') {
      memoriserChoix('activee')
      return
    }
    throw err
  }
  await appel('POST', '/api/auth/passkey/enregistrement', { reponse, appareil: libelleAppareil() })
  memoriserChoix('activee')
}

/** Connexion par passkey : le téléphone propose le compte, la personne se déverrouille. */
export async function seConnecterParPasskey(): Promise<void> {
  const optionsJSON = await appel<PublicKeyCredentialRequestOptionsJSON>('POST', '/api/auth/passkey/connexion/options')
  const reponse = await startAuthentication({ optionsJSON })
  try {
    await appel('POST', '/api/auth/passkey/connexion', reponse)
  } catch (err) {
    // Passkey retirée (ou compte supprimé) : on demande au téléphone de ne plus la proposer, et la
    // page Connexion remet le lien en premier.
    if (err instanceof ErreurApi && err.corps.inconnue) {
      sendSignal({ signalName: 'unknownCredential', rpID: window.location.hostname, credentialID: reponse.id }).catch(() => undefined)
      memoriserChoix(null)
    }
    throw err
  }
  memoriserChoix('activee')
}

// Connexion par passkey (spec 005c) : Face ID, empreinte ou code du téléphone, en complément du
// lien de connexion (005a). WebAuthn via @simplewebauthn/server ; clé publique rattachée à
// users.id. Identifiant de la partie de confiance (RP ID) = nom d'hôte du site : une passkey créée
// sur une adresse ne vaut que pour elle (à refaire après un changement de domaine).
import type { Context } from 'hono';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import type { AppEnv } from './droits';

const NOM_SITE = 'Judo Condat-sur-Vienne';
const DUREE_DEFI = "datetime('now', '+5 minutes')";

/**
 * Origine et RP ID de la requête : l'origine du navigateur (en-tête Origin), qui doit désigner le
 * même hôte que l'API (en local, Vite :5173 relaie vers le Worker :8787 : même nom d'hôte).
 */
export function origineAttendue(origine: string | undefined, urlRequete: string): { origine: string; rpID: string } | null {
  if (!origine) return null;
  try {
    const o = new URL(origine);
    const hote = new URL(urlRequete).hostname;
    if (o.hostname !== hote) return null;
    if (o.protocol !== 'https:' && o.hostname !== 'localhost') return null;
    return { origine: o.origin, rpID: o.hostname };
  } catch {
    return null;
  }
}

/** Libellé d'appareil lisible et court, fourni par le navigateur (« iPhone · Safari »). */
export const libelleAppareil = (v: unknown) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, 60) : '') || 'Appareil';

async function enregistrerDefi(c: Context<AppEnv>, defi: string, type: 'enregistrement' | 'connexion', userId: number | null) {
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM defis_passkey WHERE expire_le < datetime('now')"),
    c.env.DB.prepare(`INSERT INTO defis_passkey (defi, type, user_id, expire_le) VALUES (?, ?, ?, ${DUREE_DEFI})`).bind(defi, type, userId),
  ]);
}

/** Consomme un défi (usage unique) : vrai s'il existait, pour ce type (et ce compte), non expiré. */
async function consommerDefi(c: Context<AppEnv>, defi: string, type: 'enregistrement' | 'connexion', userId: number | null): Promise<boolean> {
  const r = await c.env.DB.prepare(
    `DELETE FROM defis_passkey WHERE defi = ? AND type = ? AND user_id IS ? AND expire_le >= datetime('now') RETURNING defi`,
  )
    .bind(defi, type, userId)
    .first();
  return !!r;
}

// --- Enregistrement (compte connecté) ---

export async function optionsEnregistrement(c: Context<AppEnv>, rpID: string) {
  const u = c.get('utilisateur');
  const { results } = await c.env.DB.prepare('SELECT id, transports FROM passkeys WHERE user_id = ?').bind(u.id).all<{ id: string; transports: string | null }>();
  const options = await generateRegistrationOptions({
    rpName: NOM_SITE,
    rpID,
    userID: new Uint8Array(new TextEncoder().encode(`condat-judo-${u.id}`)),
    userName: u.email ?? `${u.prenom} ${u.nom}`,
    userDisplayName: `${u.prenom} ${u.nom}`,
    attestationType: 'none',
    excludeCredentials: results.map((p) => ({ id: p.id, transports: p.transports ? (JSON.parse(p.transports) as string[]) : undefined })),
    authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
  });
  await enregistrerDefi(c, options.challenge, 'enregistrement', u.id);
  return options;
}

export async function verifierEnregistrement(c: Context<AppEnv>, attendu: { origine: string; rpID: string }, reponse: unknown, appareil: unknown) {
  const userId = c.get('utilisateur').id;
  const v = await verifyRegistrationResponse({
    response: reponse as RegistrationResponseJSON,
    expectedChallenge: (defi) => consommerDefi(c, defi, 'enregistrement', userId),
    expectedOrigin: attendu.origine,
    expectedRPID: attendu.rpID,
    requireUserVerification: false,
  });
  if (!v.verified) return false;
  const cred = v.registrationInfo.credential;
  await c.env.DB.prepare('INSERT INTO passkeys (id, user_id, cle_publique, compteur, transports, appareil) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(cred.id, userId, isoBase64URL.fromBuffer(cred.publicKey), cred.counter, cred.transports ? JSON.stringify(cred.transports) : null, libelleAppareil(appareil))
    .run();
  return true;
}

// --- Connexion (visiteur anonyme) ---

export async function optionsConnexion(c: Context<AppEnv>, rpID: string) {
  // Passkeys « découvrables » : le téléphone propose le compte, rien à saisir.
  const options = await generateAuthenticationOptions({ rpID, userVerification: 'preferred' });
  await enregistrerDefi(c, options.challenge, 'connexion', null);
  return options;
}

/**
 * Vérifie la réponse du téléphone ; renvoie le compte (users.id), « inconnue » (passkey retirée
 * ou compte supprimé : le téléphone peut l'oublier) ou null (vérification échouée).
 */
export async function verifierConnexion(c: Context<AppEnv>, attendu: { origine: string; rpID: string }, reponse: unknown): Promise<number | 'inconnue' | null> {
  const r = reponse as AuthenticationResponseJSON;
  if (!r || typeof r.id !== 'string') return null;
  const p = await c.env.DB.prepare(
    `SELECT pk.id, pk.user_id, pk.cle_publique, pk.compteur, pk.transports FROM passkeys pk
     JOIN users u ON u.id = pk.user_id AND u.supprime_le IS NULL WHERE pk.id = ?`,
  )
    .bind(r.id)
    .first<{ id: string; user_id: number; cle_publique: string; compteur: number; transports: string | null }>();
  if (!p) return 'inconnue';
  const v = await verifyAuthenticationResponse({
    response: r,
    expectedChallenge: (defi) => consommerDefi(c, defi, 'connexion', null),
    expectedOrigin: attendu.origine,
    expectedRPID: attendu.rpID,
    credential: {
      id: p.id,
      publicKey: isoBase64URL.toBuffer(p.cle_publique),
      counter: p.compteur,
      transports: p.transports ? (JSON.parse(p.transports) as string[]) : undefined,
    },
    requireUserVerification: false,
  });
  if (!v.verified) return null;
  await c.env.DB.prepare("UPDATE passkeys SET compteur = ?, derniere_utilisation = datetime('now') WHERE id = ?").bind(v.authenticationInfo.newCounter, p.id).run();
  return p.user_id;
}

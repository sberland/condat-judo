// Vérification du JWT Cloudflare Access (en-tête `Cf-Access-Jwt-Assertion`).
// Signature RS256 contrôlée contre les clés publiques de l'équipe Zero Trust, puis audience,
// émetteur et validité temporelle. Isolé ici : seul l'adaptateur Access (identite.ts) l'utilise.

export type AccessClaims = {
  sub: string;
  email?: string;
  aud: string | string[];
  iss: string;
  exp: number;
  nbf?: number;
  iat?: number;
};

export type AccessJwk = JsonWebKey & { kid?: string };
export type KeyFetcher = (teamDomain: string) => Promise<AccessJwk[]>;

export type VerifyOptions = {
  teamDomain: string;
  audience: string;
  fetchKeys?: KeyFetcher;
  /** Horloge injectable (ms) — tests. */
  now?: number;
};

const CLOCK_SKEW_S = 60;
const KEYS_TTL_MS = 10 * 60 * 1000;

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJson(part: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(part))) as Record<string, unknown>;
}

// Cache par isolat : les clés Access tournent rarement ; un kid inconnu force un rechargement.
let keyCache: { teamDomain: string; keys: AccessJwk[]; expiresAt: number } | null = null;

export const fetchAccessKeys: KeyFetcher = async (teamDomain) => {
  if (keyCache && keyCache.teamDomain === teamDomain && keyCache.expiresAt > Date.now()) {
    return keyCache.keys;
  }
  const response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!response.ok) throw new Error(`Clés Access indisponibles (${response.status})`);
  const body = (await response.json()) as { keys?: AccessJwk[] };
  const keys = body.keys ?? [];
  keyCache = { teamDomain, keys, expiresAt: Date.now() + KEYS_TTL_MS };
  return keys;
};

/** Motif de refus — non sensible, journalisable tel quel. */
export type RaisonRefus =
  | 'jeton-mal-forme'
  | 'algorithme'
  | 'cle-inconnue'
  | 'signature'
  | 'audience'
  | 'emetteur'
  | 'expire'
  | 'pas-encore-valide'
  | 'subject-absent';

export type Verification =
  | { ok: true; claims: AccessClaims }
  | { ok: false; raison: RaisonRefus; details?: Record<string, unknown> };

const refus = (raison: RaisonRefus, details?: Record<string, unknown>): Verification => ({ ok: false, raison, details });

export async function verifyAccessJwt(token: string, options: VerifyOptions): Promise<Verification> {
  const parts = token.split('.');
  if (parts.length !== 3) return refus('jeton-mal-forme');
  const [headerPart, payloadPart, signaturePart] = parts as [string, string, string];

  let header: Record<string, unknown>;
  let claims: Record<string, unknown>;
  try {
    header = decodeJson(headerPart);
    claims = decodeJson(payloadPart);
  } catch {
    return refus('jeton-mal-forme');
  }
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') return refus('algorithme', { alg: header.alg });

  const fetchKeys = options.fetchKeys ?? fetchAccessKeys;
  let jwk = (await fetchKeys(options.teamDomain)).find((k) => k.kid === header.kid);
  if (!jwk && !options.fetchKeys) {
    keyCache = null; // rotation de clés : un seul rechargement
    jwk = (await fetchKeys(options.teamDomain)).find((k) => k.kid === header.kid);
  }
  if (!jwk) return refus('cle-inconnue', { kid: header.kid });

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const signedData = new TextEncoder().encode(`${headerPart}.${payloadPart}`);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, base64UrlToBytes(signaturePart), signedData);
  if (!valid) return refus('signature');

  // Les détails ci-dessous (audience, émetteur, dates) sont publics : ils aident au diagnostic
  // d'une configuration (AUD / domaine d'équipe) sans rien exposer du jeton.
  const now = Math.floor((options.now ?? Date.now()) / 1000);
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.includes(options.audience)) return refus('audience', { recue: claims.aud, attendue: options.audience });
  if (claims.iss !== `https://${options.teamDomain}`) {
    return refus('emetteur', { recu: claims.iss, attendu: `https://${options.teamDomain}` });
  }
  if (typeof claims.exp !== 'number' || claims.exp + CLOCK_SKEW_S < now) return refus('expire', { exp: claims.exp, now });
  if (typeof claims.nbf === 'number' && claims.nbf - CLOCK_SKEW_S > now) {
    return refus('pas-encore-valide', { nbf: claims.nbf, now });
  }
  if (typeof claims.sub !== 'string' || claims.sub === '') return refus('subject-absent');

  return { ok: true, claims: claims as AccessClaims };
}

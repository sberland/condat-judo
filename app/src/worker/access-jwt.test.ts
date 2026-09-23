import { beforeAll, describe, expect, it } from 'vitest';
import { verifyAccessJwt, type AccessJwk } from './access-jwt';

const TEAM = 'equipe-test.cloudflareaccess.com';
const AUD = 'aud-condat-judo';
const NOW = Date.UTC(2026, 8, 23, 12, 0, 0);
const NOW_S = Math.floor(NOW / 1000);

let signingKey: CryptoKey;
let otherKey: CryptoKey;
let publicJwk: AccessJwk;

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeJson(value: unknown): string {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

async function signToken(
  claims: Record<string, unknown>,
  { key = signingKey, kid = 'k1', alg = 'RS256' }: { key?: CryptoKey; kid?: string; alg?: string } = {},
): Promise<string> {
  const unsigned = `${encodeJson({ alg, kid, typ: 'JWT' })}.${encodeJson(claims)}`;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${base64Url(new Uint8Array(signature))}`;
}

function validClaims(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    sub: 'sub-123',
    email: 'Parent@Example.test',
    aud: [AUD],
    iss: `https://${TEAM}`,
    iat: NOW_S - 10,
    nbf: NOW_S - 10,
    exp: NOW_S + 3600,
    ...overrides,
  };
}

const options = () => ({ teamDomain: TEAM, audience: AUD, now: NOW, fetchKeys: async () => [publicJwk] });

beforeAll(async () => {
  const params = {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  };
  const pair = (await crypto.subtle.generateKey(params, true, ['sign', 'verify'])) as CryptoKeyPair;
  const other = (await crypto.subtle.generateKey(params, true, ['sign', 'verify'])) as CryptoKeyPair;
  signingKey = pair.privateKey;
  otherKey = other.privateKey;
  publicJwk = { ...((await crypto.subtle.exportKey('jwk', pair.publicKey)) as JsonWebKey), kid: 'k1' };
});

const refusePour = async (token: string) => {
  const result = await verifyAccessJwt(token, options());
  return result.ok ? 'accepté' : result.raison;
};

describe('verifyAccessJwt', () => {
  it('accepte un jeton valide et renvoie ses claims', async () => {
    const result = await verifyAccessJwt(await signToken(validClaims()), options());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.claims.sub).toBe('sub-123');
      expect(result.claims.email).toBe('Parent@Example.test');
    }
  });

  it('accepte une audience fournie en chaîne simple', async () => {
    expect(await refusePour(await signToken(validClaims({ aud: AUD })))).toBe('accepté');
  });

  it('refuse une signature faite avec une autre clé', async () => {
    expect(await refusePour(await signToken(validClaims(), { key: otherKey }))).toBe('signature');
  });

  it('refuse un kid inconnu', async () => {
    expect(await refusePour(await signToken(validClaims(), { kid: 'inconnu' }))).toBe('cle-inconnue');
  });

  it('refuse un algorithme autre que RS256', async () => {
    expect(await refusePour(await signToken(validClaims(), { alg: 'none' }))).toBe('algorithme');
  });

  it('refuse une autre audience et indique les deux valeurs', async () => {
    const result = await verifyAccessJwt(await signToken(validClaims({ aud: ['aud-preview'] })), options());
    expect(result).toEqual({ ok: false, raison: 'audience', details: { recue: ['aud-preview'], attendue: AUD } });
  });

  it('refuse un autre émetteur', async () => {
    const token = await signToken(validClaims({ iss: 'https://autre-equipe.cloudflareaccess.com' }));
    expect(await refusePour(token)).toBe('emetteur');
  });

  it('refuse un jeton expiré (au-delà de la tolérance d’horloge)', async () => {
    expect(await refusePour(await signToken(validClaims({ exp: NOW_S - 120 })))).toBe('expire');
  });

  it('refuse un jeton sans subject', async () => {
    expect(await refusePour(await signToken(validClaims({ sub: '' })))).toBe('subject-absent');
  });

  it('refuse un jeton altéré', async () => {
    const token = await signToken(validClaims());
    const [h, , s] = token.split('.');
    const forged = `${h}.${encodeJson(validClaims({ sub: 'intrus' }))}.${s}`;
    expect(await refusePour(forged)).toBe('signature');
  });

  it('refuse un jeton mal formé', async () => {
    expect(await refusePour('pas.un-jwt')).toBe('jeton-mal-forme');
    expect(await refusePour('a.b.c')).toBe('jeton-mal-forme');
  });
});

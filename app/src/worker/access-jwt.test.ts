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

describe('verifyAccessJwt', () => {
  it('accepte un jeton valide et renvoie ses claims', async () => {
    const claims = await verifyAccessJwt(await signToken(validClaims()), options());
    expect(claims?.sub).toBe('sub-123');
    expect(claims?.email).toBe('Parent@Example.test');
  });

  it('accepte une audience fournie en chaîne simple', async () => {
    expect(await verifyAccessJwt(await signToken(validClaims({ aud: AUD })), options())).not.toBeNull();
  });

  it('refuse une signature faite avec une autre clé', async () => {
    expect(await verifyAccessJwt(await signToken(validClaims(), { key: otherKey }), options())).toBeNull();
  });

  it('refuse un kid inconnu', async () => {
    expect(await verifyAccessJwt(await signToken(validClaims(), { kid: 'inconnu' }), options())).toBeNull();
  });

  it('refuse un algorithme autre que RS256', async () => {
    expect(await verifyAccessJwt(await signToken(validClaims(), { alg: 'none' }), options())).toBeNull();
  });

  it('refuse une autre audience (application Access d’un autre environnement)', async () => {
    expect(await verifyAccessJwt(await signToken(validClaims({ aud: ['aud-preview'] })), options())).toBeNull();
  });

  it('refuse un autre émetteur', async () => {
    const token = await signToken(validClaims({ iss: 'https://autre-equipe.cloudflareaccess.com' }));
    expect(await verifyAccessJwt(token, options())).toBeNull();
  });

  it('refuse un jeton expiré (au-delà de la tolérance d’horloge)', async () => {
    expect(await verifyAccessJwt(await signToken(validClaims({ exp: NOW_S - 120 })), options())).toBeNull();
  });

  it('refuse un jeton sans subject', async () => {
    expect(await verifyAccessJwt(await signToken(validClaims({ sub: '' })), options())).toBeNull();
  });

  it('refuse un jeton altéré', async () => {
    const token = await signToken(validClaims());
    const [h, , s] = token.split('.');
    const forged = `${h}.${encodeJson(validClaims({ sub: 'intrus' }))}.${s}`;
    expect(await verifyAccessJwt(forged, options())).toBeNull();
  });

  it('refuse un jeton mal formé', async () => {
    expect(await verifyAccessJwt('pas.un-jwt', options())).toBeNull();
    expect(await verifyAccessJwt('a.b.c', options())).toBeNull();
  });
});

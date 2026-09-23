import { describe, expect, it } from 'vitest';
import type { Env } from './env';
import { resolveIdentite } from './identite';

const requete = new Request('https://condat-judo.example.test/api/me');

// Seul le fournisseur `dev` existe à ce stade ; il ne touche pas à la base.
const env = (vars: Partial<Env>): Env => ({ ENVIRONMENT: 'production', ...vars }) as Env;

describe('resolveIdentite — fournisseur dev', () => {
  it('résout l’utilisateur simulé en local', async () => {
    expect(await resolveIdentite(requete, env({ ENVIRONMENT: 'local', DEV_SUBJECT: 'dev-admin' }))).toEqual({
      provider: 'dev',
      subject: 'dev-admin',
      email: null,
    });
  });

  it('ignore DEV_SUBJECT en production', async () => {
    expect(await resolveIdentite(requete, env({ ENVIRONMENT: 'production', DEV_SUBJECT: 'dev-admin' }))).toBeNull();
  });

  it('ignore DEV_SUBJECT en preview', async () => {
    expect(await resolveIdentite(requete, env({ ENVIRONMENT: 'preview', DEV_SUBJECT: 'dev-admin' }))).toBeNull();
  });

  it('reste anonyme en local sans DEV_SUBJECT', async () => {
    expect(await resolveIdentite(requete, env({ ENVIRONMENT: 'local' }))).toBeNull();
  });

  it('ignore tout en-tête ou cookie Cloudflare Access (verrou d’accès, pas une identité)', async () => {
    const avecAccess = new Request('https://condat-judo.example.test/api/me', {
      headers: { 'Cf-Access-Jwt-Assertion': 'a.b.c', Cookie: 'CF_Authorization=a.b.c' },
    });
    expect(await resolveIdentite(avecAccess, env({ ENVIRONMENT: 'preview' }))).toBeNull();
  });
});

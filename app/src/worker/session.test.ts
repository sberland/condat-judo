import { describe, expect, it } from 'vitest';
import { COOKIE_SESSION, cookieSession, cookieSessionEfface, empreinte, genererJeton, jetonSession, jetonValide } from './session';

const avecCookie = (cookie: string) => new Request('https://condat-judo.example.test/api/me', { headers: { Cookie: cookie } });

describe('jetons', () => {
  it('génère 256 bits aléatoires en base64url (43 caractères)', () => {
    const a = genererJeton();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(jetonValide(a)).toBe(true);
    expect(genererJeton()).not.toBe(a);
  });

  it('refuse tout jeton mal formé', () => {
    for (const v of ['', 'abc', `${genererJeton()}x`, 'a'.repeat(42) + '=', 12, null, undefined]) {
      expect(jetonValide(v)).toBe(false);
    }
  });

  it('stocke une empreinte SHA-256 hexadécimale, stable', async () => {
    expect(await empreinte('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    const j = genererJeton();
    expect(await empreinte(j)).toBe(await empreinte(j));
  });
});

describe('cookie de session', () => {
  it('lit le jeton parmi d’autres cookies', () => {
    const j = genererJeton();
    expect(jetonSession(avecCookie(`CF_Authorization=a.b.c; ${COOKIE_SESSION}=${j}; autre=1`))).toBe(j);
  });

  it('ignore un cookie absent ou mal formé', () => {
    expect(jetonSession(new Request('https://x.test/'))).toBeNull();
    expect(jetonSession(avecCookie(`${COOKIE_SESSION}=pas-un-jeton`))).toBeNull();
    expect(jetonSession(avecCookie(`session=${genererJeton()}`))).toBeNull();
  });

  it('pose un cookie __Host- HttpOnly, Secure, SameSite=Lax, 180 jours', () => {
    const c = cookieSession('j');
    expect(c).toMatch(/^__Host-session=j; /);
    for (const attribut of ['Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax', `Max-Age=${180 * 86400}`]) expect(c).toContain(attribut);
    expect(c).not.toMatch(/Domain=/i);
    expect(cookieSessionEfface).toContain('Max-Age=0');
  });
});

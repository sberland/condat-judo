import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from './droits';
import { entreeJournal, journaliser } from './journal';

describe('journal des accès sensibles', () => {
  it('consultation de la fiche d’un adhérent (coordonnées des responsables)', () => {
    expect(entreeJournal('GET', '/api/admin/adherents/:id', { id: '12' })).toEqual({ action: 'consultation', cible: 'adherent', cible_id: 12, detail: null });
  });

  it('modifications, avec leur objet', () => {
    expect(entreeJournal('PUT', '/api/admin/adherents/:id/responsables/:userId', { id: '3', userId: '7' })).toMatchObject({ action: 'modification', cible_id: 3, detail: 'responsable' });
    expect(entreeJournal('PUT', '/api/admin/comptes/:id/roles', { id: '5' })).toMatchObject({ cible: 'compte', cible_id: 5, detail: 'rôles' });
    expect(entreeJournal('POST', '/api/admin/comptes/:id/lien', { id: '5' })).toMatchObject({ action: 'lien_connexion' });
  });

  it('liste des comptes (coordonnées de tous) et fiche famille du trésorier', () => {
    expect(entreeJournal('GET', '/api/admin/comptes', {})).toEqual({ action: 'consultation', cible: 'comptes', cible_id: null, detail: null });
    expect(entreeJournal('GET', '/api/tresorerie/familles/:id', { id: '4' })).toMatchObject({ cible: 'famille', cible_id: 4 });
  });

  it('routes sans données de contact : rien', () => {
    expect(entreeJournal('GET', '/api/admin/adherents', {})).toBe(null);
    expect(entreeJournal('GET', '/api/admin/competitions/:id/inscriptions', { id: '1' })).toBe(null);
    expect(entreeJournal('GET', '/api/admin/adherents/:id/adhesion', { id: '1' })).toBe(null);
  });
});

describe('middleware du journal', () => {
  it('journalise la route qui a répondu, malgré la route de repli des fichiers statiques', async () => {
    const lignes: unknown[][] = [];
    const env = { DB: { prepare: () => ({ bind: (...v: unknown[]) => ({ run: async () => void lignes.push(v) }) }) } };
    const admin = new Hono<AppEnv>();
    admin.use('*', async (c, next) => {
      c.set('utilisateur', { id: 7 } as never);
      await next();
    }, journaliser);
    admin.get('/adherents/:id', (c) => c.json({ ok: true }));
    admin.get('/adherents/:id/absent', (c) => c.json({ error: 'introuvable' }, 404));
    const app = new Hono<AppEnv>();
    app.route('/api/admin', admin);
    app.all('*', (c) => c.text('fichiers statiques'));

    await app.request('/api/admin/adherents/3', {}, env as never);
    await app.request('/api/admin/adherents/3/absent', {}, env as never);
    expect(lignes).toEqual([[7, 'consultation', 'adherent', 3, null]]);
  });
});

// Photos d'identification des enfants pour la garderie (spec 012b) — stockées en base (base64),
// servies par l'API, jamais mises en cache. Une photo n'est montrée à l'encadrant que si l'accord
// « photo pour la garderie » de la saison courante est « oui » et qu'elle a moins d'un an.
import type { Context } from 'hono';
import type { Recueil } from '../../web/src/content/adhesion';
import type { AppEnv } from './droits';
import type { Env } from './env';
import type { PhotoSaisie } from './validation';

/** Condition SQL (alias `p` de photos_adherents) : photo de moins d'un an. */
export const PHOTO_RECENTE = "p.deposee_le >= datetime('now', '-1 year')";

type Photo = { image: string; type: string; deposee_le: string };

export async function lirePhoto(env: Env, adherentId: number): Promise<Photo | null> {
  return env.DB.prepare(`SELECT image, type, deposee_le FROM photos_adherents p WHERE adherent_id = ? AND ${PHOTO_RECENTE}`)
    .bind(adherentId)
    .first<Photo>();
}

/** L'image elle-même : privée, jamais mise en cache (ni navigateur, ni intermédiaire). */
export function reponsePhoto(c: Context<AppEnv>, photo: Photo | null) {
  if (!photo) return c.json({ error: 'Pas de photo' }, 404);
  const octets = Uint8Array.from(atob(photo.image), (car) => car.charCodeAt(0));
  return c.body(octets, 200, { 'Content-Type': photo.type, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
}

export const enregistrerPhoto = (env: Env, adherentId: number, photo: PhotoSaisie, par: number) =>
  env.DB.prepare(
    `INSERT INTO photos_adherents (adherent_id, image, type, deposee_par) VALUES (?, ?, ?, ?)
     ON CONFLICT (adherent_id) DO UPDATE SET image = excluded.image, type = excluded.type,
       deposee_le = datetime('now'), deposee_par = excluded.deposee_par`,
  ).bind(adherentId, photo.image, photo.type, par);

export const effacerPhoto = (env: Env, adherentId: number) => env.DB.prepare('DELETE FROM photos_adherents WHERE adherent_id = ?').bind(adherentId);

/** Accord « photo pour la garderie » du dossier de la saison, ou null sans dossier. */
export async function accordPhoto(env: Env, adherentId: number, saison: string): Promise<Recueil | null> {
  const d = await env.DB.prepare('SELECT photo_garderie FROM adhesions WHERE adherent_id = ? AND saison = ?')
    .bind(adherentId, saison)
    .first<{ photo_garderie: Recueil }>();
  return d?.photo_garderie ?? null;
}

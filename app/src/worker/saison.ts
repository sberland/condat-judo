// Saisons (spec 003) — la saison courante (dossiers, trésorerie, accords) et le référentiel d'une
// saison donnée (catégories d'une compétition, d'après sa date). Lectures mémorisées pour la
// requête : une route peut en demander plusieurs fois sans relire la base.
import type { Context } from 'hono';
import { saisonDe, type Referentiel, type Saison } from '../../web/src/content/referentiel';
import type { AppEnv } from './droits';

type LigneSaison = {
  id: string;
  libelle: string;
  debut: string;
  fin: string;
  courante: number;
  inscriptions_ouvertes: number;
  referentiel: string;
};

export const COLONNES_SAISON = 'id, libelle, debut, fin, courante, inscriptions_ouvertes, referentiel';

export const versSaison = (l: LigneSaison): Saison => ({
  id: l.id,
  libelle: l.libelle,
  debut: l.debut,
  fin: l.fin,
  courante: l.courante === 1,
  inscriptions_ouvertes: l.inscriptions_ouvertes === 1,
  referentiel: JSON.parse(l.referentiel) as Referentiel,
});

function cache(c: Context<AppEnv>): Map<string, Saison> {
  let m = c.get('saisons');
  if (!m) {
    m = new Map();
    c.set('saisons', m);
  }
  return m;
}

/** Saison courante (choisie par le bureau). Toujours présente : insérée par la migration 0008. */
export async function saisonCourante(c: Context<AppEnv>): Promise<Saison> {
  const m = cache(c);
  const deja = m.get('courante');
  if (deja) return deja;
  const l = await c.env.DB.prepare(`SELECT ${COLONNES_SAISON} FROM saisons WHERE courante = 1`).first<LigneSaison>();
  if (!l) throw new Error('Aucune saison courante');
  const s = versSaison(l);
  m.set('courante', s).set(s.id, s);
  return s;
}

/** Saison d'une date (ex. une compétition), si elle est préparée ; sinon la saison courante. */
export async function saisonPourDate(c: Context<AppEnv>, date: string): Promise<Saison> {
  const id = saisonDe(date);
  const m = cache(c);
  const deja = m.get(id);
  if (deja) return deja;
  const courante = await saisonCourante(c);
  if (courante.id === id) return courante;
  const l = await c.env.DB.prepare(`SELECT ${COLONNES_SAISON} FROM saisons WHERE id = ?`).bind(id).first<LigneSaison>();
  const s = l ? versSaison(l) : courante;
  m.set(id, s);
  return s;
}

/** Saison publique (vitrine) : libellé et référentiel, sans rien d'interne. */
export const saisonPublique = (s: Saison) => ({ id: s.id, libelle: s.libelle, debut: s.debut, fin: s.fin, referentiel: s.referentiel });

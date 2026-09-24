// Événements du club (specs 009, 021) — routes PUBLIQUES : informations d'un événement (type, date,
// lieu, infos pratiques), comme la vitrine. Aucune donnée d'enfant ici : les inscriptions passent
// par /api/famille (responsable) et /api/admin (bureau). Table et routes gardent leur nom
// historique « competitions » : une compétition est un type d'événement parmi d'autres.
import { Hono, type Context } from 'hono';
import type { AppEnv } from '../droits';
import type { ModeInscription, TypeEvenement } from '../../../web/src/content/evenements';

export const competitions = new Hono<AppEnv>();

export const COLONNES_COMPETITION = 'id, type, inscription, nom, date, heure, lieu, adresse, lien_officiel, infos, categories, sexe, date_limite, statut';

type LigneCompetition = {
  id: number;
  type: TypeEvenement;
  inscription: ModeInscription;
  nom: string;
  date: string;
  heure: string | null;
  lieu: string;
  adresse: string | null;
  lien_officiel: string | null;
  infos: string | null;
  categories: string;
  sexe: 'F' | 'M' | null;
  date_limite: string;
  statut: 'ouverte' | 'cloturee' | 'annulee';
};

export type Competition = Omit<LigneCompetition, 'categories'> & { categories: string[] };

export const versCompetition = (l: LigneCompetition): Competition => ({ ...l, categories: JSON.parse(l.categories) as string[] });

/** Date du jour à Paris (AAAA-MM-JJ) : la date limite s'entend en heure française. */
export const aujourdhuiParis = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });

/** Inscriptions ouvertes : événement « ouvert », avec inscription, date limite non dépassée (jour inclus). */
export const inscriptionsOuvertes = (c: Competition) => c.statut === 'ouverte' && c.inscription !== 'aucune' && aujourdhuiParis() <= c.date_limite;

export async function lireCompetition(c: Context<AppEnv>, id: number): Promise<Competition | null> {
  const l = await c.env.DB.prepare(`SELECT ${COLONNES_COMPETITION} FROM competitions WHERE id = ?`).bind(id).first<LigneCompetition>();
  return l ? versCompetition(l) : null;
}

// Événements à venir (y compris annulés, signalés comme tels).
competitions.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(`SELECT ${COLONNES_COMPETITION} FROM competitions WHERE date >= ? ORDER BY date, id`)
    .bind(aujourdhuiParis())
    .all<LigneCompetition>();
  return c.json(results.map(versCompetition).map((comp) => ({ ...comp, inscriptionsOuvertes: inscriptionsOuvertes(comp) })));
});

competitions.get('/:id', async (c) => {
  const comp = await lireCompetition(c, Number(c.req.param('id')) || 0);
  return comp ? c.json({ ...comp, inscriptionsOuvertes: inscriptionsOuvertes(comp) }) : c.json({ error: 'Événement introuvable' }, 404);
});

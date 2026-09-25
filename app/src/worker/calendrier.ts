// Abonnement agenda aux événements du club (spec 013) : flux iCalendar (RFC 5545) public,
// /api/calendrier.ics — aucune donnée personnelle (informations publiques des événements).
// Événement sans heure : journée entière ; avec heure : 2 h, heure de Paris. Annulé : STATUS:CANCELLED.
import { TYPES_EVENEMENT, type TypeEvenement } from '../../web/src/content/evenements';

export type EvenementAgenda = {
  id: number;
  type: TypeEvenement;
  nom: string;
  date: string; // AAAA-MM-JJ
  heure: string | null; // HH:MM
  lieu: string;
  adresse: string | null;
  infos: string | null;
  statut: 'ouverte' | 'cloturee' | 'annulee';
  updated_at: string; // AAAA-MM-JJ HH:MM:SS (UTC)
};

/** Échappement d'une valeur texte (antislash, virgule, point-virgule, saut de ligne). */
export const echapper = (v: string) => v.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Pliage des lignes à 75 octets (UTF-8), sans couper un caractère. */
export function plier(ligne: string): string {
  const encodeur = new TextEncoder();
  const morceaux: string[] = [];
  let courant = '';
  let octets = 0;
  for (const car of ligne) {
    const n = encodeur.encode(car).length;
    // 75 octets pour la première ligne, 74 ensuite (l'espace de continuation compte).
    if (octets + n > (morceaux.length ? 74 : 75)) {
      morceaux.push(courant);
      courant = '';
      octets = 0;
    }
    courant += car;
    octets += n;
  }
  morceaux.push(courant);
  return morceaux.join('\r\n ');
}

const compacte = (date: string) => date.replaceAll('-', '');
const horodatage = (utc: string) => `${utc.slice(0, 10).replaceAll('-', '')}T${utc.slice(11, 19).replaceAll(':', '')}Z`;
const lendemain = (date: string) => new Date(Date.parse(`${date}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

const FUSEAU_PARIS = [
  'BEGIN:VTIMEZONE',
  'TZID:Europe/Paris',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

/** Le flux complet ; `origine` : adresse du site (liens vers la page de chaque événement). */
export function calendrierIcs(evenements: EvenementAgenda[], origine: string, maintenant = new Date()): string {
  const stamp = horodatage(maintenant.toISOString().slice(0, 19).replace('T', ' '));
  const lignes = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Judo Condat-sur-Vienne//Evenements//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Judo Condat-sur-Vienne',
    'X-WR-TIMEZONE:Europe/Paris',
    'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
    ...FUSEAU_PARIS,
  ];
  for (const e of evenements) {
    const url = `${origine}/evenements/${e.id}`;
    const description = [TYPES_EVENEMENT[e.type], e.infos, url].filter(Boolean).join('\n\n');
    lignes.push(
      'BEGIN:VEVENT',
      `UID:evenement-${e.id}@judo-condat`,
      `DTSTAMP:${stamp}`,
      `LAST-MODIFIED:${horodatage(e.updated_at)}`,
      ...(e.heure
        ? [`DTSTART;TZID=Europe/Paris:${compacte(e.date)}T${e.heure.replace(':', '')}00`, 'DURATION:PT2H']
        : [`DTSTART;VALUE=DATE:${compacte(e.date)}`, `DTEND;VALUE=DATE:${compacte(lendemain(e.date))}`]),
      `SUMMARY:${echapper(e.statut === 'annulee' ? `Annulé — ${e.nom}` : e.nom)}`,
      `LOCATION:${echapper([e.lieu, e.adresse].filter(Boolean).join(', '))}`,
      `DESCRIPTION:${echapper(description)}`,
      `URL:${url}`,
      `STATUS:${e.statut === 'annulee' ? 'CANCELLED' : 'CONFIRMED'}`,
      'END:VEVENT',
    );
  }
  lignes.push('END:VCALENDAR');
  return lignes.map(plier).join('\r\n') + '\r\n';
}

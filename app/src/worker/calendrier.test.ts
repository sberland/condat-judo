import { describe, expect, it } from 'vitest';
import { calendrierIcs, echapper, plier, type EvenementAgenda } from './calendrier';

const base: EvenementAgenda = {
  id: 7,
  type: 'repas',
  nom: 'Repas de Noël, du club',
  date: '2026-12-12',
  heure: '19:30',
  lieu: 'Salle des fêtes',
  adresse: '1 rue de l’Exemple',
  infos: 'Apportez un dessert ; merci !',
  statut: 'ouverte',
  updated_at: '2026-09-25 08:00:00',
};

describe('calendrier des événements (iCal)', () => {
  const ics = calendrierIcs([base, { ...base, id: 8, nom: 'Fête du club', heure: null, date: '2027-06-19', statut: 'annulee', infos: null }], 'https://club.test', new Date('2026-09-25T10:00:00Z'));
  const lignes = ics.split('\r\n');

  it('flux iCalendar valide : en-têtes, fuseau de Paris, fins de ligne CRLF', () => {
    expect(lignes[0]).toBe('BEGIN:VCALENDAR');
    expect(ics).toContain('TZID:Europe/Paris');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.split('BEGIN:VEVENT').length - 1).toBe(2);
  });

  it('avec heure : heure de Paris et durée ; sans heure : journée entière', () => {
    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20261212T193000');
    expect(ics).toContain('DURATION:PT2H');
    expect(ics).toContain('DTSTART;VALUE=DATE:20270619');
    expect(ics).toContain('DTEND;VALUE=DATE:20270620');
  });

  it('échappe virgules et points-virgules, marque les annulations, lie la page de l’événement', () => {
    expect(ics).toContain('SUMMARY:Repas de Noël\\, du club');
    expect(ics).toContain('STATUS:CANCELLED');
    expect(ics).toContain('SUMMARY:Annulé — Fête du club');
    expect(ics).toContain('URL:https://club.test/evenements/7');
    expect(echapper('a;b,c\\d\ne')).toBe('a\\;b\\,c\\\\d\\ne');
  });

  it('plie les lignes à 75 octets sans couper un caractère accentué', () => {
    const longue = `DESCRIPTION:${'é'.repeat(80)}`;
    const pliee = plier(longue).split('\r\n');
    expect(pliee.length).toBeGreaterThan(1);
    for (const l of pliee) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
    expect(pliee.map((l, i) => (i ? l.slice(1) : l)).join('')).toBe(longue);
  });
});

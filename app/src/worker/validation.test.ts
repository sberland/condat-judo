import { describe, expect, it } from 'vitest';
import {
  casseNom,
  normaliserTelephone,
  validerAdherent,
  validerCompte,
  validerLien,
  validerPersonneAutorisee,
} from './validation';

const AUJOURDHUI = new Date('2026-09-24T12:00:00Z');

describe('casseNom', () => {
  it('normalise la casse des noms composés', () => {
    expect(casseNom('DUPONT-MARTIN')).toBe('Dupont-Martin');
    expect(casseNom('jean pierre')).toBe('Jean Pierre');
    expect(casseNom("d'ARTAGNAN")).toBe("D'Artagnan");
    expect(casseNom('ÉLODIE')).toBe('Élodie');
  });
});

describe('normaliserTelephone', () => {
  it('formate un numéro français', () => {
    expect(normaliserTelephone('0612345678')).toBe('06 12 34 56 78');
    expect(normaliserTelephone('06.12.34.56.78')).toBe('06 12 34 56 78');
  });
  it('accepte le format international', () => {
    expect(normaliserTelephone('+33 6 12 34 56 78')).toBe('+33612345678');
  });
  it('refuse le reste', () => {
    expect(normaliserTelephone('12345')).toBeNull();
  });
});

describe('validerAdherent', () => {
  const base = { prenom: 'LÉA', nom: 'dupont', date_naissance: '2017-03-12', sexe: 'F' };

  it('accepte une saisie minimale et normalise', () => {
    const r = validerAdherent({ ...base, ville: ' Condat-sur-Vienne ', code_postal: '87920' }, AUJOURDHUI);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.valeur.prenom).toBe('Léa');
      expect(r.valeur.nom).toBe('Dupont');
      expect(r.valeur.ville).toBe('Condat-sur-Vienne');
      expect(r.valeur.grade).toBeNull();
    }
  });

  it('signale chaque champ en erreur', () => {
    const r = validerAdherent({ prenom: ' ', date_naissance: '2017-02-30', sexe: 'X', code_postal: '879' }, AUJOURDHUI);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.erreurs).sort()).toEqual(['code_postal', 'date_naissance', 'nom', 'prenom', 'sexe']);
  });

  it('refuse une date de naissance dans le futur', () => {
    const r = validerAdherent({ ...base, date_naissance: '2027-01-01' }, AUJOURDHUI);
    expect(r.ok).toBe(false);
  });
});

describe('validerCompte', () => {
  it('exige un e-mail ou un téléphone', () => {
    expect(validerCompte({ prenom: 'A', nom: 'B' }).ok).toBe(false);
    expect(validerCompte({ prenom: 'A', nom: 'B', telephone: '0612345678' }).ok).toBe(true);
  });
  it('met l’e-mail en minuscules et le valide', () => {
    const r = validerCompte({ prenom: 'A', nom: 'B', email: 'Parent@Example.TEST' });
    expect(r.ok && r.valeur.email).toBe('parent@example.test');
    expect(validerCompte({ prenom: 'A', nom: 'B', email: 'pas-un-email' }).ok).toBe(false);
  });
});

describe('validerLien', () => {
  it('exige une qualité connue et convertit les capacités', () => {
    expect(validerLien({ qualite: 'voisin' }).ok).toBe(false);
    const r = validerLien({ qualite: 'mere', peut_inscrire: true, peut_recuperer: false, est_contact: 1 });
    expect(r.ok && r.valeur).toEqual({ qualite: 'mere', peut_inscrire: 1, peut_recuperer: 0, est_contact: 1 });
  });
});

describe('validerPersonneAutorisee', () => {
  it('exige prénom, nom et lien', () => {
    expect(validerPersonneAutorisee({ prenom: 'Jeanne', nom: 'Dev' }).ok).toBe(false);
    expect(validerPersonneAutorisee({ prenom: 'Jeanne', nom: 'Dev', lien: 'grand-mère' }).ok).toBe(true);
  });
});

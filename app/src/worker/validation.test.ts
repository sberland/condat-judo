import { describe, expect, it } from 'vitest';
import {
  casseNom,
  normaliserTelephone,
  validerAdhesion,
  validerCompetition,
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

describe('ceinture (liste officielle)', () => {
  const base = { prenom: 'Léa', nom: 'Dupont', date_naissance: '2017-03-12', sexe: 'F' };
  it('accepte une ceinture de la liste', () => {
    const r = validerAdherent({ ...base, grade: 'Orange-verte' }, AUJOURDHUI);
    expect(r.ok && r.valeur.grade).toBe('Orange-verte');
  });
  it('refuse une ceinture hors liste', () => {
    const r = validerAdherent({ ...base, grade: 'Arc-en-ciel' }, AUJOURDHUI);
    expect(!r.ok && r.erreurs.grade).toBeTruthy();
  });
});

describe('validerAdhesion', () => {
  it('accepte un dossier minimal : formule seule, consentements non recueillis', () => {
    const r = validerAdhesion({ formule: 'judo-micro-mini' }, AUJOURDHUI);
    expect(r.ok && r.valeur).toMatchObject({
      formule: 'judo-micro-mini',
      paiement_mode: null,
      formalite_type: null,
      soins_urgence: 'non_recueilli',
      droit_image: 'non_recueilli',
      whatsapp: 'non_recueilli',
    });
  });
  it('accepte un dossier complet', () => {
    const r = validerAdhesion(
      {
        formule: 'taiso',
        passeport: true,
        paiement_mode: 'cheque',
        paiement_3_fois: true,
        formalite_type: 'attestation_qs_sport',
        formalite_recue_le: '2026-09-10',
        soins_urgence: 'oui',
        droit_image: 'non',
        whatsapp: 'oui',
      },
      AUJOURDHUI,
    );
    expect(r.ok && r.valeur).toMatchObject({ passeport: 1, paiement_3_fois: 1, paiement_mode: 'cheque', droit_image: 'non' });
  });
  it('refuse formule, mode, pièce et consentement inconnus', () => {
    const r = validerAdhesion({ formule: 'karate', paiement_mode: 'bitcoin', formalite_type: 'radio', droit_image: 'peut-etre' }, AUJOURDHUI);
    expect(!r.ok && Object.keys(r.erreurs).sort()).toEqual(['droit_image', 'formalite_type', 'formule', 'paiement_mode']);
  });
  it('exige la pièce quand une date de réception est saisie, et refuse une date future', () => {
    expect(!validerAdhesion({ formule: 'taiso', formalite_recue_le: '2026-09-10' }, AUJOURDHUI).ok).toBe(true);
    const r = validerAdhesion({ formule: 'taiso', formalite_type: 'certificat', formalite_recue_le: '2027-01-01' }, AUJOURDHUI);
    expect(!r.ok && r.erreurs.formalite_recue_le).toBeTruthy();
  });
});

describe('validerCompetition', () => {
  const base = { nom: 'Tournoi de Limoges', date: '2026-11-15', lieu: 'Limoges', categories: ['poussins', 'benjamins'], date_limite: '2026-11-08' };
  it('accepte une compétition minimale (mixte, ouverte)', () => {
    const r = validerCompetition(base);
    expect(r.ok && r.valeur).toMatchObject({ sexe: null, statut: 'ouverte', adresse: null, categories: ['poussins', 'benjamins'] });
  });
  it('refuse une date limite après la compétition, une catégorie inconnue, un lien non web', () => {
    const r = validerCompetition({ ...base, date_limite: '2026-11-20', categories: ['poussins', 'dragons'], lien_officiel: 'ftp://x' });
    expect(!r.ok && Object.keys(r.erreurs).sort()).toEqual(['categories', 'date_limite', 'lien_officiel']);
  });
  it('exige au moins une catégorie', () => {
    const r = validerCompetition({ ...base, categories: [] });
    expect(!r.ok && r.erreurs.categories).toBeTruthy();
  });
  it('garde les sauts de ligne des infos pratiques', () => {
    const r = validerCompetition({ ...base, infos: 'Pesée 9 h\nCombats 10 h' });
    expect(r.ok && r.valeur.infos).toBe('Pesée 9 h\nCombats 10 h');
  });
});

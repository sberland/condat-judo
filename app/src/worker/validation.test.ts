import { describe, expect, it } from 'vitest';
import {
  casseNom,
  normaliserTelephone,
  validerAdhesion,
  validerCompetition,
  validerAdherent,
  validerCompte,
  validerLien,
  validerPaiement,
  validerPersonneAutorisee,
  validerPhoto,
} from './validation';
import { REFERENTIEL_2026_2027 as REF } from '../../web/src/content/referentiel-initial';

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
    const r = validerAdhesion({ formule: 'judo-micro-mini' }, REF.tarifs, AUJOURDHUI);
    expect(r.ok && r.valeur).toMatchObject({
      formule: 'judo-micro-mini',
      paiement_mode: null,
      formalite_type: null,
      soins_urgence: 'non_recueilli',
      droit_image: 'non_recueilli',
      whatsapp: 'non_recueilli',
      photo_garderie: null, // absent du formulaire : inchangé
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
        photo_garderie: 'oui',
      },
      REF.tarifs,
      AUJOURDHUI,
    );
    expect(r.ok && r.valeur).toMatchObject({ passeport: 1, paiement_3_fois: 1, paiement_mode: 'cheque', droit_image: 'non', photo_garderie: 'oui' });
  });
  it('refuse formule, mode, pièce et consentement inconnus', () => {
    const r = validerAdhesion({ formule: 'karate', paiement_mode: 'bitcoin', formalite_type: 'radio', droit_image: 'peut-etre' }, REF.tarifs, AUJOURDHUI);
    expect(!r.ok && Object.keys(r.erreurs).sort()).toEqual(['droit_image', 'formalite_type', 'formule', 'paiement_mode']);
  });
  it('exige la pièce quand une date de réception est saisie, et refuse une date future', () => {
    expect(!validerAdhesion({ formule: 'taiso', formalite_recue_le: '2026-09-10' }, REF.tarifs, AUJOURDHUI).ok).toBe(true);
    const r = validerAdhesion({ formule: 'taiso', formalite_type: 'certificat', formalite_recue_le: '2027-01-01' }, REF.tarifs, AUJOURDHUI);
    expect(!r.ok && r.erreurs.formalite_recue_le).toBeTruthy();
  });
});

describe('validerCompetition', () => {
  const base = { nom: 'Tournoi de Limoges', date: '2026-11-15', lieu: 'Limoges', categories: ['poussins', 'benjamins'], date_limite: '2026-11-08' };
  it('accepte une compétition minimale (mixte, ouverte)', () => {
    const r = validerCompetition(base, REF.categories);
    expect(r.ok && r.valeur).toMatchObject({ sexe: null, statut: 'ouverte', adresse: null, categories: ['poussins', 'benjamins'] });
  });
  it('refuse une date limite après la compétition, une catégorie inconnue, un lien non web', () => {
    const r = validerCompetition({ ...base, date_limite: '2026-11-20', categories: ['poussins', 'dragons'], lien_officiel: 'ftp://x' }, REF.categories);
    expect(!r.ok && Object.keys(r.erreurs).sort()).toEqual(['categories', 'date_limite', 'lien_officiel']);
  });
  it('exige au moins une catégorie', () => {
    const r = validerCompetition({ ...base, categories: [] }, REF.categories);
    expect(!r.ok && r.erreurs.categories).toBeTruthy();
  });
  it('garde les sauts de ligne des infos pratiques', () => {
    const r = validerCompetition({ ...base, infos: 'Pesée 9 h\nCombats 10 h' }, REF.categories);
    expect(r.ok && r.valeur.infos).toBe('Pesée 9 h\nCombats 10 h');
  });
});

describe('validerCompetition — autres événements (spec 021)', () => {
  const base = { nom: 'Repas du club', date: '2026-12-12', lieu: 'Salle des fêtes', date_limite: '2026-12-05' };
  it('une compétition sans type reste une compétition qui inscrit des enfants', () => {
    const r = validerCompetition({ ...base, categories: ['poussins'], inscription: 'famille' }, REF.categories);
    expect(r.ok && r.valeur).toMatchObject({ type: 'competition', inscription: 'enfants' });
  });
  it('repas : inscription de la famille, sans catégorie ni sexe', () => {
    const r = validerCompetition({ ...base, type: 'repas', inscription: 'famille', categories: ['poussins'], sexe: 'F', heure: '19:30' }, REF.categories);
    expect(r.ok && r.valeur).toMatchObject({ type: 'repas', inscription: 'famille', categories: [], sexe: null, heure: '19:30' });
  });
  it('stage ouvert à tous les enfants : catégories facultatives', () => {
    expect(validerCompetition({ ...base, type: 'stage', inscription: 'enfants' }, REF.categories).ok).toBe(true);
  });
  it('sans inscription : la date limite est celle de l’événement', () => {
    const r = validerCompetition({ nom: 'Fête du club', date: '2027-06-19', lieu: 'Dojo', type: 'fete', inscription: 'aucune' }, REF.categories);
    expect(r.ok && r.valeur.date_limite).toBe('2027-06-19');
  });
  it('refuse un type, un mode ou une heure inconnus', () => {
    const r = validerCompetition({ ...base, type: 'bal', inscription: 'tous', heure: '25:00' }, REF.categories);
    expect(!r.ok && Object.keys(r.erreurs).sort()).toEqual(['heure', 'inscription', 'type']);
  });
});

describe('validerPaiement', () => {
  const cheque = {
    montant: 13000,
    mode: 'cheque',
    reference: ' Chèque 0000001  Banque Exemple ',
    recu_le: '2026-09-10',
    encaisser_le: '2026-10-05',
    parts: [
      { adhesion_id: 1, montant: 8000 },
      { adhesion_id: 3, montant: 5000 },
    ],
  };

  it('accepte un chèque réparti sur deux dossiers', () => {
    const r = validerPaiement(cheque);
    expect(r.ok).toBe(true);
    expect(r.ok && r.valeur.reference).toBe('Chèque 0000001 Banque Exemple');
    expect(r.ok && r.valeur.parts).toHaveLength(2);
  });

  it('refuse une répartition qui ne totalise pas le montant', () => {
    const r = validerPaiement({ ...cheque, montant: 12000 });
    expect(!r.ok && r.erreurs.parts).toBe('La répartition doit totaliser le montant');
  });

  it('refuse montant, mode et dates invalides', () => {
    const r = validerPaiement({ ...cheque, montant: 12.5, mode: 'bitcoin', recu_le: '10/09/2026', encaisser_le: '2026-02-30' });
    expect(!r.ok && Object.keys(r.erreurs).sort()).toEqual(['encaisser_le', 'mode', 'montant', 'recu_le']);
  });

  it('refuse un paiement sans dossier, ou un dossier en double', () => {
    expect(!validerPaiement({ ...cheque, parts: [] }).ok).toBe(true);
    const r = validerPaiement({ ...cheque, parts: [{ adhesion_id: 1, montant: 6500 }, { adhesion_id: 1, montant: 6500 }] });
    expect(!r.ok && r.erreurs.parts).toBe('Un dossier apparaît deux fois');
  });

  it('date d’encaissement facultative', () => {
    const r = validerPaiement({ ...cheque, encaisser_le: '' });
    expect(r.ok && r.valeur.encaisser_le).toBe(null);
  });
});

describe('validerPhoto', () => {
  const jpeg = btoa(String.fromCharCode(0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1));
  const webp = btoa('RIFF   WEBPVP8 ');
  it('accepte un JPEG et un WebP en base64', () => {
    expect(validerPhoto({ image: jpeg, type: 'image/jpeg' })).toEqual({ ok: true, valeur: { image: jpeg, type: 'image/jpeg' } });
    expect(validerPhoto({ image: webp, type: 'image/webp' }).ok).toBe(true);
  });
  it('refuse un autre format, un fichier déguisé, un base64 invalide', () => {
    expect(validerPhoto({ image: jpeg, type: 'image/png' }).ok).toBe(false);
    expect(validerPhoto({ image: webp, type: 'image/jpeg' }).ok).toBe(false);
    expect(validerPhoto({ image: 'pas du base64 !', type: 'image/jpeg' }).ok).toBe(false);
    expect(validerPhoto({ type: 'image/jpeg' }).ok).toBe(false);
  });
  it('refuse une photo de plus de 60 Ko', () => {
    const lourde = btoa(String.fromCharCode(0xff, 0xd8, 0xff) + 'x'.repeat(61 * 1024));
    const r = validerPhoto({ image: lourde, type: 'image/jpeg' });
    expect(!r.ok && r.erreurs.image).toMatch(/trop lourde/);
  });
});

// Grille tarifaire de la saison — séparée de club.ts pour être partagée avec le Worker (calcul de
// référence des dossiers d'adhésion, spec 010a) : pas de DOM, pas de React ici.
// Montants en CENTIMES (calculs exacts) ; affichage via lib/tarifs.ts. Cohérence vérifiée par
// les tests (content/club.test.ts) : total = participation + licence, échéancier = total.

/** Suppléments et réduction du formulaire 2026/2027 (centimes). */
export const MONTANTS = { passeport: 800, horsCommune: 200, reductionFamille: 800 } as const

// ⚠️ Licence 46 € (judo) / 43,80 € (taïso, yoga) : tels que sur le formulaire, à confirmer.

export type Formule = {
  id: string
  nom: string
  public: string
  participation: number
  licence: number
  /** Paiement en 3 fois : 1er versement (licence + part de l'activité), 2e, 3e. */
  echeancier: [number, number, number]
}

export type GroupeTarifs = { titre: string; formules: Formule[] }

export type Ajustement = { libelle: string; montant: number; precision: string }

export const TARIFS: {
  provisoire: boolean
  saison: string
  groupes: GroupeTarifs[]
  supplements: Ajustement[]
  reductions: Ajustement[]
  modesPaiement: string[]
} = {
  provisoire: false,
  saison: '2026/2027',
  groupes: [
    {
      titre: 'Judo',
      formules: [
        {
          id: 'judo-micro-mini',
          nom: 'Micro-poussins et mini-poussins',
          public: 'Nés en 2019, 2020, 2021 ou 2022',
          participation: 8200,
          licence: 4600,
          echeancier: [7400, 2700, 2700],
        },
        {
          id: 'judo-poussins-juniors',
          nom: 'Poussins à juniors',
          public: 'Nés de 2007 à 2018',
          participation: 10100,
          licence: 4600,
          echeancier: [8000, 3400, 3300],
        },
        {
          id: 'judo-adulte',
          nom: 'Judo adulte',
          public: 'Adultes',
          participation: 7500,
          licence: 4600,
          echeancier: [7100, 2500, 2500],
        },
      ],
    },
    {
      titre: 'Taïso et yoga',
      formules: [
        { id: 'taiso', nom: 'Taïso', public: 'Tout public', participation: 7520, licence: 4380, echeancier: [6900, 2500, 2500] },
        {
          id: 'yoga-1',
          nom: 'Yoga — lundi ou jeudi',
          public: 'Un cours par semaine',
          participation: 5920,
          licence: 4380,
          echeancier: [6300, 2000, 2000],
        },
        {
          id: 'yoga-2',
          nom: 'Yoga — lundi et jeudi',
          public: 'Deux cours par semaine',
          participation: 11920,
          licence: 4380,
          echeancier: [8300, 4000, 4000],
        },
      ],
    },
  ],
  supplements: [
    {
      libelle: 'Passeport sportif',
      montant: MONTANTS.passeport,
      precision: 'Recommandé pour les compétiteurs, à partir de poussin (judo).',
    },
    { libelle: 'Résident hors commune', montant: MONTANTS.horsCommune, precision: 'Pour les adhérents qui n’habitent pas Condat-sur-Vienne.' },
  ],
  reductions: [
    { libelle: 'Réduction famille', montant: MONTANTS.reductionFamille, precision: 'Sur la deuxième licence d’une même famille.' },
  ],
  modesPaiement: ['Chèque', 'Espèces', 'Carte bancaire', 'Chèques vacances et autres'],
}


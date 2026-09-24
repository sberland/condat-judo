// Référentiel de la saison 2026/2027 tel qu'il était dans le code avant la spec 003 : formulaire
// d'inscription papier du club (grille), catégories France Judo, horaires provisoires. La
// migration 0008 l'insère en base ; ensuite, la base fait foi (écran Saisons du bureau). Sert aux
// tests (cohérence de la grille, identité avec la migration).
import type { Referentiel } from './referentiel'

export const REFERENTIEL_2026_2027: Referentiel = {
  categories: [
    { id: 'micro-poussins', nom: 'Micro-poussins', de: 2021, a: 2022 },
    { id: 'mini-poussins', nom: 'Mini-poussins', de: 2019, a: 2020 },
    { id: 'poussins', nom: 'Poussins', de: 2017, a: 2018 },
    { id: 'benjamins', nom: 'Benjamins', de: 2015, a: 2016 },
    { id: 'minimes', nom: 'Minimes', de: 2013, a: 2014 },
    { id: 'cadets', nom: 'Cadets', de: 2010, a: 2012 },
    { id: 'juniors', nom: 'Juniors', de: 2007, a: 2009 },
    { id: 'seniors', nom: 'Seniors', de: 1900, a: 2006 },
  ],
  tarifs: {
    provisoire: false,
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
            judo: true,
            annees: { de: 2019, a: 2022 },
          },
          {
            id: 'judo-poussins-juniors',
            nom: 'Poussins à juniors',
            public: 'Nés de 2007 à 2018',
            participation: 10100,
            licence: 4600,
            echeancier: [8000, 3400, 3300],
            judo: true,
            annees: { de: 2007, a: 2018 },
          },
          {
            id: 'judo-adulte',
            nom: 'Judo adulte',
            public: 'Adultes',
            participation: 7500,
            licence: 4600,
            echeancier: [7100, 2500, 2500],
            judo: true,
            annees: { de: 1900, a: 2006 },
          },
        ],
      },
      {
        titre: 'Taïso et yoga',
        formules: [
          { id: 'taiso', nom: 'Taïso', public: 'Tout public', participation: 7520, licence: 4380, echeancier: [6900, 2500, 2500], judo: false, annees: null },
          {
            id: 'yoga-1',
            nom: 'Yoga — lundi ou jeudi',
            public: 'Un cours par semaine',
            participation: 5920,
            licence: 4380,
            echeancier: [6300, 2000, 2000],
            judo: false,
            annees: null,
          },
          {
            id: 'yoga-2',
            nom: 'Yoga — lundi et jeudi',
            public: 'Deux cours par semaine',
            participation: 11920,
            licence: 4380,
            echeancier: [8300, 4000, 4000],
            judo: false,
            annees: null,
          },
        ],
      },
    ],
    passeport: { montant: 800, precision: 'Recommandé pour les compétiteurs, à partir de poussin (judo).' },
    horsCommune: { montant: 200, precision: 'Pour les adhérents qui n’habitent pas Condat-sur-Vienne.' },
    reductionFamille: { montant: 800, precision: 'Sur la deuxième licence d’une même famille.' },
    modesPaiement: ['Chèque', 'Espèces', 'Carte bancaire', 'Chèques vacances et autres'],
  },
  echeances3Fois: { dates: ['2027-01-05', '2027-04-05'], provisoire: true },
  horaires: {
    provisoire: true,
    cours: [
      { jour: 'lundi', debut: '18:30', fin: '19:45', cours: 'Yoga', public: 'Adultes' },
      { jour: 'mardi', debut: '19:00', fin: '20:00', cours: 'Taïso', public: 'Adultes' },
      { jour: 'mercredi', debut: '16:00', fin: '16:45', cours: 'Éveil judo', public: '4-5 ans' },
      { jour: 'mercredi', debut: '17:00', fin: '18:00', cours: 'Judo enfants', public: '6-9 ans' },
      { jour: 'jeudi', debut: '18:00', fin: '19:15', cours: 'Yoga', public: 'Adultes' },
      { jour: 'jeudi', debut: '19:30', fin: '21:00', cours: 'Jujitsu', public: 'Ados et adultes' },
      { jour: 'vendredi', debut: '18:00', fin: '19:30', cours: 'Judo jeunes', public: '10-15 ans' },
    ],
  },
}

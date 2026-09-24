// Identité du site et textes fixes (spec 001). Le contenu administré par le club (coordonnées,
// équipe, disciplines, partenaires, règlement, liens) est en base depuis la spec 014 :
// content/contenu.ts (description), content/contenu-initial.ts (valeurs initiales et de repli).
// Code moral : texte officiel de France Judo (ffjudo.com/le-code-moral-du-judo).

export const CLUB = {
  nom: 'Judo Condat',
  nomComplet: 'Judo Condat-sur-Vienne',
  ville: 'Condat-sur-Vienne',
} as const

// --- Mises en forme ---

/** « a, b, c et d » */
export function enumerer(mots: string[]): string {
  return mots.length < 2 ? mots.join('') : `${mots.slice(0, -1).join(', ')} et ${mots[mots.length - 1]}`
}

export const majuscule = (s: string) => s.charAt(0).toLocaleUpperCase('fr-FR') + s.slice(1)

const NOMBRES = ['Aucune', 'Une', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf', 'Dix']
/** 4 → « Quatre » (disciplines, façons de pratiquer…). */
export const enLettres = (n: number) => NOMBRES[n] ?? String(n)

/** Une valeur d'une discipline ; `origine` : son nom d'origine (ex. « Ahimsa »). */
export type Valeur = { nom: string; definition: string; lignes: string[]; origine?: string }

// Les 8 valeurs du code moral du judo — texte officiel France Judo.
export const CODE_MORAL: Valeur[] = [
  {
    nom: 'Amitié',
    definition: 'C’est partager et évoluer ensemble.',
    lignes: ['S’entraider, progresser, se faire confiance.', 'L’amitié, c’est apprendre ensemble, en se soutenant et en s’amusant.'],
  },
  {
    nom: 'Courage',
    definition: 'C’est dépasser sa peur.',
    lignes: ['Essayer, tomber, recommencer.', 'Le courage, c’est oser même quand on ne sait pas si on va y arriver.'],
  },
  {
    nom: 'Respect',
    definition: 'C’est écouter les autres et les considérer.',
    lignes: [
      'Reconnaître la valeur de chaque personne et ce qu’elle apporte.',
      'Le respect, c’est accepter les différences et reconnaître les efforts.',
    ],
  },
  {
    nom: 'Contrôle de soi',
    definition: 'C’est garder son calme.',
    lignes: ['Respirer, réfléchir, se maîtriser.', 'Se contrôler, c’est choisir la paix pour soi et avec les autres.'],
  },
  {
    nom: 'Honneur',
    definition: 'C’est faire ce que l’on dit.',
    lignes: [
      'Tenir ses promesses, être juste et respecter ses engagements.',
      'L’honneur, c’est faire ce qui est bien, même quand personne ne regarde.',
    ],
  },
  {
    nom: 'Politesse',
    definition: 'C’est dire les mots magiques.',
    lignes: ['Un bonjour, une écoute, un merci.', 'La politesse, c’est prendre soin des autres, sur le tatami comme dans la vie.'],
  },
  {
    nom: 'Sincérité',
    definition: 'C’est dire la vérité.',
    lignes: ['Être honnête, même quand ce n’est pas facile.', 'La sincérité, c’est être soi-même, sans tricher avec les autres.'],
  },
  {
    nom: 'Modestie',
    definition: 'C’est être fier sans se faire remarquer.',
    lignes: [
      'On progresse, on apprend, on s’améliore en gardant les pieds sur terre.',
      'La modestie, c’est rester curieux, et laisser les autres briller aussi.',
    ],
  },
]

// Les principes de vie du yoga (yamas, Yoga Sutras de Patanjali), en mots simples — proposés le
// 2026-09-24 (spec 020), à relire par le professeur de yoga.
export const PRINCIPES_YOGA: Valeur[] = [
  {
    nom: 'Non-violence',
    origine: 'Ahimsa',
    definition: 'C’est prendre soin de soi et des autres.',
    lignes: ['Ne pas forcer : écouter son corps, respecter ses limites.', 'Être bienveillant, avec soi comme avec les autres.'],
  },
  {
    nom: 'Vérité',
    origine: 'Satya',
    definition: 'C’est être sincère.',
    lignes: ['Dire vrai, avec douceur.', 'Pratiquer tel que l’on est, sans chercher à paraître.'],
  },
  {
    nom: 'Honnêteté',
    origine: 'Asteya',
    definition: 'C’est ne pas prendre ce qui n’est pas à soi.',
    lignes: ['Respecter le temps, l’espace et les efforts des autres.', 'Ne pas se comparer : chacun son chemin.'],
  },
  {
    nom: 'Modération',
    origine: 'Brahmacharya',
    definition: 'C’est trouver la juste mesure.',
    lignes: ['Doser son énergie, ni trop ni trop peu.', 'Savoir s’arrêter pour mieux progresser.'],
  },
  {
    nom: 'Non-attachement',
    origine: 'Aparigraha',
    definition: 'C’est lâcher prise.',
    lignes: ['Accueillir chaque séance comme elle vient.', 'Se libérer du superflu, garder l’essentiel.'],
  },
]

// Information des personnes sur leurs données (spec 006, art. 13 RGPD) — page « Données
// personnelles », mentions de l'espace membres. Registre des traitements détaillé :
// workspace/docs/rgpd/registre-traitements.md (même contenu, à tenir cohérent).
//
// ⚠️ Valeurs `provisoire: true` = réponse du club attendue : affichées « À compléter » en local /
// qualif ; le déploiement en prod ÉCHOUE tant qu'il en reste une (contrôle dans deploy.yml).

export type Valeur<T> = { valeur: T; provisoire: boolean }

export const RGPD: {
  /** Qui traite les demandes des familles (consulter, corriger, supprimer). */
  contact: Valeur<string>
  /** Conservation des données d'un adhérent qui ne se réinscrit pas. */
  conservationAdherents: Valeur<string>
  /** Destinataires hors du bureau. */
  destinataires: Valeur<string[]>
} = {
  contact: { valeur: 'le bureau du club, par écrit (adresse à préciser)', provisoire: true },
  conservationAdherents: { valeur: '3 saisons après la dernière adhésion', provisoire: true },
  destinataires: {
    valeur: ['France Judo, pour la prise de licence', 'France Judo et l’organisateur, pour l’inscription aux compétitions'],
    provisoire: true,
  },
}

/** Durées fixées par le fonctionnement du site (pas de décision du club requise). */
export const DUREES_TECHNIQUES = [
  { quoi: 'Session de connexion (cookie)', duree: '6 mois après la dernière visite' },
  { quoi: 'Lien de connexion', duree: '7 jours, une seule utilisation' },
  { quoi: 'Sauvegardes chiffrées de la base', duree: '1 an au plus (30 quotidiennes, puis une par mois)' },
  { quoi: 'Consentements (droit à l’image, WhatsApp)', duree: 'jusqu’à leur retrait, et au plus la durée de conservation de l’adhérent' },
] as const

export type Traitement = { titre: string; donnees: string[]; finalite: string; base: string }

export const TRAITEMENTS: Traitement[] = [
  {
    titre: 'Adhésion et vie du club',
    donnees: [
      'Adhérent : nom, prénom, date de naissance, sexe, ceinture, n° de licence, adresse',
      'Responsables légaux : nom, prénom, e-mail, téléphone, lien avec l’enfant et droits (inscrire, récupérer, être prévenu)',
      'Personnes autorisées à récupérer l’enfant : nom, lien, téléphone',
      'Dossier : formule, montant, mode de paiement, date de réception de la formalité médicale',
    ],
    finalite: 'Gérer les inscriptions, la licence, les paiements et la sécurité des enfants (qui peut les récupérer).',
    base: 'Exécution de l’adhésion à l’association.',
  },
  {
    titre: 'Cotisations et paiements',
    donnees: [
      'Montant dû par adhérent et échéancier',
      'Paiements reçus : date, montant, mode, référence du chèque (n°, banque), dates d’encaissement',
    ],
    finalite: 'Suivre qui a payé quoi et ce qui reste dû ; tenir la comptabilité de l’association.',
    base: 'Exécution de l’adhésion à l’association ; obligations comptables de l’association.',
  },
  {
    titre: 'Compétitions',
    donnees: [
      'Inscription : compétition, qui a inscrit l’enfant et quand',
      'Ressaisi sur le site de France Judo pour l’organisateur : nom, prénom, date de naissance, sexe, catégorie, ceinture, n° de licence',
    ],
    finalite: 'Inscrire les enfants aux compétitions choisies par leurs parents.',
    base: 'Exécution de l’adhésion à l’association, à votre demande (vous inscrivez votre enfant).',
  },
  {
    titre: 'Autorisations et consentements',
    donnees: ['Autorisation de soins d’urgence', 'Droit à l’image', 'Ajout au groupe WhatsApp du club'],
    finalite: 'Savoir ce que chaque famille a accepté ou refusé, avec la date et qui l’a saisi.',
    base: 'Votre consentement, retirable à tout moment (soins d’urgence : intérêt vital de l’enfant).',
  },
  {
    titre: 'Espace membres',
    donnees: ['Compte : nom, e-mail, téléphone, rôle au club', 'Connexion : cookie de session, date de dernière visite'],
    finalite: 'Vous permettre de consulter les informations de vos enfants et, au bureau, de gérer le club.',
    base: 'Nécessaire au service que vous demandez en vous connectant.',
  },
  {
    titre: 'Sauvegardes',
    donnees: ['Copie chiffrée de l’ensemble de la base'],
    finalite: 'Pouvoir restaurer les données en cas d’incident.',
    base: 'Intérêt légitime du club (sécurité des données).',
  },
]

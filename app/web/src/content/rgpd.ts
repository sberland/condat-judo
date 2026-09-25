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
  /** Conservation des données d'un adhérent qui ne se réinscrit pas, en saisons après la dernière
   *  adhésion (appliquée par la purge automatique, spec 019 — inactive tant que provisoire). */
  conservationAdherents: Valeur<number>
  /** Destinataires hors du bureau. */
  destinataires: Valeur<string[]>
} = {
  contact: { valeur: 'le bureau du club, par écrit (adresse à préciser)', provisoire: true },
  conservationAdherents: { valeur: 3, provisoire: true },
  destinataires: {
    valeur: ['France Judo, pour la prise de licence', 'France Judo et l’organisateur, pour l’inscription aux compétitions'],
    provisoire: true,
  },
}

/** « 3 saisons après la dernière adhésion ». */
export const texteConservation = (saisons: number) => `${saisons} saison${saisons > 1 ? 's' : ''} après la dernière adhésion`

/** Durées fixées par le fonctionnement du site (pas de décision du club requise). */
export const DUREES_TECHNIQUES = [
  { quoi: 'Session de connexion (cookie)', duree: '6 mois après la dernière visite' },
  { quoi: 'Lien de connexion', duree: '7 jours, une seule utilisation' },
  { quoi: 'Connexion par Face ID / empreinte (clé publique)', duree: 'jusqu’à son retrait par vous ou par le bureau, ou la suppression du compte' },
  { quoi: 'Sauvegardes chiffrées de la base', duree: '1 an au plus (30 quotidiennes, puis une par mois)' },
  { quoi: 'Consentements (droit à l’image, WhatsApp, photo pour la garderie)', duree: 'jusqu’à leur retrait, et au plus la durée de conservation de l’adhérent' },
  { quoi: 'Journal des consultations et modifications des coordonnées des familles', duree: '1 an' },
  { quoi: 'Photo d’un enfant pour la garderie', duree: '1 an après son dépôt, ou jusqu’au retrait de l’accord' },
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
      'Dossier rempli en ligne : date d’envoi, acceptation datée du règlement, de l’information assurance et de cette information, attestation du questionnaire de santé (votre réponse et sa date seulement, jamais le questionnaire)',
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
    titre: 'Garderie du mercredi',
    donnees: [
      'Demande : enfant, mercredi, lieu de récupération, qui l’a faite et quand',
      'Photo de l’enfant (si vous l’acceptez), montrée aux seuls encadrants, le mercredi même',
      'Pour l’encadrant, le jour même : responsables et personnes autorisées à récupérer l’enfant, avec leur téléphone',
      'Pointage : heure de prise en charge à la garderie, personne avec qui l’enfant est parti et à quelle heure',
    ],
    finalite:
      'Savoir quels enfants récupérer chaque mercredi, et où ; les reconnaître, ne les confier qu’aux personnes autorisées, et permettre aux parents de suivre la prise en charge.',
    base:
      'Exécution de l’adhésion à l’association, à votre demande ; photo : votre consentement, retirable à tout moment. Demandes et pointages effacés un an après le mercredi, photo un an après son dépôt.',
  },
  {
    titre: 'Événements et compétitions',
    donnees: [
      'Inscription d’un enfant : événement, qui l’a inscrit et quand',
      'Inscription d’une famille (repas, fête…) : responsable, nombre d’adultes et d’enfants',
      'Ressaisi sur le site de France Judo pour l’organisateur : nom, prénom, date de naissance, sexe, catégorie, ceinture, n° de licence',
    ],
    finalite: 'Inscrire les enfants et les familles aux événements du club (compétitions, stages, repas…), à leur demande.',
    base: 'Exécution de l’adhésion à l’association, à votre demande. Inscriptions des familles effacées un an après l’événement.',
  },
  {
    titre: 'Autorisations et consentements',
    donnees: ['Autorisation de soins d’urgence', 'Droit à l’image', 'Ajout au groupe WhatsApp du club', 'Photo pour la garderie du mercredi'],
    finalite: 'Savoir ce que chaque famille a accepté ou refusé, avec la date et qui l’a saisi.',
    base: 'Votre consentement, retirable à tout moment (soins d’urgence : intérêt vital de l’enfant).',
  },
  {
    titre: 'Espace membres',
    donnees: [
      'Compte : nom, e-mail, téléphone, rôle au club',
      'Connexion : cookie de session, date de dernière visite',
      'Si vous l’activez, connexion par Face ID / empreinte : une clé publique et le nom de l’appareil (votre visage ou votre empreinte restent dans le téléphone)',
    ],
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

// Aide intégrée à l'espace membres (spec 016) — source unique de l'aide de l'espace.
// ⚠️ Toute spec qui modifie un écran de l'espace met à jour la rubrique concernée
// (règle de workflow-dev-spe.md). Rédaction : langage simple, vouvoiement, pas de jargon.
import type { Role } from '../lib/api'

/** Profil minimal pour voir une rubrique : famille = tout compte connecté. */
export type ProfilAide = 'famille' | 'bureau' | 'admin'

export type IdRubrique =
  | 'connexion'
  | 'mes-enfants'
  | 'donnees'
  | 'adherents'
  | 'adhesions'
  | 'responsables'
  | 'liens-connexion'
  | 'comptes'
  | 'roles'

export type RubriqueAide = {
  id: IdRubrique
  titre: string
  profil: ProfilAide
  questions: { q: string; r: string[] }[]
}

// Rôles qui donnent accès à chaque profil (un administrateur voit tout).
const ROLES_DU_PROFIL: Record<Exclude<ProfilAide, 'famille'>, Role[]> = {
  bureau: ['bureau', 'admin'],
  admin: ['admin'],
}

export const LIBELLES_PROFIL: Record<ProfilAide, string> = { famille: 'Tous', bureau: 'Bureau', admin: 'Administrateur' }

export const RUBRIQUES_AIDE: RubriqueAide[] = [
  // --- Famille : tout compte connecté ---
  {
    id: 'connexion',
    titre: 'Se connecter, rester connecté',
    profil: 'famille',
    questions: [
      {
        q: 'Comment me connecter ?',
        r: [
          'Le bureau du club vous envoie un lien personnel (WhatsApp ou SMS). Touchez-le depuis votre téléphone, puis « Me connecter sur cet appareil ». Pas de mot de passe à retenir.',
          'Le lien ne fonctionne qu’une fois et pendant 7 jours. Il est personnel : ne le transférez à personne, il ouvre une session sur votre compte.',
          'Ensuite, le bouton « Mon espace », en haut à droite de chaque page, vous y ramène directement.',
        ],
      },
      {
        q: 'Combien de temps je reste connecté ?',
        r: ['6 mois, et chaque visite prolonge ce délai : si vous venez régulièrement, vous n’aurez presque jamais à vous reconnecter.'],
      },
      {
        q: 'J’ai changé de téléphone, ou mon lien a expiré',
        r: ['Demandez un nouveau lien au bureau du club. Il remplace le précédent.'],
      },
      {
        q: 'J’ai perdu mon téléphone',
        r: ['Prévenez le bureau : il peut déconnecter tous vos appareils à distance, puis vous envoyer un nouveau lien.'],
      },
      {
        q: 'Comment me déconnecter ?',
        r: ['Bouton « Mon espace » (en haut à droite) → « Se déconnecter », en bas de la page. Utile sur un appareil partagé : les informations affichées sont effacées de l’appareil.'],
      },
    ],
  },
  {
    id: 'mes-enfants',
    titre: 'Mes enfants',
    profil: 'famille',
    questions: [
      {
        q: 'Que trouve-t-on dans « Mes enfants » ?',
        r: [
          'La fiche de chaque enfant dont vous êtes responsable : âge, ceinture, n° de licence, les autres responsables et les personnes autorisées à venir le chercher.',
        ],
      },
      {
        q: 'Que veulent dire « inscrire », « récupérer » et « prévenu » ?',
        r: [
          'Inscrire : vous pouvez l’inscrire aux compétitions et à la garderie du mercredi.',
          'Récupérer : vous pouvez venir le chercher à la fin du cours ou de la garderie.',
          'Prévenu : le club vous contacte pour ce qui le concerne.',
          'Ces droits sont fixés par le bureau, pour chaque responsable.',
        ],
      },
      {
        q: 'L’autre parent voit-il mes informations ?',
        r: [
          'Chaque responsable a son propre compte et ne voit que les enfants auxquels il est lié, avec le nom des autres responsables. Ni votre e-mail ni votre téléphone ne lui sont montrés.',
        ],
      },
      {
        q: 'Une information est fausse, ou mon numéro a changé',
        r: [
          'Votre téléphone : modifiez-le vous-même dans « Mes coordonnées ».',
          'Tout le reste (fiche d’un enfant, personnes autorisées…) : signalez-le au bureau, qui met la fiche à jour.',
        ],
      },
    ],
  },
  {
    id: 'donnees',
    titre: 'Vos données',
    profil: 'famille',
    questions: [
      {
        q: 'Qui voit les informations de mes enfants ?',
        r: ['Les membres du bureau du club, et les responsables liés à l’enfant. Rien n’est public.'],
      },
      {
        q: 'Le site dépose-t-il des cookies ?',
        r: ['Un seul, strictement nécessaire pour vous garder connecté. Aucune publicité, aucune mesure d’audience.'],
      },
      {
        q: 'Consulter, corriger ou supprimer mes données',
        r: ['Adressez-vous au bureau du club.'],
      },
    ],
  },

  // --- Bureau ---
  {
    id: 'adherents',
    titre: 'Adhérents : saisir et tenir à jour',
    profil: 'bureau',
    questions: [
      {
        q: 'Ajouter un adhérent',
        r: [
          'Adhérents → « Ajouter un adhérent » : prénom, nom, date de naissance et sexe suffisent ; ceinture (liste officielle France Judo, « Aucune » pour le taïso ou le yoga), n° de licence et adresse peuvent attendre.',
          'Vous arrivez ensuite sur sa fiche pour lui ajouter ses responsables légaux.',
        ],
      },
      {
        q: 'Retrouver un adhérent',
        r: ['La recherche filtre la liste dès la première lettre (prénom ou nom). « Aucun responsable » signale une fiche à compléter.'],
      },
      {
        q: 'Modifier ou supprimer un adhérent',
        r: [
          'Sur sa fiche : « Modifier » pour l’identité ; « Supprimer l’adhérent » en bas du bloc.',
          'Une fiche supprimée reste restaurable (« Restaurer la fiche ») : rien n’est perdu en cas d’erreur.',
        ],
      },
    ],
  },
  {
    id: 'adhesions',
    titre: 'Dossiers d’adhésion de la saison',
    profil: 'bureau',
    questions: [
      {
        q: 'Ressaisir un formulaire papier',
        r: [
          '1. « Saisir un nouvel adhérent » (écran Dossiers ou Adhérents) : identité de l’enfant.',
          '2. Sur sa fiche, le formulaire « Responsables légaux » s’ouvre directement : ajoutez le ou les parents.',
          '3. Plus bas, « Adhésion » → « Saisir le dossier » : formule, paiement, formalité médicale, autorisations.',
          '4. Une fois enregistré, « Saisir l’adhérent suivant » enchaîne sur le formulaire suivant.',
        ],
      },
      {
        q: 'Comment le montant est-il calculé ?',
        r: [
          'D’après la grille de la saison : participation + licence, + passeport (judo) et hors commune, − réduction famille.',
          'La formule judo est proposée d’après l’année de naissance, « hors commune » d’après l’adresse, la réduction famille si un frère ou une sœur a déjà un dossier : vérifiez et corrigez si besoin.',
          'Le montant est figé à l’enregistrement ; en 3 fois, suppléments et réduction portent sur le 1er versement.',
        ],
      },
      {
        q: 'Formalité médicale : que noter ?',
        r: [
          'Seulement la pièce reçue (attestation du questionnaire de santé pour un mineur, certificat ou attestation QS-SPORT pour un majeur) et sa date. Jamais le contenu : le site ne conserve aucune information de santé.',
        ],
      },
      {
        q: 'Droit à l’image, WhatsApp, soins d’urgence : « Non recueilli » ?',
        r: [
          'Le formulaire papier disait le droit à l’image « accepté par l’inscription » : ce n’est pas un accord valable. Laissez « Non recueilli » tant que la famille n’a pas dit oui ou non explicitement.',
          'WhatsApp : reprenez la case cochée sur le papier. Soins d’urgence : « Non recueilli » s’ils ne figurent pas sur le papier.',
          'Ces réponses sont datées, avec le nom de qui les a saisies. Elles ne bloquent pas le dossier mais restent signalées « à recueillir ».',
        ],
      },
      {
        q: 'À compléter, complet, validé',
        r: [
          'À compléter : il manque un responsable (mineur), le mode de paiement ou la formalité médicale — l’écran dit quoi.',
          'Complet : tout y est ; « Valider le dossier » confirme qu’il a été vérifié.',
          'Modifier un dossier validé le repasse en « complet » : il faut le revalider.',
        ],
      },
      {
        q: 'Suivre l’avancement',
        r: ['Écran « Dossiers » : tous les adhérents, filtrables (sans dossier, à compléter, complets, validés), avec ce qui manque pour chacun et le total des montants.'],
      },
    ],
  },
  {
    id: 'responsables',
    titre: 'Responsables légaux et personnes autorisées',
    profil: 'bureau',
    questions: [
      {
        q: 'Ajouter un responsable à un enfant',
        r: [
          'Sur la fiche de l’enfant → Responsables légaux → « Ajouter ».',
          '« Compte existant » : pour un parent déjà enregistré (deuxième enfant, par exemple) — cherchez-le par son nom.',
          '« Nouveau parent » : prénom, nom, et au moins un e-mail ou un téléphone.',
          'Choisissez ensuite son lien avec l’enfant et ses droits : peut inscrire, peut récupérer, prévenu par le club.',
        ],
      },
      {
        q: 'Le site dit que l’e-mail est déjà utilisé',
        r: ['Ce parent a déjà un compte : touchez « Lier le compte existant » plutôt que d’en créer un second.'],
      },
      {
        q: 'Parents séparés',
        r: [
          'Créez un compte pour chacun et liez les deux à l’enfant, chacun avec ses propres droits. Aucun des deux n’a besoin de connaître les coordonnées de l’autre.',
        ],
      },
      {
        q: 'Modifier les droits d’un responsable, ou le retirer',
        r: ['Sur la fiche de l’enfant, « Modifier » sur la ligne du responsable. Retirer un responsable lui enlève immédiatement l’accès à cet enfant.'],
      },
      {
        q: 'Personnes autorisées à récupérer l’enfant',
        r: [
          'Grands-parents, nounou… : des personnes sans compte, en plus des responsables. Fiche de l’enfant → « Autorisés à récupérer l’enfant » → « Ajouter » (nom, lien avec l’enfant, téléphone).',
        ],
      },
    ],
  },
  {
    id: 'liens-connexion',
    titre: 'Connecter une personne au site',
    profil: 'bureau',
    questions: [
      {
        q: 'Envoyer son lien de connexion à un parent',
        r: [
          'Comptes → « Modifier » sur la personne → « Créer un lien de connexion » ; ou, sur la fiche d’un enfant, « Lien de connexion » sur la ligne du responsable.',
          '« Envoyer sur WhatsApp » ouvre la conversation avec son numéro (s’il est connu), message prêt. Sinon « Copier le lien » et collez-le dans un SMS.',
        ],
      },
      {
        q: 'Combien de temps le lien reste-t-il valable ?',
        r: [
          '7 jours, et une seule fois. Créer un nouveau lien annule le précédent. Une fois connectée, la personne reste connectée 6 mois.',
          '« Compte activé » apparaît dès sa première connexion.',
        ],
      },
      {
        q: 'Précautions',
        r: [
          'Le lien connecte À LA PLACE de la personne : envoyez-le uniquement à elle, jamais dans un groupe.',
          'Pour un membre du bureau, seul un administrateur peut créer le lien.',
        ],
      },
      {
        q: 'Un parent a perdu son téléphone',
        r: ['Comptes → « Modifier » sur la personne → « Déconnecter tous ses appareils », puis envoyez-lui un nouveau lien.'],
      },
    ],
  },
  {
    id: 'comptes',
    titre: 'Comptes',
    profil: 'bureau',
    questions: [
      {
        q: 'À quoi sert l’écran Comptes ?',
        r: [
          'Il liste tous les adultes enregistrés (parents, adhérents majeurs, bureau) : coordonnées, nombre d’adhérents liés, « compte activé » ou « pas encore connecté », rôles.',
        ],
      },
      {
        q: 'Créer ou modifier un compte',
        r: [
          '« Nouveau compte » : prénom, nom, et un e-mail ou un téléphone. Le plus souvent, on crée plutôt le parent depuis la fiche de son enfant.',
          '« Modifier » pour changer ses coordonnées, lui envoyer un lien de connexion ou le déconnecter.',
        ],
      },
      {
        q: 'Supprimer un compte',
        r: [
          '« Supprimer le compte » coupe immédiatement tous ses accès (sessions, liens en attente) et le retire des enfants auxquels il était lié. Vous ne pouvez pas supprimer votre propre compte.',
        ],
      },
    ],
  },

  // --- Administrateur ---
  {
    id: 'roles',
    titre: 'Rôles et administration',
    profil: 'admin',
    questions: [
      {
        q: 'Attribuer un rôle',
        r: [
          'Comptes → « Modifier » sur la personne → Rôles au club. Les rôles se cumulent : bureau, trésorier, encadrant, gestion du site, administrateur.',
          'Sans rôle, un compte est « famille » : il ne voit que ses enfants.',
        ],
      },
      {
        q: 'Qui peut quoi ?',
        r: [
          'Bureau : adhérents, responsables, comptes, liens de connexion des familles.',
          'Administrateur : tout, y compris les rôles et les liens de connexion des membres du bureau.',
          'Trésorier, encadrant, gestion du site : leurs écrans arriveront avec les prochaines fonctionnalités (licences et paiements, garderie, contenu du site).',
        ],
      },
      {
        q: 'Garde-fous',
        r: [
          'Il reste toujours au moins un administrateur : le site refuse de retirer le rôle, ou de supprimer le compte, du dernier.',
          'Un administrateur qui a perdu son téléphone reçoit un lien d’un autre administrateur ; à défaut, la procédure d’installation permet d’en recréer un.',
        ],
      },
    ],
  },
]

/** Rubriques visibles pour ces rôles (famille : tout compte connecté ; admin : tout). */
export function rubriquesPour(roles: Role[]): RubriqueAide[] {
  return RUBRIQUES_AIDE.filter((r) => r.profil === 'famille' || ROLES_DU_PROFIL[r.profil].some((role) => roles.includes(role)))
}

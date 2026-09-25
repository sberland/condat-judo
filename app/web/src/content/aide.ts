// Aide intégrée à l'espace membres (spec 016) — source unique de l'aide de l'espace.
// ⚠️ Toute spec qui modifie un écran de l'espace met à jour la rubrique concernée
// (règle de workflow-dev-spe.md). Rédaction : langage simple, vouvoiement, pas de jargon.
import type { Role } from '../lib/api'

/** Profil minimal pour voir une rubrique : famille = tout compte connecté. */
export type ProfilAide = 'famille' | 'encadrant' | 'bureau' | 'publication' | 'tresorier' | 'contenu' | 'admin'

export type IdRubrique =
  | 'connexion'
  | 'mes-enfants'
  | 'competitions'
  | 'cotisations'
  | 'garderie'
  | 'donnees'
  | 'competitions-bureau'
  | 'saisons'
  | 'garderie-bureau'
  | 'garderie-jour'
  | 'tresorerie'
  | 'contenu'
  | 'actualites'
  | 'adherents'
  | 'adhesions'
  | 'responsables'
  | 'liens-connexion'
  | 'comptes'
  | 'roles'
  | 'rgpd'

export type RubriqueAide = {
  id: IdRubrique
  titre: string
  profil: ProfilAide
  questions: { q: string; r: string[] }[]
}

// Rôles qui donnent accès à chaque profil (un administrateur voit tout).
const ROLES_DU_PROFIL: Record<Exclude<ProfilAide, 'famille'>, Role[]> = {
  encadrant: ['encadrant', 'bureau', 'admin'],
  bureau: ['bureau', 'admin'],
  publication: ['bureau', 'contenu', 'admin'],
  tresorier: ['tresorier', 'admin'],
  contenu: ['contenu', 'admin'],
  admin: ['admin'],
}

export const LIBELLES_PROFIL: Record<ProfilAide, string> = { famille: 'Tous', encadrant: 'Encadrant', bureau: 'Bureau', publication: 'Bureau, site', tresorier: 'Trésorier', contenu: 'Contenu du site', admin: 'Administrateur' }

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
          'Inscrire : vous pouvez l’inscrire aux événements (compétitions, stages…) et à la garderie du mercredi.',
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
          'Les personnes autorisées à venir chercher votre enfant : vous les gérez vous-même (voir ci-dessous).',
          'Tout le reste (fiche d’un enfant…) : signalez-le au bureau, qui met la fiche à jour.',
        ],
      },
      {
        q: 'Autoriser un grand-parent ou une nounou à venir chercher mon enfant',
        r: [
          'Mes enfants → la fiche de l’enfant → « Autorisés à le récupérer » → « Ajouter une personne » : prénom, nom, lien avec l’enfant et, de préférence, son téléphone. « Retirer » (corbeille) pour l’enlever.',
          'L’encadrant ne confie l’enfant qu’aux responsables qui peuvent le récupérer et aux personnes de cette liste. Si quelqu’un d’autre se présente, il vous appelle : ajoutez alors la personne, la liste de l’encadrant se met à jour.',
          'Seul un responsable qui peut « inscrire » l’enfant modifie cette liste.',
        ],
      },
      {
        q: 'Ajouter une photo pour la garderie du mercredi',
        r: [
          'Mes enfants → la fiche de l’enfant → « Photo pour la garderie du mercredi » : cochez l’accord, puis « Ajouter une photo » (prise sur le moment ou choisie dans vos photos). Un portrait bien éclairé, visage dégagé, suffit.',
          'La photo est réduite sur votre téléphone avant l’envoi. Elle n’est montrée qu’aux encadrants, le mercredi même, pour reconnaître votre enfant à la garderie ; elle est effacée au bout d’un an (pensez à la renouveler).',
          '« Retirer la photo » l’efface ; répondre « Non » à « Photo pour la garderie » dans les autorisations l’efface aussi. Seul un responsable légal (mère, père, tuteur) peut déposer ou retirer la photo.',
        ],
      },
    ],
  },
  {
    id: 'competitions',
    titre: 'Événements : compétitions, stages, repas…',
    profil: 'famille',
    questions: [
      {
        q: 'Inscrire mon enfant à une compétition ou un stage',
        r: [
          'Touchez le lien de l’événement posté dans le groupe WhatsApp du club (ou menu « Événements » du site), puis « Inscrire » à côté du prénom de votre enfant. Pour une compétition, le bureau s’occupe ensuite de l’inscription auprès de la fédération.',
          'Il faut être connecté : si le site vous le demande, utilisez le lien personnel envoyé par le bureau.',
        ],
      },
      {
        q: 'Je me suis trompé, ou mon enfant ne peut plus venir',
        r: [
          'Jusqu’à la date limite, « Annuler l’inscription » sur la page de l’événement.',
          'Après la date limite, les inscriptions sont transmises : prévenez directement le bureau.',
        ],
      },
      {
        q: 'Le bouton « Inscrire » n’apparaît pas',
        r: [
          '« Pas dans les catégories » : l’événement ne concerne pas l’âge (ou le sexe) de votre enfant ; la catégorie est calculée d’après son année de naissance.',
          '« Inscription par un autre responsable » : le bureau ne vous a pas donné le droit d’inscrire cet enfant (voir « Mes enfants »).',
          '« Inscriptions closes » : la date limite est passée.',
        ],
      },
      {
        q: 'Inscrire ma famille à un repas, une fête…',
        r: [
          'Sur la page de l’événement, bloc « Ma famille » : indiquez le nombre d’adultes et d’enfants avec « + » et « − », puis « Inscrire ma famille ».',
          'Jusqu’à la date limite, vous pouvez changer le nombre (« Mettre à jour ») ou « Annuler l’inscription ».',
        ],
      },
      {
        q: 'Ajouter le calendrier du club à mon agenda',
        r: [
          'Page « Événements » → « S’abonner au calendrier » : sur iPhone ou Mac, « Calendrier (iPhone, Mac, Outlook) » ; sur Android, « Google Agenda ». Les événements du club apparaissent alors dans votre agenda et se mettent à jour tout seuls.',
        ],
      },
      {
        q: 'Où voir les événements de mon enfant ?',
        r: ['Dans « Mes enfants », en bas de sa fiche : les événements à venir et passés auxquels il a été inscrit.'],
      },
    ],
  },
  {
    id: 'cotisations',
    titre: 'Cotisations et paiements',
    profil: 'famille',
    questions: [
      {
        q: 'Où voir ce que j’ai payé ?',
        r: [
          'Dans « Mes enfants », bloc « Cotisations » : pour chaque enfant, le montant de l’adhésion, ce qui a été payé, ce qui reste, et les versements reçus par le club.',
          'En 3 fois : les dates des versements sont indiquées ; un chèque remis d’avance apparaît avec la date à partir de laquelle il sera encaissé.',
        ],
      },
      {
        q: 'Un paiement n’apparaît pas, ou un montant est faux',
        r: ['Adressez-vous au trésorier du club : c’est lui qui enregistre les paiements.'],
      },
    ],
  },
  {
    id: 'garderie',
    titre: 'Garderie du mercredi',
    profil: 'famille',
    questions: [
      {
        q: 'Demander que le club récupère mon enfant',
        r: [
          'Mon espace → « Garderie du mercredi » : « Demander » à côté du mercredi voulu. Pour toute la période, choisissez « Tous les mercredis jusqu’au … » puis « Demander ».',
          'Vous pouvez demander ou annuler jusqu’au délai indiqué en haut de la page (par défaut la veille au soir). Ensuite, prévenez directement le bureau.',
        ],
      },
      {
        q: 'Annuler un mercredi',
        r: ['« Annuler » à côté du mercredi, tant que le délai n’est pas passé. Les autres mercredis demandés restent valables.'],
      },
      {
        q: 'Savoir si mon enfant a bien été récupéré',
        r: [
          'Le mercredi, « Garderie du mercredi » affiche en haut l’état de chaque enfant demandé : récupéré à la garderie (avec l’heure), puis parti avec la personne venue le chercher. La page se met à jour toute seule tant qu’elle est ouverte.',
          '« Pas à la garderie » : l’encadrant ne l’a pas trouvé ; il vous appelle.',
        ],
      },
      {
        q: 'Je ne vois pas les boutons pour mon enfant',
        r: ['Seul un responsable qui a le droit d’« inscrire » l’enfant peut faire les demandes (voir « Mes enfants »). Les demandes faites par l’autre responsable apparaissent quand même.'],
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
        r: [
          'Consulter : « Mes enfants » → « Mes données » → « Télécharger mes données » : un fichier avec tout ce que le club enregistre sur vous et vos enfants.',
          'Corriger ou supprimer : adressez-vous au bureau du club.',
        ],
      },
      {
        q: 'Photos, groupe WhatsApp, photo pour la garderie : donner ou retirer mon accord',
        r: [
          '« Mes enfants » → « Autorisations » : répondez « Oui » ou « Non » pour chaque enfant (photos et vidéos publiées par le club, groupe WhatsApp, photo montrée aux encadrants de la garderie). Vous pouvez changer d’avis à tout moment ; votre réponse est datée et enregistrée à votre nom.',
          'Seuls les responsables légaux (mère, père, tuteur) peuvent répondre ; un adhérent majeur répond pour lui-même.',
        ],
      },
      {
        q: 'Combien de temps le club garde-t-il ces informations ?',
        r: [
          'Tout est détaillé sur la page « Données personnelles » (lien en bas de chaque page) : ce qui est enregistré, pourquoi, pour combien de temps, qui y a accès et vos droits.',
          'Après la durée décidée par le club, les informations d’un adhérent qui ne se réinscrit plus sont rendues anonymes automatiquement.',
        ],
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
    id: 'competitions-bureau',
    titre: 'Événements : publier, suivre, ressaisir',
    profil: 'bureau',
    questions: [
      {
        q: 'Publier un événement',
        r: [
          'Événements → « Nouvel événement » : type (compétition, stage, rencontre, repas, fête…), nom, date et heure, lieu (et adresse, pour l’itinéraire). Informations pratiques et lien vers la page officielle si vous les avez.',
          'Inscription : une compétition inscrit des enfants, par catégorie. Pour les autres événements, au choix : pas d’inscription (information seule), inscription des enfants (aucune catégorie cochée = tous les enfants), ou inscription de la famille avec le nombre d’adultes et d’enfants (ex. repas). Avec inscription : date limite.',
          'Puis « Envoyer sur WhatsApp » : le message est prêt, avec le lien de la page. Postez-le dans le groupe du club.',
        ],
      },
      {
        q: 'Que voient les parents ?',
        r: [
          'La page de l’événement est publique : date, lieu, catégories, informations pratiques. Aucune information sur les inscrits.',
          'Une fois connecté, un parent voit ses enfants et peut inscrire ceux qui sont dans les catégories, jusqu’à la date limite incluse, s’il a le droit « inscrire » sur l’enfant.',
        ],
      },
      {
        q: 'Ressaisir les inscriptions sur le site fédéral',
        r: [
          'Compétitions seulement. Bloc « Inscrits » : « Copier » (à coller dans un tableur) ou « CSV » (fichier Excel) : nom, prénom, date de naissance, sexe, catégorie, ceinture, n° de licence.',
          'Cochez « Ressaisi sur le site fédéral » au fur et à mesure : la liste des événements indique combien il en reste.',
          'Le fichier contient des données d’enfants : supprimez-le une fois la ressaisie faite.',
        ],
      },
      {
        q: 'Les alertes en orange',
        r: [
          'N° de licence manquant, pas de dossier d’adhésion pour la saison, formalité médicale non reçue (compétitions) : l’inscription n’est pas bloquée, mais c’est à régler avant la ressaisie.',
        ],
      },
      {
        q: 'Suivre les familles inscrites (repas, fête…)',
        r: [
          'Bloc « Familles inscrites » : chaque famille avec son nombre d’adultes et d’enfants, et le total des participants. « CSV » pour le traiteur ou la salle ; « Retirer » annule une inscription.',
        ],
      },
      {
        q: 'Inscrire un enfant à la place de ses parents',
        r: [
          'Bloc « Inscrire un enfant » : les adhérents des catégories concernées, pas encore inscrits. Possible même après la date limite. Chaque inscription garde le nom de qui l’a faite.',
          '« Retirer » annule une inscription.',
        ],
      },
      {
        q: 'Clôturer, annuler, supprimer',
        r: [
          '« Modifier » → statut : « Clôturée » ferme les inscriptions avant la date limite ; « Annulée » l’affiche barrée pour tout le monde (les inscriptions restent visibles).',
          'La suppression n’est possible que si personne n’est inscrit.',
        ],
      },
    ],
  },
  {
    id: 'saisons',
    titre: 'Saisons : catégories, tarifs, horaires',
    profil: 'bureau',
    questions: [
      {
        q: 'À quoi sert l’écran Saisons et tarifs ?',
        r: [
          'Chaque saison a ses catégories d’âge (compétitions), sa grille tarifaire (dossiers d’adhésion, page publique), les dates des 2e et 3e versements du paiement en 3 fois (trésorerie) et les horaires des cours (page publique).',
          'La saison courante est celle qu’utilisent les dossiers, la trésorerie, les compétitions et le site public.',
        ],
      },
      {
        q: 'Modifier un tarif, un horaire, une catégorie',
        r: [
          'Ouvrez la saison, « Modifier » sur la partie voulue, puis « Enregistrer ». Le site vérifie tout avant d’enregistrer (par exemple, les trois versements doivent totaliser le montant de la formule) et signale ce qui ne va pas.',
          'Un dossier déjà enregistré garde ses montants : une modification de tarif ne vaut que pour les dossiers saisis ou modifiés ensuite.',
          '« À confirmer » (tarifs, horaires) : masqués sur le site public tant que la case est cochée.',
        ],
      },
      {
        q: 'Préparer la saison suivante',
        r: [
          '« Préparer la saison … » copie la dernière saison en décalant les années de naissance des catégories et des formules, et les dates du paiement en 3 fois, d’un an. Ajustez ensuite tarifs et horaires : rien ne change sur le site.',
          'Le moment venu (fin août en général), « Rendre cette saison courante » : les nouveaux dossiers, la trésorerie et la page publique passent sur la nouvelle saison.',
        ],
      },
    ],
  },
  {
    id: 'garderie-jour',
    titre: 'Mercredi du jour (encadrant)',
    profil: 'encadrant',
    questions: [
      {
        q: 'Voir les enfants à récupérer',
        r: [
          'Mon espace → « Mercredi du jour » : les enfants demandés pour aujourd’hui, par lieu de récupération, avec leur photo quand la famille l’a donnée. Touchez la photo pour l’agrandir.',
          'La liste n’est visible que le mercredi même. Chaque consultation est enregistrée (journal des accès).',
        ],
      },
      {
        q: 'Qui peut venir chercher un enfant ?',
        r: [
          '« Qui peut venir le chercher » : les responsables qui peuvent le récupérer et les personnes autorisées par la famille, avec leur téléphone (touchez le numéro pour appeler).',
          'Ne confiez jamais un enfant à une personne absente de cette liste : appelez un responsable, qui peut l’ajouter depuis son espace ; la liste se met à jour d’elle-même (toutes les 30 secondes).',
          '« À prévenir, mais ne peut pas le récupérer » : un responsable à contacter, qui n’est pas autorisé à venir le chercher.',
        ],
      },
      {
        q: 'Pointer les enfants',
        r: [
          'À la garderie : « Récupéré » pour chaque enfant pris en charge, « Absent » s’il n’y est pas (appelez alors un responsable). Les compteurs en haut de la liste indiquent où vous en êtes.',
          'À la fin du cours : « Parti avec : » puis le nom de la personne venue le chercher. Seules les personnes autorisées sont proposées.',
          'Une erreur ? « Annuler » revient à l’étape précédente. Les parents voient l’état de leur enfant en direct dans leur espace.',
        ],
      },
      {
        q: 'Un enfant n’a pas de photo',
        r: ['La famille ne l’a pas encore déposée, ou n’a pas donné son accord. Le bureau peut aussi en déposer une, si l’accord figure au dossier.'],
      },
    ],
  },
  {
    id: 'garderie-bureau',
    titre: 'Garderie du mercredi : suivi',
    profil: 'bureau',
    questions: [
      {
        q: 'Voir les enfants à récupérer',
        r: [
          'Mon espace → « Garderie : liste du mercredi » : choisissez le mercredi ; les enfants sont regroupés par lieu, avec qui a fait la demande et quand.',
        ],
      },
      {
        q: 'Une demande tardive, ou une erreur',
        r: ['« Ajouter un enfant » (recherche par nom) ou « Retirer » : le bureau n’est pas limité par le délai des familles.'],
      },
      {
        q: 'Savoir qui est parti avec qui',
        r: ['Dans la liste du mercredi, chaque enfant pointé par l’encadrant affiche « Récupéré à la garderie à … », « Pas à la garderie » ou « Parti avec … à … ».'],
      },
      {
        q: 'Photo d’un enfant pour la garderie',
        r: [
          'Accord : « Photo pour la garderie du mercredi » dans le dossier d’adhésion (ou la famille répond dans son espace). « Non » efface la photo.',
          'Avec l’accord, la fiche de l’adhérent → « Photo pour la garderie » → « Ajouter une photo » (vous pouvez la prendre au dojo). La famille peut aussi la déposer elle-même.',
        ],
      },
      {
        q: 'Régler lieux, calendrier et délai',
        r: [
          'Saisons et tarifs → la saison → « Garderie du mercredi » : lieux de récupération, premier et dernier mercredi, mercredis sans garderie (touchez une date pour la fermer), délai de demande.',
          'Tant que « Réglages à confirmer » est coché, les familles ne peuvent pas encore demander sur le site public.',
          'Fermer un mercredi ne supprime pas les demandes déjà faites pour ce jour-là : retirez-les dans la liste du mercredi (le site y signale « mercredi sans garderie »).',
        ],
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

  // --- Trésorier ---
  {
    id: 'tresorerie',
    titre: 'Trésorerie : suivre les cotisations',
    profil: 'tresorier',
    questions: [
      {
        q: 'Enregistrer un chèque',
        r: [
          'Trésorerie → la famille → « Enregistrer un paiement ». Le montant proposé est ce qu’il reste à payer ; le mode est « Chèque », la date celle du jour. Ajoutez le n° du chèque et la banque, puis « Enregistrer le paiement ».',
          'Un chèque pour deux enfants : saisissez-le une seule fois, le site le répartit entre eux au prorata de ce que chacun doit. La répartition reste modifiable.',
        ],
      },
      {
        q: 'Paiement en 3 fois',
        r: [
          'Sur la fiche de la famille, « Enregistrer les 3 chèques de … » : les trois montants sont repris du dossier, avec leurs dates d’encaissement (le 1er tout de suite, les suivants aux échéances).',
          'Un chèque à encaisser plus tard garde sa date : il apparaît dans « À remettre en banque » le mois venu.',
        ],
      },
      {
        q: 'Remise en banque',
        r: [
          'L’écran Trésorerie liste les chèques et espèces à remettre en banque (échéance dépassée ou dans le mois). « Remis en banque » les retire de la liste ; « Annuler la remise » sur la fiche de la famille en cas d’erreur.',
          'Carte bancaire et virement sont considérés encaissés dès leur réception.',
        ],
      },
      {
        q: 'Retards, reste à payer',
        r: [
          'Une famille est « en retard » quand un versement échu n’a pas été reçu (tout, à l’inscription, pour un paiement comptant). L’avance payée pour un enfant ne couvre pas le retard d’un autre.',
          'Filtres de l’écran Trésorerie : en retard, à payer, partiellement payées, soldées.',
        ],
      },
      {
        q: 'Exports pour la comptabilité',
        r: [
          '« Paiements (CSV) » : une ligne par paiement (date, enfants, mode, référence, montant, dates d’encaissement). « Familles (CSV) » : dû, payé, reste et retard par famille.',
          'Ces fichiers contiennent des données personnelles : gardez-les sur un appareil du club, pas dans une messagerie.',
        ],
      },
      {
        q: 'Une erreur de saisie',
        r: ['Sur la fiche de la famille, « Supprimer » le paiement, puis enregistrez-le à nouveau. Un dossier d’adhésion qui porte des paiements ne peut plus être supprimé.'],
      },
    ],
  },

  // --- Actualités : bureau et gestion du site ---
  {
    id: 'actualites',
    titre: 'Actualités',
    profil: 'publication',
    questions: [
      {
        q: 'Publier une actualité',
        r: [
          'Mon espace → « Actualités » → « Nouvelle actualité » : titre et texte (une ligne vide entre deux paragraphes), puis « Créer l’actualité ». Elle reste en brouillon tant que vous ne la passez pas « Publiée ».',
          '« Publique » : visible de tous ; « Réservée aux familles » : seulement des comptes connectés.',
          'Publiée, elle apparaît sur l’accueil (les trois dernières) et sur la page « Actualités ».',
        ],
      },
      {
        q: 'Ajouter une photo',
        r: [
          'Sur l’actualité, bloc « Photo » : cochez d’abord que les enfants reconnaissables ont l’accord droit à l’image (voir leurs dossiers), puis « Ajouter une photo ». Elle est réduite sur votre téléphone avant l’envoi.',
          'En cas de doute, choisissez une photo où les enfants ne sont pas reconnaissables (de dos, de loin).',
        ],
      },
      {
        q: 'Partager, retirer',
        r: [
          '« Envoyer sur WhatsApp » prépare le message avec le lien. Pour retirer une actualité du site sans la perdre, repassez-la en brouillon ; « Supprimer » l’efface.',
        ],
      },
    ],
  },

  // --- Contenu du site ---
  {
    id: 'contenu',
    titre: 'Contenu du site',
    profil: 'contenu',
    questions: [
      {
        q: 'Modifier une information du site',
        r: [
          'Mon espace → « Contenu du site » → choisissez le contenu (coordonnées, dojo, équipe, esprit du club, disciplines, partenaires, règlement, liens…), modifiez, puis « Enregistrer et publier » : c’est en ligne aussitôt, sans mise à jour du site.',
          'Dans une liste (membres du bureau, articles, partenaires…), touchez un élément pour le modifier ; « Monter » / « Descendre » changent l’ordre, « Ajouter » en crée un nouveau.',
          '« Voir sur le site » ouvre la page publique concernée.',
        ],
      },
      {
        q: 'Préparer un contenu sans le montrer tout de suite',
        r: [
          'Statut « À compléter » : le contenu disparaît du site public, et reste visible avec un badge sur le site de test du club, pour le relire. Repassez-le « Publié » quand il est prêt.',
          'Pour une discipline ou un partenaire, cochez « À compléter » sur l’élément lui-même.',
        ],
      },
      {
        q: 'Changer l’icône d’un article du règlement',
        r: [
          'Contenu du site → Règlement intérieur → l’article → « Icône ». Par défaut, l’icône est choisie d’après le titre de l’article.',
        ],
      },
      {
        q: 'Revenir en arrière après une erreur',
        r: ['En bas de la page du contenu, « Historique » : « Revenir à cette version » puis « Confirmer » republie la version choisie. Les 30 dernières versions sont gardées, avec leur date et leur auteur.'],
      },
      {
        q: 'Ce qui ne se modifie pas ici',
        r: [
          'Horaires, tarifs et catégories d’âge : Mon espace → « Saisons et tarifs » (bureau).',
          'Le code moral du judo (texte officiel de France Judo), le nom et le logo du club.',
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
          'Bureau : adhérents, dossiers, compétitions, saisons et tarifs, responsables, comptes, liens de connexion des familles.',
          'Administrateur : tout, y compris les rôles, les liens de connexion des membres du bureau et la page « Données personnelles » (purge, journal des accès).',
          'Trésorier : la trésorerie (cotisations, paiements, remises en banque) — le rôle « bureau » seul ne voit pas les paiements.',
          'Encadrant, gestion du site : leurs écrans arriveront avec les prochaines fonctionnalités (garderie, contenu du site).',
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
  {
    id: 'rgpd',
    titre: 'Données personnelles : conservation, purge, journal',
    profil: 'admin',
    questions: [
      {
        q: 'Que fait la purge automatique ?',
        r: [
          'Chaque lundi, les adhérents dont la dernière saison est plus ancienne que la durée de conservation sont rendus anonymes : nom, adresse, n° de licence, personnes autorisées et accords effacés ; l’année de naissance, les montants et les compétitions restent, sans nom.',
          'Leurs responsables qui n’ont plus d’autre enfant au club sont rendus anonymes aussi, et déconnectés. Les membres du bureau (comptes avec un rôle) ne sont jamais concernés.',
          'Elle ne tourne qu’en production, et seulement une fois la durée de conservation confirmée par le club.',
        ],
      },
      {
        q: 'Voir qui sera concerné',
        r: ['Mon espace → Données personnelles : la liste des adhérents concernés à la prochaine purge et à la rentrée suivante. Une réinscription (nouveau dossier) retire l’adhérent de la liste.'],
      },
      {
        q: 'Journal des accès',
        r: [
          'Chaque consultation de la fiche d’un adhérent (coordonnées des responsables), de la liste des comptes ou de la fiche d’une famille en trésorerie, et chaque modification, est enregistrée : qui, quoi, quand. Conservé un an.',
        ],
      },
      {
        q: 'Répondre à une demande d’accès reçue par écrit',
        r: ['Comptes → « Modifier » sur la personne → « Exporter ses données » : un fichier avec tout ce qui la concerne, elle et les adhérents qui lui sont liés. Les familles peuvent aussi le télécharger elles-mêmes depuis leur espace.'],
      },
    ],
  },
]

/** Rubriques visibles pour ces rôles (famille : tout compte connecté ; admin : tout). */
export function rubriquesPour(roles: Role[]): RubriqueAide[] {
  return RUBRIQUES_AIDE.filter((r) => r.profil === 'famille' || ROLES_DU_PROFIL[r.profil].some((role) => roles.includes(role)))
}

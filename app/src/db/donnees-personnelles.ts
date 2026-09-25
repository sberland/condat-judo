// Classement de CHAQUE colonne de la base au regard de l'anonymisation de la qualification (spec 008).
// Le test anonymisation.test.ts applique les migrations et exige que toute colonne existante soit
// classée ici (et qu'aucune entrée ne soit obsolète) : ajouter une colonne sans la classer fait
// échouer la CI. Une colonne « pseudonymisee » doit être traitée dans anonymisation-qualif.sql.

export type Traitement =
  | 'conservee' // pas une donnée personnelle, ou nécessaire telle quelle aux tests
  | 'pseudonymisee' // remplacée par une valeur fictive stable (anonymisation-qualif.sql)
  | 'purgee' // table vidée à chaque recopie

type Table = {
  /** Lignes gardées telles quelles (condition SQL) — ex. comptes des testeurs du bureau. */
  conserveesSi?: string
  colonnes: Record<string, Traitement>
}

const COMPTE_AVEC_ROLE = (col: string) => `EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = ${col})`

export const TABLES: Record<string, Table> = {
  users: {
    conserveesSi: COMPTE_AVEC_ROLE('users.id'),
    colonnes: {
      id: 'conservee',
      prenom: 'pseudonymisee',
      nom: 'pseudonymisee',
      email: 'pseudonymisee',
      telephone: 'pseudonymisee',
      created_at: 'conservee',
      last_login: 'conservee',
      supprime_le: 'conservee',
      anonymise_le: 'conservee',
    },
  },
  identites: {
    conserveesSi: COMPTE_AVEC_ROLE('identites.user_id'),
    colonnes: {
      provider: 'conservee',
      subject: 'conservee', // identifiant opaque (dev) ou users.id (app)
      user_id: 'conservee',
      email_vu: 'pseudonymisee', // vidé
      created_at: 'conservee',
      last_seen: 'conservee',
    },
  },
  user_roles: { colonnes: { user_id: 'conservee', role: 'conservee' } },
  // Saisons et référentiels (003) : aucune donnée personnelle (modifie_par = id d'un membre du bureau).
  saisons: {
    colonnes: Object.fromEntries(
      ['id', 'libelle', 'debut', 'fin', 'courante', 'inscriptions_ouvertes', 'referentiel', 'modifie_le', 'modifie_par'].map((c) => [c, 'conservee' as const]),
    ),
  },
  adherents: {
    conserveesSi: `adherents.user_id IS NOT NULL AND ${COMPTE_AVEC_ROLE('adherents.user_id')}`,
    colonnes: {
      id: 'conservee',
      prenom: 'pseudonymisee',
      nom: 'pseudonymisee',
      date_naissance: 'pseudonymisee', // année conservée (catégories), jour et mois fictifs
      sexe: 'conservee',
      grade: 'conservee',
      numero_licence: 'pseudonymisee',
      adresse: 'pseudonymisee',
      code_postal: 'conservee', // supplément « hors commune »
      ville: 'conservee',
      user_id: 'conservee',
      created_at: 'conservee',
      updated_at: 'conservee',
      supprime_le: 'conservee',
      anonymise_le: 'conservee',
    },
  },
  liens: {
    colonnes: {
      user_id: 'conservee',
      adherent_id: 'conservee',
      qualite: 'conservee',
      peut_inscrire: 'conservee',
      peut_recuperer: 'conservee',
      est_contact: 'conservee',
      created_at: 'conservee',
    },
  },
  personnes_autorisees: {
    colonnes: {
      id: 'conservee',
      adherent_id: 'conservee',
      prenom: 'pseudonymisee',
      nom: 'pseudonymisee',
      lien: 'conservee', // « grand-mère », « nounou »…
      telephone: 'pseudonymisee',
      created_at: 'conservee',
    },
  },
  // Dossiers d'adhésion (010a) : aucune colonne identifiante (rattachés à l'adhérent, pseudonymisé) ;
  // formalités = type + date seulement (aucune donnée de santé), consentements = oui / non / non recueilli.
  adhesions: {
    colonnes: Object.fromEntries(
      [
        'id', 'adherent_id', 'saison', 'formule', 'passeport', 'hors_commune', 'reduction_famille',
        'montant_participation', 'montant_licence', 'montant_supplements', 'montant_reduction', 'montant_total',
        'paiement_mode', 'paiement_3_fois', 'echeance_1', 'echeance_2', 'echeance_3',
        'formalite_type', 'formalite_recue_le',
        'soins_urgence', 'soins_urgence_le', 'soins_urgence_par',
        'droit_image', 'droit_image_le', 'droit_image_par',
        'whatsapp', 'whatsapp_le', 'whatsapp_par',
        'photo_garderie', 'photo_garderie_le', 'photo_garderie_par',
        'valide_le', 'valide_par', 'cree_par', 'created_at', 'updated_at',
      ].map((c) => [c, 'conservee' as const]),
    ),
  },
  // Paiements (011) : montants et dates ; `reference` (n° de chèque, banque, parfois le nom du
  // titulaire) est pseudonymisée.
  paiements: {
    colonnes: {
      id: 'conservee',
      saison: 'conservee',
      montant: 'conservee',
      mode: 'conservee',
      reference: 'pseudonymisee',
      recu_le: 'conservee',
      encaisser_le: 'conservee',
      encaisse_le: 'conservee',
      saisi_par: 'conservee',
      created_at: 'conservee',
      updated_at: 'conservee',
    },
  },
  paiement_parts: { colonnes: { paiement_id: 'conservee', adhesion_id: 'conservee', montant: 'conservee' } },
  // Compétitions (009) : informations publiques ; `infos` = texte pratique du bureau (pesée…).
  competitions: {
    colonnes: Object.fromEntries(
      ['id', 'nom', 'date', 'lieu', 'adresse', 'lien_officiel', 'infos', 'categories', 'sexe', 'date_limite', 'statut', 'cree_par', 'created_at', 'updated_at', 'type', 'inscription', 'heure'].map(
        (c) => [c, 'conservee' as const],
      ),
    ),
  },
  // Inscriptions (009) : identifiants et dates seulement (l'adhérent est pseudonymisé).
  inscriptions_competition: {
    colonnes: { competition_id: 'conservee', adherent_id: 'conservee', inscrit_par: 'conservee', inscrit_le: 'conservee', ressaisi_le: 'conservee' },
  },
  // Événements (021) : famille inscrite (compte pseudonymisé) et nombre de participants.
  inscriptions_famille: {
    colonnes: { competition_id: 'conservee', user_id: 'conservee', adultes: 'conservee', enfants: 'conservee', inscrit_le: 'conservee', modifie_le: 'conservee' },
  },
  // Garderie (012a) : enfant, mercredi, lieu, auteur — pas de donnée identifiante (adhérent pseudonymisé).
  // Pointage (012c) : heures et auteurs conservés ; `parti_avec` (nom de la personne) pseudonymisé.
  garderie_demandes: {
    colonnes: {
      adherent_id: 'conservee',
      date: 'conservee',
      lieu: 'conservee',
      demande_par: 'conservee',
      demande_le: 'conservee',
      recupere_le: 'conservee',
      absent_le: 'conservee',
      pointe_par: 'conservee',
      parti_le: 'conservee',
      parti_avec: 'pseudonymisee',
      parti_par: 'conservee',
    },
  },
  // Contenu du site (014) : textes publics (équipe publiée avec son accord), auteur des modifications.
  contenus: { colonnes: { cle: 'conservee', valeur: 'conservee', statut: 'conservee', modifie_le: 'conservee', modifie_par: 'conservee' } },
  contenus_versions: {
    colonnes: { id: 'conservee', cle: 'conservee', valeur: 'conservee', statut: 'conservee', modifie_le: 'conservee', modifie_par: 'conservee' },
  },
  // Actualités (013) : contenu public du club ; auteur ; photo publiée avec l'accord droit à l'image.
  actualites: {
    colonnes: Object.fromEntries(
      ['id', 'titre', 'texte', 'visibilite', 'statut', 'publiee_le', 'auteur', 'created_at', 'updated_at'].map((c) => [c, 'conservee' as const]),
    ),
  },
  actualites_images: {
    colonnes: { actualite_id: 'conservee', type: 'conservee', accord: 'conservee', deposee_par: 'conservee', deposee_le: 'conservee' },
  },
  actualites_images_morceaux: { colonnes: { actualite_id: 'conservee', rang: 'conservee', donnees: 'conservee' } },
  // Passkeys (005c) : liées à l'adresse de la prod, vidées dans la qualif (comme les sessions).
  passkeys: {
    colonnes: { id: 'purgee', user_id: 'purgee', cle_publique: 'purgee', compteur: 'purgee', transports: 'purgee', appareil: 'purgee', created_at: 'purgee', derniere_utilisation: 'purgee' },
  },
  defis_passkey: { colonnes: { defi: 'purgee', type: 'purgee', user_id: 'purgee', expire_le: 'purgee' } },
  // Photos d'identification de la garderie (012b) : visages d'enfants — jamais dans la qualif.
  photos_adherents: { colonnes: { adherent_id: 'purgee', image: 'purgee', type: 'purgee', deposee_le: 'purgee', deposee_par: 'purgee' } },
  // Journal des accès (019) : qui a consulté quelle famille en prod — vidé dans la qualif.
  journal_acces: {
    colonnes: { id: 'purgee', cree_le: 'purgee', user_id: 'purgee', action: 'purgee', cible: 'purgee', cible_id: 'purgee', detail: 'purgee' },
  },
  // Rapports de purge (019) : dates et nombres seulement.
  purges: { colonnes: { id: 'conservee', execute_le: 'conservee', seuil: 'conservee', adherents: 'conservee', comptes: 'conservee' } },
  liens_connexion: {
    colonnes: {
      empreinte: 'purgee',
      user_id: 'purgee',
      cree_par: 'purgee',
      created_at: 'purgee',
      expire_le: 'purgee',
      utilise_le: 'purgee',
      annule_le: 'purgee',
    },
  },
  sessions: {
    colonnes: { empreinte: 'purgee', user_id: 'purgee', created_at: 'purgee', expire_le: 'purgee', renouvele_le: 'purgee' },
  },
}

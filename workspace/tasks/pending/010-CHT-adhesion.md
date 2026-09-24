# 010-CHT — Dossier d'adhésion (inscription)

## Pourquoi

L'inscription au club se fait sur un formulaire papier (saison 2026/2027) : ressaisies, écriture
illisible, informations incomplètes (un seul téléphone de responsable), mentions obsolètes. Avoir
le dossier sur le site donne au bureau **toutes les informations des adhérents et des contacts
parents**, à jour, et prépare compétitions, garderie et paiements.

Pour la saison en cours, les formulaires papier sont déjà remis : le bureau les **ressaisit**
(010a), ce qui valide au passage l'ergonomie du dossier avant de l'ouvrir aux familles (010b).

## Sous-specs (dans l'ordre)

- [ ] [`010a-dossier-saisie-bureau.md`](010a-dossier-saisie-bureau.md) — le bureau ressaisit les
  dossiers papier 2026/2027 : dossier complet, montant calculé, suivi des dossiers incomplets
- [ ] [`010b-dossier-en-ligne-familles.md`](010b-dossier-en-ligne-familles.md) — les familles
  remplissent le dossier en ligne (inscriptions 2027/2028), pré-rempli d'une saison sur l'autre

## Contenu du dossier (commun à 010a et 010b)

Par adhérent et par saison :

1. **Adhérent** (004) : identité, date de naissance, sexe, **ceinture (liste officielle)**,
   n° de licence, adresse.
2. **Responsables légaux** (004) : un ou deux, chacun avec ses coordonnées et ses droits ;
   personnes autorisées à récupérer l'enfant.
3. **Activité** : discipline et formule de la grille de la saison (judo par tranche d'âge,
   taïso, yoga lundi / jeudi / les deux).
4. **Montant calculé** : participation + licence, + passeport, + hors commune, − réduction
   famille (2ᵉ licence d'un même foyer) ; mode de paiement, paiement en 3 fois (échéancier) → 011.
5. **Formalités médicales** : mineur → attestation du questionnaire de santé ; majeur → certificat
   (1ʳᵉ licence) ou attestation QS-SPORT. Seulement « reçu le … », **jamais de donnée de santé**.
6. **Autorisations** : soins d'urgence ; personnes autorisées à récupérer l'enfant (004).
7. **Consentements** explicites et datés (006) : droit à l'image, ajout au groupe WhatsApp.
8. **Engagements** : règlement intérieur, information sur l'assurance (Code du sport L321-4),
   mention d'information RGPD.
9. **Suivi** : dossier « à compléter / complet / validé » ; liste des dossiers incomplets.

## Ordre et dépendances

- **010a** : dépend de 004 et 005a (livrées). Référentiels de la saison **en dur** (grille déjà
  publiée dans `content/club.ts`), chaque dossier **fige** sa formule et son montant ; la 003 les
  passera en base pour 2027/2028.
- **Données réelles** : la ressaisie en prod attend les garde-fous **006** (socle minimal),
  **007** (sauvegarde) et **008** (qualif anonymisée). 010a se développe en parallèle et se teste
  avec des données fictives (local, qualif).
- **010b** : après 003 (référentiels en base) et 006 complète ; cible juin 2027.

## Revue de chantier (2026-09-24) — décisions

1. **Périmètre** : dossier complet, d'abord saisi par le bureau (010a), puis rempli en ligne par
   les familles (010b).
2. **Ordre** : garde-fous (006 minimal, 007, 008) avant toute donnée réelle ; 010a en parallèle.
3. **Référentiels** : grille 2026/2027 en dur ; catégorie déduite de l'année de naissance ;
   ceintures en liste fixe (liste officielle France Judo) ; base de données avec la 003.
4. **Droit à l'image** : le papier le dit « accepté par l'inscription » (implicite, non valable) →
   saisi « **non recueilli** », à recueillir explicitement ; le « WhatsApp oui / non » du papier,
   explicite, est repris tel quel.

## Arbitrages du formulaire papier

| # | Élément du formulaire | Constat | Décision |
| --- | --- | --- | --- |
| A1 | « Certificat médical pour la pratique du judo, y compris en compétition » | Obsolète pour les mineurs (décret n° 2021-564) : questionnaire de santé + attestation ; majeurs : certificat à la 1ʳᵉ licence puis QS-SPORT | Formalités à jour, « reçu le … » seulement |
| A2 | « Passeport +8 € (obligatoire à partir de poussin) » | En compétition : passeport **ou** tout autre justificatif d'identité | Passeport proposé (comme sur le site) |
| A3 | Licence 46 € (judo) / 43,80 € (taïso, yoga) | Deux montants pour la même licence | **À vérifier avec le club** ; montants du formulaire repris |
| A4 | Tranches d'années de naissance | À recaler chaque saison | Tranche déduite de l'année de naissance (grille 2026/2027) ; catégories officielles avec la 003 |
| A5 | Droit à l'image implicite | Non conforme | « Non recueilli » à la ressaisie ; consentement explicite (006) |
| A6 | Aucune information sur les données personnelles | Obligatoire (art. 13 RGPD) | Mention + page « Données personnelles » (006) |
| A7 | Un seul téléphone, un seul e-mail | Insuffisant | Deux responsables (004) |
| A8 | Absents : soins d'urgence, règlement, assurance | Usuels / obligatoire (assurance) | Ajoutés ; à la ressaisie : « non recueilli » s'ils ne figurent pas sur le papier |
| A9 | « WhatsApp oui / non » | Consentement | Repris tel que coché ; retirable (006) |
| A10 | Yoga (lundi / jeudi) | Absent du site | Fait (015) |
| A11 | Paiement « CB » | Par quel moyen ? | Mode « CB » enregistré ; **précision à demander au club** |
| A12 | Allergies pour le goûter de la garderie | Donnée de santé | **Rien de collecté** (consigne orale aux encadrants) |
| A13 | « Écrire en majuscules » | Inutile en ligne | Casse normalisée automatiquement (004) |

## Clôture (à remplir avant le dernier merge)

Résumé chantier pour CHANGELOG (Notes client + liste des ajouts/modifications) :

- …

Niveau de version retenu : MINEUR / MAJEUR

## Notes

- Droits requis : `bureau` / `admin` (tous les dossiers, validation) ; `tresorier` (montants, 011) ;
  en 010b : responsable lié (ses enfants), adhérent majeur (lui-même).
- Données personnelles : identité et coordonnées de mineurs et de leurs responsables,
  autorisations, consentements — registre (006) ; nouvelles tables → purge et anonymisation de la
  qualif (008).

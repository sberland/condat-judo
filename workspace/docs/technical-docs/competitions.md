# Compétitions (spec 009)

## Contexte

Besoin d'origine du projet : remplacer le recueil des inscriptions dans le groupe WhatsApp. Le
bureau publie une compétition et poste son lien dans le groupe ; les parents y inscrivent leurs
enfants depuis leur téléphone ; le bureau récupère une liste propre à ressaisir sur le site
fédéral (pas d'API connue : la ressaisie reste manuelle).

## Description / Flux

### Modèle (migration `0005_competitions.sql`)

| Table | Rôle |
| --- | --- |
| `competitions` | Nom, date, lieu, adresse (itinéraire), lien officiel, infos pratiques (texte libre, sauts de ligne gardés), `categories` (JSON d'identifiants), `sexe` (`F`, `M` ou `NULL` = mixte), `date_limite` (incluse), `statut` (`ouverte`, `cloturee`, `annulee`), `cree_par` |
| `inscriptions_competition` | Clé (`competition_id`, `adherent_id`), `inscrit_par` (responsable ou bureau), `inscrit_le`, `ressaisi_le` (case « ressaisi sur le site fédéral ») ; suppression en cascade avec la compétition |

Les deux tables sont classées « conservées » dans `donnees-personnelles.ts` (identifiants et dates
seulement ; l'adhérent est pseudonymisé en qualif) et figurent dans les listes de purge de la
preview.

### Catégories d'âge

`app/web/src/content/categories.ts` — table **en dur** de la saison 2026/2027 (termes du formulaire
du club : micro-poussins 2021-2022 … seniors 2006 et avant), **importée par le Worker** comme
`adhesion.ts` : l'écran et l'API calculent la même catégorie (`categorieDe`, d'après l'année de
naissance) et la même éligibilité (`eligible` : catégorie cochée et sexe compatible). À mettre à
jour chaque saison (en base avec la spec 003).

### Règles d'inscription

- **Inscriptions ouvertes** (`inscriptionsOuvertes`, `routes/competitions.ts`) : statut `ouverte`
  **et** date du jour à Paris ≤ `date_limite`. « Clôturée » ferme avant la date limite ; « Annulée »
  est affichée barrée partout.
- **Parent** (`/api/famille`) : seulement ses enfants (filtre `liens.user_id` en SQL), avec le
  droit `peut_inscrire` (sinon 403, même réponse que pour un enfant qui n'est pas le sien),
  inscriptions ouvertes (sinon 409), enfant éligible (sinon 409). Désinscription aux mêmes
  conditions.
- **Bureau** (`/api/admin`, rôles `bureau` / `admin`) : inscrit à la place des parents, **même
  après la date limite** (pas si annulée), éligibilité exigée ; retire une inscription ; coche la
  ressaisie. Chaque inscription garde son auteur.
- **Alertes** (sans bloquer, décision de la revue) : n° de licence manquant, pas de dossier
  d'adhésion pour la saison, formalité médicale non reçue — calculées d'après `adherents` et
  `adhesions` à la lecture de la liste.
- **Suppression** d'une compétition : seulement sans inscrit (sinon 409 : l'annuler).

### API

| Route | Accès | Rôle |
| --- | --- | --- |
| `GET /api/competitions` | public | Compétitions à venir (date ≥ aujourd'hui), avec `inscriptionsOuvertes` |
| `GET /api/competitions/:id` | public | Une compétition (aucune donnée d'enfant) |
| `GET /api/famille/competitions` | connecté | Par compétition à venir : mes enfants concernés (éligibles ou inscrits) |
| `GET /api/famille/competitions/:id` | connecté | Mes enfants : catégorie, éligible, droit d'inscrire, inscrit |
| `PUT` / `DELETE /api/famille/competitions/:id/inscriptions/:adherentId` | responsable *inscrire* | S'inscrire / se désinscrire |
| `GET` / `POST /api/admin/competitions`, `PUT` / `DELETE …/:id` | bureau | Liste (avec compteurs inscrits / ressaisis), création, modification, suppression |
| `GET /api/admin/competitions/:id/inscriptions` | bureau | Inscrits (identité, catégorie, ceinture, licence, auteur, alertes) + candidats éligibles non inscrits |
| `PUT` / `DELETE …/:id/inscriptions/:adherentId`, `PUT …/ressaisi` | bureau | Inscription par le bureau, retrait, case « ressaisi » |

Validation : `validerCompetition` (`validation.ts`) — nom et lieu requis, dates ISO, date limite ≤
date, lien `http(s)`, catégories connues et non vides.

### Écrans

| Route | Contenu |
| --- | --- |
| `/competitions` (menu public) | Cartes des compétitions à venir ; connecté : prénoms inscrits / pas encore inscrits |
| `/competitions/$id` (lien partagé) | Infos publiques, itinéraire, page officielle ; bloc « Mes enfants » si connecté (« Inscrire Léa » en un geste), sinon « Se connecter » |
| `/espace/competitions` | Bureau : à venir / passées, compteurs, « Nouvelle compétition » |
| `/espace/competitions/$id` | Bureau : informations (modifier, statut, supprimer), partage WhatsApp (message prêt), inscrits (copier en colonnes pour un tableur, CSV `;` avec BOM), ressaisie, inscription par le bureau |
| Fiches enfant / adhérent | Historique des compétitions (à venir et passées) |

Mises en forme et export : `app/web/src/lib/competitions.ts` (testé).

## Points de vigilance

- La date limite s'entend **en heure de Paris** (`aujourdhuiParis`), jour inclus.
- Les catégories sont figées pour 2026/2027 : une compétition de la saison suivante nécessite de
  mettre la table à jour (ou la spec 003).
- Le CSV contient des données de mineurs : il est généré dans le navigateur (rien n'est stocké
  côté serveur) ; l'aide du bureau rappelle de le supprimer après la ressaisie.
- La page publique n'expose aucune donnée d'enfant ; les prénoms n'apparaissent qu'aux
  responsables connectés, pour leurs propres enfants.

## Références

- Worker : `app/src/worker/routes/competitions.ts`, `routes/famille.ts`, `routes/admin.ts`, `validation.ts`
- Front : `app/web/src/pages/Competition*.tsx`, `pages/espace/Competition*GestionPage.tsx`,
  `components/espace/FormulaireCompetition.tsx`, `components/espace/HistoriqueCompetitions.tsx`
- Contenu partagé : `app/web/src/content/categories.ts` ; aide : rubriques `competitions` et
  `competitions-bureau` de `content/aide.ts`
- RGPD : traitement « Compétitions » (`content/rgpd.ts`, `docs/rgpd/registre-traitements.md`)

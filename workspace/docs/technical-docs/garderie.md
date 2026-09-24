# Garderie du mercredi — demandes, liste du jour, photos (specs 012a, 012b)

## Contexte

Le mercredi, le club récupère des enfants à la garderie (goûter, cours de judo). Les demandes
passaient par WhatsApp. La 012a les met dans le site : le parent demande ou annule, le bureau a la
liste de chaque mercredi. La 012b donne à l'encadrant la liste du jour (photos, personnes
autorisées, téléphones) et laisse les familles gérer photo et personnes autorisées. Le pointage
viendra avec 012c.

## Description / Flux

### Réglages (référentiel de la saison, spec 003)

`garderie: ReglagesGarderie` (`app/web/src/content/garderie.ts`) : `lieux` (1 à 10), `debut` et
`fin` (des mercredis), `fermes` (mercredis sans garderie), `limite` (`jours` avant le mercredi,
`heure` de Paris), `provisoire`. Migration `0009` : ajout dans les saisons existantes (lieu
« Garderie de l’école », septembre → fin juin, la veille à 20 h, à confirmer). Copie vers la
saison suivante : période décalée d'un an sur des mercredis, mercredis fermés vidés, à confirmer.

### Règles partagées (écran et Worker)

- `mercredisOuverts(g)` : tous les mercredis de la période, sans les fermés.
- `limiteDemande(g, mercredi)` = mercredi − `jours`, à `heure` ; `modifiable` compare avec
  `maintenantParis()` (« AAAA-MM-JJ HH:MM », fuseau Europe/Paris).
- En **production**, tant que `provisoire` : aucune demande possible (API 409, page « bientôt »).

### Modèle (`garderie_demandes`, migration 0009)

Clé (`adherent_id`, `date`) ; `lieu` (copié au moment de la demande), `demande_par`,
`demande_le`. Annuler = supprimer. Purge : un an après le mercredi, et à l'anonymisation de
l'adhérent (`instructionsPurge`, spec 019).

### API

| Route | Accès | Rôle |
| --- | --- | --- |
| `GET /api/famille/garderie` | connecté | Réglages utiles, mercredis ouverts à venir (modifiable ou non), ses enfants et leurs demandes |
| `PUT` / `DELETE /api/famille/garderie/:adherentId/:date` | responsable *inscrire* | Demander (avec le lieu) / annuler, avant le délai |
| `POST /api/famille/garderie/:adherentId/serie` | responsable *inscrire* | `{ jusquau, lieu }` : tous les mercredis ouverts encore modifiables jusqu'à cette date |
| `GET /api/admin/garderie?date=` | bureau | Demandes d'un mercredi (par défaut le prochain), mercredis à venir |
| `PUT` / `DELETE /api/admin/garderie/:adherentId/:date` | bureau | Ajout / retrait sans délai |

### Liste du jour de l'encadrant (spec 012b, `routes/encadrant.ts`)

- Monté sous `/api/encadrant` : rôles `encadrant`, `bureau`, `admin`.
- **Le mercredi même seulement** : `jourConsultable` = aujourd'hui (heure de Paris). Hors
  production (`ENVIRONMENT` ≠ `production`), `?date=` choisit un mercredi pour les essais.
- `GET /garderie` : enfants demandés ce jour (par lieu), catégorie, photo (oui / non),
  responsables (qualité, téléphone, *peut récupérer*, *prévenu*), personnes autorisées (téléphone).
  Hors d'un mercredi : `enfants: null` et le prochain mercredi ouvert.
- `GET /garderie/:date/photo/:adherentId` : seulement si l'enfant est demandé ce jour-là et que
  l'accord de la saison est « oui ».
- **Journal** : une entrée par personne et par jour (`cible = adherent`, `cible_id = NULL`,
  détail « garderie du … : photos et contacts »), affichée « la liste des enfants » dans l'écran RGPD.

### Photos d'identification (spec 012b, `worker/photos.ts`, `content/photos.ts`)

- Table `photos_adherents` (migration 0010) : une photo par adhérent, **base64** (JPEG ou WebP),
  `deposee_le`, `deposee_par`. Réduite dans le navigateur (`lib/photo.ts` : 480 px, 60 Ko
  au plus, métadonnées perdues) ; contrôlée par `validerPhoto` (type, poids, signature).
  Pourquoi base64 et 60 Ko : l'export D1 (sauvegarde, recopie vers la qualif) écrit chaque ligne
  en une instruction SQL, limitée à 100 Ko.
- Accord `adhesions.photo_garderie` (+ `_le`, `_par`) : saisi par le bureau dans le dossier
  (envoyé seulement s'il a changé dans le formulaire), ou par la famille (Autorisations, ou en
  déposant la photo). « Non » **efface** la photo.
- Dépôt : responsable légal (mère, père, tuteur) — `PUT /api/famille/enfants/:id/photo`,
  accord donné en même temps (`accord: true`) ; bureau — `PUT /api/admin/adherents/:id/photo`,
  seulement si l'accord est « oui » (journalisé). Retrait : `DELETE` sur les mêmes routes.
- Servie par l'API (`Cache-Control: private, no-store`) ; montrée si l'accord de la saison
  courante est « oui » et si elle a moins d'un an (`PHOTO_RECENTE`).
- Effacement : un an après le dépôt (purge hebdomadaire, `instructionsDurees`, même tant que la
  durée de conservation est à confirmer), à l'anonymisation de l'adhérent, au retrait de
  l'accord. **Jamais dans la qualif** (`anonymisation-qualif.sql` vide la table).
- Export des données (019) : la photo (data URL) et les demandes de garderie y figurent.

### Personnes autorisées gérées par les familles (spec 012b)

`POST /api/famille/enfants/:id/personnes-autorisees`, `DELETE …/:pid` : un responsable qui
peut *inscrire* l'enfant. Le téléphone saisi n'est pas réaffiché aux familles (minimisation) ;
il l'est à l'encadrant et au bureau.

### Écrans

- `/espace/mercredis` (familles) : par enfant, lieu (s'il y en a plusieurs), « Tous les mercredis
  jusqu'au … », liste des mercredis (8 puis « voir les suivants ») avec « Demander » / « Annuler » /
  « Délai passé » ; enfants sans le droit d'inscrire en lecture seule.
- `/espace/garderie` (bureau) : choix du mercredi, enfants par lieu, retrait, ajout par recherche.
- `/espace/garderie-du-jour` (encadrant, bureau, admin) : « Mercredi du jour », cartes par lieu
  (photo agrandissable, « Qui peut venir le chercher » avec appel en un geste) ; sélecteur de
  mercredi hors production.
- « Mes enfants » (familles) : « Autorisés à le récupérer » et « Photo pour la garderie du
  mercredi » sur chaque fiche ; fiche adhérent (bureau) : bloc « Photo pour la garderie »
  (composants partagés `PersonnesAutorisees`, `GestionPhoto`).
- Saisons et tarifs → section « Garderie du mercredi » : lieux, période, mercredis fermés (grille
  des dates par mois), délai, « à confirmer ».

## Points de vigilance

- Le délai s'entend en **heure de Paris** ; le Worker tourne en UTC : toujours passer par
  `maintenantParis()`.
- Changer les lieux n'altère pas les demandes existantes (lieu copié) ; un lieu retiré apparaît
  en « Autre lieu » dans la liste du bureau.
- Allergies / consignes du goûter : rien n'est collecté (donnée de santé, arbitrage du club).
- Accès à la liste du jour : la barrière est l'API (date du jour en production), jamais l'écran.
- Une ancienne version de l'écran du dossier qui n'envoie pas `photo_garderie` ne touche pas
  l'accord (`null` = inchangé).

## Références

- `app/web/src/content/garderie.ts` (+ tests), `referentiel.ts`
- `app/src/worker/routes/famille.ts` (garderie, photo, personnes autorisées), `routes/garderie.ts`,
  `routes/encadrant.ts`, `photos.ts`, `purge.ts`
- `app/web/src/content/photos.ts`, `lib/photo.ts`, `components/espace/Photo.tsx`,
  `components/espace/PersonnesAutorisees.tsx`, `pages/espace/GarderieJourPage.tsx`
- `app/web/src/pages/espace/GarderiePage.tsx`, `GarderieBureauPage.tsx`, `SaisonPage.tsx`, `lib/garderie.ts`

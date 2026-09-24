# Garderie du mercredi — demandes des familles (spec 012a)

## Contexte

Le mercredi, le club récupère des enfants à la garderie (goûter, cours de judo). Les demandes
passaient par WhatsApp. La 012a les met dans le site : le parent demande ou annule, le bureau a la
liste de chaque mercredi. La liste du jour de l'encadrant (photos, contacts) et le pointage
viendront avec 012b et 012c.

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

### Écrans

- `/espace/mercredis` (familles) : par enfant, lieu (s'il y en a plusieurs), « Tous les mercredis
  jusqu'au … », liste des mercredis (8 puis « voir les suivants ») avec « Demander » / « Annuler » /
  « Délai passé » ; enfants sans le droit d'inscrire en lecture seule.
- `/espace/garderie` (bureau) : choix du mercredi, enfants par lieu, retrait, ajout par recherche.
- Saisons et tarifs → section « Garderie du mercredi » : lieux, période, mercredis fermés (grille
  des dates par mois), délai, « à confirmer ».

## Points de vigilance

- Le délai s'entend en **heure de Paris** ; le Worker tourne en UTC : toujours passer par
  `maintenantParis()`.
- Changer les lieux n'altère pas les demandes existantes (lieu copié) ; un lieu retiré apparaît
  en « Autre lieu » dans la liste du bureau.
- Allergies / consignes du goûter : rien n'est collecté (donnée de santé, arbitrage du club).

## Références

- `app/web/src/content/garderie.ts` (+ tests), `referentiel.ts`
- `app/src/worker/routes/famille.ts` (garderie), `routes/garderie.ts`, `purge.ts`
- `app/web/src/pages/espace/GarderiePage.tsx`, `GarderieBureauPage.tsx`, `SaisonPage.tsx`, `lib/garderie.ts`

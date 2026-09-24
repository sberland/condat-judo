# RGPD — droits outillés, purge automatique, journal (spec 019)

## Contexte

La 006 informe les familles et tient le registre ; la 019 outille les droits pour que le bureau
n'ait rien à faire à la main : export des données, accords (droit à l'image, WhatsApp) donnés ou
retirés par la famille, anonymisation à l'échéance de la durée de conservation, traçabilité des
accès aux coordonnées des familles.

## Description / Flux

### Durée de conservation

`RGPD.conservationAdherents` (`app/web/src/content/rgpd.ts`) : **nombre de saisons** après la
dernière adhésion (`Valeur<number>`), texte affiché par `texteConservation`. Tant qu'il est
`provisoire`, la page « Données personnelles » le signale, le déploiement en prod échoue
(`deploy.yml`) et la purge ne fait rien.

### Purge automatique (`app/src/worker/purge.ts`)

- **Déclencheur** : `[triggers] crons = ["0 3 * * 1"]` (lundi 3 h UTC) dans `wrangler.toml`,
  aucun en preview (`[env.preview.triggers] crons = []`). Gestionnaire `scheduled` exporté par
  `index.ts` → `purgerRgpd(env)` : ne fait rien hors `ENVIRONMENT = production`, ni tant que la
  durée est provisoire.
- **Saison** : septembre → août ; `saisonCourante(jour)` = année de début. Dernière saison d'un
  adhérent = son dernier dossier (`adhesions.saison`), sinon la saison de création de sa fiche.
  Anonymisé si dernière saison < saison courante − N (`seuilPurge`). Jamais un adhérent dont le
  compte a un rôle (membre du bureau).
- **Instructions** (`instructionsPurge`, un lot D1 = une transaction ; `anonymise_le` = horodatage
  du passage marque le lot) : marquer les adhérents, puis leurs comptes (responsables, ou compte
  de l'adhérent majeur) sans autre adhérent actif ni rôle ; effacer personnes autorisées, liens,
  accords des dossiers, références des chèques ; anonymiser fiches (« Ancien adhérent n° id »,
  année de naissance gardée, adresse / licence / compte effacés) et comptes (e-mail et téléphone
  effacés, identités, sessions et liens de connexion supprimés) ; durées techniques (journal > 1 an,
  sessions et liens expirés) ; rapport dans `purges` (nombres seulement).
- **Gardé** : montants des dossiers et paiements (comptabilité), inscriptions aux compétitions,
  année de naissance et sexe — rattachés à une fiche anonyme. Une fiche anonymisée ne se restaure
  pas (`POST /adherents/:id/restaurer` l'exclut).
- **Tests** : `app/src/db/purge.test.ts`, les mêmes instructions sur SQLite (node:sqlite).

### Journal des accès sensibles (`app/src/worker/journal.ts`)

Table `journal_acces` (qui, action, cible, id, détail, date). Middleware `journaliser` posé sur
les routeurs `/api/admin` et `/api/tresorerie` : après une réponse réussie, `entreeJournal`
associe la route à une entrée — `routePath(c)` de Hono lu après `next()` désigne la route qui a
répondu (l'index `-1` désignerait la route de repli `*` des fichiers statiques). Journalisé :
consultation de la fiche d'un adhérent (coordonnées des responsables), de la liste des comptes, de la fiche famille du
trésorier ; modifications d'adhérents, responsables, personnes autorisées, dossiers, comptes,
rôles ; liens de connexion ; déconnexions ; exports. Vidé dans la qualif, purgé après un an.

### Export des données (`app/src/worker/export.ts`)

`donneesDuCompte(env, userId)` : le compte (identité, coordonnées, rôles, connexions, sessions) et,
pour chaque adhérent lié (enfant, ou lui-même) : fiche, lien et droits, autres responsables (noms),
personnes autorisées (noms), dossiers de toutes les saisons, versements (sans référence de chèque),
compétitions. JSON aux clés lisibles, généré à la demande (rien n'est stocké).

### API

| Route | Accès | Rôle |
| --- | --- | --- |
| `GET /api/famille/export` | connecté | Ses données (fichier JSON côté navigateur) |
| `GET /api/famille/accords` | connecté | Accords de la saison pour ses enfants — et lui-même, adhérent majeur |
| `PUT /api/famille/accords/:adhesionId` | responsable légal (mère, père, tuteur) ou l'adhérent majeur | `{ accord: 'droit_image' \| 'whatsapp', valeur: 'oui' \| 'non' }`, daté, à son nom |
| `GET /api/admin/comptes/:id/export` | admin | Export pour une demande écrite (journalisé) |
| `GET /api/admin/rgpd` | admin | Durée, purge active ou non, adhérents concernés (prochaine purge, rentrée suivante), historique |
| `GET /api/admin/journal?q=` | admin | 300 dernières entrées, recherche sur l'auteur ou la cible |

### Écrans

- « Mes enfants » : blocs **Autorisations** (oui / non par enfant et par accord) et **Mes données**
  (« Télécharger mes données »).
- **Mon espace → Données personnelles** (admin) : durée, état de la purge, listes des adhérents
  concernés, historique, journal des accès.
- Comptes → Modifier (admin) : « Exporter ses données ».

## Points de vigilance

- La purge **efface** : elle ne tourne qu'en production, une fois la durée confirmée. Avant de
  confirmer, vérifier la liste « À la prochaine purge » (Mon espace → Données personnelles).
- Le déclencheur cron est créé sur le Worker de prod au déploiement (`wrangler deploy`).
- Un nouveau champ personnel dans une table existante doit être traité par la purge
  (`instructionsPurge`) en plus de l'anonymisation de la qualif.
- Deux parents peuvent répondre différemment à un accord : la dernière réponse compte, datée et
  au nom de son auteur.

## Références

- Worker : `purge.ts`, `journal.ts`, `export.ts`, `routes/famille.ts`, `routes/admin.ts`, `index.ts` (`scheduled`)
- Migration : `0007_rgpd_droits.sql` ; tests : `app/src/db/purge.test.ts`, `app/src/worker/journal.test.ts`
- Front : `pages/espace/RgpdPage.tsx`, `pages/espace/FamillePage.tsx`, `lib/rgpd.ts`
- Registre : `workspace/docs/rgpd/registre-traitements.md`

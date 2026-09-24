# Environnement de preview Cloudflare (technique)

> Sas de qualification isolé de la prod. Le mode opératoire (setup, commandes, flux git) est dans
> [`workflow-deploy-spe.md`](../../workflow-deploy-spe.md) → « Environnement de preview ». Ce
> document explique **pourquoi** cette architecture, et les pièges (retour d'expérience du projet
> de référence StrategyHub, spec 007).

## Contexte

La prod porte les données réelles des familles. On veut qualifier une version **sans toucher la
prod ni ses données**.

## Description / Flux

Cloudflare Workers offre deux mécanismes qu'on confond facilement :

| Mécanisme | Ce que ça fait | Isolation des données |
| --- | --- | --- |
| **Versions & Gradual Deployments** | Un **seul** Worker : une version inactive avec URL de preview, promue ensuite. | ❌ **Aucune** — même binding D1 → toute écriture de la preview écrit dans la prod. |
| **Environnements Wrangler** (`[env.preview]`) | **Deux** Workers (`condat-judo`, `condat-judo-preview`), chacun son URL et **sa D1**. | ✅ **Totale** |

Retenu : les **environnements**. Conséquence : la promotion en prod n'est pas un bouton
Cloudflare mais un **merge git + tag** qui déclenche `.github/workflows/deploy.yml`.

```text
feature/NNN ─PR▶ preview ─(preview.yml)▶ deploy --env preview + copie D1 prod (lecture seule) ▶ D1 preview
            (validé) ─PR preview→main + tag vX.Y.Z─(deploy.yml)▶ deploy prod
```

## Points de vigilance

- **Jeton CI de COMPTE, pas utilisateur** ⚠️ — `wrangler d1 export` refuse un jeton *utilisateur*
  (`Authentication error [code: 10000]`) alors que `deploy` passe. `CLOUDFLARE_API_TOKEN` = jeton
  d'API de **compte**, Workers Scripts:Edit + D1:Edit.
- **Access obligatoire sur le host de preview** : sinon la preview est une copie publique des
  données des familles.
- **Saisies preview écrasées** à chaque push sur `preview` (D1 jetable) — voulu.
- **Liste des tables à purger codée en dur** (`contenus_versions`, `contenus`, `photos_adherents`, `garderie_demandes`, `journal_acces`, `purges`, `paiement_parts`, `paiements`, `inscriptions_famille`, `inscriptions_competition`, `competitions`, `adhesions`, `sessions`, `liens_connexion`, `liens`, `personnes_autorisees`, `identites`, `user_roles`, `adherents`, `saisons`, `users`, `d1_migrations`) à
  trois endroits (`app/package.json`, `deploy/refresh-preview-db.ps1`, `preview.yml`) — à mettre
  à jour à chaque nouvelle table, ordre = dépendances FK (enfants d'abord).
- **Copie anonymisée** (spec 008) après import + migrations : `app/src/db/anonymisation-qualif.sql`
  (dans `preview.yml` et `refresh-preview-db.ps1`) pseudonymise familles, adhérents et personnes
  autorisées, et supprime sessions et liens de connexion de la prod. Les **comptes avec un rôle**
  (testeurs du bureau) sont conservés : un testeur obtient son lien par
  `deploy/lien-connexion.ps1 -Email <son e-mail> -Cible preview`, puis passe le verrou Access **et**
  la connexion de l'app. Les comptes famille y ont des e-mails `compte<id>@exemple.test`.
- **Toute nouvelle colonne** doit être classée dans `app/src/db/donnees-personnelles.ts` (et
  traitée dans le SQL si elle est personnelle) : le test `anonymisation.test.ts` bloque la CI sinon.
- **Snapshot prod vide** (avant la première mise en prod) : l'import est sauté, les migrations
  créent le schéma.
- **Clés étrangères à l'import** : l'import D1 se fait par lots et n'honore pas
  `PRAGMA defer_foreign_keys`. Les FK actuelles (`identites.user_id → users`) ne posent pas de
  problème (l'export sort les tables dans l'ordre de création). Une FK auto-référente avec des
  références « en avant » ferait échouer l'import (vécu sur la référence) : à anticiper.
- **`--env preview` ≠ `--preview`** : on sélectionne l'**environnement** ; le flag `--preview` de
  `d1 execute` vise une autre chose (preview DB liée au binding), non utilisée ici.

## Références

- Config : `app/wrangler.toml` (`[env.preview]`), `app/package.json` (`deploy:preview`, `db:migrate:preview`)
- CI : `.github/workflows/preview.yml`
- Script : `deploy/refresh-preview-db.ps1`
- Mode opératoire : [`workflow-deploy-spe.md`](../../workflow-deploy-spe.md)

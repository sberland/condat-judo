# Workflow de déploiement — Condat Judo

> ⚠️ **À lire avec [`workflow-deploy.md`](workflow-deploy.md)** — ce fichier ne couvre que les spécificités projet ; le workflow complet est dans le générique.
>
> 🔧 **Cible : Cloudflare Workers** (Assets + D1). Le Worker sert le site **et** l'API `/api/*`.
> Dépôt : `https://github.com/sberland/condat-judo` (public).

---

## Build : options spécifiques

`publish.ps1` lit la version depuis `app/package.json`, **build le front React**
(`npm run build:web` → `app/web/dist`), puis archive ce build (+ `CHANGELOG.md`) dans
`deploy/current/condat-judo-X.Y.Z.zip` (artefact de la Release GitHub). Le dossier `publish/`
(gitignore) sert d'étape de transit entre le build et le ZIP.

Déploiement manuel du Worker de prod (hors CI) :

```powershell
.\deploy\publish.ps1 -Deploy
```

Le flag `-Deploy` lance `wrangler deploy` **depuis `app/`** (worker + assets bundlés via
`app/wrangler.toml`). Le ZIP reste l'artefact de release ; le déploiement effectif passe par
`wrangler`, pas par le ZIP.

---

## Artefacts produits

| Fichier | Contenu |
| --- | --- |
| `condat-judo-X.Y.Z.zip` | Build du front React (`app/web/dist`) + `CHANGELOG.md` — attaché à la Release GitHub |

Dans `deploy\current\` (gitignore). Attaché à la release sur
`https://github.com/sberland/condat-judo/releases`.

**Pas de `package-deploiement.ps1`** pour ce projet : aucun bundle support à assembler. L'étape
« Package support » du générique est **sautée**.

---

## Scripts `deploy/*.ps1` — points de vigilance (Windows PowerShell 5.1)

Le poste n'a **pas** `pwsh` (PowerShell 7) : tout s'exécute sous PS 5.1. Règles héritées des
incidents du projet de référence (StrategyHub, v1.5.0 → v2.4.1) :

- **BOM UTF-8 obligatoire** sur les scripts `deploy/*.ps1`. Sans BOM, PS 5.1 relit le fichier
  en ANSI et les em-dashes / bandeaux `═══` cassent le parsing. Si un outil réécrit un script
  sans BOM : le relire en UTF-8 explicite et le réécrire **avec BOM**.
- **Paramètres nommés en splatting hashtable** (`@{ Version = '1.5.0' }`), jamais un array
  (les valeurs passeraient en positionnel et casseraient la `ValidatePattern`).
- **Tout exe natif qui écrit sur stderr** (`gh`, `git push`, `npm`/`vite`, `npx wrangler`) casse un
  script sous `$ErrorActionPreference = 'Stop'` **dès que sa sortie est capturée ou redirigée** :
  PS 5.1 emballe chaque ligne de stderr dans un ErrorRecord, qui devient une erreur terminante
  **avant** la lecture de `$LASTEXITCODE`. Tous ces appels passent par la fonction
  `Invoke-Native` des scripts (EAP `'Continue'` local, `2>&1 | ForEach-Object { Write-Host $_ }`,
  test du code de sortie) — **ne jamais les remettre sous EAP=Stop**.
- **Jamais de JSON avec guillemets en argument d'exe natif** (PS 5.1 mange guillemets et
  espaces → JSON invalide). Les notes de release passent par un fichier (`--notes-file`).
- **Vérifier la Release après le script** : `gh release view vX.Y.Z` — le script de référence a
  historiquement affiché un succès alors que la Release n'était pas créée. Le script le fait
  lui-même en fin de parcours, mais le contrôle humain reste de mise.
- **Splatting d'un résultat de pipeline** : `@var` sur le résultat d'un `ForEach-Object` qui ne
  renvoie qu'**un** élément splatte une chaîne caractère par caractère (vu en v0.1.0 : `gh release
  create` → « no matches found for `C` »). Toujours forcer un tableau : `$x = @(... | ForEach-Object ...)`.
  Le script est rejouable : relancé après correction, il réutilise le tag existant.
- **Chemins internes du ZIP** : sous PS 5.1 / .NET Framework, `ZipFile::CreateFromDirectory` écrit
  des séparateurs `\` (sans effet sous Windows ; à revoir si l'archive doit être extraite sous Linux).
- `Compress-Archive` peut échouer en erreur **non terminante** (verrou antivirus transitoire) :
  toujours `-ErrorAction Stop` et `Test-Path` sur l'artefact produit.

---

## Déploiement Cloudflare Workers

### Option A — GitHub Actions (recommandé)

| Workflow | Déclencheur | Action |
| --- | --- | --- |
| `.github/workflows/ci.yml` | PR vers `main`/`preview`, push sur `main`/`preview` | typecheck worker + front, tests, build |
| `.github/workflows/preview.yml` | push sur `preview` (ou manuel) | copie D1 prod → preview, migrations, `wrangler deploy --env preview` |
| `.github/workflows/deploy.yml` | tag `vX.Y.Z` | contrôle version tag = `app/package.json`, **sauvegarde chiffrée si migrations en attente**, migrations prod, `wrangler deploy` |
| `.github/workflows/sauvegarde.yml` | chaque nuit (02 h 30 UTC, depuis `main`) ou manuel | sauvegarde chiffrée de la D1 de prod vers le dépôt privé, rétention (spec 007) |

**Secrets GitHub Actions** (Settings → Secrets and variables → Actions, ou `gh secret set`) :

- `CLOUDFLARE_API_TOKEN` — **jeton d'API de compte** (pas utilisateur) avec **Workers
  Scripts:Edit et D1:Edit**. ⚠️ Un jeton *utilisateur* est refusé par `wrangler d1 export`
  (`Authentication error [code: 10000]`) — constaté sur le projet de référence.
- `CLOUDFLARE_ACCOUNT_ID` — identifiant du compte Cloudflare.

Le tag `vX.Y.Z` est créé par `deploy/deploy-release-on-github.ps1` (voir générique) → déclenche
`deploy.yml`.

### Option B — Manuel (depuis un poste authentifié)

```bash
cd app
npx wrangler d1 migrations apply condat-judo --remote
npm run build:web
npx wrangler deploy
```

Prérequis : `npx wrangler login` (OAuth) ou `CLOUDFLARE_API_TOKEN` dans l'environnement.

---

## Base de données D1

| Environnement | Base D1 | Worker | URL |
| --- | --- | --- | --- |
| Prod | `condat-judo` (`a58cc624-…`, juridiction UE) | `condat-judo` | `https://condat-judo.sebastien-berland.workers.dev` |
| Preview | `condat-judo-preview` (`0bf6338c-…`, juridiction UE) | `condat-judo-preview` | `https://condat-judo-preview.sebastien-berland.workers.dev` |

- Bases créées le 2026-09-23 avec `--jurisdiction eu` (données stockées et traitées dans l'UE — RGPD) ; `database_id` dans `app/wrangler.toml`.
- Compte Cloudflare : compte perso `Sebastien.berland@gmail.com's Account` (partagé avec d'autres projets — l'équipe Zero Trust et son quota gratuit de 50 utilisateurs Access aussi).
- ⚠️ **Ne jamais `db:seed` ni `db:reset` sur une base distante** : le seed est réservé au `--local`.
- `migrations apply --remote` n'applique que les migrations en attente.
- **Sauvegarde** (spec 007, [`sauvegarde.md`](docs/technical-docs/sauvegarde.md)) : export
  **chiffré** (age) chaque nuit et avant toute migration, dans le dépôt **privé**
  `sberland/condat-judo-sauvegardes` (30 quotidiennes + une par mois sur un an) ; restauration
  testable vers la qualif par `deploy/restaurer-sauvegarde.ps1`. En plus : D1 **Time Travel**
  (30 jours, chez Cloudflare). ⚠️ Un déploiement qui migre **échoue** si la sauvegarde n'est pas
  configurée (secrets) — c'est voulu.
- **Premier administrateur** : aucun compte n'est promu automatiquement (pas d'email magique dans
  le code). Création par SQL puis lien de connexion par `deploy/lien-connexion.ps1 -Cible production`
  — procédure dans [`installation.md`](docs/install/installation.md).

---

## Environnement de preview

Sas de **qualification** entre le dev local et la prod. **Worker et D1 dédiés**, totalement
isolés de la prod. Détail technique : [`cloudflare-preview.md`](docs/technical-docs/cloudflare-preview.md).

### Flux de promotion

```text
local (wrangler dev + D1 locale)
   │  PR feature/NNN-slug ──▶ preview
   ▼
branche `preview` ──Actions(preview.yml)──▶ deploy --env preview
   │                                         + copie D1 prod (lecture seule) ▶ D1 preview
   ▼  validé → PR preview → main, puis tag vX.Y.Z
 main ──(tag) Actions(deploy.yml)──▶ deploy prod
```

- **Un push sur `preview`** recopie la D1 de prod (`wrangler d1 export`, **lecture seule sur la
  prod**) dans la D1 de preview, applique les migrations, puis déploie `condat-judo-preview`.
- Les saisies faites en preview sont **écrasées** à chaque push (D1 preview jetable).
- **Bascule en prod** = PR `preview` → `main` + tag `vX.Y.Z`. Pas de « bouton » Cloudflare.

### Convention de déploiement (qualif d'abord)

0. **Local d'abord.** Handoff de revue sur `http://localhost:5173/` avant tout déploiement.
1. **Par défaut = qualif.** Toute demande de déploiement va sur la preview.
2. **Prod = sur validation explicite uniquement.** Après un déploiement qualif, **toujours
   demander** s'il faut promouvoir en prod.
3. **Déploiement prod unitaire possible** sur demande explicite, sur la base du code validé en qualif.

⚠️ **Règle données (absolue) — le sens de copie est TOUJOURS `prod → qualif`, jamais l'inverse.**
Un déploiement prod ne concerne que **l'app (code + assets)** ; la D1 de prod conserve ses données.

⚠️ **Données personnelles en preview** : la preview contient une *copie* des données réelles →
l'accès au site est **verrouillé par Cloudflare Access** (« Protéger ce Worker » sur `condat-judo-preview`,
politique « Condat Judo — bureau ») et réservé aux personnes habilitées. Ce verrou n'a **aucun lien
avec l'authentification de l'app** (cf. [`cloudflare-access.md`](docs/technical-docs/cloudflare-access.md)).
La prod, elle, n'a pas de verrou Access : le site est public.

### Tables purgées avant import

Liste codée en dur (ordre = dépendances FK) : `inscriptions_competition`, `competitions`, `adhesions`, `sessions`, `liens_connexion`, `liens`, `personnes_autorisees`, `identites`, `user_roles`, `adherents`, `saisons`, `users`, `d1_migrations`.
Présente à trois endroits, **à tenir à jour à chaque nouvelle table** :
`app/package.json` (`db:reset:local`), `deploy/refresh-preview-db.ps1`, `.github/workflows/preview.yml`.

Après import et migrations, la copie est **anonymisée** (spec 008,
`app/src/db/anonymisation-qualif.sql`, mêmes deux fichiers) : familles, adhérents et personnes
autorisées pseudonymisés, sessions et liens de connexion de la prod supprimés ; comptes avec un
rôle (testeurs) conservés. Toute nouvelle colonne est classée dans
`app/src/db/donnees-personnelles.ts` (test bloquant en CI).

### Déploiement / refresh manuel (hors CI)

```powershell
.\deploy\refresh-preview-db.ps1   # copie prod → D1 preview (prod en lecture seule)
```

```bash
cd app
npm run deploy:preview            # wrangler deploy --env preview
```

---

## Setup initial (à faire une fois)

Suivi dans [`installation.md`](docs/install/installation.md) § « Mise en place Cloudflare / GitHub » :

- [x] D1 `condat-judo` et `condat-judo-preview` créées (juridiction UE), `database_id` reportés dans `app/wrangler.toml`
- [x] Jeton d'API de compte `condat-judo-github-actions` (Workers Scripts:Edit + D1:Edit) ; secrets `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` dans GitHub
- [x] Verrou Access sur la **preview** (« Protéger ce Worker », portée « Tout le trafic », politique `Condat Judo — bureau`, code PIN à usage unique) — vérifié : anonyme → 302
- [x] Ruleset GitHub sur `main` et `preview` (PR obligatoire, check CI « Typecheck, tests, build »)
- [ ] Premier tag (vitrine v1) → déploiement prod vérifié (site public accessible)
- [ ] Sauvegarde : dépôt privé, clé age (privée hors ligne), variable `SAUVEGARDE_CLE_PUBLIQUE`, secret `SAUVEGARDE_TOKEN` ; première sauvegarde et restauration testées (spec 007)
- [ ] Premier administrateur créé en prod et connecté — possible dès la livraison de la spec 005a (`deploy/lien-connexion.ps1`)

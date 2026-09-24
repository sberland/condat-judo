# Workflow de développement — Condat Judo

> ⚠️ **À lire avec [`workflow-dev.md`](workflow-dev.md)** — ce fichier ne couvre que les spécificités projet ; le workflow complet est dans le générique.

---

## Revue de spec — points à identifier à chaque spec

Dès la revue de spec (step 0), toute spec identifie :

- **Les droits requis** : qui peut voir / faire quoi (parent, encadrant, bureau, admin). L'API est la
  vraie barrière ; le masquage UI n'est jamais la sécurité. Les droits référencent `users.id`, jamais
  l'email (cf. [`identite-auth.md`](docs/technical-docs/identite-auth.md)).
- **Les données personnelles** traitées (RGPD) : finalité, minimisation, qui y accède, durée de
  conservation. Données de mineurs et photos = vigilance renforcée ; aucune donnée de santé stockée.
- **L'usage mobile** : le parcours parent doit tenir sur un écran de téléphone (360 px).
- **L'aide intégrée** : toute spec qui ajoute ou modifie un écran de l'espace membres met à jour
  `app/web/src/content/aide.ts` (rubrique du profil concerné : famille, bureau, admin… ; nouvelle
  rubrique pour un nouveau rôle) et relie l'écran à sa rubrique (`<Espace aide="…">`). C'est la
  documentation que lisent les parents et le bureau.

---

## Démarrer l'application (développement local)

Deux serveurs en parallèle :

```bash
cd app
npm install          # première fois uniquement
npm run build:web    # première fois : wrangler dev sert web/dist (doit exister)
npm run dev          # wrangler dev — API /api/* + D1 locale + dernier build (web/dist)
npm run dev:web      # vite — front React live (:5173), proxy /api → :8787
```

Interface principale (dev) : `http://localhost:5173/` (front React live, rechargé à chaud).
`http://localhost:8787/` sert le **dernier build** `web/dist` — utile pour vérifier le bundle,
pas pour le développement courant.

Base D1 locale (première fois — crée + seed la base locale jetable) :

```bash
cd app
npm run db:migrate:local && npm run db:seed:local
```

Remise à zéro complète de la base locale : `npm run db:reset:local`.

Utilisateur simulé en local : `app/.dev.vars` (copie de `app/.dev.vars.example`, non commité)
définit `ENVIRONMENT=local` et `DEV_SUBJECT=dev-admin`, qui correspond à l'utilisateur
« Admin Dev » du seed. Changer `DEV_SUBJECT` (ex. `dev-parent`, `dev-bureau`) pour se mettre dans
la peau d'un autre utilisateur du seed.

Tester la vraie connexion par lien (spec 005a) : une session ouverte par un lien **prime** sur
l'utilisateur simulé. Pour partir d'un visiteur anonyme, lancer un second worker sans utilisateur
simulé, puis créer un lien pour un compte du seed :

```powershell
cd app; npx wrangler dev --port 8789 --inspector-port 9239 --var "DEV_SUBJECT:"   # http://localhost:8789 (dernier build)
.\deploy\lien-connexion.ps1 -Email parent.dev@example.test -Cible local           # lien http://localhost:5173/connexion#…
```

Le lien affiché pointe sur `:5173` (admin simulé via le worker `:8787`) : remplacer le port par
`8789` pour se connecter en partant d'un visiteur anonyme. Les cookies ne distinguent pas les ports
de `localhost` : se déconnecter (ou vider les cookies) avant de revenir à l'utilisateur simulé.

## Arrêter le serveur local

`Ctrl+C` dans le terminal où tourne le serveur.

---

## Handoff utilisateur (Step 4)

Avant de prévenir l'utilisateur que c'est prêt :

1. Démarrer le worker local (`cd app && npm run dev`)
2. Démarrer le front React (`cd app && npm run dev:web`)
3. Vérifier que `http://localhost:5173/` s'affiche correctement, y compris en largeur mobile
   (outils de développement du navigateur, 360 px)

URL de test :

- Application (revue) : `http://localhost:5173/`
- Worker seul (API + dernier build) : `http://localhost:8787/`
- Santé : `http://localhost:8787/api/health`

> La revue locale est aussi l'**étape 0 de tout déploiement assisté** — voir
> `workflow-deploy-spe.md` § « Convention de déploiement » : rien ne part en qualif
> sans un OK sur `http://localhost:5173/`.

---

## Actions spécifiques au merge (Step 6)

**Branche cible des PR feature : `preview`** (sas de qualification). La promotion en prod se fait
ensuite par une PR `preview` → `main`, puis le tag `vX.Y.Z` (voir `workflow-deploy-spe.md`).

Fichiers à bumper :

- `app/package.json` — champ `version` (source unique ; injectée dans le front via Vite et
  renvoyée par `/api/health`). Garder `app/package-lock.json` cohérent (`npm install` après bump).

Si la spec ajoute une table D1 : l'ajouter aux listes de purge de la preview
(`db:reset:local` dans `app/package.json`, `deploy/refresh-preview-db.ps1`,
`.github/workflows/preview.yml`).

Si la spec ajoute une table **ou une colonne** : la classer dans
`app/src/db/donnees-personnelles.ts` (conservée / pseudonymisée / purgée) et, si elle est
personnelle, la traiter dans `app/src/db/anonymisation-qualif.sql` (spec 008) — sinon le test
`anonymisation.test.ts` échoue.

---

## URL et ports

| Environnement | Port | URL |
| --- | --- | --- |
| Dev local — front React (Vite) | 5173 | `http://localhost:5173` (revue / handoff) |
| Dev local — worker (API + build) | 8787 | `http://localhost:8787` (wrangler dev) |
| Preview / qualif | — | Cloudflare Workers `condat-judo-preview` (voir `workflow-deploy-spe.md`) |
| Production | — | Cloudflare Workers `condat-judo` (voir `workflow-deploy-spe.md`) |

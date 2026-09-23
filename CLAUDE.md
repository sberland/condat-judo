# CLAUDE.md — Condat Judo

Contexte et conventions pour l'assistant IA sur ce projet.

---

## ⚠️ Règle d'implémentation — PRIORITÉ ABSOLUE

**Toute demande d'implémentation de spec** (« traite la spec », « implémente », « on va implémenter… », etc.) **DOIT suivre ce protocole sans exception, dans cet ordre :**

1. **Lire `workspace/workflow-dev.md`** en entier
2. **Lire `workspace/workflow-dev-spe.md`** en entier
3. **Lire `workspace/docs/README.md`** et les technical-docs liées aux modules impactés
4. **Revue de spec** (step 0 du workflow) — identifier les points flous, soumettre les choix structurants
5. **Créer la branche** `feature/NNN-slug` depuis `main`
6. **Seulement ensuite** : coder

**Aucune modification de fichier source avant l'étape 5.** Même pour une « petite » spec.

---

## ⚠️ Règle de déploiement

**Toute action de déploiement** (release, publication, tag, package…) **DOIT commencer par lire les deux fichiers, dans cet ordre :**

1. **Lire `workspace/workflow-deploy.md`** en entier
2. **Lire `workspace/workflow-deploy-spe.md`** en entier

---

## Ce que fait ce projet

Site web du club **Judo Condat** (petit club associatif). Il remplace les groupes WhatsApp pour
la vie du club : les parents se connectent (depuis leur mobile, le plus souvent), consultent les
compétitions et y inscrivent leurs enfants, demandent la prise en charge du mercredi (garderie →
goûter + cours) ; le bureau administre les comptes, les enfants et leurs contacts, et suit le
paiement des licences. Besoin d'origine : [`workspace/docs/spec-fonctionnelle/expression-besoin.md`](workspace/docs/spec-fonctionnelle/expression-besoin.md).

**Modules fonctionnels** (cibles — voir [`backlog.md`](workspace/tasks/backlog.md)) :

| Module | Rôle |
| --- | --- |
| **Site vitrine** | Accueil, informations du club, contact |
| **Comptes & foyers** | Adultes, enfants, lien parent ↔ enfant, rôles club, administration des comptes |
| **Compétitions** | Publication (date, lieu, catégories), inscription des enfants par les parents, liste pour la ressaisie fédération |
| **Garderie du mercredi** | Demande de prise en charge, liste du jour (photo), pointage « récupéré » |
| **Licences** | Suivi / validation des paiements par le trésorier |
| **Communication** | Actualités, calendrier du club |

**Application web** : Worker Cloudflare servant le front **React** (build Vite via Workers Assets) +
une API `/api/*` (Hono/TypeScript) sur base **D1**. Aujourd'hui : socle technique (`/api/health`,
`/api/me`), accès protégé par Cloudflare Access.

---

## Architecture

```text
app/           — Worker Cloudflare
├── src/worker/    — API Hono (/api/*) + fallback ASSETS ; identite.ts = seam d'identité
├── src/db/        — migrations D1 + seed (--local uniquement)
├── web/           — front React (Vite + TypeScript + Tailwind + TanStack), build → web/dist
└── wrangler.toml  — [assets] (web/dist) + [[d1_databases]] + [env.preview]
deploy/        — Scripts de packaging, release GitHub et refresh de la D1 de preview
.github/       — Workflows GitHub Actions (CI, preview, prod sur tag)
workspace/     — Documentation, specs, workflows
```

Déployé sur **Cloudflare Workers** — prod `condat-judo` + environnement **preview** de
qualification `condat-judo-preview` (Worker et D1 dédiés).

### Services clés

| Service | Rôle |
| --- | --- |
| `resolveUser` (`app/src/worker/identite.ts`) | **Point unique** requête → utilisateur interne (`users.id`). Fournisseurs : Cloudflare Access (JWT vérifié), dev local. Voir [`identite-auth.md`](workspace/docs/technical-docs/identite-auth.md) |
| `verifyAccessJwt` (`app/src/worker/access-jwt.ts`) | Vérification de signature / audience / expiration du JWT Cloudflare Access |

**Règle d'or identité** : aucun droit n'est rattaché à l'email ni à un artefact Access. Tous les droits
référencent `users.id` ; seule la table `identites` connaît le fournisseur d'authentification.

### Commandes essentielles

```bash
# Dev local — deux serveurs en parallèle (depuis app/)
npm install                                   # première fois
npm run db:migrate:local && npm run db:seed:local   # première fois : D1 locale jetable
npm run build:web                             # première fois : wrangler dev sert web/dist
npm run dev                                   # wrangler dev — API /api/* + D1 locale (:8787)
npm run dev:web                               # vite — front React live (:5173, proxy /api → :8787)
```

#### Arrêt du serveur local

`Ctrl+C` dans le terminal du serveur. Pas de process nommé à cibler.

#### Conventions shell — règles impératives

**Choix du tool selon la nature de la commande :**

| Commande | Tool | Raison |
| --- | --- | --- |
| `git *` | **Bash** | git est natif Unix — `Bash(git *)` est dans l'allowlist |
| `gh *` (PR, issues, runs Actions, releases) | **Bash** | CLI officiel GitHub — `Bash(gh *)` dans l'allowlist |
| Build, scripts deploy, commandes Windows | **PowerShell** | natif Windows |
| Script qui mélange git + logique PS | Deux appels séparés | Bash pour git/gh, PowerShell pour le reste |

Le contexte de session indique `Shell: PowerShell` — ce n'est **pas** une instruction
d'utiliser le tool PowerShell pour git ou gh. Toujours utiliser **Bash** pour ces deux outils.

**`gh` est le CLI GitHub officiel** (`C:\Program Files\GitHub CLI\gh.exe`, dans le PATH après
redémarrage de VS Code). Authentifié sur le compte `sberland` (keyring, scopes `repo` + `workflow`) ;
`gh auth setup-git` branche aussi `git push` dessus. L'utiliser systématiquement pour toutes les
opérations GitHub — **jamais curl ni l'API REST directement** (`gh api` si besoin).

```bash
gh pr create --fill --base preview           # crée la PR depuis la branche courante
gh pr merge <n> --merge --delete-branch      # merge une PR (checks CI au vert)
gh pr list                                   # liste les PRs ouvertes
gh pr view <n>                               # détails d'une PR
gh pr checks <n>                             # état des checks CI
gh run list / gh run view <id>               # runs GitHub Actions
```

**Jamais de `cd` en préfixe de commande.** Le répertoire courant est déjà le
projet root et persiste entre les appels. Écrire directement la commande.

```bash
# ✗ À ne JAMAIS faire
cd c:/Src/Repos/Perso/Judo && git status

# ✓ Correct
git status
```

**`rm` uniquement dans `/tmp/`.** Pour tout fichier temporaire à supprimer. En
dehors de `/tmp/`, utiliser `git rm` (fichiers trackés) ou laisser à l'utilisateur.
Écrire les fichiers temporaires dans `/tmp/nom-fichier` dès leur création.

---

## Documentation projet

### Structure du workspace

```text
workspace/
├── docs/                   ← documentation (spec-fonctionnelle, technical-docs, external-docs, users-docs, install, test)
├── notes/                  ← notes libres, brouillons
├── tasks/                  ← specs pending / done + backlog.md
├── workflow-dev.md         ← workflow dev générique
├── workflow-dev-spe.md     ← workflow dev spécifique projet
├── workflow-deploy.md      ← workflow déploiement générique
├── workflow-deploy-spe.md  ← workflow déploiement spécifique projet
└── workflow-workspace.md   ← structure canonique et migration workspace
```

Raccourcis :

- **Nouvelle spec** → créer `tasks/pending/NNN-titre.md` depuis `tasks/_template.md`
- **Nouveau chantier** → créer `tasks/pending/NNN-CHT-titre.md` depuis `tasks/_template-chantier.md`
- **Entrée CHANGELOG** → utiliser `tasks/_template-changelog.md`
- **Note libre** → déposer dans `notes/`
- **Doc de référence externe** → `docs/external-docs/<source>/`
- **Analyse technique** → `docs/technical-docs/<sujet>.md`

Spécifications markdown légères dans `workspace/tasks/pending/NNN-titre.md`, déplacées dans
`workspace/tasks/done/` une fois livrées (via `git mv`). Cf. `workspace/workflow-dev.md` pour
le workflow détaillé.

### Docs

Index complet (spec fonctionnelle, technical-docs, external-docs, users-docs, install, test) : [`workspace/docs/README.md`](workspace/docs/README.md)

### Notes

Notes libres et brouillons dans `workspace/notes/`.

### Workflows

#### Développement

- **Générique** : [`workspace/workflow-dev.md`](workspace/workflow-dev.md)
- **Spécifique projet** : [`workspace/workflow-dev-spe.md`](workspace/workflow-dev-spe.md)

Règles critiques (valables même hors workflow) :

- Branche `feature/NNN-slug` — jamais de commit direct sur `main` (protégé GitHub — ruleset).
- Tout merge passe par une PR GitHub — pas de `git push origin main` direct.
- Handoff explicite avant toute validation manuelle (voir Step 4 dans `workflow-dev.md`).
- **Aucun merge** sans « validé » explicite — « les tests passent » ne suffit pas.

Règles propres à ce projet :

- **Dépôt public** : **aucune donnée personnelle** dans le dépôt (noms d'enfants, contacts, photos,
  exports de base). Seeds et exemples = données fictives. Les vraies données ne vivent que dans D1.
- **Ressources externes** (Cloudflare : Workers, D1, Access ; GitHub : secrets, rulesets, releases,
  tags) : ne rien créer ni modifier sans accord explicite — proposer la commande, l'utilisateur valide.

#### Déploiement

- **Générique** : [`workspace/workflow-deploy.md`](workspace/workflow-deploy.md)
- **Spécifique projet** : [`workspace/workflow-deploy-spe.md`](workspace/workflow-deploy-spe.md)

### Cohérence inter-projets

Voir [`workspace/workflow-workspace.md`](workspace/workflow-workspace.md) — fichiers canoniques, règles de structure, procédures de création et migration.

---

## Stack technique

| Composant | Technologie |
| --- | --- |
| Langage | TypeScript 7 (worker + front) |
| Framework front | React 19 · Vite 8 · Tailwind CSS 4 · TanStack Router / Query |
| Framework API | Hono 4 |
| Backend / BDD | Worker Cloudflare + Cloudflare D1 (SQLite) |
| Plateforme cible | Navigateur mobile d'abord (iOS Safari / Chrome Android), puis desktop |
| Hébergement | Cloudflare Workers (Assets + D1) — prod + env preview |
| Authentification | Cloudflare Access (démarrage) derrière le seam `resolveUser` ; cible applicative à trancher (chantier auth) |
| Outillage | Node.js 24 / npm · Wrangler 4 · Vite · Vitest |
| Packaging | ZIP via PowerShell |
| Release | GitHub Releases + `wrangler deploy` (GitHub Actions sur tag) |

---

## Conventions de code

- **Front React** (`app/web/src/`) — TypeScript ; composants sous `components/` et `pages/`, style **Tailwind CSS 4** (tokens dans `index.css` via `@theme`). Routing **TanStack Router**, data-fetching **TanStack Query**. **Mobile first** : toute page doit être utilisable à 360 px de large.
- **Worker** (`app/src/worker/`) — TypeScript (Hono). Autorisation via le seam d'identité `resolveUser` — voir `workspace/docs/technical-docs/identite-auth.md` (jamais de droit keyé sur l'email ou un artefact Access).
- **Base D1** — migrations numérotées dans `app/src/db/migrations/` (jamais modifier une migration déjà appliquée) ; seed réservé au `--local`. Toute nouvelle table doit être ajoutée aux listes de purge de la preview (cf. `workflow-deploy-spe.md`).
- **Données personnelles** — minimisation (RGPD) : ne collecter que le nécessaire, pas de données de santé stockées, photos d'enfants accessibles au strict nécessaire.
- **Version applicative** : `app/package.json` (champ `version`, source unique) — injectée dans le front via Vite (`__APP_VERSION__`) et renvoyée par `/api/health`.

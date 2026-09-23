# Condat Judo — Site du club

Site web du club Judo Condat : informations du club, inscriptions des enfants aux compétitions,
prise en charge du mercredi, suivi des licences. Pensé pour les parents sur mobile ; hébergé sur
Cloudflare Workers (Assets + API + D1).

[CHANGELOG](CHANGELOG.md)

---

## Prérequis

| Composant | Version minimale |
| --- | --- |
| Navigateur moderne (mobile ou desktop) | Safari iOS 17 / Chrome 120 / Firefox 120 / Edge 120 |
| Node.js (dev local) | 24 LTS |
| Wrangler CLI (installé via npm) | 4.x |
| GitHub CLI `gh` (release) | 2.x |

---

## Démarrage rapide

```bash
cd app
npm install                                        # première fois
npm run db:migrate:local && npm run db:seed:local  # première fois : D1 locale
npm run build:web                                  # première fois
npm run dev                                        # worker :8787
npm run dev:web                                    # front :5173 (autre terminal)

# Interface principale (dev)
http://localhost:5173/

# Santé de l'API
http://localhost:8787/api/health
```

---

## Modules

| Module | Route principale | Description |
| --- | --- | --- |
| Santé | `/api/health` | Statut, version et environnement |
| Identité | `/api/me` | Utilisateur connecté (via le seam d'identité) |

Pages web intégrées : `/` (accueil). Les modules métier (compétitions, garderie, licences…) sont au
[backlog](workspace/tasks/backlog.md).

---

## Architecture

```text
app/           — Worker Cloudflare (API Hono /api/* + Workers Assets)
├── src/worker/    — API Hono + seam d'identité (TypeScript)
├── src/db/        — migrations D1 + seed local
├── web/           — front React (Vite + Tailwind + TanStack)
└── wrangler.toml  — assets + D1 + env preview
deploy/        — Scripts de packaging, release GitHub, refresh D1 preview
.github/       — GitHub Actions (CI, preview, prod sur tag)
workspace/     — Documentation, specs, workflows
```

Un Worker Cloudflare sert le front React buildé et l'API `/api/*` sur D1. Deux environnements :
prod (`condat-judo`) et qualification (`condat-judo-preview`), chacun avec son Worker et sa D1.

---

## Déploiement

```powershell
# Build du front + archive de release
.\deploy\publish.ps1

# Créer la release GitHub (tag + artefact + notes de version) — le tag déclenche le déploiement prod
.\deploy\deploy-release-on-github.ps1 -Version X.Y.Z
```

Qualification : push sur la branche `preview` (GitHub Actions). Détail :
[`workspace/workflow-deploy-spe.md`](workspace/workflow-deploy-spe.md).

---

## Documentation

- [Documentation projet](workspace/docs/README.md) — index technique, utilisateur, installation, tests
- [Tâches en cours](workspace/tasks/pending/) — specs fonctionnelles
- [Backlog](workspace/tasks/backlog.md) — idées et fonctionnalités non encore spécifiées
- [Changelog](CHANGELOG.md) — historique des versions

---

## Développement

Voir [`workspace/workflow-dev.md`](workspace/workflow-dev.md) (générique)
et [`workspace/workflow-dev-spe.md`](workspace/workflow-dev-spe.md) (commandes et ports projet).

---

## Données personnelles

Le site traite des données de familles, dont des mineurs. Ce dépôt est **public** : il ne contient
**aucune donnée personnelle** (seeds fictifs uniquement). Conformité RGPD : voir le backlog.

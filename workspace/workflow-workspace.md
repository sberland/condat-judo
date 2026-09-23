# Workflow workspace — Structure canonique (projets perso GitHub)

<!-- markdownlint-disable MD024 MD031 MD032 MD040 -->
<!-- Ce fichier embarque des templates markdown avec blocs de code imbriqués : les règles de fence et de listes ne s'appliquent pas à son contenu. -->

> **Règle fondamentale** : ce fichier est la **source de référence unique** pour la structure workspace des projets perso hébergés sur GitHub. Il est dérivé de la version TheraSoft (StrategyHub, 2026-09-23), transposée GitLab → GitHub (`glab` → `gh`, MR → PR, GitLab CI → GitHub Actions, Generic Packages → GitHub Releases). Toute évolution de structure (nouvelle section dans un fichier générique, nouvelle convention, nouveau skeleton) **se fait ici en premier**, puis se propage aux projets concernés.

---

## Cohérence inter-projets

| Fichier | Règle |
| --- | --- |
| `workspace/workflow-dev.md` | **Identique** entre tous les projets — toute modification passe par ce fichier en premier |
| `workspace/workflow-deploy.md` | **Identique** entre tous les projets — toute modification passe par ce fichier en premier |
| `workspace/workflow-workspace.md` | **Identique** entre tous les projets — source canonique |
| `workspace/workflow-dev-spe.md` | **Structure commune** (sections), contenu spécifique projet |
| `workspace/workflow-deploy-spe.md` | **Structure commune** (sections), contenu spécifique projet |
| `README.md` | 8 sections dans l'ordre — voir §F (migration) |
| `CLAUDE.md` | 7 sections dans l'ordre — voir §G (migration) |
| `workspace/tasks/backlog.md` | Légende + Conventions + tableau + Synthèse — voir skeleton ci-dessous |
| `workspace/docs/technical-docs/_template.md` | **Identique** entre tous les projets — copie depuis le projet de référence |
| `workspace/tasks/_template.md` | **Identique** entre tous les projets — copie depuis le projet de référence |
| `workspace/tasks/_template-chantier.md` | **Identique** entre tous les projets — copie depuis le projet de référence |
| `workspace/tasks/_template-changelog.md` | **Identique** entre tous les projets — copie depuis le projet de référence |

**Ligne de démarcation :** la **structure** (sections, ordre, conventions) est normalisée par ce fichier ; le **contenu** (commandes, noms de process, ports, scripts) est spécifique à chaque projet.

---

## Arborescence cible

```text
[NomProjet]/
├── .claude/
│   └── settings.local.json          ← permissions Claude Code (à adapter)
├── .github/
│   └── workflows/                   ← CI/CD GitHub Actions (à adapter)
├── .gitignore
├── CHANGELOG.md                     ← skeleton première version
├── README.md                        ← skeleton
├── CLAUDE.md                        ← template avec éléments génériques prêts
├── src/                             ← code source du projet (à compléter)
├── deploy/
│   ├── prepare-changelog.ps1            ← skeleton à adapter
│   ├── publish.ps1                      ← skeleton à adapter
│   ├── package-deploiement.ps1          ← skeleton à adapter
│   ├── deploy-release-on-github.ps1     ← skeleton complet à adapter
│   └── current/                         ← gitignore (artefacts build)
└── workspace/
    ├── docs/
    │   ├── README.md                ← index doc (skeleton à compléter)
    │   ├── technical-docs/
    │   │   └── _template.md         ← copie depuis le projet de référence
    │   ├── external-docs/           ← vide
    │   ├── users-docs/
    │   │   ├── utilisation.md       ← skeleton
    │   │   └── changelog-metier.md  ← skeleton
    │   ├── install/
    │   │   └── installation.md      ← skeleton
    │   └── test/                    ← vide
    ├── notes/                       ← vide
    ├── tasks/
    │   ├── pending/                 ← vide
    │   ├── done/                    ← vide
    │   ├── backlog.md               ← skeleton
    │   ├── _template.md             ← copie depuis le projet de référence
    │   ├── _template-chantier.md    ← copie depuis le projet de référence
    │   └── _template-changelog.md   ← copie depuis le projet de référence
    ├── workflow-dev.md              ← copie générique depuis le projet de référence
    ├── workflow-dev-spe.md          ← skeleton à adapter
    ├── workflow-deploy.md           ← copie générique depuis le projet de référence
    ├── workflow-deploy-spe.md       ← skeleton à adapter
    └── workflow-workspace.md        ← copie depuis le projet de référence (ce fichier)
```

---

## Contenu des fichiers skeleton

> ⚠️ **Encodage des scripts `.ps1` : UTF-8 avec BOM obligatoire.** Sous Windows
> PowerShell 5.1 (`pwsh` n'est pas garanti sur les postes), un script sans BOM est relu
> en ANSI — les em-dashes et bandeaux `═══` cassent alors le parsing.

### `.gitignore`

```text
# .NET
*.user
*.suo
.vs/
bin/
obj/

# Build artifacts
publish/
deploy/current/

# Logs
*.log
logs/

# Packages
*.nupkg
*.snupkg

# Secrets
*.pfx
*.p12
appsettings.*.json
!appsettings.json
!appsettings.Development.json

# Claude Code
.claude/scheduled_tasks.lock
```

Bloc à ajouter pour une stack Node / Cloudflare Workers :

```text
# Node / Wrangler
node_modules/
.wrangler/
.dev.vars

# Front build (Vite)
dist/
.vite/
```

---

### `CHANGELOG.md`

```markdown
# Changelog

Toutes les versions notables de ce projet sont documentées dans ce fichier.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
Versioning : [SemVer](https://semver.org/).

## [Unreleased]

## [0.1.0] — AAAA-MM-JJ
### Initialisation
#### Notes client
Première version du projet.
#### Ajouts
- Initialisation du projet
```

---

### `README.md`

```markdown
# [NomProjet] — [Titre court]

[Description en 2-3 lignes : ce que fait le projet, pour qui, sur quelle plateforme]

[CHANGELOG](CHANGELOG.md)

---

## Prérequis

| Composant | Version minimale |
| --- | --- |
| [Composant 1] | [Version] |
| [Composant 2] | [Version] |

---

## Démarrage rapide

```bash
# [Compléter : commande de démarrage en dev (port [PORT])]

# Interface principale
http://localhost:[PORT]/

# [Autres URL utiles — ex: Swagger, health check]
```

---

## Modules

| Module | Route principale | Description |
| --- | --- | --- |
| [Module 1] | `/api/[module1]/*` | [Description] |
| [Module 2] | `/api/[module2]/*` | [Description] |

Pages web intégrées : `/`, `/admin`, `/doc`, `/health`, `/swagger` (dev uniquement).

---

## Architecture

[Description de l'architecture — ex: couches (Core / Api), modules, dépendances clés]

---

## Déploiement

```powershell
# Build Release
dotnet build [NomProjet].sln -c Release

# Publier
.\deploy\publish.ps1

# Assembler le package support
.\deploy\package-deploiement.ps1 -Version X.Y.Z

# Créer la release GitHub (tag + artefacts + notes de version)
.\deploy\deploy-release-on-github.ps1 -Version X.Y.Z
```

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

## [Section spécifique au projet]

[Contenu spécifique — ex : Conformité réglementaire, Licence particulière, Intégration système.
Supprimer cette section si non applicable.]
```

---

### `CLAUDE.md`

Le contenu ci-dessous est à copier tel quel dans le fichier `CLAUDE.md` à la racine du projet,
puis à compléter en remplaçant les `[placeholders]`.

````markdown
# CLAUDE.md — [NomProjet]

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

[Description courte du projet — 2 à 3 phrases : domaine, cible, plateforme]

**Modules fonctionnels :**

| Module | Rôle |
| --- | --- |
| **[Module 1]** | [Description fonctionnelle complète] |
| **[Module 2]** | [Description fonctionnelle complète] |

**Interface admin web** : [décrire les pages web intégrées — ex: dashboard (`/`), admin (`/admin`), doc (`/doc`), santé (`/health`)]

---

## Architecture

```text
[NomProjet].Core   — [logique métier pure — décrire les contraintes de dépendance]
[NomProjet].Api    — [couche hôte — décrire le framework et les composants]
```

[Décrire la structure des modules : sous-dossiers, conventions DI, patterns utilisés]

### Services clés (Core)

| Service | Rôle |
| --- | --- |
| `[Service 1]` | [Rôle — lien vers technical-docs si doc existe] |
| `[Service 2]` | [Rôle] |

[Note DI ou contrainte technique notable]

### Dépendances clés

> **Section optionnelle** — ajouter uniquement si le projet a des DLLs locales non-NuGet ou des SDKs tiers avec contrat spécifique (ex: SDK Nuance DMSK, DLL SESAM-Vitale). Supprimer si toutes les dépendances sont des packages NuGet standards.

| Dépendance | Rôle |
| --- | --- |
| `[NomDLL]` | [Rôle — préciser si locale/non-NuGet ou SDK tiers] |

### Commandes essentielles

```bash
# Build Release
[compléter : commande de build]

# Dev (port [PORT])
[compléter : commande de démarrage dev]

# Release
[compléter : commande de démarrage release]
```

#### Arrêt de l'API (commandes canoniques)

Toujours cibler le process **par nom** (`[NomProjet].Api` / `[NomProjet].Api.exe`),
jamais par PID. Ces commandes sont dans l'allowlist de permissions — les utiliser
telles quelles évite les prompts de validation.

```bash
# Git Bash (préféré dans ce projet)
taskkill //F //IM [NomProjet].Api.exe

# Équivalent Unix-style si dispo
pkill -f [NomProjet].Api
```

Ou via PowerShell :

```powershell
Stop-Process -Name [NomProjet].Api -Force
# ou, plus défensif :
Get-Process -Name [NomProjet].Api -ErrorAction SilentlyContinue | Stop-Process -Force
```

**Ne jamais chercher le PID** au préalable — ni par process (`ps | grep | awk`,
`tasklist | findstr`) ni par port (`netstat -ano | grep :[PORT]`, `Get-NetTCPConnection`).
Le kill par nom ci-dessus est suffisant en toutes circonstances et évite les
prompts de validation inutiles.

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

**`gh` est le CLI GitHub officiel** (installé par `winget install --id GitHub.cli -e` dans
`C:\Program Files\GitHub CLI\gh.exe`, ajouté au PATH — redémarrer VS Code après installation).
Il s'authentifie via `gh auth login` (keyring, scopes `repo` + `workflow`) ; `gh auth setup-git`
branche aussi `git push` dessus. L'utiliser systématiquement pour toutes les opérations
GitHub — **jamais curl ni l'API REST directement** (`gh api` si besoin).

```bash
gh pr create --fill --base <branche-cible>   # crée la PR depuis la branche courante
gh pr merge <n> --merge --delete-branch      # merge une PR (checks CI au vert)
gh pr list                                   # liste les PRs ouvertes
gh pr view <n>                               # détails d'une PR
gh pr checks <n>                             # état des checks CI
gh run list / gh run view <id>               # runs GitHub Actions
```

**Opérations cross-repo** : `gh` accepte `-R <compte>/<repo>` — pas besoin de sous-shell.

```bash
gh pr list -R [compte]/[AutreProjet]
```

**Jamais de `cd` en préfixe de commande.** Le répertoire courant est déjà le
projet root et persiste entre les appels. Écrire directement la commande.

```bash
# ✗ À ne JAMAIS faire
cd c:/Src/Repos/Perso/[NomProjet] && git status

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
├── docs/                   ← documentation (technical-docs, external-docs, users-docs, install, test)
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

Index complet (technical-docs, external-docs, users-docs, install, test) : [`workspace/docs/README.md`](workspace/docs/README.md)

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

#### Déploiement

- **Générique** : [`workspace/workflow-deploy.md`](workspace/workflow-deploy.md)
- **Spécifique projet** : [`workspace/workflow-deploy-spe.md`](workspace/workflow-deploy-spe.md)

### Cohérence inter-projets

Voir [`workspace/workflow-workspace.md`](workspace/workflow-workspace.md) — fichiers canoniques, règles de structure, procédures de création et migration.

---

## Stack technique

| Composant | Technologie |
| --- | --- |
| Langage | [ex: C# 12] |
| Runtime | [ex: .NET 8] |
| Framework | [ex: ASP.NET Core] |
| Plateforme cible | [ex: Windows 10 / 11 x64] |
| [Bibliothèque 1] | [Rôle] |
| [Bibliothèque 2] | [Rôle] |
| Packaging | [ex: Inno Setup] |

---

## Conventions de code

- **[Langage / Runtime]** — [conventions de base]
- [Convention 1]
- [Convention 2]
- [Conventions spécifiques au projet]
````

---

### `deploy/publish.ps1`

```powershell
#Requires -Version 5.1
[CmdletBinding()]
param(
    [switch] $SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot   = Split-Path -Parent $PSScriptRoot
$ApiProject = Join-Path $RepoRoot "src\[NomProjet].Api\[NomProjet].Api.csproj"  # À adapter
$PublishDir = Join-Path $RepoRoot "publish"
$CurrentDir = Join-Path $PSScriptRoot "current"

# Lecture de la version depuis le csproj
[xml] $csproj = Get-Content $ApiProject
$Version = $csproj.Project.PropertyGroup.Version | Where-Object { $_ } | Select-Object -First 1
if (-not $Version) { $Version = "1.0.0" }

$ZipName = "[NomProjet]-$Version-win-x64.zip"  # À adapter
$ZipPath = Join-Path $CurrentDir $ZipName

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  [NomProjet] — Publication v$Version" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Nettoyage et recréation du répertoire publish
if (Test-Path $PublishDir) { Remove-Item $PublishDir -Recurse -Force }
New-Item -ItemType Directory -Path $PublishDir | Out-Null
New-Item -ItemType Directory -Force -Path $CurrentDir | Out-Null

# Build & Publish (dotnet publish fait restore+build+publish en une passe)
if (-not $SkipBuild) {
    Write-Host "Publication..." -ForegroundColor Yellow
    dotnet publish $ApiProject -c Release -r win-x64 --self-contained false -o $PublishDir
    if ($LASTEXITCODE -ne 0) { throw "Publication échouée" }
}

# Copie CHANGELOG.md (requis pour la vue Notes de version)
Copy-Item (Join-Path $RepoRoot "CHANGELOG.md") $PublishDir

# Archive ZIP dans deploy\current\
Write-Host "Création de $ZipName..." -ForegroundColor Yellow
Remove-Item $ZipPath -ErrorAction SilentlyContinue
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($PublishDir, $ZipPath)

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Terminé : $ZipPath" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
```

---

### `deploy/package-deploiement.ps1`

```powershell
#Requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^\d+\.\d+\.\d+$')]
    [string] $Version
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot    = Split-Path -Parent $PSScriptRoot
$CurrentDir  = Join-Path $PSScriptRoot "current"
$ZipName     = "[NomProjet]-$Version-win-x64.zip"              # À adapter
$PackageName = "package-deploiement-[NomProjet]-$Version.zip"  # À adapter
$ZipPath     = Join-Path $CurrentDir $ZipName
$PackagePath = Join-Path $CurrentDir $PackageName

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Assemblage package v$Version" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Vérification prérequis
if (-not (Test-Path $ZipPath)) {
    throw "Archive introuvable : $ZipName — lancer d'abord deploy\publish.ps1"
}

$TempDir = Join-Path $CurrentDir "_temp"
New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

# Inclure l'archive applicative
Copy-Item $ZipPath $TempDir

# [Ajouter ici les dépendances tierces]
# Copy-Item "lib\[NomDependance].msi" $TempDir

# [Inclure le guide installation PDF si présent]
# if (Test-Path (Join-Path $PSScriptRoot "INSTALLATION.pdf")) {
#     Copy-Item (Join-Path $PSScriptRoot "INSTALLATION.pdf") $TempDir
# }

Remove-Item $PackagePath -ErrorAction SilentlyContinue
# -ErrorAction Stop indispensable : Compress-Archive émet des erreurs NON terminantes
# (ex: verrou antivirus transitoire sur le ZIP source) que l'EAP global n'intercepte pas —
# sans lui, le script poursuit et annonce un succès mensonger.
Compress-Archive -Path "$TempDir\*" -DestinationPath $PackagePath -ErrorAction Stop
Remove-Item $TempDir -Recurse -Force

# Vérification finale — ne jamais se fier à la seule sortie console
if (-not (Test-Path $PackagePath)) {
    throw "Échec silencieux : $PackageName absent de deploy\current\"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Package créé : $PackagePath" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
```

---

### `deploy/prepare-changelog.ps1`

Voir le fichier `deploy/prepare-changelog.ps1` dans le projet de référence — complet et fonctionnel.

---

### `deploy/deploy-release-on-github.ps1`

Voir le fichier `deploy/deploy-release-on-github.ps1` dans le projet de référence — complet et fonctionnel.

---

### `workspace/workflow-dev-spe.md`

````markdown
# Workflow de développement — [NomProjet]

> ⚠️ **À lire avec [`workflow-dev.md`](workflow-dev.md)** — ce fichier ne couvre que les spécificités projet ; le workflow complet est dans le générique.

---

## Démarrer l'application

```bash
dotnet run --project src/[NomProjet].Api
# [compléter avec port, variables d'env, etc.]
```

## Arrêter l'application

```bash
taskkill //F //IM [NomProjet].Api.exe
```

```powershell
Stop-Process -Name [NomProjet].Api -Force
```

> **Note** : les commandes Démarrer/Arrêter peuvent aussi figurer dans `CLAUDE.md` (section `### Commandes essentielles`) si le projet a fait ce choix. Dans ce cas, ne pas dupliquer ici — pointer vers `CLAUDE.md` avec un renvoi du type : *voir `CLAUDE.md` → § Commandes essentielles*.

---

## Handoff utilisateur (Step 4)

Avant de prévenir l'utilisateur que c'est prêt :

1. Démarrer l'application (commande ci-dessus)
2. [Compléter : données de test à préparer, état initial attendu]

URL de test :

- Dashboard : `http://localhost:[PORT]/`
- Health : `http://localhost:[PORT]/health`
- [Autres URL pertinentes]

---

## Actions spécifiques au merge (Step 6)

Fichiers à bumper :

- `[NomProjet].Api/[NomProjet].Api.csproj` — champ `<Version>X.Y.Z</Version>`
- [Autres fichiers si nécessaire]

---

## URL et ports

| Environnement | Port | URL |
| --- | --- | --- |
| Dev | [PORT] | `http://localhost:[PORT]` |
| Release | [PORT] | `http://localhost:[PORT]` |
````

---

### `workspace/workflow-deploy-spe.md`

````markdown
# Workflow de déploiement — [NomProjet]

> ⚠️ **À lire avec [`workflow-deploy.md`](workflow-deploy.md)** — ce fichier ne couvre que les spécificités projet ; le workflow complet est dans le générique.

---

## Build : options spécifiques

[Compléter si publish.ps1 requiert des options — ex: `-BuildInstaller`. Supprimer si aucune.]

---

## Artefacts produits

| Fichier | Contenu |
| --- | --- |
| `[NomProjet]_X.Y.Z.zip` | Archive applicative complète |
| `package-deploiement-[NomProjet]-X.Y.Z.zip` | Bundle support (ZIP + artefacts tierces + notice) |

Dans `deploy\current\` (gitignore). Les deux sont attachés à la Release GitHub `https://github.com/[compte]/[nom-repo]/releases`.
````

---

### `workspace/docs/technical-docs/_template.md`

```markdown
# Titre du sujet

## Contexte

Pourquoi cette analyse existe, quel problème elle documente.

## Description / Flux

Le comportement, le flux, la logique. Schémas si utile.

## Points de vigilance

Ce qui est contre-intuitif, les pièges connus, les cas limites.

## Références

- Fichier source : `src/...`
- Doc externe : `docs/external-docs/.../`
```

---

### `workspace/docs/install/installation.md`

```markdown
---
doc-version: "0.1"
doc-date: "AAAA-MM-JJ"
---

# [NomProjet] — Guide d'installation

> Document en cours de rédaction.

## Prérequis

| Composant | Version minimale | Notes |
|---|---|---|
| Windows | 10 / 11 | |

## Installation

…

## Configuration initiale

…

## Désinstallation

…

## Support

Éditeur : **[Éditeur]**

Pour toute demande de support, fournir :

- Version installée (visible sur …)
- Description du problème et étapes pour le reproduire
```

---

### `workspace/docs/README.md`

```markdown
# Documentation — [NomProjet]

Index de toute la documentation du projet.

---

## technical-docs/

| Fichier | Contenu |
| --- | --- |
| *(à compléter)* | *(à compléter)* |

Utiliser `_template.md` pour créer un nouveau fichier technique.

---

## external-docs/

| Source | Contenu | État |
| --- | --- | --- |
| *(à compléter)* | *(à compléter)* | *(à compléter)* |

---

## users-docs/

| Fichier | Contenu |
| --- | --- |
| `utilisation.md` | Guide d'utilisation destiné aux utilisateurs finaux |
| `changelog-metier.md` | Historique des versions en langage métier |

---

## install/

[`install/installation.md`](install/installation.md) — Guide d'installation pas à pas

---

## test/

*(Procédures et résultats de tests — à compléter)*
```

---

### `workspace/docs/users-docs/utilisation.md`

```markdown
# Guide d'utilisation — [NomProjet]

*(À compléter)*
```

---

### `workspace/docs/users-docs/changelog-metier.md`

```markdown
# Changelog métier — [NomProjet]

Historique des versions, destiné aux utilisateurs et équipes support.

---

*(Alimenté automatiquement par `deploy\prepare-changelog.ps1` lors de la préparation de chaque release)*
```

---

### `workspace/tasks/backlog.md`

```markdown
# Backlog — [NomProjet] — Vue consolidée

**Mis à jour :** AAAA-MM-JJ

---

## Légende

### Types

| Type | Signification |
|---|---|
| `technique` | Refactoring, infra, dette technique, outillage |
| `feature` | Nouvelle fonctionnalité visible |
| `proposition` | Idée à affiner, pas encore de spec |

### Priorités

| Priorité | Signification |
|---|---|
| **P1** | Critique — deadline dure ou bloquant client |
| **P2** | Important — engagement client ou dépendance forte |
| **P3** | Souhaitable — valeur réelle mais pas de deadline |
| **P4** | Long terme — à garder en tête, pas d'engagement |

---

## Conventions

### Fichier

- Lien cliquable `[NNN-titre.md](pending/NNN-titre.md)` dès qu'un fichier spec existe dans `pending/`
- `—` tant qu'aucun fichier n'est créé (proposition)

### Numérotation

- Le numéro est attribué **à la création du fichier spec**, pas à la proposition
- Les propositions n'ont pas de numéro (`—` dans la colonne Fichier et dans les `#` des synthèses)
- **Prochain numéro disponible** : NNN+1 après le plus grand numéro dans `pending/` et `done/` — vérifier aussi le backlog pour éviter tout conflit

### Ajout d'une spec

1. Créer le fichier `pending/NNN-titre.md`
2. Ajouter la ligne dans le tableau principal (avec lien, en ordre numérique)
3. Ajouter dans la synthèse par priorité correspondante (avec le numéro)
4. Si la proposition existait déjà : remplacer `—` par le lien dans le tableau et le numéro dans les synthèses

### Livraison

1. `git mv workspace/tasks/pending/NNN-titre.md workspace/tasks/done/`
2. Retirer la ligne du tableau principal
3. Retirer de la synthèse par priorité
4. Mettre à jour `**Mis à jour :**` en tête de fichier

---

| Fichier | Scope | Type | Impact utilisateur | Effort estimé | Priorité | Date cible | Notes |
|---|---|---|---|---|---|---|---|

---

## Synthèse par priorité

### P1 — Critique

*(Vide)*

---

### P2 — Important

*(Vide)*

---

### P3 — Souhaitable

*(Vide)*

---

### P4 — Long terme

*(Vide)*
```

---

### Fichiers copiés depuis le projet de référence

Les fichiers suivants sont copiés tels quels depuis le projet de référence (ne pas modifier) :

- `workspace/docs/technical-docs/_template.md`
- `workspace/tasks/_template.md`
- `workspace/tasks/_template-chantier.md`
- `workspace/tasks/_template-changelog.md`
- `workspace/workflow-dev.md`
- `workspace/workflow-deploy.md`
- `workspace/workflow-workspace.md` *(ce fichier)*

---

## Création d'un nouveau projet

### Checklist actions manuelles

#### Git et GitHub

- [ ] `gh` installé (`winget install --id GitHub.cli -e`) et authentifié :
  `gh auth login --hostname github.com --git-protocol https --web --scopes workflow` puis `gh auth setup-git`
- [ ] `git init -b main` dans le dossier du projet
- [ ] Identité git **locale** : `git config user.email "<id>+<compte>@users.noreply.github.com"` (repo public : ne pas exposer l'email perso)
- [ ] Créer le dépôt : `gh repo create [nom-repo] --public --description "…" --disable-wiki` (sans `--push`)
- [ ] `git remote add origin https://github.com/[compte]/[nom-repo].git`
- [ ] Premier commit : `git add .` + `git commit -m "chore: init projet"` puis `git push -u origin main`
- [ ] **Protection de `main`** (Settings → Rules → Rulesets, ou `gh api`) : PR obligatoire, pas de force-push ni
  de suppression, checks CI requis. ⚠️ Sur un compte **GitHub Free**, la protection de branche n'existe que
  pour les dépôts **publics** (privé = GitHub Pro requis).
- [ ] Secrets GitHub Actions (`gh secret set`) : ceux listés dans `workflow-deploy-spe.md`

#### Adaptations fichiers

- [ ] Remplacer tous les `[NomProjet]` dans `CLAUDE.md`, `deploy/publish.ps1`, `deploy/prepare-changelog.ps1`, `deploy/deploy-release-on-github.ps1`, `workflow-dev-spe.md`, `workflow-deploy-spe.md`
- [ ] Compléter `$Repo` (`[compte]/[nom-repo]`) dans `deploy/deploy-release-on-github.ps1`
- [ ] Compléter le port dans `workflow-dev-spe.md`
- [ ] Adapter `.claude/settings.local.json` (voir prompt ci-dessous)
- [ ] Compléter la date dans `CHANGELOG.md` (version 0.1.0)

### Marqueurs à remplacer

| Marqueur | Description |
| --- | --- |
| `[NomProjet]` | Nom exact du projet (ex: `condat-judo`) |
| `[compte]` / `[nom-repo]` | Compte et dépôt GitHub |
| `[PORT]` | Port d'écoute de l'API en développement |
| `[À compléter]` | Zone de contenu libre à rédiger |
| `AAAA-MM-JJ` | Date du jour au format ISO |

### Prompt settings.local.json

Copier-coller ce prompt dans la session Claude Code du nouveau projet :

```text
Crée le fichier `.claude/settings.local.json` pour ce projet en adaptant celui du projet de référence.
Modèle source : `c:/Src/Repos/Perso/Judo/.claude/settings.local.json`
Adaptations à faire :
- Paths `Read`, `Write` et `Edit` : remplacer le chemin du projet de référence par celui du projet cible
- Scripts de déploiement et commandes spécifiques (npm, wrangler, dotnet…) : adapter à la stack
- Conserver la section `ask` (actions sensibles : push forcé, release, secrets, déploiement, écriture D1 distante)
- Conserver tout le reste à l'identique (lectures Bash, créations PowerShell, WebFetch, git, gh)
```

---

## Migration d'un projet existant

### Principe absolu : zéro perte de données

**Aucun contenu existant ne doit être supprimé sans avoir été préservé ailleurs.**

- Tout contenu retiré d'un fichier est d'abord copié dans sa destination (`*-spe.md`, `technical-docs/`, etc.)
- En cas de doute : placer dans `workspace/notes/arbitrage-migration.md` — l'utilisateur tranche
- Ne jamais écraser un `*-spe.md` existant sans l'avoir lu en entier

### Workflow dans la session cible

#### Étape 0 — Inventaire complet (avant tout changement)

Lire intégralement : `CLAUDE.md`, `workflow-dev.md`, `workflow-dev-spe.md`, `workflow-deploy.md`,
`workflow-deploy-spe.md`, `tasks/_template.md`, tous les fichiers de `workspace/docs/`,
`tasks/backlog.md`, `.claude/settings.local.json`, scripts `deploy/`, `CHANGELOG.md`.

Produire un **état des lieux** : ce qui existe, ce qui manque, ce qui est redondant ou à déplacer.

#### Étape 1 — Proposition de plan

Avant toute modification, proposer un plan détaillé (chaque fichier à créer/modifier/déplacer).
Identifier les contenus ambigus et **poser des questions interactives** — ne pas trancher seul.
L'utilisateur valide avant que quoi que ce soit soit modifié.

#### Étape 2 — Exécution (après validation uniquement)

Appliquer dans l'ordre validé. Créer `workspace/notes/arbitrage-migration.md` si contenu ambigu rencontré.

### Périmètre de la migration

#### A — Workspace : docs

`workspace/docs/README.md` — créer si absent, compléter si incomplet.
Index central : `technical-docs/`, `external-docs/`, `users-docs/`, `install/`, `test/`.
Référence : `workspace/docs/README.md` du projet de référence

Les READMEs dans les sous-dossiers peuvent être supprimés **uniquement si leur contenu est intégralement repris** dans `workspace/docs/README.md`.

#### B — Workspace : templates et backlog

Créer si absents (copie depuis le projet de référence) :

- `workspace/tasks/_template-chantier.md`
- `workspace/tasks/_template-changelog.md`

Mettre à jour `workspace/tasks/_template.md` : ajouter en tête :

```html
<!-- Issue GitHub : #XX  ← optionnel, supprimer si spec créée directement -->
```

`workspace/tasks/backlog.md` — créer si absent avec le skeleton standard (voir ci-dessus).
Si existant, vérifier la présence de la section `## Conventions` et l'ajouter si manquante.

`workspace/docs/technical-docs/_template.md` — créer si absent (copie depuis le projet de référence).

#### C — Workflow dev

`workspace/workflow-dev.md` — 100 % générique.
Remplacer par la version du projet de référence **après vérification** que l'existant ne contient pas de sections spécifiques. Tout contenu spécifique est déplacé dans `workflow-dev-spe.md` avant remplacement.

`workspace/workflow-dev-spe.md` — conserver et nettoyer :

- Supprimer "Step 0 — Lecture des docs" si présent (dans le générique)
- Aligner les numéros de step sur le générique (step 6 = merge)
- Vérifier/compléter : commandes start/stop, handoff, actions merge, fichiers à bumper

#### D — Workflow deploy

`workspace/workflow-deploy.md` — 100 % générique. Même règle que C.

`workspace/workflow-deploy-spe.md` — conserver et compléter :

- Vérifier commandes de build et chemins d'artefacts
- Vérifier/ajouter : `CHANGELOG.md` copié dans les artefacts publiés

#### E — Déploiement : scripts et CHANGELOG

Vérifier la présence et la cohérence de :

- `CHANGELOG.md` à la racine — créer si absent
- `deploy/prepare-changelog.ps1` — script pré-merge (génère `changelog-metier.md` + `deploy/.installation-md.sha256`) — noter si absent
- `deploy/publish.ps1` — noter l'état dans le plan
- `deploy/package-deploiement.ps1` — noter l'état dans le plan
- `deploy/deploy-release-on-github.ps1` — noter si absent

Scripts existants non référencés dans `workflow-deploy-spe.md` → les y ajouter.
Scripts absents → signaler dans le plan (hors périmètre : leur création est une spec dédiée).

#### F — README.md

Structure obligatoire (dans cet ordre) :

1. `# [NomProjet] — [Titre court]` + description + `[CHANGELOG](CHANGELOG.md)`
2. `## Prérequis` — OS en premier, puis runtime (pas SDK), puis dépendances
3. `## Démarrage rapide` — lancement + URL principale + Swagger
4. `## Modules` — tableau Module / Route / Description
5. `## Architecture` — bloc code + description
6. `## Déploiement` — commandes build / publish / release
7. `## Documentation` — exactement ces 4 liens :
   - `[Documentation projet](workspace/docs/README.md)`
   - `[Tâches en cours](workspace/tasks/pending/)`
   - `[Backlog](workspace/tasks/backlog.md)`
   - `[Changelog](CHANGELOG.md)`
8. `## Développement` — pointeur vers `workflow-dev.md` et `workflow-dev-spe.md`
9. Sections spécifiques — conserver si contenu, supprimer si vide

#### G — CLAUDE.md

| Type de contenu trouvé | Destination |
| --- | --- |
| Description projet, architecture, modules | Conserver dans `CLAUDE.md` |
| Commandes dev / run / stop | Conserver dans `CLAUDE.md` |
| Tables de docs détaillées | → `workspace/docs/README.md` + 1 ligne de pointeur |
| Conventions de code (.NET, C#…) | Conserver dans `CLAUDE.md` |
| Workflow détaillé dev/deploy | → `workflow-dev-spe.md` ou `workflow-deploy-spe.md` |
| Contenu destination ambiguë | → `workspace/notes/arbitrage-migration.md` |

Structure obligatoire (dans cet ordre) :

1. `## ⚠️ Règle d'implémentation` (lecture workflow-dev + spe, pas de code avant branche)
2. `## ⚠️ Règle de déploiement` (lecture workflow-deploy + spe)
3. `## Ce que fait ce projet`
4. `## Architecture` (services clés, commandes, arrêt par nom)
5. `## Documentation projet` (workspace, raccourcis, workflows + règles critiques, cohérence inter-projets)
6. `## Stack technique`
7. `## Conventions de code`

Points à vérifier après nettoyage :

- Raccourcis workspace : `_template-chantier.md`, `_template-changelog.md`, `external-docs/`, `technical-docs/`
- Quatre règles critiques (branche, PR, handoff, aucun merge sans validé)
- Pointeur `workspace/docs/README.md`
- Pointeur `workspace/workflow-workspace.md` (cohérence inter-projets)
- Stack technique présente avant Conventions de code
- Arrêt par nom, règle « Ne jamais chercher le PID »
- Conventions shell : git + gh via Bash (pas PowerShell), jamais de `cd` en préfixe, `rm` uniquement dans `/tmp/`, gh pour toutes les opérations GitHub (jamais curl)
- `### Dépendances clés` — optionnel, uniquement si DLLs locales non-NuGet ou SDKs tiers

#### H — GitHub : protection de main

**Settings → Rules → Rulesets** sur `main` (et `preview` si le projet a un sas de qualif) : PR obligatoire, force-push et suppression bloqués, checks CI requis. Dépôt **public** requis sur un compte GitHub Free.

#### I — Permissions Claude Code

Copier `.claude/settings.local.json` depuis le projet de référence, adapter paths, commandes et scripts.

### Checklist de validation migration

- [ ] Inventaire complet produit avant toute modification
- [ ] Plan proposé et validé par l'utilisateur avant exécution
- [ ] `workspace/notes/arbitrage-migration.md` créé si contenu ambigu rencontré
- [ ] Aucun contenu supprimé sans avoir été préservé dans sa destination
- [ ] `workspace/docs/README.md` indexe toute la documentation
- [ ] `_template-chantier.md`, `_template-changelog.md`, `_template.md` (avec Issue GitHub) en place
- [ ] `backlog.md` présent avec section `## Conventions`
- [ ] `docs/technical-docs/_template.md` présent
- [ ] `workflow-dev.md` = version générique du projet de référence
- [ ] `workflow-deploy.md` = version générique du projet de référence
- [ ] `workflow-dev-spe.md` et `workflow-deploy-spe.md` nettoyés, cohérents et complets
- [ ] `CHANGELOG.md` présent à la racine
- [ ] Scripts de déploiement présents (`publish.ps1`, `deploy-release-on-github.ps1`, `prepare-changelog.ps1`) ; artefacts documentés dans `workflow-deploy-spe.md`
- [ ] `README.md` : 8 sections, prérequis runtime, 4 liens documentation, section Développement
- [ ] `CLAUDE.md` : 7 sections dans l'ordre (incl. règles d'implémentation et de déploiement prioritaires), raccourcis complets, 4 règles critiques, arrêt par nom, conventions Bash (no `cd` prefix, `rm` /tmp/ only), pointeur workflow-workspace.md
- [ ] Branche `main` protégée dans GitHub (ruleset)
- [ ] `.claude/settings.local.json` adapté au projet

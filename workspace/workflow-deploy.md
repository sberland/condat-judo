# Workflow de déploiement

<!-- Fichier générique — identique dans tous les projets perso hébergés sur GitHub. Transposé GitHub depuis la référence TheraSoft (StrategyHub, 2026-09-23). Toute évolution passe par `workflow-workspace.md` en premier. -->

Processus générique de release, déclenché sur décision explicite de l'utilisateur.
Pour les prérequis, artefacts et particularités propres au projet, voir `workflow-deploy-spe.md`.

---

## Quand déployer

Le déploiement est une **décision consciente et indépendante du merge**. Plusieurs specs peuvent être mergées (chacune avec son bump de version et son entrée CHANGELOG) avant qu'on décide de livrer aux clients.

Déclencheur : l'utilisateur dit explicitement « on déploie la vX.Y.Z » — jamais automatiquement après un merge.

---

## Prérequis

Avant de lancer le déploiement :

1. **`CHANGELOG.md`** contient une entrée `## [X.Y.Z] — YYYY-MM-DD` avec une section `#### Notes client` rédigée (voir convention dans `workflow-dev.md` → Entrée CHANGELOG.md)
2. **Merge sur la branche principale** effectué, état git propre
3. Pour les applications avec vue release notes intégrée : vérifier que le CHANGELOG est correctement embarqué dans le build (voir spec d'implémentation par projet)

---

## Pré-merge : préparer les artefacts trackés

Sur la branche feature, **avant la PR** :

```powershell
.\deploy\prepare-changelog.ps1 -Version X.Y.Z

git add workspace/docs/users-docs/changelog-metier.md
# si le projet suit les modifications de installation.md :
git add deploy/.installation-md.sha256
git commit -m "docs(release): préparer changelog-metier pour vX.Y.Z"
# Puis pousser et créer la PR normalement.
```

Ces fichiers font partie de la feature — ils doivent être dans la PR, pas dans un commit post-deploy sur `main`.

---

## Commandes post-merge

### 1 — Build des artefacts

```powershell
.\deploy\publish.ps1
```

Options spécifiques au projet dans `workflow-deploy-spe.md`.

### 2 — Package support

Si le projet dispose d'un script `deploy/package-deploiement.ps1` :

```powershell
.\deploy\package-deploiement.ps1 -Version X.Y.Z
```

Le contenu du bundle est dans `workflow-deploy-spe.md`.

### 3 — Script de release

```powershell
.\deploy\deploy-release-on-github.ps1 -Version X.Y.Z
```

`deploy-release-on-github.ps1` enchaîne automatiquement :

1. Vérifie que les artefacts existent dans `deploy\current\`
2. Extrait la section `[X.Y.Z]` de `CHANGELOG.md`
3. Crée le tag `vX.Y.Z` et le pousse
4. Crée la Release GitHub (`gh release create`) avec les artefacts attachés
5. Vérifie la Release créée (`gh release view`) — ne jamais se fier à la seule sortie console

Authentification : `gh auth login` (scopes `repo` + `workflow`) ou `$env:GH_TOKEN`.

---

## Vérification post-publish : présence de CHANGELOG.md

Pour les projets intégrant une vue « Notes de version », `CHANGELOG.md` est copié dans le répertoire de publication au moment du build.

**Vérifier que `CHANGELOG.md` est présent dans les artefacts publiés :**

```powershell
# Dans le ZIP de distribution
Expand-Archive "deploy\current\<NomArtefact>-X.Y.Z.zip" -DestinationPath "deploy\current\verify-tmp" -Force
Test-Path "deploy\current\verify-tmp\CHANGELOG.md"  # doit retourner True
Remove-Item "deploy\current\verify-tmp" -Recurse -Force

# Ou directement dans le dossier publish/ avant packaging
Test-Path "publish\CHANGELOG.md"  # doit retourner True
```

Si `CHANGELOG.md` est absent : `CopyToOutputDirectory="PreserveNewest"` non déclenché, ou publish lancé avec `--no-build`. Relancer `publish.ps1` depuis la racine.

---

## Gestion du guide d'installation (PDF)

Source unique : `workspace/docs/install/installation.md`.

**Prérequis** : **Pandoc** installé et dans le PATH.

- Installation : `winget install JohnMacFarlane.Pandoc` (nécessite aussi **XeLaTeX** via MiKTeX ou TinyTeX pour le moteur PDF)
- Vérification : `pandoc --version`

Si le projet dispose d'un script `deploy/package-deploiement.ps1` : il génère automatiquement `deploy/INSTALLATION.pdf` via Pandoc, **uniquement si `installation.md` a changé** (comparaison SHA256 avec `deploy/.installation-md.sha256`).

**Règle** : toute modification de `installation.md` doit s'accompagner d'un bump du champ `doc-version` dans le frontmatter YAML en tête du fichier. Le hash `deploy/.installation-md.sha256` est mis à jour par `prepare-changelog.ps1` et commité sur la branche feature avant le merge.

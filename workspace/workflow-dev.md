# Workflow de travail

<!-- Fichier générique — identique dans tous les projets perso hébergés sur GitHub. Transposé GitHub depuis la référence TheraSoft (StrategyHub, 2026-09-23). Toute évolution passe par `workflow-workspace.md` en premier. -->

Processus générique de collaboration entre l'utilisateur et l'assistant IA (Claude Code).
Pour les spécificités du projet (fichiers à bumper, actions au merge, lancer l'application), voir `workflow-dev-spe.md`.
Pour le déploiement, voir `workflow-deploy.md` + `workflow-deploy-spe.md`.

---

## Specs et tâches

Les specs vivent dans `workspace/tasks/` : `pending/` pour les specs en attente, `done/` pour les specs livrées (déplacées par `git mv`).

Alternative plus lourde : issues GitHub — à utiliser pour les bugs remontés par des utilisateurs finaux, les features avec deadline externe, ou dès qu'une discussion avec un tiers est nécessaire.

### Convention de nommage

`NNN-titre-court.md` — `NNN` est un numéro sur 3 chiffres à incrément libre (`001`, `002`, …). Le numéro sert uniquement à ordonner dans le dossier ; il n'a pas de lien avec Git ou GitHub.

### Format d'une spec

Utiliser `_template.md` comme point de départ. Les sections minimales :

- **Pourquoi** — contexte métier, problème à résoudre
- **Quoi** — exigences fonctionnelles et techniques concrètes
- **Critères d'acceptation** — observables qui valident la livraison

Sections optionnelles : **Hors périmètre**, **Notes**, **Références**.

**Depuis une Issue GitHub** : reprendre le titre et la description de l'Issue, décommenter `<!-- Issue GitHub : #XX -->` en tête de spec — la PR inclura automatiquement `Closes #XX` et fermera l'Issue au merge.

### Chantiers — regrouper plusieurs specs

Un **chantier** est une spec chapeau qui orchestre plusieurs sous-specs liées.
Il reste dans `pending/` jusqu'à la validation de la dernière sous-spec.

**Convention de nommage :**

```text
workspace/tasks/pending/
├── 021-CHT-refonte-identification.md   ← chantier (orchestrateur)
├── 021a-identification-api.md          ← sous-spec A
├── 021b-identification-ui-admin.md     ← sous-spec B
└── 021c-identification-dpapi.md        ← sous-spec C
```

- Le chantier est identifié par `-CHT-` dans son nom.
- Les sous-specs partagent le même préfixe numérique + une lettre (`a`, `b`, `c`…).

**Contenu du fichier chantier :** utiliser `_template-chantier.md` comme point de départ.

**Contenu des sous-specs :** spec normale avec une ligne en tête : `> Chantier : NNN-CHT-titre`

**Cycle de vie :**

- Chaque sous-spec suit le workflow normal (branche, handoff, validation, merge).
- Le fichier chantier est mis à jour (cases cochées) au fil des validations.
- **Dernier merge = clôture du chantier** — règles spécifiques :
  - Le niveau de version reflète le chantier complet (généralement MINEUR), pas seulement la dernière sous-spec.
  - L'entrée CHANGELOG résume l'ensemble du chantier, pas seulement la dernière sous-spec.
  - `git mv pending → done` du fichier chantier + de toutes les sous-specs restantes.

---

## Déclencher le traitement

Dans une session Claude Code :

- **« Traite `workspace/tasks/pending/042-titre.md` »** — objectif : livrer du code. Inclut la revue de spec (étape 0), mais l'intention est d'aller jusqu'à l'implémentation une fois les points ouverts résolus.
- **« Traite les tâches pending »** — toutes les tâches en attente, une par une, avec le même objectif.
- **« Prépare un plan pour `workspace/tasks/pending/042-titre.md` »** — objectif : livrer une analyse. S'arrête avant tout code — utile pour les specs complexes ou pour arbitrer des choix d'architecture avant de démarrer.

---

## Workflow attendu côté assistant

### 0 — Revue de spec (avant de coder)

Avant de toucher au code :

1. Lire la spec en entier.
2. Consulter l'index de documentation du projet (`workspace/docs/README.md`) et lire les technical-docs, external-docs et users-docs liées aux modules impactés.
3. Identifier les points flous, les dépendances, les impacts sur d'autres modules.
4. Si des choix techniques structurants sont ouverts : les lister avec avantages/inconvénients et **soumettre à l'utilisateur** pour décision. Ne pas trancher seul.
5. Repartir avec une spec maîtrisée — pas de code tant qu'un point structurant reste ouvert.

### 1 — Analyse

Lire la spec. Poser **une seule question** si un choix structurant manque. Si la spec est claire, démarrer directement.

Ne pas modifier le backlog à cette étape — la mise à jour (retrait ou marquage livré) se fait au merge (step 6). Si la spec a été substantiellement retravaillée pendant la revue, mettre à jour son libellé dans le backlog pour refléter le périmètre retenu.

### 2 — Branche

Toujours créer une branche `feature/NNN-slug` depuis la branche principale, sans exception — la branche principale est protégée sur GitHub (ruleset), aucun push direct n'est accepté.

### 3 — Implémentation

Implémenter + committer sur la branche. Vérifier que le build passe. Faire des smoke tests (appels, tests unitaires, démarrage rapide).

Rédiger l'entrée CHANGELOG avant le merge — template : `workspace/tasks/_template-changelog.md`. Obligatoire dans tous les cas.

#### Mise à jour de la documentation

- `technical-docs/` : créer ou mettre à jour le fichier concerné si la spec introduit un flux complexe, un comportement non évident ou un choix d'architecture fort. Peut être initié dès la revue de spec.
- `users-docs/` : mettre à jour si la spec a un impact fonctionnel visible dans l'utilisation.
- Ces documents doivent être à jour **au moment du merge**, après validation.

### 4 — Handoff utilisateur ← étape obligatoire

1. Préparer l'environnement de validation (démarrer l'application si applicable, préparer les données de test…). Voir `workflow-dev-spe.md` pour le détail par projet.
2. **Prévenir explicitement** que c'est prêt pour validation manuelle.
3. Lister ce qui a été testé et ce qui reste à valider manuellement.

> L'application tourne, l'utilisateur valide — l'assistant attend.

### 5 — Itérations

Tant que l'utilisateur n'a pas dit **« validé »** (ou équivalent) :

- Rester sur la branche.
- Corriger, ajuster, rejouer les tests.
- **Aucun merge**, aucun `git mv pending → done`.

> **Règle dure** : « les tests passent » ≠ « c'est mergeable ».  
> Le merge exige une validation explicite de l'utilisateur.

### 6 — Merge (après validation)

Dans cet ordre :

1. `git mv workspace/tasks/pending/NNN-*.md workspace/tasks/done/NNN-*.md`
2. Si l'item figurait dans `backlog.md` : le retirer ou le marquer livré
3. **Poser deux questions interactives** (options cliquables) :
   - **Niveau de version** : PATCH / MINEUR / MAJEUR (voir section Versioning ci-dessus). Si ce merge clôt un chantier : le niveau reflète le chantier complet.
   - **Déploiement** : déployer maintenant / non, je regroupe d'autres specs d'abord
4. Appliquer le bump de version selon la réponse
5. Entrée dans `CHANGELOG.md` (template : `workspace/tasks/_template-changelog.md`) si ce n'est pas déjà fait
6. Vérifier que technical-docs et users-docs sont à jour (voir règle step 3) — compléter avant de merger si nécessaire
7. Actions spécifiques au projet — voir `workflow-dev-spe.md`
8. Si le projet dispose d'un script `deploy/prepare-changelog.ps1` : le lancer (`.\deploy\prepare-changelog.ps1 -Version X.Y.Z`) et commiter les fichiers générés sur la branche avant de pousser. Ces fichiers (changelog métier, hash de doc…) font partie de la feature — ils doivent être dans la PR, pas dans un commit post-deploy séparé.
9. `git push origin feature/NNN-slug`
10. Créer la PR sur GitHub via `gh pr create` (titre = titre de la spec, description = entrée CHANGELOG), vers la branche cible indiquée dans `workflow-dev-spe.md` (`main` par défaut). Si la spec contient `Issue GitHub : #XX` : ajouter `Closes #XX` dans la description — l'Issue se fermera automatiquement au merge.
11. **Poser une question interactive** : Relire la PR dans GitHub avant merge ?
    - **Oui** → prévenir l'utilisateur que la PR est prête, attendre son merge dans GitHub
    - **Non** → merger automatiquement via `gh pr merge <n> --merge --delete-branch` (une fois les checks CI au vert)
12. Si déploiement confirmé : enchaîner avec `workflow-deploy.md` après le merge

---

## Versioning (SemVer)

**Demander explicitement à l'utilisateur** avant de bumper :

| Niveau | Quand | Exemple |
| --- | --- | --- |
| PATCH | Bug fix, amélioration interne, doc, refactor sans impact fonctionnel | `1.3.0` → `1.3.1` |
| MINEUR | Nouvelle fonctionnalité rétro-compatible, nouveau module, refonte UI | `1.3.1` → `1.4.0` |
| MAJEUR | Breaking change API/contrat JSON, retrait d'endpoint, refonte archi | `1.4.0` → `2.0.0` |

En cas de doute, proposer le niveau bas — l'utilisateur arbitre vers le haut.

Les fichiers à bumper sont dans `workflow-dev-spe.md`.

---

## Entrée CHANGELOG.md

Format : `workspace/tasks/_template-changelog.md`.

La date est celle du merge. Vider la section `[Unreleased]` si elle est peuplée.

La section `#### Notes client` est **obligatoire**. Elle embarque des notes destinées aux clients, chefs de projet et équipes support.

**Règles :**

- Langage métier — pas de code, pas de noms de classe, pas de jargon technique
- Rédigée pendant la branche feature, **validée avant le merge**
- Copiée **verbatim** par le script de release — aucune synthèse automatique

La destination de la copie (fichier changelog métier) est dans `workflow-deploy-spe.md`.

---

## Backlog et idées

Les idées non encore spécifiées vivent dans `workspace/tasks/backlog.md`.
Quand une idée mûrit → créer une vraie spec `workspace/tasks/pending/NNN-slug.md`
et retirer l'idée du backlog (ou la barrer avec un pointeur vers la spec).

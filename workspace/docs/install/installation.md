---
doc-version: "0.4"
doc-date: "2026-09-24"
---

# Condat Judo — Guide d'installation

> Document en cours de rédaction. Destiné à la personne qui installe ou reprend le projet.

## Prérequis

| Composant | Version minimale | Notes |
|---|---|---|
| Navigateur web moderne | Safari iOS 17 / Chrome 120 / Firefox 120 / Edge 120 | Consultation |
| Node.js | 24 LTS | Développement et déploiement |
| GitHub CLI (`gh`) | 2.x | `winget install --id GitHub.cli -e` |
| Compte Cloudflare | Plan gratuit | Workers, D1, Zero Trust (verrou Access de la qualif) |

## Installation

### Poste de développement

```bash
git clone https://github.com/sberland/condat-judo.git
cd condat-judo/app
npm install
cp .dev.vars.example .dev.vars                     # utilisateur simulé en local
npm run db:migrate:local && npm run db:seed:local  # D1 locale jetable
npm run build:web
npm run dev        # worker :8787
npm run dev:web    # front :5173 (autre terminal)
```

### Mise en place Cloudflare / GitHub (une fois)

1. **D1** (depuis `app/`) : `npx wrangler d1 create condat-judo` et
   `npx wrangler d1 create condat-judo-preview` → reporter chaque `database_id` dans
   `app/wrangler.toml`.
2. **Jeton d'API de compte** Cloudflare (Workers Scripts:Edit + D1:Edit) → secrets GitHub :
   `gh secret set CLOUDFLARE_API_TOKEN` et `gh secret set CLOUDFLARE_ACCOUNT_ID`.
3. **Cloudflare Access** : application de verrouillage de la **preview** uniquement (la prod est
   publique) — voir [`cloudflare-access.md`](../technical-docs/cloudflare-access.md). Aucune
   valeur à reporter dans le code : Access n'est pas une source d'identité pour l'app.
4. **Sauvegarde de la base** (spec 007) : voir « Sauvegarde de la base » ci-dessous — **avant**
   tout déploiement en prod qui applique une migration (il la sauvegarde d'abord, et échoue sinon).
5. **Premier déploiement** : voir `workspace/workflow-deploy-spe.md`.

### Sauvegarde de la base (une fois)

Sauvegarde quotidienne de la D1 de prod, **chiffrée**, dans un dépôt GitHub **privé** (le dépôt
du projet est public). Détail : [`sauvegarde.md`](../technical-docs/sauvegarde.md).

1. **Dépôt privé** :

   ```bash
   gh repo create sberland/condat-judo-sauvegardes --private --description "Sauvegardes chiffrées de la base Condat Judo"
   ```

2. **Clé de chiffrement** (poste du responsable) : `winget install FiloSottile.age`, rouvrir le
   terminal, puis :

   ```powershell
   age-keygen -o "$HOME\condat-judo-sauvegarde.key"
   ```

   La commande affiche la **clé publique** (`age1…`). Le fichier contient la **clé privée** :
   la ranger hors ligne, en deux exemplaires (gestionnaire de mots de passe + support hors
   ligne). ⚠️ Sans elle, les sauvegardes sont illisibles ; elle ne va jamais dans GitHub.

3. **Clé publique** → variable GitHub du projet :

   ```bash
   gh variable set SAUVEGARDE_CLE_PUBLIQUE --repo sberland/condat-judo --body "age1…"
   ```

4. **Jeton limité au dépôt privé** : github.com → Settings → Developer settings → *Fine-grained
   tokens* → *Generate new token* : accès au seul dépôt `condat-judo-sauvegardes`, permission
   **Contents : Read and write**, expiration 1 an (noter la date de renouvellement). Puis :

   ```bash
   gh secret set SAUVEGARDE_TOKEN --repo sberland/condat-judo   # coller le jeton
   ```

5. **Vérifier** (une fois `sauvegarde.yml` sur `main`) : `gh workflow run sauvegarde.yml`, puis
   `gh release list --repo sberland/condat-judo-sauvegardes`.
6. **Tester la restauration** (vers la qualif, anonymisée) :

   ```powershell
   .\deploy\restaurer-sauvegarde.ps1 -Nom quotidienne-AAAA-MM-JJ -Cle "$HOME\condat-judo-sauvegarde.key"
   ```

## Configuration initiale

### Premier administrateur

Aucun compte n'est créé ni promu automatiquement, et personne ne peut encore créer de lien de
connexion depuis l'application. Deux commandes, lancées depuis un poste authentifié sur
Cloudflare (`npx wrangler login`) :

1. Créer le compte administrateur en prod (e-mail **en minuscules**) :

   ```bash
   cd app
   npx wrangler d1 execute condat-judo --remote --command "INSERT INTO users (prenom, nom, email) VALUES ('Prénom', 'Nom', 'adresse@exemple.fr'); INSERT INTO user_roles (user_id, role) SELECT id, 'admin' FROM users WHERE email = 'adresse@exemple.fr';"
   ```

2. Créer son lien de connexion (usage unique, 7 jours) et l'ouvrir **sur le téléphone** de
   l'administrateur :

   ```powershell
   .\deploy\lien-connexion.ps1 -Email adresse@exemple.fr -Cible production
   ```

À sa première connexion, le compte est « activé » (table `identites`) et reste connecté 6 mois
glissants. Les autres comptes, leurs rôles et leurs liens de connexion se gèrent ensuite depuis
l'application (**Mon espace → Comptes**). La preview récupère les comptes à chaque recopie des
données de prod, mais **pas les sessions ni les liens** : un testeur de la qualif obtient son lien
par `.\deploy\lien-connexion.ps1 -Email … -Cible preview`.

Administrateur qui a perdu son téléphone : un autre administrateur lui crée un lien ; à défaut,
relancer l'étape 2.

## Désinstallation

Supprimer les Workers `condat-judo` / `condat-judo-preview`, les bases D1 du même nom et les
applications Access dans le dashboard Cloudflare. ⚠️ Exporter les données avant
(`npx wrangler d1 export condat-judo --remote --output sauvegarde.sql`) : elles contiennent des
données personnelles, à conserver ou détruire selon la politique RGPD du club.

## Support

Éditeur : **Judo Condat** (projet bénévole)

Pour toute demande de support, fournir :

- Version installée (visible en pied de page du site)
- Description du problème et étapes pour le reproduire

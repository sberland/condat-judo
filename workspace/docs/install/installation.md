---
doc-version: "0.3"
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
4. **Premier déploiement** : voir `workspace/workflow-deploy-spe.md`.

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

# Changelog

Toutes les versions notables de ce projet sont documentées dans ce fichier.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
Versioning : [SemVer](https://semver.org/).

## [Unreleased]

## [0.1.0] — 2026-09-23

### Initialisation

#### Notes client

Première version du projet : la base technique du futur site du club est en place. Aucune
fonctionnalité n'est encore ouverte aux familles.

#### Ajouts

- Initialisation du projet : workspace (workflows, templates, backlog), socle applicatif
  (Worker Cloudflare, API Hono, base D1, front React), scripts de déploiement et CI GitHub Actions
- Seam d'identité : résolution de l'utilisateur via Cloudflare Access (signature du jeton vérifiée),
  utilisateur simulé en développement local
- Mise en place Cloudflare : bases D1 prod et preview hébergées dans l'Union européenne, accès à
  l'environnement de qualification protégé par Cloudflare Access
- Journalisation des refus de connexion Cloudflare Access (motif et paramètres publics, jamais le
  jeton) pour diagnostiquer une configuration

#### Corrections

- Connexion via Cloudflare Access : le jeton est aussi lu dans le cookie `CF_Authorization`, Access
  ne transmettant pas toujours l'en-tête dédié sur les adresses `workers.dev`

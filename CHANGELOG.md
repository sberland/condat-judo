# Changelog

Toutes les versions notables de ce projet sont documentées dans ce fichier.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
Versioning : [SemVer](https://semver.org/).

## [Unreleased]

### Site vitrine du club

#### Notes client

Le nouveau site du club remplace l'ancien site : il présente le club, ses trois disciplines
(judo avec l'éveil judo dès 4 ans, jujitsu, taïso), le code moral du judo, l'équipe, le dojo et
le règlement intérieur. Il est pensé d'abord pour le téléphone : menu simple, gros boutons,
itinéraire vers le dojo en un geste. Le site ne dépose aucun cookie et ne collecte aucune donnée.

#### Ajouts

- Pages Accueil, Disciplines, Le club, Règlement intérieur, Contact et Mentions légales
- Textes repris de l'ancien site du club ; code moral officiel de France Judo
- Liens d'itinéraire vers le dojo, page Facebook du club, prise de licence France Judo
- Identité visuelle reprise du logo du club (noir, rouge, blanc) ; affiliation France Judo

#### Corrections

- Script de release : la Release GitHub est créée correctement quand un seul artefact est attaché

## [0.1.0] — 2026-09-23

### Initialisation

#### Notes client

Première version du projet : la base technique du futur site du club est en place. Aucune
fonctionnalité n'est encore ouverte aux familles.

#### Ajouts

- Initialisation du projet : workspace (workflows, templates, backlog), socle applicatif
  (Worker Cloudflare, API Hono, base D1, front React), scripts de déploiement et CI GitHub Actions
- Seam d'identité : point unique de résolution de l'utilisateur, prêt pour l'authentification de
  l'application ; utilisateur simulé en développement local
- Mise en place Cloudflare : bases D1 prod et preview hébergées dans l'Union européenne ;
  environnement de qualification verrouillé par Cloudflare Access (accès au site uniquement, sans
  lien avec l'authentification de l'application)

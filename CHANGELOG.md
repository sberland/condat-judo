# Changelog

Toutes les versions notables de ce projet sont documentées dans ce fichier.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
Versioning : [SemVer](https://semver.org/).

## [Unreleased]

### Tarifs de la saison 2026/2027

#### Notes client

Les tarifs de la saison 2026/2027 sont en ligne : judo (par âge), taïso et yoga, licence France
Judo comprise, avec le détail du paiement en 3 fois, les suppléments (passeport, hors commune) et
la réduction famille. Les horaires des cours suivront dès qu'ils seront confirmés.

#### Ajouts

- Page « Tarifs » : une carte par formule (total, participation, licence, échéancier en 3 fois),
  suppléments et réductions, modes de paiement
- Discipline yoga préparée (présentation à fournir par le club, visible en qualification seulement)

#### Modifications

- Passeport sportif présenté comme recommandé pour les compétiteurs (et non plus obligatoire),
  conformément aux textes officiels France Judo 2026/2027

## [0.2.1] — 2026-09-24

### Menu mobile lisible

#### Notes client

Sur téléphone et sur les écrans étroits, le menu s'affiche de nouveau correctement : les rubriques
apparaissent sur un fond blanc, bien lisibles, au lieu de se superposer à la page.

#### Corrections

- Menu du téléphone : panneau plein écran sur fond blanc (il s'affichait en transparence par-dessus
  la page), marges alignées sur l'en-tête en tablette

## [0.2.0] — 2026-09-23

### Site vitrine du club

#### Notes client

Le nouveau site du club remplace l'ancien site : il présente le club, ses trois disciplines
(judo avec l'éveil judo dès 4 ans, jujitsu, taïso), le code moral du judo, l'équipe, le dojo et
le règlement intérieur. Il est pensé d'abord pour le téléphone : menu simple, gros boutons,
itinéraire vers le dojo en un geste. Le site ne dépose aucun cookie et ne collecte aucune donnée.

#### Ajouts

- Pages Accueil, Disciplines, Horaires et tarifs, Le club, Règlement intérieur, Contact et Mentions légales
- Règlement intérieur mis à jour selon la réglementation France Judo en vigueur (questionnaire de
  santé pour les mineurs, formalités médicales des majeurs, pièces demandées en compétition)
- Mentions légales avec l'identité officielle de l'association
- Horaires, tarifs, coordonnées et partenaires préparés en qualification, publiés dès que le club
  les aura confirmés
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

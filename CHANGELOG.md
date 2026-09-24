# Changelog

Toutes les versions notables de ce projet sont documentées dans ce fichier.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
Versioning : [SemVer](https://semver.org/).

## [Unreleased]

### Connexion à l'espace membres par lien personnel

#### Notes client

Les familles et le bureau peuvent désormais se connecter au site, sans mot de passe. Le bureau
envoie à chaque adulte un lien personnel sur WhatsApp : un geste suffit, et l'on reste connecté
six mois (chaque visite prolonge ce délai). Un lien ne sert qu'une fois et expire au bout de sept
jours ; en cas de téléphone perdu, le bureau coupe l'accès en un clic. La reconnexion autonome par
code reçu par e-mail viendra ensuite, une fois le nom de domaine du club choisi.

#### Ajouts

- Page de connexion : accueil personnalisé (« Bonjour Claire »), bouton « Me connecter sur cet
  appareil », messages clairs pour un lien expiré ou déjà utilisé, conseil si le lien s'ouvre dans
  le navigateur intégré d'une application
- Bureau : « Créer un lien de connexion » depuis un compte ou un responsable, avec « Envoyer sur
  WhatsApp » (directement au numéro du parent) et « Copier le lien »
- « Se déconnecter » dans Mon espace ; « Déconnecter tous ses appareils » pour le bureau
- Lien « Espace membres » en bas de chaque page
- Outil d'installation pour connecter le premier administrateur

#### Modifications

- Seul un administrateur peut créer un lien de connexion pour un membre du bureau
- Supprimer un compte coupe immédiatement tous ses accès
- Mentions légales : cookie de connexion de l'espace membres

## [0.4.0] — 2026-09-24

### Adhérents, responsables légaux et rôles du bureau

#### Notes client

Le site sait désormais qui est responsable de quel enfant. Le bureau peut enregistrer les
adhérents, leurs parents ou tuteurs (deux parents séparés peuvent chacun avoir leur accès), les
personnes autorisées à venir chercher l'enfant, et choisir pour chaque parent s'il peut inscrire
l'enfant, le récupérer et être prévenu. Les membres du bureau reçoivent des rôles (bureau,
trésorier, encadrant, gestion du site). Chaque parent verra uniquement ses propres enfants.
Ces écrans ouvriront aux familles et au bureau avec la connexion au site, prochaine étape.

#### Ajouts

- Espace connecté « Mon espace » : accueil, fiches des adhérents (identité, ceinture, licence,
  adresse), responsables légaux avec leurs droits, personnes autorisées à récupérer l'enfant
- Gestion des comptes : création, modification, suppression, attribution des rôles (réservée à
  l'administrateur ; il reste toujours au moins un administrateur)
- Espace famille : un parent consulte les fiches de ses enfants et met à jour son téléphone
- Saisie guidée sur mobile : messages d'erreur sous chaque champ, noms et téléphones remis en
  forme, proposition de relier un parent déjà connu plutôt que de créer un doublon
- Protection des formulaires contre les envois frauduleux depuis un autre site

#### Modifications

- Un compte peut cumuler plusieurs rôles (le rôle unique « admin » est repris automatiquement)

## [0.3.0] — 2026-09-24

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

# Actualités et abonnement agenda (spec 013)

## Contexte

La communication du club était dispersée (WhatsApp, Facebook, ancien site). Le site devient la
référence : les **actualités** y sont publiées, WhatsApp et Facebook relaient leur lien ; le
**calendrier** du club, ce sont les événements (spec 021), auxquels on s'abonne depuis son agenda.

## Description / Flux

### Modèle (migration 0015)

| Table | Rôle |
| --- | --- |
| `actualites` | Titre, texte (paragraphes séparés par une ligne vide), `visibilite` (`public`, `familles`), `statut` (`brouillon`, `publiee`), `publiee_le` (première publication), auteur ; `updated_at` change aussi avec la photo |
| `actualites_images` | Une photo au plus : type, `accord` (= 1, confirmé par l'auteur), déposant |
| `actualites_images_morceaux` | L'image en base64, en morceaux de 60 000 caractères (300 Ko au plus au total) |

Pourquoi des morceaux : l'export D1 (sauvegarde, recopie vers la qualif) écrit chaque ligne en une
instruction SQL, limitée à 100 Ko ; une photo d'actualité correcte dépasse ce seuil. Réduction
dans le navigateur : `reduirePhoto(fichier, PHOTO_ACTUALITE)` (1200 px, qualité dégressive).

### API (`routes/actualites.ts`, `/api/actualites`)

| Route | Accès | Rôle |
| --- | --- | --- |
| `GET /` (`?limite=`) | public | Publiées, les plus récentes d'abord ; « familles » seulement pour un compte connecté (`resolveUser`) |
| `GET /:id`, `GET /:id/image` | public | 404 si brouillon ; 401 si réservée et visiteur anonyme ; photo publique en cache 1 h, réservée jamais |
| `/gestion` (`GET`, `POST`, `PUT /:id`, `DELETE /:id`, `PUT` / `DELETE /:id/image`) | `bureau`, `contenu`, `admin` | Rédaction, publication (date de première publication conservée), photo avec `accord: true` obligatoire |

Les routes publiques utilisent `/:id{[0-9]+}` pour ne pas intercepter `/gestion`.

### Agenda (`worker/calendrier.ts`, `GET /api/calendrier.ics`)

Flux iCalendar public (RFC 5545) des événements des 90 derniers jours et à venir : journée entière
sans heure, 2 h à l'heure de Paris sinon (`VTIMEZONE` Europe/Paris), `STATUS:CANCELLED` si annulé,
lien vers la page de l'événement ; échappement et pliage des lignes à 75 octets (testés). Page
« Événements » : abonnement `webcal://…` (iPhone, Mac, Outlook), Google Agenda, copie de l'adresse.

### Écrans

- `/actualites` et `/actualites/$id` (public) ; accueil : « À la une » (3 dernières actualités) et
  « Prochains événements » (3), masqués s'il n'y en a pas. Pas d'entrée de menu (ordre décidé en 020).
- `/espace/actualites` et `/espace/actualites/$id` : rédaction, statut, visibilité, photo (case
  d'accord droit à l'image obligatoire), partage WhatsApp, suppression.

## Points de vigilance

- Une photo publique est mise en cache 1 h par le navigateur : l'adresse porte `?v=updated_at`,
  que le dépôt ou le retrait d'une photo met à jour.
- Données personnelles : les enfants reconnaissables n'apparaissent qu'avec l'accord droit à
  l'image (confirmé par l'auteur, non vérifiable automatiquement). Tables conservées dans la
  qualif (contenu public du club).

## Références

- `app/src/db/migrations/0015_actualites.sql`, `app/src/worker/routes/actualites.ts`, `calendrier.ts` (+ tests)
- `app/web/src/content/actualites.ts`, `lib/actualites.ts`, `lib/photo.ts`
- `app/web/src/pages/ActualitesPage.tsx`, `pages/espace/ActualitesGestionPage.tsx`, `HomePage.tsx`, `CompetitionsPage.tsx`

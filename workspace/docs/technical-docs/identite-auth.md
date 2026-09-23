# Identité et authentification — seam `resolveUser`

## Contexte

Le site démarre derrière **Cloudflare Access** (prod + preview), mais la cible est une
authentification applicative adaptée aux parents sur mobile (chantier auth, non tranché — cf.
[`notes/2026-09-23-reflexion-auth.md`](../../notes/2026-09-23-reflexion-auth.md)). Pour pouvoir
changer de fournisseur **sans refonte**, l'identité passe dès le socle par un point unique, et
**aucun droit n'est rattaché à l'email ni à un artefact Access**.

Conception reprise du projet de référence (StrategyHub, doc « 005-a droits & identité »), avec deux
durcissements : la table `identites` (au lieu d'une résolution par email) et la vérification de
signature du JWT Access.

## Description / Flux

```text
Requête ──▶ fournisseur d'identité ──▶ Identite { provider, subject, email? }
               ├─ cf-access : JWT Cf-Access-Jwt-Assertion vérifié (signature, aud, iss, exp)
               └─ dev       : DEV_SUBJECT, uniquement si ENVIRONMENT=local
                     │
                     ▼
        identites (provider, subject) ──▶ users.id   ← seule identité connue du reste du code
                     │ absent ?
                     ▼
        1re connexion : users.email = email vérifié, compte non supprimé et pas encore relié
        à ce fournisseur ──▶ INSERT identites (liaison)      sinon ──▶ « compte non reconnu »
```

### Modèle

| Table | Rôle |
| --- | --- |
| `users` | Personne connue du club (`prenom`, `nom`, `email` de contact, `role`, `supprime_le`). Créée par un admin (invitation). **Tous les droits référencent `users.id`.** |
| `identites` | `(provider, subject)` → `user_id`. Seule table qui connaît le fournisseur. `email_vu` = information, jamais un critère. |

### Code

- `app/src/worker/identite.ts` : fournisseurs (`identiteCloudflareAccess`, `identiteDev`),
  `resolveIdentite`, `resolveUser` → `{ statut: 'anonyme' | 'inconnu' | 'ok' }`.
- `app/src/worker/access-jwt.ts` : `verifyAccessJwt` — RS256 contre les clés
  `https://<équipe>/cdn-cgi/access/certs` (cache 10 min, rechargement si `kid` inconnu), audience =
  `CF_ACCESS_AUD`, émetteur = `https://<CF_ACCESS_TEAM_DOMAIN>`, `exp`/`nbf` avec 60 s de tolérance.
  Tests : `access-jwt.test.ts`.
- `/api/me` : 401 anonyme, 403 compte non reconnu, 200 avec l'utilisateur interne.

### Changer de fournisseur (auth applicative)

Ajouter un fournisseur dans `identite.ts` (ex. `provider = 'app'`, `subject` = id de compte de la
librairie d'auth) et l'insérer dans `resolveIdentite`. Les comptes existants se relient à la
première connexion (même email vérifié) ou par invitation. Le reste du code (droits, données) ne
change pas. Access peut alors être retiré de la prod.

## Points de vigilance

- **L'email ne donne aucun droit** : il sert uniquement à relier une *première* connexion à un
  compte créé par un admin. Un compte déjà relié à un fournisseur ne peut pas être repris par une
  autre identité du même fournisseur.
- **Pas de provisionnement automatique** : un inconnu authentifié par Access reçoit 403. Pas
  d'« email admin » codé en dur : le premier administrateur est créé par SQL (cf.
  [`installation.md`](../install/installation.md)).
- **Fournisseur dev** : double verrou `ENVIRONMENT === 'local'` **et** `DEV_SUBJECT`, deux variables
  qui n'existent que dans `app/.dev.vars`. Vérifié : avec `ENVIRONMENT=production`, `/api/me` → 401.
- **Où trouver le jeton Access** : en-tête `Cf-Access-Jwt-Assertion`, à défaut cookie
  `CF_Authorization` (même JWT, même vérification). Constaté le 2026-09-23 : sur la preview
  `*.workers.dev`, Access authentifie mais **n'injecte pas l'en-tête** — le repli cookie est
  indispensable. Motifs de refus journalisés (`wrangler tail`), jamais le jeton.
- **Futures routes d'écriture** : l'identité reposant sur un cookie (directement, ou via l'en-tête
  qu'Access en dérive), toute route `POST/PUT/DELETE` devra se protéger du CSRF (contrôle de
  l'en-tête `Origin`, ou en-tête personnalisé exigé côté API).
- **Access non configuré** (`CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_AUD` vides) : tout jeton est
  ignoré → 401. Chaque environnement a **son** AUD : un jeton de la preview est refusé en prod.
- **Clés Access injoignables** : refus (401), jamais d'acceptation par défaut.
- **Comptes de service Access** : jeton sans `email` → jamais relié automatiquement.

## Références

- Fichiers source : `app/src/worker/identite.ts`, `app/src/worker/access-jwt.ts`, `app/src/db/migrations/0001_init.sql`
- Configuration Access : [`cloudflare-access.md`](cloudflare-access.md)
- Réflexion auth cible : [`notes/2026-09-23-reflexion-auth.md`](../../notes/2026-09-23-reflexion-auth.md)
- Doc Cloudflare : <https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/>

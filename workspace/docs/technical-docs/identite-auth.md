# Identité et authentification — seam `resolveUser`

## Contexte

L'authentification de l'application (parents sur mobile, bureau, encadrants) sera construite au
**chantier auth** (non tranché — cf. [`notes/2026-09-23-reflexion-auth.md`](../../notes/2026-09-23-reflexion-auth.md)).
Pour pouvoir choisir et faire évoluer le mode d'authentification **sans refonte**, l'identité passe
dès le socle par un point unique, et **aucun droit n'est rattaché à l'email ni à un fournisseur**.

**Cloudflare Access n'est pas un fournisseur d'identité de l'app** (décision du 2026-09-23) : c'est
un verrou d'accès à la qualification, sans lien avec l'authentification — cf.
[`cloudflare-access.md`](cloudflare-access.md).

Conception reprise du projet de référence (StrategyHub, doc « 005-a droits & identité »), avec la
table `identites` (au lieu d'une résolution par email).

## Description / Flux

```text
Requête ──▶ fournisseur d'identité ──▶ Identite { provider, subject, email? }
               ├─ dev : DEV_SUBJECT, uniquement si ENVIRONMENT=local
               └─ (à venir) auth applicative — chantier auth
                     │
                     ▼
        identites (provider, subject) ──▶ users.id   ← seule identité connue du reste du code
                     │ absent ?
                     ▼
        1re connexion : users.email = email vérifié par le fournisseur, compte non supprimé et
        pas encore relié à ce fournisseur ──▶ INSERT identites (liaison)
        sinon ──▶ « compte non reconnu » (403)
```

### Modèle

| Table | Rôle |
| --- | --- |
| `users` | Personne connue du club (`prenom`, `nom`, `email` de contact, `role`, `supprime_le`). Créée par un admin (invitation). **Tous les droits référencent `users.id`.** |
| `identites` | `(provider, subject)` → `user_id`. Seule table qui connaît le fournisseur. `email_vu` = information, jamais un critère. |

### Code

- `app/src/worker/identite.ts` : fournisseurs (`identiteDev` aujourd'hui), `resolveIdentite`,
  `resolveUser` → `{ statut: 'anonyme' | 'inconnu' | 'ok' }`.
- `/api/me` : 401 anonyme, 403 compte non reconnu, 200 avec l'utilisateur interne.
- Tests : `app/src/worker/identite.test.ts` (verrou du fournisseur dev, indifférence à Access).

### Ajouter l'authentification applicative

Ajouter un fournisseur dans `identite.ts` (ex. `provider = 'app'`, `subject` = identifiant de compte
de la solution d'auth retenue) et l'insérer dans `resolveIdentite`. Les comptes créés par un admin
se relient à la première connexion (email vérifié) ou par invitation. Le reste du code (droits,
données) ne change pas.

## Points de vigilance

- **L'email ne donne aucun droit** : il sert uniquement à relier une *première* connexion à un
  compte créé par un admin. Un compte déjà relié à un fournisseur ne peut pas être repris par une
  autre identité du même fournisseur.
- **Pas de provisionnement automatique** : un inconnu authentifié reçoit 403. Pas d'« email admin »
  codé en dur : le premier administrateur est créé par SQL (cf. [`installation.md`](../install/installation.md)).
- **Fournisseur dev** : double verrou `ENVIRONMENT === 'local'` **et** `DEV_SUBJECT`, deux variables
  qui n'existent que dans `app/.dev.vars`. Testé ; vérifié aussi avec `ENVIRONMENT=production` → 401.
- **Access ignoré** : en-tête `Cf-Access-Jwt-Assertion`, cookie `CF_Authorization`, `ctx.access` ne
  sont jamais lus (testé). En preview, passer le verrou Access ne connecte donc personne dans l'app.
- **Futures routes d'écriture** : l'authentification reposera sur une session navigateur (cookie) ;
  toute route `POST/PUT/DELETE` devra se protéger du CSRF (contrôle de l'en-tête `Origin`, ou
  en-tête personnalisé exigé côté API).

## Références

- Fichiers source : `app/src/worker/identite.ts`, `app/src/db/migrations/0001_init.sql`
- Verrou de qualification : [`cloudflare-access.md`](cloudflare-access.md)
- Réflexion auth cible : [`notes/2026-09-23-reflexion-auth.md`](../../notes/2026-09-23-reflexion-auth.md)

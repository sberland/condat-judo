# Identité et authentification — seam `resolveUser`

## Contexte

L'authentification de l'application (parents sur mobile, bureau, encadrants) est construite par le
**chantier 005** ([`005-CHT-authentification.md`](../../tasks/pending/005-CHT-authentification.md),
arbitrages du 2026-09-24) : **lien de connexion personnel remis par le bureau + session de 6 mois
glissants** (005a), puis code par e-mail (005b) et passkey (005c). Ni mot de passe, ni SMS.

Pour pouvoir faire évoluer le mode d'authentification **sans refonte**, l'identité passe par un
point unique, et **aucun droit n'est rattaché à l'email ni à un fournisseur**.

**Cloudflare Access n'est pas un fournisseur d'identité de l'app** (décision du 2026-09-23) : c'est
un verrou d'accès à la qualification, sans lien avec l'authentification — cf.
[`cloudflare-access.md`](cloudflare-access.md).

Conception reprise du projet de référence (StrategyHub, doc « 005-a droits & identité »), avec la
table `identites` (au lieu d'une résolution par email).

## Description / Flux

```text
Requête ──▶ fournisseur d'identité ──▶ Identite { provider, subject, email? }
               ├─ app : cookie __Host-session → sessions (valide, compte actif) → subject = users.id
               └─ dev : DEV_SUBJECT, uniquement si ENVIRONMENT=local (une session app prime)
                     │
                     ▼
        identites (provider, subject) ──▶ users.id   ← seule identité connue du reste du code
                     │ absent ?
                     ▼
        1re connexion : users.email = email vérifié par le fournisseur, compte non supprimé et
        pas encore relié à ce fournisseur ──▶ INSERT identites (liaison)
        sinon ──▶ « compte non reconnu » (403)
```

### Connexion par lien (spec 005a)

```text
Bureau : Comptes → « Créer un lien de connexion »  ──▶ liens_connexion (empreinte, 7 jours)
         └─ « Envoyer sur WhatsApp » : https://…/connexion#<jeton>
Parent : ouvre le lien ──▶ /connexion lit le fragment (#), POST /api/auth/lien/infos → « Bonjour Claire »
         clic « Me connecter sur cet appareil » ──▶ POST /api/auth/lien
             ├─ lien consommé (UPDATE … RETURNING, atomique, une seule fois)
             ├─ INSERT OR IGNORE identites ('app', users.id)   ← « compte activé »
             └─ sessions (empreinte, 180 jours) + Set-Cookie __Host-session
Ensuite : /api/me prolonge la session (au plus une fois par jour) ; POST /api/auth/deconnexion la ferme.
```

### Modèle

| Table | Rôle |
| --- | --- |
| `users` | Personne connue du club (`prenom`, `nom`, `email` et `telephone` de contact, `supprime_le`). Créée par le bureau. **Tous les droits référencent `users.id`.** |
| `user_roles` | Rôles club cumulables sur `users.id` (spec 004) — cf. [`comptes-adherents.md`](comptes-adherents.md). |
| `identites` | `(provider, subject)` → `user_id`. Seule table qui connaît le fournisseur. `email_vu` = information, jamais un critère. |
| `liens_connexion` | Lien personnel : **empreinte SHA-256** du jeton, compte, créateur (`cree_par`, NULL = script), échéance (7 jours), `utilise_le`, `annule_le` (remplacé, compte supprimé). |
| `sessions` | Session navigateur : **empreinte SHA-256** du jeton du cookie, compte, échéance (180 jours glissants), dernière prolongation. |

### Code

- `app/src/worker/identite.ts` : fournisseurs `identiteApp` et `identiteDev`, `resolveIdentite`,
  `resolveUser` → `{ statut: 'anonyme' | 'inconnu' | 'ok' }`.
- `app/src/worker/session.ts` : jetons (256 bits, base64url), empreintes, cookie, sessions, liens.
- `app/src/worker/routes/auth.ts` : `/api/auth/lien/infos`, `/api/auth/lien`, `/api/auth/deconnexion`
  (publiques, en-tête anti-CSRF exigé).
- `app/src/worker/routes/admin.ts` : `POST /api/admin/comptes/:id/lien`,
  `DELETE /api/admin/comptes/:id/sessions` ; la suppression d'un compte coupe ses accès.
- `/api/me` : 401 anonyme, 403 compte non reconnu, 200 avec l'utilisateur interne ; prolonge la session.
- `deploy/lien-connexion.ps1` : lien pour un e-mail, en local / qualif / prod (premier administrateur).
- Front : `pages/ConnexionPage.tsx` (`/connexion`), `components/espace/LienConnexion.tsx`.
- Tests : `identite.test.ts` (verrou du fournisseur dev, indifférence à Access, cookie forgé),
  `session.test.ts` (jetons, empreintes, cookie).

### Ajouter un mode de connexion

Tout nouveau mode (code e-mail 005b, passkey 005c, Google…) **ouvre une session du même type**
(`ouvrirSession`) une fois la personne reconnue, ou ajoute un fournisseur dans `resolveIdentite`.
Le reste du code (droits, données) ne change pas.

## Points de vigilance

- **L'email ne donne aucun droit** : il sert à relier une *première* connexion d'un fournisseur
  externe à un compte créé par le bureau. Un compte déjà relié à un fournisseur ne peut pas être
  repris par une autre identité du même fournisseur.
- **Jetons jamais en clair** : seule l'empreinte SHA-256 des jetons (lien, session) est en base —
  une fuite de la base ne donne aucun accès. Un cookie mal formé est écarté sans requête SQL.
- **Le jeton du lien est dans le fragment** (`/connexion#…`) : le navigateur ne l'envoie jamais au
  serveur ; l'aperçu de lien de WhatsApp ne le voit pas, les journaux non plus. Il n'est consommé
  qu'au clic (POST) : un aperçu ou un rechargement ne le grille pas.
- **Un lien connecte à la place de la personne** : le bureau crée des liens pour les comptes
  famille, **seul un administrateur** pour un compte qui a un rôle (sinon un membre du bureau
  pourrait se connecter comme administrateur). Créer un lien annule le précédent.
- **Cookie** `__Host-session` : `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, sans `Domain` (limité
  au nom d'hôte exact : la prod et la qualif ne partagent rien). Accepté en `http://localhost`
  (contexte sûr pour les navigateurs).
- **Couper l'accès** : déconnexion (l'appareil), « Déconnecter tous ses appareils » (bureau),
  suppression du compte (sessions fermées, liens annulés). Les rôles et liens étant relus à chaque
  requête, un retrait de droit est immédiat même sans déconnexion.
- **Navigateurs intégrés** (Facebook, Instagram…) : la session y resterait enfermée ; la page de
  connexion invite à ouvrir le lien dans Safari ou Chrome.
- **Pas de provisionnement automatique** : un inconnu reçoit 403. Pas d'« email admin » codé en
  dur : le premier administrateur est créé par SQL puis reçoit un lien par
  `deploy/lien-connexion.ps1` (cf. [`installation.md`](../install/installation.md)).
- **Fournisseur dev** : double verrou `ENVIRONMENT === 'local'` **et** `DEV_SUBJECT`, deux variables
  qui n'existent que dans `app/.dev.vars`. Une session `app` le prime : pour tester la connexion
  par lien en partant d'un visiteur anonyme, lancer le worker avec `DEV_SUBJECT` vide.
- **Access ignoré** : en-tête `Cf-Access-Jwt-Assertion`, cookie `CF_Authorization`, `ctx.access` ne
  sont jamais lus (testé). En preview, passer le verrou Access ne connecte donc personne dans l'app.
- **Qualification** : les sessions et liens copiés de la prod y sont supprimés à chaque recopie.
- **CSRF** : toute écriture de l'API exige l'en-tête `X-Condat-Judo` (middleware `protectionCsrf`,
  spec 004 — cf. [`comptes-adherents.md`](comptes-adherents.md)).

## Références

- Fichiers source : `app/src/worker/identite.ts`, `app/src/worker/session.ts`,
  `app/src/worker/routes/auth.ts`, `app/src/db/migrations/0001_init.sql`, `0003_connexion.sql`
- Chantier : [`005-CHT-authentification.md`](../../tasks/pending/005-CHT-authentification.md)
- Verrou de qualification : [`cloudflare-access.md`](cloudflare-access.md)
- Réflexion auth : [`notes/2026-09-23-reflexion-auth.md`](../../notes/2026-09-23-reflexion-auth.md)

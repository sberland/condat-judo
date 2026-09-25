# Identité et authentification — seam `resolveUser`

## Contexte

L'authentification de l'application (parents sur mobile, bureau, encadrants) est construite par le
**chantier 005** ([`005-CHT-authentification.md`](../../tasks/pending/005-CHT-authentification.md),
arbitrages du 2026-09-24) : **lien de connexion personnel remis par le bureau + session de 6 mois
glissants** (005a), **passkey** facultative (005c), puis code par e-mail (005b). Ni mot de passe, ni SMS.

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

### Connexion par passkey (spec 005c)

WebAuthn via `@simplewebauthn/server` (Worker) et `@simplewebauthn/browser` (front). Proposée,
jamais imposée ; le lien reste toujours possible.

```text
Activation (compte connecté) : bandeau de /espace « Activer Face ID » ou « Mes enfants »
  POST /api/auth/passkey/enregistrement/options  ──▶ défi (defis_passkey, 5 min, lié au compte)
  navigateur : startRegistration (passkey découvrable, attestation « none »)
  POST /api/auth/passkey/enregistrement {reponse, appareil} ──▶ défi consommé, passkeys (clé publique)
Connexion (anonyme) : /connexion « Se connecter avec Face ID »
  POST /api/auth/passkey/connexion/options ──▶ défi (sans compte : le téléphone propose le compte)
  navigateur : startAuthentication
  POST /api/auth/passkey/connexion ──▶ défi consommé, signature vérifiée, compteur mis à jour
      └─ même ouverture de session que le lien (connecter : identites 'app' + sessions + cookie)
```

- **RP ID = nom d'hôte** de la requête (`origineAttendue`) : l'en-tête `Origin` doit désigner le
  même hôte que l'API, en `https` (ou `localhost`). Une passkey ne vaut que pour l'adresse où elle a
  été créée : prod, qualif et local sont distinctes ; **à refaire après un changement de domaine**.
- **Défis à usage unique** (`DELETE … RETURNING`), 5 minutes, purgés à chaque nouveau défi et par la
  purge quotidienne.
- `userID` WebAuthn = `condat-judo-<users.id>` (jamais l'e-mail comme identifiant).
- **Refus mémorisé sur l'appareil** (`localStorage` `condat-judo-passkey` = `activee` | `refusee`) :
  « Non merci » n'est plus proposé sur ce téléphone ; « activée » met le bouton passkey en premier
  sur /connexion.
- **Retrait** : par la personne (« Mes enfants », `DELETE /api/famille/passkeys/:id`, puis signal
  `allAcceptedCredentials` au navigateur) ; par le bureau (« Déconnecter tous ses appareils ») ; à
  la suppression ou l'anonymisation du compte (`couperAcces`, purge). Une passkey inconnue du
  serveur renvoie 401 `inconnue` : le front envoie le signal `unknownCredential` pour que le
  téléphone cesse de la proposer.

### Modèle

| Table | Rôle |
| --- | --- |
| `users` | Personne connue du club (`prenom`, `nom`, `email` et `telephone` de contact, `supprime_le`). Créée par le bureau. **Tous les droits référencent `users.id`.** |
| `user_roles` | Rôles club cumulables sur `users.id` (spec 004) — cf. [`comptes-adherents.md`](comptes-adherents.md). |
| `identites` | `(provider, subject)` → `user_id`. Seule table qui connaît le fournisseur. `email_vu` = information, jamais un critère. |
| `liens_connexion` | Lien personnel : **empreinte SHA-256** du jeton, compte, créateur (`cree_par`, NULL = script), échéance (7 jours), `utilise_le`, `annule_le` (remplacé, compte supprimé). |
| `sessions` | Session navigateur : **empreinte SHA-256** du jeton du cookie, compte, échéance (180 jours glissants), dernière prolongation. |
| `passkeys` | Passkey (005c) : identifiant (base64url), compte, **clé publique** (COSE, base64url), compteur, transports, libellé de l'appareil, dates. |
| `defis_passkey` | Défi WebAuthn à usage unique : type (enregistrement / connexion), compte (enregistrement), échéance (5 minutes). |

### Code

- `app/src/worker/identite.ts` : fournisseurs `identiteApp` et `identiteDev`, `resolveIdentite`,
  `resolveUser` → `{ statut: 'anonyme' | 'inconnu' | 'ok' }`.
- `app/src/worker/session.ts` : jetons (256 bits, base64url), empreintes, cookie, sessions, liens.
- `app/src/worker/routes/auth.ts` : `/api/auth/lien/infos`, `/api/auth/lien`, `/api/auth/deconnexion`
  (publiques, en-tête anti-CSRF exigé) ; `/api/auth/passkey/connexion[/options]` (publiques) et
  `/api/auth/passkey/enregistrement[/options]` (compte connecté).
- `app/src/worker/passkey.ts` : options et vérifications WebAuthn, défis, `origineAttendue`.
- `app/src/worker/routes/famille.ts` : `GET /api/famille/passkeys`, `DELETE /api/famille/passkeys/:id`.
- `app/src/worker/routes/admin.ts` : `POST /api/admin/comptes/:id/lien`,
  `DELETE /api/admin/comptes/:id/sessions` ; la suppression d'un compte coupe ses accès.
- `/api/me` : 401 anonyme, 403 compte non reconnu, 200 avec l'utilisateur interne ; prolonge la session.
- `deploy/lien-connexion.ps1` : lien pour un e-mail, en local / qualif / prod (premier administrateur).
- Front : `pages/ConnexionPage.tsx` (`/connexion`), `components/espace/LienConnexion.tsx`,
  `lib/passkey.ts`, `components/espace/Passkeys.tsx` (proposition, gestion).
- Tests : `identite.test.ts` (verrou du fournisseur dev, indifférence à Access, cookie forgé),
  `session.test.ts` (jetons, empreintes, cookie), `passkey.test.ts` (origine attendue, libellé).

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
- **Couper l'accès** : déconnexion (l'appareil), « Déconnecter tous ses appareils » (bureau : sessions
  fermées et passkeys retirées), suppression du compte (sessions fermées, liens annulés, passkeys
  retirées). Les rôles et liens étant relus à chaque
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
- **Qualification** : les sessions, liens et passkeys copiés de la prod y sont supprimés à chaque
  recopie (une passkey de la prod ne vaudrait de toute façon pas pour l'adresse de la qualif).
- **CSRF** : toute écriture de l'API exige l'en-tête `X-Condat-Judo` (middleware `protectionCsrf`,
  spec 004 — cf. [`comptes-adherents.md`](comptes-adherents.md)).

## Références

- Fichiers source : `app/src/worker/identite.ts`, `app/src/worker/session.ts`,
  `app/src/worker/routes/auth.ts`, `app/src/worker/passkey.ts`, `app/src/db/migrations/0001_init.sql`,
  `0003_connexion.sql`, `0016_passkeys.sql`
- Chantier : [`005-CHT-authentification.md`](../../tasks/pending/005-CHT-authentification.md)
- Verrou de qualification : [`cloudflare-access.md`](cloudflare-access.md)
- Réflexion auth : [`notes/2026-09-23-reflexion-auth.md`](../../notes/2026-09-23-reflexion-auth.md)

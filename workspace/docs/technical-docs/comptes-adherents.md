# Comptes, adhérents, responsables et droits (spec 004)

## Contexte

Tout le site familles (compétitions, garderie, dossier d'inscription) repose sur une question :
**qui est responsable de quel enfant, et qui a le droit de faire quoi pour lui**. La spec 004 pose
ce modèle et les droits qui en découlent, sans dépendre du mécanisme de connexion (chantier 005) :
les écrans fonctionnent en local avec l'utilisateur simulé, et s'ouvriront en ligne avec la 005.

Décisions de la revue (2026-09-24) : rôles cumulables, un responsable légal est toujours un compte
`users` créé par le bureau, pas de table « foyer » (famille implicite via les liens).

## Description / Flux

### Modèle (migration `0002_comptes_adherents.sql`)

```text
users ──< user_roles            rôles club cumulables : admin, bureau, tresorier, encadrant, contenu
  │
  └──< liens >── adherents ──< personnes_autorisees
       qualite                  (sans compte : nom, lien, téléphone)
       peut_inscrire
       peut_recuperer
       est_contact
```

| Table | Rôle |
| --- | --- |
| `users` | Adulte connu du club (parent, adhérent majeur, bureau). `email` **ou** `telephone` requis. |
| `user_roles` | `(user_id, role)` — rôles club. Aucun rôle = « famille » (droits dérivés des liens seuls). |
| `adherents` | Pratiquant (enfant ou adulte). `user_id` renseigné pour un adhérent majeur qui a un compte. Suppression **logique** (`supprime_le`), restaurable. |
| `liens` | Responsable ↔ adhérent : qualité (mère, père, tuteur, autre) et capacités. Plusieurs responsables par enfant (parents séparés), plusieurs enfants par responsable. |
| `personnes_autorisees` | Personnes sans compte autorisées à récupérer l'enfant (garderie, spec 012). |

« Famille » = ensemble des responsables liés à un même enfant : pas de table dédiée, donc pas de
foyer à maintenir quand des parents se séparent ou se recomposent.

### Droits (`app/src/worker/droits.ts`)

| Middleware | Effet |
| --- | --- |
| `protectionCsrf` | Toute requête autre que `GET/HEAD/OPTIONS` sans en-tête `X-Condat-Judo: 1` → 403. Un formulaire d'un autre site ne peut pas poser d'en-tête personnalisé ; le front l'envoie via `appel()` (`web/src/lib/api.ts`). |
| `connexionRequise` | Résout l'utilisateur (seam `resolveUser`) : 401 anonyme, 403 compte non reconnu ; sinon `c.get('utilisateur')`. |
| `roleRequis(...roles)` | 403 si l'utilisateur n'a aucun des rôles cités. |

| Routes | Accès |
| --- | --- |
| `/api/admin/*` (`routes/admin.ts`) | `bureau` ou `admin` — adhérents, liens, personnes autorisées, comptes |
| `PUT /api/admin/comptes/:id/roles` | `admin` seulement |
| `/api/famille/*` (`routes/famille.ts`) | tout compte connecté — **filtré en SQL** sur `liens.user_id = moi` |

Les droits d'un responsable sont **recalculés à chaque requête** à partir des liens : retirer un
lien retire immédiatement l'accès. L'e-mail n'intervient jamais dans un droit.

### Écrans (`app/web/src/pages/espace/`)

`/espace` (accueil), `/espace/famille` (mes enfants, mon téléphone), `/espace/adherents` (liste,
recherche), `/espace/adherents/nouveau`, `/espace/adherents/$id` (identité, responsables,
personnes autorisées), `/espace/comptes` (comptes, rôles, liens de connexion — spec 005a, cf.
[`identite-auth.md`](identite-auth.md)). Le composant `Espace`
(`components/espace/Garde.tsx`) masque selon les rôles ; **le masquage n'est pas la sécurité**,
l'API vérifie les mêmes droits. L'entrée « Mon espace » n'apparaît dans le menu que pour un
utilisateur connecté.

## Points de vigilance

- **Au moins un administrateur** : l'API refuse de retirer le rôle `admin` au dernier admin et de
  supprimer son compte (409). Un utilisateur ne peut pas supprimer son propre compte.
- **E-mail unique** : créer un compte avec un e-mail déjà utilisé → 409 avec l'`id` du compte
  existant ; l'écran propose alors de **lier le compte existant** plutôt que de créer un doublon.
- **Suppression logique** d'un compte (`users.supprime_le`) : ses liens restent en base mais sont
  ignorés partout (listes, fiche, espace famille), et `resolveUser` ne le reconnaît plus.
- **Saisie normalisée** côté API (`validation.ts`) : prénom/nom en casse de nom propre, e-mail en
  minuscules, téléphone au format `06 12 34 56 78` ; la ville est gardée telle que saisie.
- **Nouvelle table** → l'ajouter aux listes de purge de la preview (cf. `workflow-deploy-spe.md`).
- **Données personnelles** de mineurs : pas de donnée de santé, accès au strict nécessaire ; la
  durée de conservation et l'information des familles relèvent de la spec 006.

## Références

- Fichiers source : `app/src/db/migrations/0002_comptes_adherents.sql`, `app/src/worker/droits.ts`,
  `app/src/worker/validation.ts`, `app/src/worker/routes/`, `app/web/src/pages/espace/`
- Spec : [`004-comptes-foyers-roles.md`](../../tasks/done/004-comptes-foyers-roles.md)
- Seam d'identité : [`identite-auth.md`](identite-auth.md)

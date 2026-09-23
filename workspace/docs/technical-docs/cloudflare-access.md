# Cloudflare Access — configuration (prod + preview)

## Contexte

Périmètre protégé par Access (décision du 2026-09-23) :

| Environnement | Public | Derrière Access |
| --- | --- | --- |
| **Prod** `condat-judo.sebastien-berland.workers.dev` | Site vitrine (accueil, infos club, contact) et assets | `/espace` (espace membres) et `/api` |
| **Preview** `condat-judo-preview.sebastien-berland.workers.dev` | — | **Tout le host** (qualif + copie des données réelles) |

Seuls les comptes autorisés (bureau du club) passent Access. Le code du front (bundle JS) est
public par nature : il ne doit contenir **aucune donnée**, toutes les données passent par `/api`.
L'équipe Zero Trust est celle du compte perso, **partagée avec d'autres projets** (quota gratuit de
50 utilisateurs commun). Le Worker ne fait pas
confiance aveuglément à l'en-tête d'Access : il **vérifie la signature** du JWT (cf.
[`identite-auth.md`](identite-auth.md)). Limite : plan gratuit Zero Trust = **50 utilisateurs** —
suffisant pour le bureau, pas pour ouvrir le site à toutes les familles (→ chantier auth).

## Description / Flux

```text
Navigateur ──▶ Cloudflare Access (edge) : authentifie (code à usage unique par email…), refuse l'anonyme
                 │  injecte Cf-Access-Jwt-Assertion
                 ▼
              Worker condat-judo[-preview] : verifyAccessJwt (signature, aud, iss, exp)
                 ▼
              identites (cf-access, sub) ──▶ users.id
```

### Mise en place (dashboard Cloudflare Zero Trust)

1. **Zero Trust** → première ouverture : choisir un **nom d'équipe** → domaine
   `<equipe>.cloudflareaccess.com` (= `CF_ACCESS_TEAM_DOMAIN`). Plan **Free**.
2. **Settings → Authentication** : activer **One-time PIN** (code par email, aucun IdP à configurer).
3. **Access → Applications → Add an application → Self-hosted**, une par environnement :
   - `Condat Judo — preview` — domaine `condat-judo-preview.sebastien-berland.workers.dev`,
     **sans chemin** (tout le host) ;
   - `Condat Judo — prod` — domaine `condat-judo.sebastien-berland.workers.dev`, **deux
     destinations** : chemins `espace` et `api` (la vitrine reste publique).
4. **Policy** : *Allow*, *Include → Emails* = les personnes autorisées (liste explicite).
5. Dans chaque application : **Overview → Application Audience (AUD) Tag** → à reporter dans
   `app/wrangler.toml` (`CF_ACCESS_AUD` de `[vars]` pour la prod, de `[env.preview.vars]` pour la
   preview), ainsi que `CF_ACCESS_TEAM_DOMAIN`.
6. Créer les comptes correspondants dans `users` (le premier admin : cf. `installation.md`) : une
   personne autorisée par Access mais absente de `users` reçoit « compte non reconnu ».

## Points de vigilance

- **Autoriser par Access ≠ donner des droits** : Access filtre l'entrée ; les droits viennent de
  `users` (rôle) via `users.id`.
- **Preview = copie des données réelles** : même niveau de protection que la prod, obligatoire.
- **URL de version** (`<version>-condat-judo….workers.dev`) : elles ne seraient pas couvertes par
  les applications Access → désactivées par `preview_urls = false` (prod et preview, `wrangler.toml`).
  À contrôler dans Workers → Settings → Domains & Routes après le premier déploiement.
- AUD et domaine d'équipe ne sont pas des secrets (valeurs publiques dans le JWT) : ils peuvent
  rester dans `wrangler.toml`.

## Vérification (après premier déploiement)

- [ ] Accès anonyme → écran Access (redirection 302)
- [ ] Après code OTP : page d'accueil, carte « Utilisateur connecté » renseignée, via `cf-access`
- [ ] Personne autorisée par Access mais sans compte → « Compte non reconnu »
- [ ] `/api/health` affiche l'environnement attendu (`production` / `preview`)

## Références

- Code : `app/src/worker/identite.ts`, `app/src/worker/access-jwt.ts`
- Config : `app/wrangler.toml`
- Doc Cloudflare Access (self-hosted apps) : <https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-public-app/>

# Cloudflare Access — verrou d'accès à la qualification

## Contexte

Décision du 2026-09-23 : **Cloudflare Access sert uniquement de verrou d'accès au site de
qualification. Il n'a aucun lien avec l'authentification de l'application.**

| Environnement | Cloudflare Access | Authentification de l'app |
| --- | --- | --- |
| **Prod** `condat-judo.sebastien-berland.workers.dev` | Aucune (site public : vitrine) | Auth applicative (chantier auth, à venir) |
| **Preview** `condat-judo-preview.sebastien-berland.workers.dev` | **Tout le host verrouillé** (bureau / testeurs autorisés) | Idem prod — indépendante du verrou |

Pourquoi un verrou sur la qualif : elle reçoit une **copie des données de prod** et fait tourner du
code non encore validé. Access en bloque l'accès à toute personne non autorisée, sans rien changer
au fonctionnement de l'app.

Pourquoi aucune identité tirée d'Access : l'app aura sa propre authentification (parents sur
mobile, cf. [`identite-auth.md`](identite-auth.md)). Lire l'identité Access créerait un second
chemin de connexion, différent entre qualif et prod. Le seam `resolveUser` ignore donc tout ce
qui vient d'Access (en-tête, cookie, `ctx.access`) — un test le vérifie.

## Description / Flux

```text
Navigateur ──▶ Cloudflare Access (edge, preview uniquement) : code PIN par email, refuse l'anonyme (302)
                 ▼
              Worker condat-judo-preview : ne lit RIEN d'Access
                 ▼
              /api/me ──▶ seam resolveUser ──▶ auth applicative (à venir) — 401 d'ici là
```

### Configuration en place (dashboard Cloudflare One, compte perso)

- **Équipe Zero Trust** : `thera-soft.cloudflareaccess.com` (partagée avec d'autres projets du
  compte — son quota gratuit de 50 utilisateurs aussi ; la page de connexion est commune à toute
  l'équipe et ne se personnalise pas par application).
- **Méthode de connexion** : code PIN à usage unique (fournisseur d'identité déjà présent).
- **Verrou** : Workers & Pages → `condat-judo-preview` → Access → **« Protéger ce Worker derrière
  Access »**, portée **« Tout le trafic »** (couvre l'URL principale et les URL de version).
  ⚠️ Jamais sur le Worker de prod `condat-judo`, qui doit rester public.
  *(Historique : une application auto-hébergée par nom d'hôte, créée le 2026-09-23, a disparu le
  soir même sans modification connue ; remplacée le 2026-09-24 par ce mécanisme natif.)*
- **Politique** `Condat Judo — bureau` : *Autoriser*, *Inclure → E-mails* = personnes habilitées
  à la qualification. Ajouter / retirer une personne = modifier cette liste.

## Points de vigilance

- **Verrou ≠ compte** : passer Access ne donne aucun droit dans l'app ; l'app demandera sa propre
  connexion quand l'auth applicative existera.
- **URL de version** (`<version>-condat-judo-preview….workers.dev`) : désactivées par
  `preview_urls = false` (`app/wrangler.toml`) ; la portée « Tout le trafic » les couvrirait de
  toute façon.
- **Contrôle après chaque changement de config Access** : `curl -sI https://condat-judo-preview.sebastien-berland.workers.dev/`
  doit renvoyer **302** vers `thera-soft.cloudflareaccess.com` (le verrou a déjà disparu une fois
  sans alerte).
- **Constat technique (2026-09-23)** : avec une application Access créée par nom d'hôte sur
  `*.workers.dev`, le Worker ne reçoit ni l'en-tête `Cf-Access-Jwt-Assertion`, ni le cookie
  `CF_Authorization`, ni `ctx.access`. Seul le mécanisme « Protéger ce Worker derrière Access »
  (Workers & Pages → Worker → Access) alimente `ctx.access`. Sans objet ici, puisqu'on ne lit pas
  l'identité Access — à savoir si la question revient.
- **Prod** : jamais de verrou Access (le site doit rester public). La protection des données passe
  par l'auth applicative et les droits côté API.

## Vérification

- [x] Accès anonyme à la preview → redirection 302 vers `thera-soft.cloudflareaccess.com`
  (2026-09-23, puis 2026-09-24 après passage à « Protéger ce Worker »)
- [x] Après code PIN : le site s'affiche ; `/api/me` → « Non connecté » (normal : l'app n'a pas encore d'auth)

## Références

- Config : `app/wrangler.toml` (`preview_urls = false`)
- Seam d'identité : `app/src/worker/identite.ts` (+ `identite.test.ts`)
- Doc Cloudflare — Access pour les Workers : <https://developers.cloudflare.com/workers/configuration/cloudflare-access/>

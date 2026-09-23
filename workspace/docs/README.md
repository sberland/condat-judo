# Documentation — Condat Judo

Index de toute la documentation du projet.

---

## spec-fonctionnelle/

| Fichier | Contenu |
| --- | --- |
| [`expression-besoin.md`](spec-fonctionnelle/expression-besoin.md) | Expression du besoin d'origine (compétitions, garderie, communication, licences, connexion mobile, RGPD) — source des specs `NNN` du backlog |

---

## technical-docs/

| Fichier | Contenu |
| --- | --- |
| [`identite-auth.md`](technical-docs/identite-auth.md) | Seam d'identité `resolveUser` — tables `users` / `identites`, fournisseurs (dev ; auth applicative à venir), liaison de première connexion, Access non utilisé comme identité |
| [`cloudflare-access.md`](technical-docs/cloudflare-access.md) | Cloudflare Access — verrou d'accès à la qualification (sans lien avec l'auth de l'app), configuration, constat technique `workers.dev` |
| [`cloudflare-preview.md`](technical-docs/cloudflare-preview.md) | Environnement de preview — Worker + D1 dédiés, flux de qualification, pièges |

Utiliser `_template.md` pour créer un nouveau fichier technique.

---

## external-docs/

| Source | Contenu | État |
| --- | --- | --- |
| *(à compléter)* | *(à compléter)* | *(à compléter)* |

---

## users-docs/

| Fichier | Contenu |
| --- | --- |
| `utilisation.md` | Guide d'utilisation destiné aux utilisateurs finaux |
| `changelog-metier.md` | Historique des versions en langage métier |

---

## install/

[`install/installation.md`](install/installation.md) — Guide d'installation pas à pas (poste de dev, mise en place Cloudflare / GitHub, premier administrateur)

---

## test/

*(Procédures et résultats de tests — à compléter)*

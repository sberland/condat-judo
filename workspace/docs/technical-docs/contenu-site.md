# Contenu du site administré par le club (spec 014)

## Contexte

Les informations du site vitrine (coordonnées, dojo, équipe, disciplines, partenaires, règlement,
liens, identité de l'association) étaient écrites dans le code (`content/club.ts`) : la moindre
correction demandait une mise en production. Elles sont désormais en base, modifiables par le
rôle `contenu` et l'administrateur, avec historique.

## Description / Flux

### Documents (`app/web/src/content/contenu.ts`)

Un **document JSON par type de contenu** (même choix que les saisons, spec 003) :

| Clé | Contenu | Statut « à compléter » |
| --- | --- | --- |
| `contact` | E-mail et téléphone du club | oui |
| `club` | Nom et adresse du dojo, page Facebook, période des cours | non (toujours affiché) |
| `association` | Dénomination, forme, RNA, SIREN, siège, création | non (mentions légales) |
| `equipe` | Professeur, bureau (le premier membre = directeur de la publication) | oui |
| `esprit` | L'esprit du club : titre, introduction, valeurs (page « Le club », spec 020) | oui |
| `disciplines` | Liste **fixe** (identifiants stables : ancres, horaires) ; « à compléter » par discipline | non |
| `partenaires` | Liste ; « à compléter » par partenaire | oui |
| `reglement` | Articles, date de mise à jour, références | oui |
| `liens` | Liens utiles | oui |

Chaque document est **décrit champ par champ** (`DEFINITIONS` : texte, texte long, URL https,
e-mail, téléphone, case, choix dans une liste, identifiant caché, liste de textes, objet
facultatif, liste d'objets).
Cette description sert à la fois à la **validation** (`validerContenu`, Worker et écran : champs
inconnus ignorés, espaces nettoyés, erreurs indexées par chemin, ex. `bureau.1.nom`) et à
l'**éditeur générique** (`components/espace/EditeurContenu.tsx`).

Restent dans le code (`content/club.ts`) : le nom du club, le code moral (texte officiel de
France Judo), les principes de vie du yoga (spec 020) et les utilitaires de mise en forme.
Illustrations des disciplines : `components/IllustrationDiscipline.tsx` (par identifiant de
discipline ; `disciplineDe` retrouve la discipline d'un cours ou d'une formule par son nom). Horaires et tarifs : référentiel de saison (003).

### Base (migration 0012)

- `contenus` (`cle`, `valeur` JSON, `statut` publie / a_completer, `modifie_le`, `modifie_par`).
- `contenus_versions` : chaque enregistrement ; les **30 dernières** versions par contenu.
- Contenu initial = `content/contenu-initial.ts` (repris de l'ancien `club.ts`, script de
  génération), vérifié identique par `src/db/contenu.test.ts`.

### API (`app/src/worker/routes/contenu.ts`, `/api/contenu`)

| Route | Accès | Rôle |
| --- | --- | --- |
| `GET /api/contenu` | public | Tous les documents et leur statut ; `Cache-Control: no-cache` + **ETag** (304 si inchangé) |
| `GET /api/contenu/gestion` | `contenu`, `admin` | Liste : statut, dernière modification, nombre de versions |
| `GET /api/contenu/gestion/:cle` | idem | Document courant et historique |
| `PUT /api/contenu/gestion/:cle` | idem | `{ valeur, statut }` validés ; liste fixe : ni ajout ni retrait (409) |
| `POST /api/contenu/gestion/:cle/versions/:id/restaurer` | idem | La version redevient le contenu courant (nouvelle version) |

### Pages publiques (`lib/contenu.ts`)

- `useContenu()` : réponse de l'API complétée par le contenu initial ; dernier contenu gardé dans
  le navigateur (`localStorage`) et affiché aussitôt à la visite suivante, puis revalidé.
- Première visite : `main.tsx` attend le contenu **1,5 s au plus** avant le premier affichage
  (pas d'ancien contenu affiché puis remplacé) ; API lente ou injoignable → contenu initial.
- `useAffichable()` / `SelonStatut` : un contenu « à compléter » est masqué en production, visible
  avec le badge « À compléter » en local et en qualif (même règle que `Provisoire`).

### Écrans

`/espace/contenu` (liste) et `/espace/contenu/$cle` (formulaire, statut, « Enregistrer et
publier », « Voir sur le site », historique avec « Revenir à cette version » confirmé).

### Icônes du règlement (spec 022)

Champ facultatif `icone` des articles (choix parmi `ICONES_REGLEMENT`) ; sans choix, `iconeArticle`
la déduit du titre (licence, santé, parents, ponctualité, tenue, dossier, hygiène, compétition,
saison…, sinon « autre »). Correspondance clé → icône : `components/IconeArticle.tsx`.

## Points de vigilance

- Ajouter un champ : le décrire dans `DEFINITIONS` (validation et formulaire suivent) et adapter
  la page publique ; un document en base sans ce champ garde le repli du code seulement si le champ
  est facultatif — prévoir une migration de données sinon.
- Une URL doit être en `https://`.
- Données personnelles : seuls les noms et rôles de l'équipe, publiés avec leur accord ; jamais de
  contact personnel sans consentement.

## Références

- `app/web/src/content/contenu.ts`, `contenu-initial.ts`, `club.ts`
- `app/src/worker/routes/contenu.ts`, `app/src/db/migrations/0012_contenus.sql`
- `app/web/src/lib/contenu.ts`, `components/espace/EditeurContenu.tsx`, `pages/espace/ContenusPage.tsx`, `ContenuPage.tsx`

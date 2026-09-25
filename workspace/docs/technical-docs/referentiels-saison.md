# Saisons et référentiels (spec 003)

## Contexte

Catégories d'âge (compétitions), grille tarifaire (dossiers d'adhésion, page publique), dates du
paiement en 3 fois (trésorerie) et horaires des cours (page publique) changent chaque saison.
Avant la 003, ils étaient dans le code ; ils vivent désormais en base, saison par saison, et le
bureau prépare la saison suivante sans développement.

## Description / Flux

### Modèle (migration `0008_saisons_referentiels.sql`)

Table `saisons` (remplace la table d'exemple de `0001`) : `id` (« 2026-2027 », la valeur de
`adhesions.saison` et `paiements.saison`), `libelle`, `debut`, `fin`, `courante` (une seule,
index unique partiel), `inscriptions_ouvertes` (dossier en ligne des familles, 010b — cf.
[`comptes-adherents.md`](comptes-adherents.md)), `referentiel`
(JSON), `modifie_le`, `modifie_par`. La migration insère 2026/2027 avec exactement les valeurs qui
étaient dans le code (`content/referentiel-initial.ts` ; test `src/db/referentiel.test.ts`).

### Le document (`app/web/src/content/referentiel.ts`)

```ts
type Referentiel = {
  categories: Categorie[]                    // id stable, nom, années de naissance de → à
  tarifs: Tarifs                             // groupes de formules, passeport, hors commune, réduction famille, modes, provisoire
  echeances3Fois: { dates: [string, string]; provisoire: boolean }
  horaires: { cours: Cours[]; provisoire: boolean }  // jour, début, fin (HH:MM), cours, public
  garderie: ReglagesGarderie                 // spec 012a : lieux, période, mercredis fermés, délai (garderie.md)
}
```

- **Formules** : `judo` (passeport possible), `annees` (tranche de naissance → formule judo
  suggérée : celle qui couvre l'année, sinon la plus proche).
- **Validation** (`validerReferentiel`, à chaque `PUT`) : identifiants, catégories sans
  chevauchement, montants entiers ≥ 0, **trois versements = participation + licence**, dates ISO
  ordonnées, jours et heures valides. Erreurs par chemin (« tarifs.groupes.0.formules.1 ») affichées
  dans la section concernée.
- **Copie** (`copierReferentiel`) : copie profonde, années de naissance (catégories, formules) et
  dates du paiement en 3 fois décalées d'un an ; « … et avant » (1900) conservé.

### Quelle saison ?

- **Saison courante** (`saisonCourante(c)`, `worker/saison.ts`) : dossiers d'adhésion, trésorerie,
  accords des familles, page publique, catégories affichées. Changée **par le bureau**
  (« Rendre cette saison courante »), jamais automatiquement.
- **Saison d'une date** (`saisonPourDate`) : catégories et dossiers d'une compétition (saison de sa
  date si elle est préparée, sinon la courante).
- Lectures mémorisées pour la requête (`c.var.saisons`).
- Côté écran : `useSaisonCourante()` / `useReferentiel()` (`lib/saison.ts`, `GET /api/saison`,
  public, cache 10 min, invalidé après une modification).

### API

| Route | Accès | Rôle |
| --- | --- | --- |
| `GET /api/saison` | public | Saison courante et son référentiel (vitrine, espace) |
| `GET /api/admin/saisons` | bureau | Saisons avec nombre de dossiers et paiements |
| `GET /api/admin/saisons/:id` | bureau | Une saison complète |
| `PUT /api/admin/saisons/:id` | bureau | `{ referentiel, inscriptions_ouvertes }` — validé en entier |
| `POST /api/admin/saisons/:id/suivante` | bureau | Prépare la saison suivante par copie (409 si elle existe) |
| `POST /api/admin/saisons/:id/courante` | bureau | Bascule (une transaction) |
| `DELETE /api/admin/saisons/:id` | bureau | Seulement ni courante, ni dossier, ni paiement |

### Écrans

`/espace/saisons` (liste, « Préparer la saison … ») et `/espace/saisons/$id` : en-tête (courante,
inscriptions ouvertes, bascule, suppression) puis une section par partie — catégories, tarifs,
paiement en 3 fois, horaires — lecture puis « Modifier » (brouillon) et « Enregistrer ». Page
publique « Horaires & tarifs » et menu : lus depuis la saison courante (« à confirmer » = masqués
en production).

> Migration 0014 (spec 022) : le groupe « Taïso et yoga » de la grille devient deux groupes,
> « Taïso » et « Yoga » (mêmes formules), dans les saisons où il existait sous ce titre.

## Points de vigilance

- Un dossier garde ses montants figés : changer un tarif ne touche que les dossiers saisis ou
  modifiés ensuite.
- Les **identifiants** de catégories et de formules servent de clés (compétitions, dossiers) : ne
  pas en recréer sous un autre identifiant d'une saison à l'autre (la copie les conserve).
- Les ceintures restent une liste constante (`CEINTURES`, liste officielle France Judo), pas un
  référentiel de saison.
- Le texte de la vitrine « De septembre à juin… » reste dans `content/club.ts` (spec 014).

## Références

- `app/web/src/content/referentiel.ts` (+ tests), `referentiel-initial.ts`, `tarifs.ts`, `categories.ts`, `adhesion.ts`, `paiements.ts`
- `app/src/worker/saison.ts`, `routes/saisons.ts`, `index.ts` (`/api/saison`)
- `app/web/src/pages/espace/SaisonsPage.tsx`, `SaisonPage.tsx`, `pages/HorairesTarifsPage.tsx`, `lib/saison.ts`

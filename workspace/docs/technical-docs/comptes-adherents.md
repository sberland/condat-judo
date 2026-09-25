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
| `personnes_autorisees` | Personnes sans compte autorisées à récupérer l'enfant (garderie, spec 012) ; gérées par le bureau et, depuis la 012b, par un responsable qui peut inscrire l'enfant. |

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
| `/api/famille/*` (`routes/famille.ts`) | tout compte connecté — **filtré en SQL** sur `liens.user_id = moi` ; personnes autorisées : *peut inscrire* ; photo : responsable légal (spec 012b) |
| `/api/encadrant/*` (`routes/encadrant.ts`) | `encadrant`, `bureau` ou `admin` — liste du mercredi du jour (spec 012b) |

Les droits d'un responsable sont **recalculés à chaque requête** à partir des liens : retirer un
lien retire immédiatement l'accès. L'e-mail n'intervient jamais dans un droit.

### Écrans (`app/web/src/pages/espace/`)

`/espace` (accueil), `/espace/famille` (mes enfants, mon téléphone), `/espace/adherents` (liste,
recherche), `/espace/adherents/nouveau`, `/espace/adherents/$id` (identité, responsables,
personnes autorisées), `/espace/comptes` (comptes, rôles, liens de connexion — spec 005a, cf.
[`identite-auth.md`](identite-auth.md)). Le composant `Espace`
(`components/espace/Garde.tsx`) masque selon les rôles ; **le masquage n'est pas la sécurité**,
l'API vérifie les mêmes droits. Le bouton de l'en-tête (`useAccesEspace`, spec 018) mène à
`/espace` (« Mon espace ») pour un utilisateur connecté, à `/connexion` (« Espace membres ») sinon.

### Dossiers d'adhésion (spec 010a)

Table `adhesions` (migration `0004`) : un dossier par adhérent **et par saison**
(`UNIQUE (adherent_id, saison)`), pour la **saison courante** (spec 003 : table `saisons`, choisie
par le bureau).

- **Règles partagées** : `app/web/src/content/adhesion.ts` (formule suggérée d'après l'année de
  naissance, suppléments, réduction famille, échéancier en 3 fois, statut, ceintures) et
  `content/tarifs.ts` (types de la grille) sont importés **par l'écran et par le Worker** ; la grille
  elle-même vient du référentiel de la saison courante (spec 003). L'écran calcule
  en direct ; le Worker recalcule et **fige** les montants à l'enregistrement (la saisie du
  client n'est jamais prise pour un montant).
- **Statut** : `a_completer` (manque un responsable pour un mineur, le mode de paiement ou la
  formalité reçue) → `complet` → `valide` (action du bureau, refusée si incomplet). Toute
  modification annule la validation. Consentements et autorisations « non recueillis » : signalés
  « à recueillir », non bloquants.
- **Traçabilité** : `soins_urgence`, `droit_image`, `whatsapp` → `*_le` / `*_par` mis à jour
  quand la réponse change (remis à vide si « non recueilli ») ; `valide_par`, `cree_par`.
- **Réduction famille** suggérée si un autre enfant d'un même responsable a déjà un dossier de la
  saison ; **hors commune** si le code postal n'est pas 87920.
- Routes (`bureau` / `admin`) : `GET|PUT|DELETE /api/admin/adherents/:id/adhesion`,
  `POST …/adhesion/valider`, `GET /api/admin/adhesions` (tous les adhérents actifs + dossier).
  Toutes acceptent `?saison=<id>` (spec 010b) : par défaut la saison courante ; les écrans
  proposent d'abord la saison des inscriptions en ligne quand elle est ouverte pour une autre
  saison (`useSaisonDossiers`, `ChoixSaison`). Les réponses portent la grille (`tarifs`) de la saison.

### Dossier rempli en ligne par la famille (spec 010b)

Pour la **saison dont le bureau a ouvert les inscriptions** (`saisons.inscriptions_ouvertes`,
`saisonInscriptions` : la plus récente ; `inscriptions` dans `GET /api/saison`, tuile de l'espace).

```text
Mon espace → « Inscriptions 2027/2028 » (/espace/inscriptions) : un dossier par adhérent
  GET  /api/famille/inscriptions         mes enfants (responsable légal) + moi (adhérent majeur),
                                         dossier de la saison, dossier précédent, proposition
  /espace/inscriptions/$id : 7 étapes (adhérent → activité → paiement → santé → autorisations
                             → engagements → envoi) ; brouillon en localStorage jusqu'à l'envoi
  PUT  /api/famille/inscriptions/:id     validé en entier (validerDossierFamille), montant figé,
                                         envoye_le / envoye_par, engagements_le / _par
  POST /api/famille/inscriptions/enfants nouvel enfant (mineur) : adherents.propose_par + lien légal
  PUT  /api/famille/inscriptions/enfants/:id  corriger sa fiche tant que le bureau ne l'a pas vérifiée
Bureau : « Dossiers » (saison des inscriptions) → « Envoyé en ligne le … », « Fiche à vérifier »
         → « Valider le dossier » (efface propose_par ; enregistrer la fiche aussi)
```

- **Qui** : responsable légal (mère, père, tuteur) de l'enfant, ou l'adhérent majeur lui-même
  (comme les accords, spec 019). Un nouvel enfant doit être mineur ; doublon (même prénom, nom,
  date de naissance) refusé ; 6 fiches en attente de vérification au plus par compte.
- **Modifiable** : pas de dossier, ou dossier envoyé par la famille et pas encore validé. Un
  dossier saisi par le bureau (`envoye_le` vide) ou validé se consulte seulement ; l'upsert porte
  un `WHERE` qui protège un dossier validé entre-temps.
- **Reprise d'une saison sur l'autre** (`saisieInitiale`, `formuleProposee`) : formule (l'an dernier
  si ce n'est pas du judo, sinon d'après l'âge), passeport, paiement, adresse. **Consentements jamais
  repris** (acte positif) : réponse de l'an dernier seulement rappelée ; le serveur exige oui ou non.
- **Montant** : hors commune d'après le code postal saisi ; réduction famille si un frère ou une
  sœur (même responsable) a un dossier de la saison **créé avant** (la 1ʳᵉ licence n'est jamais
  réduite, même renvoyée ensuite).
- **Formalité** : « attestation » → `attestation_qs_mineur` ou `attestation_qs_sport`, reçue le jour
  même, `formalite_par` = ce responsable ; « certificat » → pièce à recevoir par le bureau (manque).
- **Adresse** : seule partie de la fiche que la famille modifie (mise à jour de `adherents`).
- **Accords** (`/api/famille/accords`) : saison courante **et** saison des inscriptions ; retirer
  l'accord photo n'efface la photo que pour la saison courante.
- Migration `0017_dossier_en_ligne.sql` : `adhesions.formalite_par`, `engagements_le/_par`,
  `envoye_le/_par`, `adherents.propose_par`.

## Points de vigilance

- **Aucune donnée de santé** dans un dossier : formalité = type de pièce + date de réception ;
  aucun champ de texte libre (on y écrirait des informations médicales).
- **Ceinture** : liste officielle (`CEINTURES`) validée côté API ; une valeur saisie avant la
  liste reste affichée dans l'écran pour ne pas être perdue.
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

- Fichiers source : `app/src/db/migrations/0002_comptes_adherents.sql`, `0004_adhesions.sql`, `0017_dossier_en_ligne.sql`,
  `app/src/worker/routes/inscriptions.ts`, `app/web/src/lib/inscriptions.ts`, `pages/espace/InscriptionsPage.tsx`, `DossierFamillePage.tsx`,
  `app/src/worker/droits.ts`, `app/src/worker/validation.ts`, `app/src/worker/routes/`,
  `app/web/src/content/adhesion.ts`, `app/web/src/pages/espace/`
- Spec 010a : [`010a-dossier-saisie-bureau.md`](../../tasks/done/010a-dossier-saisie-bureau.md)
- Spec : [`004-comptes-foyers-roles.md`](../../tasks/done/004-comptes-foyers-roles.md)
- Seam d'identité : [`identite-auth.md`](identite-auth.md)

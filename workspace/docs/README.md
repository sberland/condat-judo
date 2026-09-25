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
| [`identite-auth.md`](technical-docs/identite-auth.md) | Seam d'identité `resolveUser` et connexion applicative — lien de connexion personnel, sessions de 6 mois glissants (spec 005a), passkey Face ID / empreinte (spec 005c), fournisseur dev, Access non utilisé comme identité |
| [`comptes-adherents.md`](technical-docs/comptes-adherents.md) | Comptes, adhérents, responsables légaux et rôles (spec 004), dossiers d'adhésion (spec 010a), dossier rempli en ligne par les familles (spec 010b) — modèle de données, droits (CSRF, rôles, filtrage par liens), calcul partagé écran / Worker, écrans de l'espace connecté |
| [`competitions.md`](technical-docs/competitions.md) | Événements et compétitions (specs 009, 021) — types d'événement, inscription au choix (aucune, enfants, famille avec nombre de participants) ; modèle, catégories partagées écran / Worker, règles d'inscription (droits, date limite, éligibilité), API publique / famille / bureau, liste à ressaisir (copie, CSV), historique |
| [`garderie.md`](technical-docs/garderie.md) | Garderie du mercredi (specs 012a, 012b) — réglages dans la saison (lieux, période, mercredis fermés, délai), demandes des familles au mercredi ou en série, suivi du bureau ; liste du jour de l'encadrant (le mercredi même, journalisée), photos d'identification sur accord (base, 60 Ko, un an), personnes autorisées gérées par les familles ; pointage de l'encadrant et suivi en direct par les parents (012c) |
| [`referentiels-saison.md`](technical-docs/referentiels-saison.md) | Saisons et référentiels (spec 003) — un document JSON validé par saison (catégories, tarifs, paiement en 3 fois, horaires), saison courante choisie par le bureau, saison d'une date (compétitions), copie vers la saison suivante |
| [`actualites.md`](technical-docs/actualites.md) | Actualités et abonnement agenda (spec 013) — publiques ou réservées aux familles, brouillon / publiée, photo en morceaux (300 Ko) avec accord droit à l'image, flux iCal des événements |
| [`contenu-site.md`](technical-docs/contenu-site.md) | Contenu du site administré par le club (spec 014) — un document JSON par contenu, décrit champ par champ (validation + éditeur générique), historique de 30 versions, lecture publique avec ETag et cache navigateur, statut « à compléter » |
| [`tresorerie.md`](technical-docs/tresorerie.md) | Trésorerie (spec 011) — paiements répartis sur les dossiers, familles calculées (responsables partagés), échéancier en 3 fois, retards, remise en banque, accès trésorier / familles, exports |
| [`rgpd-droits.md`](technical-docs/rgpd-droits.md) | RGPD outillé (spec 019) — purge automatique hebdomadaire (cron, prod, durée confirmée), journal des accès sensibles (middleware, filtrable — spec 023), export des données, accords donnés ou retirés par les familles |
| [`cloudflare-access.md`](technical-docs/cloudflare-access.md) | Cloudflare Access — verrou d'accès à la qualification (sans lien avec l'auth de l'app), configuration, constat technique `workers.dev` |
| [`sauvegarde.md`](technical-docs/sauvegarde.md) | Sauvegarde de la base de prod (spec 007) — export chiffré (age) quotidien et avant migration, dépôt GitHub privé, rétention, restauration vers la qualif |
| [`cloudflare-preview.md`](technical-docs/cloudflare-preview.md) | Environnement de preview — Worker + D1 dédiés, flux de qualification, pièges |

Utiliser `_template.md` pour créer un nouveau fichier technique.

---

## rgpd/

| Fichier | Contenu |
| --- | --- |
| [`registre-traitements.md`](rgpd/registre-traitements.md) | Registre des traitements (art. 30 RGPD) : adhésions, compétitions, cotisations et paiements, garderie du mercredi, consentements, espace membres, sauvegardes — finalités, bases légales, données, destinataires, durées, sécurité. À valider par le bureau ; même contenu que la page « Données personnelles » du site |

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

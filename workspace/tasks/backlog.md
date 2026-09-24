# Backlog — Condat Judo — Vue consolidée

**Mis à jour :** 2026-09-24

---

## Légende

### Types

| Type | Signification |
|---|---|
| `technique` | Refactoring, infra, dette technique, outillage |
| `feature` | Nouvelle fonctionnalité visible |
| `proposition` | Idée à affiner, pas encore de spec |

### Priorités

| Priorité | Signification |
|---|---|
| **P1** | Critique — deadline dure ou bloquant client |
| **P2** | Important — engagement client ou dépendance forte |
| **P3** | Souhaitable — valeur réelle mais pas de deadline |
| **P4** | Long terme — à garder en tête, pas d'engagement |

---

## Conventions

### Fichier

- Lien cliquable `[NNN-titre.md](pending/NNN-titre.md)` dès qu'un fichier spec existe dans `pending/`
- `—` tant qu'aucun fichier n'est créé (proposition)

### Numérotation

- Le numéro est attribué **à la création du fichier spec**, pas à la proposition
- Les propositions n'ont pas de numéro (`—` dans la colonne Fichier et dans les `#` des synthèses)
- **Prochain numéro disponible** : NNN+1 après le plus grand numéro dans `pending/` et `done/` — vérifier aussi le backlog pour éviter tout conflit

### Ajout d'une spec

1. Créer le fichier `pending/NNN-titre.md`
2. Ajouter la ligne dans le tableau principal (avec lien, en ordre numérique)
3. Ajouter dans la synthèse par priorité correspondante (avec le numéro)
4. Si la proposition existait déjà : remplacer `—` par le lien dans le tableau et le numéro dans les synthèses

### Livraison

1. `git mv workspace/tasks/pending/NNN-titre.md workspace/tasks/done/`
2. Retirer la ligne du tableau principal
3. Retirer de la synthèse par priorité
4. Mettre à jour `**Mis à jour :**` en tête de fichier

---

> Specs tirées de l'[expression du besoin](../docs/spec-fonctionnelle/expression-besoin.md)
> (complétée le 2026-09-24 par le formulaire d'inscription papier). Priorités revues le
> 2026-09-24 : **la ressaisie des dossiers papier 2026/2027 passe en tête** (010a), précédée des
> garde-fous sur les données réelles (006, 007, 008).

| Fichier | Scope | Type | Impact utilisateur | Effort estimé | Priorité | Date cible | Notes |
|---|---|---|---|---|---|---|---|
| [003-referentiels-saison.md](pending/003-referentiels-saison.md) | Référentiels | feature | Élevé — socle de toutes les fonctionnalités | M | P1 | — | Catégories calculées par date de naissance, cours, grades, grille tarifaire ; copie de saison |
| [005-CHT-authentification.md](pending/005-CHT-authentification.md) | Auth | technique | Élevé — « connexion simple = clé du succès » | L | P1 | — | Chantier (a=lien remis par le bureau + session 6 mois, b=code e-mail — attend le domaine, c=passkey) ; arbitrages rendus le 2026-09-24 |
| [006-rgpd-socle.md](pending/006-rgpd-socle.md) | RGPD | feature | Élevé — obligatoire avant les données des familles | M | P1 | — | Registre, mentions, consentements opt-in, durées, droits, pas de donnée de santé |
| [007-sauvegarde-d1.md](pending/007-sauvegarde-d1.md) | Données | technique | Moyen — sécurité des données | S | P1 | — | Avant données réelles ; lieu de stockage chiffré à arbitrer (dépôt public exclu) |
| [009-competitions.md](pending/009-competitions.md) | Compétitions | feature | Élevé — **besoin d'origine** | M | P1 | — | Lien WhatsApp → inscription en 3 gestes ; liste à ressaisir sur le site fédéral |
| [010-CHT-adhesion.md](pending/010-CHT-adhesion.md) | Adhésions | feature | Élevé — toutes les infos adhérents et parents | L | P1 | 010a : saison en cours · 010b : 2027-06 | Chantier (a=ressaisie des dossiers papier 2026/2027 par le bureau — livrée en v0.7.0, b=dossier en ligne pour les familles) ; revue du 2026-09-24 ; arbitrages A1-A13 rendus (A3, A11 à voir avec le club) |
| [011-cotisations-paiements.md](pending/011-cotisations-paiements.md) | Paiements | feature | Moyen — travail du trésorier | M | P2 | — | Dû / encaissé / restant, paiement en 3 fois, modes, export ; pas de paiement en ligne |
| [012-CHT-garderie-mercredi.md](pending/012-CHT-garderie-mercredi.md) | Garderie | feature | Élevé — remplace un fil WhatsApp confus | M | P2 | — | Chantier (a=demande, b=liste du jour + photo, c=pointage) |
| [013-communication.md](pending/013-communication.md) | Communication | feature | Moyen — actualités et calendrier | M | P3 | — | WhatsApp / Facebook relaient des liens ; abonnement agenda |
| [014-administration-contenu.md](pending/014-administration-contenu.md) | Contenu | feature | Élevé — le club tient son site à jour sans développeur | M | P2 | — | Rôle `contenu` ; coordonnées, équipe, disciplines, partenaires, règlement, mentions ; historique ; horaires / tarifs dans 003 |
| [017-idees-whatsapp-api.md](pending/017-idees-whatsapp-api.md) | Communication | proposition | Moyen — messages envoyés par le site | M | P4 | — | Idées seulement : numéro WhatsApp du club, envoi depuis le site (liens de connexion, rappels), agent conversationnel ; payant, modèles validés par Meta, opt-in |
| — | Import des adhérents | proposition | Moyen — gain de saisie | S | P3 | — | Import depuis un tableur existant (si le club en a un), sinon saisie bureau (004) |
| — | Nom de domaine du club | proposition | Moyen — image, e-mails d'envoi | S | P3 | — | Ex. judo-condat.fr (~10 €/an) ; utile pour l'envoi des e-mails de connexion (005, arbitrage A3) |
| — | Résultats et palmarès | proposition | Faible | S | P4 | — | Résultats des compétitions par enfant (suite de 009) |
| — | Paiement en ligne HelloAsso | proposition | Faible à moyen | M | P4 | — | Gratuit pour les associations ; API + webhooks → rapprochement automatique (011) |
| — | Notifications push (PWA) | proposition | Faible | M | P4 | — | Sur iPhone : exige l'ajout du site à l'écran d'accueil |

---

## Plan de livraison proposé

| Phase | Specs | Pourquoi dans cet ordre |
| --- | --- | --- |
| 0 — Tout de suite | ~~002~~ (livrée en v0.3.0) | Gain rapide, sans dépendance |
| 1 — Fondations (bureau d'abord) | ~~004~~ (v0.4.0) → **005-CHT** (005a livrée en v0.5.0 ; 005b attend le domaine) | On ne peut inviter que des personnes connues (004) ; les écrans exigent la connexion (005) |
| 2 — Ressaisie des dossiers 2026/2027 | ~~010a~~ (v0.7.0, en qualif) en parallèle de **006** (socle minimal), **007**, ~~008~~ (v0.6.1) | Priorité du 2026-09-24 : les formulaires papier sont remis ; la ressaisie réelle en prod attend les trois garde-fous (données de mineurs) |
| 3 — Le club autonome | **003** → **014** | Référentiels en base (saison 2027/2028) et contenu du site administrés par le club |
| 4 — Valeur pour les familles | **009** puis **012-CHT** | Besoin d'origine d'abord ; la garderie ensuite (hebdomadaire) |
| 5 — Gestion du club | **011** puis **010b** | Le trésorier dès que les dossiers existent ; le dossier en ligne pour les inscriptions 2027/2028 |
| 6 — Communication | **013** (et idées **017**) | Relais du site vers WhatsApp / Facebook |

---

## Synthèse par priorité

### P1 — Critique

- **#003** — [Saisons et référentiels](pending/003-referentiels-saison.md)
- **#005-CHT** — [Authentification applicative](pending/005-CHT-authentification.md)
- **#006** — [Conformité RGPD : socle](pending/006-rgpd-socle.md)
- **#007** — [Sauvegarde de la base hors Cloudflare](pending/007-sauvegarde-d1.md)
- **#009** — [Compétitions : publication et inscription des enfants](pending/009-competitions.md)
- **#010-CHT** — [Dossier d'adhésion (inscription)](pending/010-CHT-adhesion.md)

---

### P2 — Important

- **#011** — [Cotisations : suivi des paiements](pending/011-cotisations-paiements.md)
- **#012-CHT** — [Garderie du mercredi](pending/012-CHT-garderie-mercredi.md)
- **#014** — [Administration du contenu du site](pending/014-administration-contenu.md)

---

### P3 — Souhaitable

- **#013** — [Communication : actualités et calendrier](pending/013-communication.md)
- **—** — Import des adhérents
- **—** — Nom de domaine du club

---

### P4 — Long terme

- **—** — Résultats et palmarès
- **—** — Paiement en ligne HelloAsso
- **—** — Notifications push (PWA)
- **#017** — [Idées : messages WhatsApp envoyés par le site](pending/017-idees-whatsapp-api.md)

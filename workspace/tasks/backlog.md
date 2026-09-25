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
| [005-CHT-authentification.md](pending/005-CHT-authentification.md) | Auth | technique | Élevé — « connexion simple = clé du succès » | L | P1 | — | Chantier (a=lien remis par le bureau + session 6 mois, b=code e-mail — attend le domaine, c=passkey — livrée en v0.21.0) ; arbitrages rendus le 2026-09-24 |
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
| 1 — Fondations (bureau d'abord) | ~~004~~ (v0.4.0) → **005-CHT** (005a livrée en v0.5.0, 005c en v0.21.0 ; 005b attend le domaine) | On ne peut inviter que des personnes connues (004) ; les écrans exigent la connexion (005) |
| 2 — Ressaisie des dossiers 2026/2027 | ~~010a~~ (v0.7.0, en qualif) en parallèle de ~~006~~ (v0.8.0, en qualif — réponses du club à reporter avant la prod) puis ~~019~~ (v0.11.0, en qualif), ~~007~~ (v0.7.1), ~~008~~ (v0.6.1) | Priorité du 2026-09-24 : les formulaires papier sont remis ; la ressaisie réelle en prod attend les trois garde-fous (données de mineurs) |
| 3 — Le club autonome | ~~003~~ (v0.12.0, en qualif) → ~~014~~ (v0.16.0, en qualif) | Référentiels en base (saison 2027/2028) et contenu du site administrés par le club |
| 4 — Valeur pour les familles | ~~009~~ (v0.9.0, en qualif) puis ~~012-CHT~~ (v0.13.0 à v0.15.0, en qualif) | Besoin d'origine d'abord ; la garderie ensuite (hebdomadaire) |
| 5 — Gestion du club | ~~011~~ (v0.10.0, en qualif) puis ~~010b~~ (v0.22.0, en qualif — chantier 010 clos) | Le trésorier dès que les dossiers existent ; le dossier en ligne pour les inscriptions 2027/2028 |
| 6 — Communication | ~~021~~ Événements (v0.18.0, en qualif) puis ~~013~~ (v0.20.0, en qualif) ; idées **017** | Relais du site vers WhatsApp / Facebook |

---

## Synthèse par priorité

### P1 — Critique

- **#005-CHT** — [Authentification applicative](pending/005-CHT-authentification.md)

---

### P2 — Important


---

### P3 — Souhaitable

- **—** — Import des adhérents
- **—** — Nom de domaine du club

---

### P4 — Long terme

- **—** — Résultats et palmarès
- **—** — Paiement en ligne HelloAsso
- **—** — Notifications push (PWA)
- **#017** — [Idées : messages WhatsApp envoyés par le site](pending/017-idees-whatsapp-api.md)

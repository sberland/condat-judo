# 012a — Garderie du mercredi : demande de récupération par les parents

> Chantier : 012-CHT-garderie-mercredi

## Pourquoi

Le mercredi, le club récupère des enfants à la garderie pour le goûter et le cours de judo. Les
demandes passent aujourd'hui par WhatsApp : on ne sait pas quel parent répond, pour quel enfant, ni
pour quel lieu. Le parent doit pouvoir dire lui-même, sans ambiguïté, quels mercredis son enfant
doit être récupéré, et le bureau avoir la liste propre de chaque mercredi.

## Quoi

- **Réglages de la saison** (écran Saisons, spec 003) : lieux de récupération, période (premier et
  dernier mercredi), mercredis sans garderie, délai de demande (jours avant, heure).
- **Parent** (responsable qui peut *inscrire* l'enfant) : pour chaque enfant, les mercredis ouverts
  à venir ; il demande ou annule un mercredi, ou « tous les mercredis jusqu'au … » en un geste ; il
  choisit le lieu s'il y en a plusieurs. Après le délai, le mercredi n'est plus modifiable par lui.
- **Bureau** : la liste de chaque mercredi (enfants par lieu, qui a demandé), ajout ou retrait d'un
  enfant même après le délai.

## Critères d'acceptation

- [ ] Un parent demande la récupération de son enfant pour un mercredi en un geste, depuis son téléphone
- [ ] « Tous les mercredis jusqu'au … » crée les demandes des mercredis ouverts, chacun annulable
- [ ] Une demande ou une annulation après le délai est refusée côté API (sauf bureau)
- [ ] Un parent ne voit et ne demande que pour ses enfants, s'il a le droit de les inscrire
- [ ] Le bureau voit la liste d'un mercredi, par lieu
- [ ] Utilisable à 360 px

## Hors périmètre

- Liste du jour de l'encadrant avec photos et contacts (012b), pointage « récupéré » (012c)
- Allergies et consignes du goûter (données de santé : arbitrage du club attendu)
- Notifications

## Revue (2026-09-24) — décisions

1. **Délai réglable** dans la saison, par défaut la veille à 20 h ; après, seul le bureau modifie.
2. **Demande au mercredi + « tous les mercredis jusqu'au … »**, chaque mercredi annulable.
3. **Lieux gérés par le bureau** dans la saison ; aucun choix à faire s'il n'y en a qu'un ; le
   dernier lieu choisi est repris.
4. **Mercredis sans garderie cochés par le bureau** (période + mercredis fermés) ; les parents ne
   voient que les mercredis ouverts.
5. Tranché sans question : demande = responsable avec le droit *inscrire* ; annulation = suppression
   de la demande ; demandes effacées un an après le mercredi (purge hebdomadaire) et à
   l'anonymisation de l'adhérent ; réglages 2026/2027 « à confirmer » tant que le club n'a pas
   répondu (questionnaire).

## Réalisation

- Réglages dans le référentiel de saison (`content/garderie.ts`, validation, copie) ; migration
  `0009_garderie.sql` (table `garderie_demandes`, réglages par défaut « à confirmer »).
- API famille (lecture, demande, annulation, série) avec délai en heure de Paris ; API bureau (liste
  d'un mercredi, ajout / retrait sans délai) ; en production, rien tant que « à confirmer ».
- Écrans : « Garderie du mercredi » (familles), « Garderie : liste du mercredi » (bureau), section
  garderie de l'éditeur de saison (mercredis fermés en grille) ; tuiles de l'espace.
- Purge : demandes effacées un an après le mercredi et à l'anonymisation ; aide, traitement RGPD,
  registre, doc technique `garderie.md`, guide.

## Notes

- Droits : responsable *inscrire* (ses enfants) ; `bureau` / `admin` (liste, ajout / retrait).
- Données : enfant, mercredi, lieu, auteur et date de la demande — aucune donnée de santé.

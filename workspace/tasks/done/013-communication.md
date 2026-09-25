# 013 — Communication du club : actualités et calendrier

## Pourquoi

« Mettre toute la partie communication du club » : aujourd'hui dispersée entre WhatsApp,
Facebook et un site Jimdo à l'abandon. Le site doit devenir la référence (dates, événements,
nouvelles), WhatsApp et Facebook servant à relayer des liens.

## Quoi

- **Actualités** : titre, texte, image (sans enfant identifiable sans consentement), date ;
  publiées par le bureau ; publiques ou réservées aux familles.
- **Calendrier du club** : entraînements exceptionnels, fermetures, compétitions (009), passages
  de grades, fêtes du club ; vue liste lisible sur mobile ; export / abonnement agenda (iCal).
- **Partage** : chaque actualité / événement a un lien court à poster sur WhatsApp ou Facebook.
- Accueil de la vitrine : dernières actualités et prochains événements.

## Critères d'acceptation

- [x] Le bureau publie une actualité depuis son téléphone en moins de 2 minutes
- [x] Les familles voient les prochains événements sur l'accueil
- [x] Une actualité « familles » n'est pas visible sans connexion
- [x] Un parent peut ajouter le calendrier du club à son agenda de téléphone

## Hors périmètre

- Notifications push (proposition PWA), newsletter par e-mail

## Revue (2026-09-25) — décisions

1. **Calendrier** = les événements (spec 021) ; abonnement agenda public (iCal, adresse unique),
   sans donnée personnelle ; événements annulés marqués comme tels.
2. **Publication** : rôles bureau, gestion du site (`contenu`) et admin.
3. **Photo** : une par actualité, réduite dans le navigateur, stockée en base ; avant de publier,
   case obligatoire « les enfants reconnaissables ont l’accord droit à l’image ».
4. Tranché sans question : actualité *publique* ou *réservée aux familles* (tout compte
   connecté) ; brouillon ou publiée ; accueil : trois dernières actualités et trois prochains
   événements ; page « Actualités » reliée depuis l’accueil (le menu reste celui décidé en 020) ;
   partage WhatsApp comme pour les événements.

## Notes

- **Dépend de** : 004 et 005 pour la publication (bureau) et les contenus réservés.
- Droits requis : `bureau` (publier) ; public / familles (lire).
- Données personnelles : photos → droit à l'image (006).
- **2026-09-24 (spec 021)** : le calendrier du club, ce sont les **événements** (compétitions,
  stages, rencontres, repas…, menu « Événements »). La 013 garde les actualités et construit
  l'abonnement agenda (iCal) à partir des événements.

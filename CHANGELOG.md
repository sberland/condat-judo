# Changelog

Toutes les versions notables de ce projet sont documentées dans ce fichier.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
Versioning : [SemVer](https://semver.org/).

## [Unreleased]

## [0.24.0] — 2026-09-25

### Données de démonstration en qualification

#### Notes client

Pour présenter le site au club et s'entraîner avant une démonstration, le site de test
(qualification) peut être rempli en une commande avec des données entièrement fictives : une
famille avec son enfant et sa photo (une illustration dessinée), des dossiers et des paiements
dans tous les états, des événements, une garderie du mercredi en cours de pointage et des
actualités. Deux comptes de démonstration — un administrateur et un parent — permettent de
montrer le site sous chaque angle, en même temps que la vue publique.

#### Ajouts

- Script de chargement des données de démonstration et des liens de connexion des comptes de démo

#### Corrections

- Actualités : la mention « connectez-vous » revient à la ligne correctement sur téléphone

## [0.23.0] — 2026-09-25

### Mon espace rangé par rubriques, journal des accès filtrable

#### Notes client

Avec les nouvelles fonctionnalités, l'accueil de l'espace membres devenait une longue suite de
cartes. Les écrans sont désormais rangés en rubriques : Ma famille, Mercredi (encadrement),
Adhérents, Vie du club, Gestion. Chacun ne voit que les rubriques de son rôle — un parent
retrouve simplement sa famille. L'aide est accessible par le bouton « Aide » en haut de l'écran,
comme partout ailleurs, et les membres du bureau qui sont aussi parents retrouvent « Événements »
pour inscrire leurs enfants. Côté administrateur, le journal des accès aux coordonnées des
familles se filtre par période, par membre du bureau et par type d'action.

#### Modifications

- Mon espace : rubriques, une carte par rubrique ; bouton « Aide » dans l'en-tête
- Données personnelles : journal filtrable (du / au, membre du bureau, action), nombre d'entrées
- Aide intégrée

## [0.22.0] — 2026-09-25

### Inscriptions en ligne : le dossier rempli par les familles

#### Notes client

Fini les formulaires papier : quand le bureau ouvre les inscriptions de la saison suivante, chaque
famille remplit le dossier de ses enfants depuis son téléphone, en quelques étapes. Les
coordonnées sont déjà connues du club et les choix de l'an dernier (formule, paiement, adresse)
sont proposés : il suffit de vérifier. Le montant est calculé tout seul (hors commune, réduction
famille). Pour un enfant, pas de certificat médical : le parent atteste que le questionnaire de
santé est négatif, sans jamais transmettre ses réponses. Les autorisations (photos, WhatsApp,
soins d'urgence, photo pour la garderie) sont redemandées chaque saison, sans rien cocher à la
place des parents, et restent modifiables à tout moment. Un enfant nouveau au club peut être
inscrit par ses parents : le bureau vérifie sa fiche. Le bureau retrouve les dossiers envoyés
dans l'écran « Dossiers », sur la saison des inscriptions, et les valide. Ce dossier complète la
ressaisie des formulaires papier par le bureau : le chantier « dossier d'adhésion » est terminé.

#### Ajouts

- Mon espace : « Inscriptions 2027/2028 » (quand le bureau les ouvre) — un dossier par adhérent,
  en 7 étapes, modifiable jusqu'à la validation ; « Inscrire un autre enfant »
- Dossiers (bureau) : choix de la saison (en cours / inscriptions), « Envoyé en ligne le … »,
  « Fiche à vérifier » ; sur la fiche adhérent, le dossier de chaque saison
- Mes enfants : autorisations de la saison en cours et de la saison des inscriptions
- Saisons : « Inscriptions ouvertes » ouvre le dossier en ligne aux familles
- Aide intégrée, page « Données personnelles », registre des traitements

## [0.21.0] — 2026-09-25

### Connexion par Face ID ou empreinte

#### Notes client

Après une première connexion par lien, le site propose d'activer Face ID (ou l'empreinte) sur le
téléphone. Ensuite, un simple déverrouillage suffit pour ouvrir son espace : plus besoin de
redemander un lien au bureau. C'est facultatif : « Non merci », et le site ne le redemande plus sur
ce téléphone. Le visage ou l'empreinte ne quittent jamais le téléphone. Téléphone perdu : on retire
sa connexion depuis « Mes enfants », ou le bureau coupe tous les accès du compte en un geste.

#### Ajouts

- Page Connexion : « Se connecter avec Face ID » (ou l'empreinte)
- Mon espace : proposition « Activer Face ID », refus mémorisé sur l'appareil
- Mes enfants : « Connexion par Face ID / empreinte » (appareils, activer, retirer)
- Comptes (bureau) : nombre de passkeys ; « Déconnecter tous ses appareils » les retire aussi
- Aide intégrée, page « Données personnelles », registre des traitements

## [0.20.0] — 2026-09-25

### Actualités du club et abonnement agenda

#### Notes client

Le club publie ses actualités sur le site : résultats, sorties, informations aux familles, avec
une photo. Le bureau ou la personne qui gère le site les rédige depuis son téléphone, les garde en
brouillon le temps de les relire, puis les publie et partage leur lien dans le groupe WhatsApp en
un geste. Une actualité peut être réservée aux familles connectées. Avant d'ajouter une photo,
l'auteur confirme que les enfants reconnaissables ont l'accord droit à l'image. L'accueil présente
les trois dernières actualités et les trois prochains événements. Les familles peuvent aussi
s'abonner au calendrier des événements du club depuis l'agenda de leur téléphone : il se met à
jour tout seul.

#### Ajouts

- Page « Actualités » et page de chaque actualité (partage WhatsApp) ; accueil : « À la une » et
  « Prochains événements »
- Espace « Actualités » (bureau, gestion du site) : rédiger, publier, photo, partager, supprimer
- Page « Événements » : « S'abonner au calendrier » (iPhone, Mac, Outlook, Google Agenda)
- Aide intégrée ; registre des traitements

## [0.19.0] — 2026-09-25

### Tarifs du yoga séparés, icônes du règlement

#### Notes client

La page « Horaires & tarifs » présente désormais trois groupes de formules — Judo, Taïso et
Yoga —, chacun avec l'illustration de sa discipline : chaque activité a sa propre grille, même
lorsque les montants se ressemblent. Chaque article du règlement intérieur est accompagné d'une
icône (licence, santé, tenue, ponctualité…) qui le rend plus facile à repérer ; le club peut la
changer dans « Contenu du site ».

#### Modifications

- Tarifs : « Taïso et yoga » devient deux groupes, « Taïso » et « Yoga » ; illustration de la
  discipline au titre de chaque groupe
- Règlement : une icône par article, choisie d'après le titre ou par le club

## [0.18.0] — 2026-09-24

### Événements du club : compétitions, stages, rencontres, repas…

#### Notes client

« Compétitions » devient « Événements » : le bureau y annonce toute la vie du club — compétitions,
stages, rencontres, repas, fêtes… —, avec l'heure si besoin, et choisit pour chacun l'inscription
qui convient : aucune (simple information), inscription des enfants (toutes catégories ou
certaines), ou inscription de la famille avec le nombre d'adultes et d'enfants, pratique pour un
repas. Les familles s'inscrivent depuis le lien posté dans le groupe WhatsApp, et peuvent modifier
ou annuler jusqu'à la date limite. Pour les compétitions, rien ne change : catégories, liste à
ressaisir sur le site fédéral et alertes. Les anciens liens de compétitions continuent de
fonctionner.

#### Ajouts

- Types d'événement (compétition, stage, rencontre, repas, fête du club, autre), avec pictogramme,
  et filtre par type sur la page Événements
- Inscription des familles avec le nombre de participants ; côté bureau, liste des familles,
  total et fichier CSV
- Heure de l'événement (facultative)

#### Modifications

- Menu, pages, espace et aide : « Événements » au lieu de « Compétitions » ; adresses
  `/evenements`
- Événements hors compétition : inscription des enfants ouverte à tous par défaut

## [0.17.0] — 2026-09-24

### Vitrine : disciplines illustrées, valeurs, esprit du club

#### Notes client

Chaque discipline a désormais sa petite illustration, reprise sur l'accueil, la page Disciplines,
les horaires et les tarifs. Le yoga est présenté plus complètement, comme les autres disciplines.
Les valeurs trouvent leur place sur la page Disciplines : le code moral pour le judo, le jujitsu
et le taïso, et les principes de vie du yoga ; l'accueil ne met plus en avant le seul judo. La
page « Le club » présente l'esprit du club — convivial, familial et ouvert à tous —, un texte que
le club peut modifier lui-même. Le menu suit un nouvel ordre : Accueil, Le club, Disciplines,
Horaires & tarifs, puis Règlement et Contact.

#### Ajouts

- Illustrations des quatre disciplines
- Page Disciplines : section « Valeurs » (code moral, principes de vie du yoga)
- Page « Le club » : « L'esprit du club », modifiable dans « Contenu du site »

#### Modifications

- Présentation du yoga étoffée
- Code moral retiré de l'accueil et de la page « Le club »
- Ordre du menu

## [0.16.0] — 2026-09-24

### Contenu du site modifiable par le club

#### Notes client

Le club tient désormais son site à jour lui-même : la personne qui gère le site (ou
l'administrateur) modifie depuis son espace, y compris sur téléphone, les coordonnées du club,
l'adresse du dojo et la période des cours, l'équipe, la présentation des disciplines, les
partenaires, le règlement intérieur, les liens utiles et l'identité de l'association. La
modification est en ligne aussitôt, sans attendre une mise à jour du site. Un contenu peut être
préparé « à compléter » : il reste masqué sur le site public et se relit sur le site de test.
Chaque modification est conservée avec sa date et son auteur, et l'on peut revenir à une version
précédente en un geste. Le site reste rapide : le contenu est gardé dans le navigateur entre deux
visites.

#### Ajouts

- Espace « Contenu du site » (rôle « Gestion du site » et administrateur) : liste des contenus,
  formulaire de chaque contenu, statut « À compléter », « Voir sur le site », historique et retour
  à une version
- Aide intégrée : rubrique « Contenu du site » ; registre des traitements : site public

#### Modifications

- Toutes les pages du site lisent leur contenu administré (accueil, disciplines, le club,
  règlement, contact, mentions légales, données personnelles, horaires, en-tête et pied de page)

## [0.15.0] — 2026-09-24

### Garderie du mercredi : pointage et suivi par les parents

#### Notes client

La garderie du mercredi est désormais complète sur le site. Le mercredi, l'encadrant pointe
chaque enfant « Récupéré » à la garderie (ou « Absent », et il prévient la famille), puis, à la
fin du cours, « Parti avec » la personne venue le chercher, choisie parmi les seules personnes
autorisées. Les parents suivent l'état de leur enfant en direct dans « Garderie du mercredi »
(récupéré à quelle heure, parti avec qui), sans rien avoir à demander ; le bureau le voit dans la
liste du mercredi.

#### Ajouts

- « Mercredi du jour » : boutons « Récupéré », « Absent », « Parti avec … », « Annuler » ;
  compteurs ; liste mise à jour toute seule toutes les 30 secondes
- Espace famille : bloc « Aujourd'hui » avec l'état de chaque enfant, mis à jour automatiquement
- Liste du mercredi du bureau : état de chaque enfant
- Aide intégrée (encadrant, familles, bureau) ; page « Données personnelles » et registre

## [0.14.0] — 2026-09-24

### Garderie du mercredi : liste du jour de l'encadrant, photos

#### Notes client

Le mercredi, l'encadrant qui va chercher les enfants à la garderie ouvre « Mercredi du jour » sur
son téléphone : les enfants à récupérer, par lieu, avec leur photo pour les reconnaître, et qui
peut venir les chercher au dojo, avec leur téléphone pour appeler en un geste. Cette liste n'est
visible que le mercredi même, et chaque consultation est enregistrée. Les parents déposent
eux-mêmes la photo de leur enfant depuis leur espace (réduite sur le téléphone avant l'envoi),
avec leur accord, retirable à tout moment ; le bureau peut aussi la prendre au dojo si l'accord
figure au dossier. La photo est effacée au bout d'un an. Les parents gèrent aussi la liste des
personnes autorisées à venir chercher leur enfant (grands-parents, nounou…) : l'encadrant ne
confie un enfant qu'aux personnes de cette liste.

#### Ajouts

- Écran « Mercredi du jour » (encadrants, bureau) : enfants par lieu, photo agrandissable,
  responsables et personnes autorisées avec leur téléphone
- Espace famille : « Photo pour la garderie du mercredi » et « Autorisés à le récupérer » sur la
  fiche de chaque enfant ; accord « Photo pour la garderie » dans les autorisations
- Dossier d'adhésion : accord « Photo pour la garderie du mercredi » ; fiche adhérent : photo
- Aide intégrée pour l'encadrant ; page « Données personnelles » et registre mis à jour

#### Modifications

- Les demandes de garderie et la photo figurent dans le téléchargement « Mes données »
- Effacements techniques (journal, demandes et photos de plus d'un an) appliqués chaque semaine,
  même avant la confirmation de la durée de conservation par le club

## [0.13.0] — 2026-09-24

### Garderie du mercredi : les parents demandent en ligne

#### Notes client

Les parents demandent eux-mêmes, depuis leur téléphone, que le club récupère leur enfant à la
garderie le mercredi : pour un mercredi, ou pour tous les mercredis jusqu’à une date, en un geste.
Ils peuvent annuler jusqu’au délai fixé par le club (par défaut la veille au soir). Le bureau voit
chaque mercredi la liste des enfants à récupérer, par lieu, et peut ajouter ou retirer un enfant
à tout moment. Lieux, calendrier (mercredis sans garderie) et délai se règlent dans la saison ;
tant que le club ne les a pas confirmés, les demandes ne sont pas ouvertes sur le site public.

#### Ajouts

- Espace famille : « Garderie du mercredi » (demander, annuler, tous les mercredis jusqu’au …)
- Bureau : liste de chaque mercredi par lieu, ajout et retrait d’un enfant
- Saisons et tarifs : réglages de la garderie (lieux, période, mercredis fermés, délai)

## [0.12.0] — 2026-09-24

### Saisons et tarifs gérés par le bureau

#### Notes client

Le bureau gère lui-même, saison par saison, les catégories d’âge, la grille tarifaire, les dates
du paiement en 3 fois et les horaires des cours : plus besoin d’un développeur pour les changer.
Pour la rentrée suivante, il prépare la nouvelle saison en un clic (copie de la précédente, années
et dates décalées d’un an), l’ajuste tranquillement, puis la rend « courante » quand il le décide :
dossiers d’adhésion, trésorerie, compétitions et page publique « Horaires & tarifs » passent
alors dessus. Rien ne change pour la saison 2026/2027 : ses valeurs sont reprises à l’identique.

#### Ajouts

- Écran « Saisons et tarifs » : catégories, formules et tarifs, suppléments et réduction, dates du
  paiement en 3 fois, horaires des cours ; contrôles à l’enregistrement (versements = total…)
- Préparation de la saison suivante par copie, bascule de la saison courante, inscriptions
  ouvertes (pour le futur dossier en ligne)

#### Modifications

- Page publique « Horaires & tarifs », dossiers d’adhésion, trésorerie et compétitions lisent la
  saison courante (compétitions : la saison de leur date, si elle est préparée)

## [0.11.0] — 2026-09-24

### Données personnelles : droits des familles et effacement automatique

#### Notes client

Les familles exercent elles-mêmes leurs droits depuis leur espace : elles téléchargent en un geste
tout ce que le club enregistre sur elles et leurs enfants, et répondent oui ou non, à tout
moment, pour les photos et vidéos et pour le groupe WhatsApp — ce qui règle aussi le recueil de
ces accords cette saison. Une fois la durée de conservation confirmée par le club, les données
d'un adhérent qui ne se réinscrit plus sont rendues anonymes automatiquement chaque semaine.
Chaque consultation ou modification des coordonnées d'une famille par le bureau est enregistrée
et consultable par l'administrateur pendant un an.

#### Ajouts

- Espace famille : « Autorisations » (photos et vidéos, groupe WhatsApp : oui ou non) et
  « Télécharger mes données »
- Effacement automatique (anonymisation) des adhérents arrivés à échéance et de leurs responsables
  sans autre enfant au club, chaque lundi, une fois la durée confirmée par le club
- Écran « Données personnelles » pour l'administrateur : durée, adhérents concernés, historique,
  journal des accès aux coordonnées des familles
- Export des données d'un compte pour répondre à une demande écrite

#### Modifications

- Page « Données personnelles » : droits exerçables depuis l'espace, effacement automatique,
  journal des accès

## [0.10.0] — 2026-09-24

### Cotisations : suivi des paiements par le trésorier

#### Notes client

Le trésorier suit les cotisations de la saison sur le site : ce que chaque famille doit, ce
qu'elle a payé, ce qui reste et les versements en retard. Il enregistre un chèque en quelques
secondes depuis son téléphone ; un chèque pour deux enfants est réparti automatiquement entre
eux, et les trois chèques d'un paiement en 3 fois s'enregistrent d'un coup avec leurs dates
d'encaissement. Le site liste les chèques à remettre en banque chaque mois et fournit les exports
pour la comptabilité. Chaque famille voit, dans son espace, ce qu'elle a payé et ce qui reste ;
seuls le trésorier et l'administrateur voient l'ensemble des paiements.

#### Ajouts

- Écran « Trésorerie » : totaux de la saison, chèques et espèces à remettre en banque, familles
  filtrables (en retard, à payer, partiellement payées, soldées), exports CSV
- Fiche famille : dossiers et échéancier, enregistrement d'un paiement réparti entre les enfants,
  « 3 chèques » d'un paiement en 3 fois, remise en banque, suppression d'une erreur
- Espace famille : bloc « Cotisations » (dû, payé, reste, versements reçus)
- Aide intégrée pour le trésorier et les familles ; traitement « Cotisations et paiements » dans
  la page Données personnelles et le registre

#### Modifications

- Un dossier d'adhésion sur lequel des paiements sont enregistrés ne peut plus être supprimé

## [0.9.0] — 2026-09-24

### Compétitions : publication et inscription des enfants

#### Notes client

Le bureau publie chaque compétition sur le site (date, lieu, catégories, date limite, informations
pratiques) et en poste le lien dans le groupe WhatsApp du club, message prêt. Depuis ce lien, un
parent connecté inscrit son enfant d'un geste, et peut annuler jusqu'à la date limite ; seuls les
enfants des catégories concernées peuvent l'être, par un responsable qui en a le droit. La page
d'une compétition est publique mais n'affiche aucune information sur les enfants. Le bureau suit
les inscrits, avec une alerte quand une licence, un dossier ou une formalité médicale manque,
récupère la liste prête à ressaisir sur le site de la fédération (copie ou fichier Excel), coche
les inscriptions ressaisies, et peut inscrire un enfant à la place de ses parents.

#### Ajouts

- Menu « Compétitions » : compétitions à venir, et pour un parent connecté, ses enfants inscrits
  ou pas encore inscrits
- Page de chaque compétition : informations pratiques, itinéraire, page officielle, inscription et
  désinscription des enfants jusqu'à la date limite incluse
- Espace bureau : création, modification, clôture, annulation ; partage WhatsApp ; liste des
  inscrits avec alertes, copie ou fichier CSV, case « ressaisi sur le site fédéral » ; inscription
  par le bureau, même après la date limite
- Historique des compétitions sur la fiche de chaque enfant (famille et bureau)
- Aide intégrée : rubriques « Inscrire mon enfant à une compétition » et « Compétitions » (bureau)
- Page « Données personnelles » et registre : traitement « Compétitions »

#### Modifications

- Menu du site : entrée « Compétitions », espacement resserré sur grand écran

## [0.8.0] — 2026-09-24

### Données personnelles : information des familles

#### Notes client

Une page « Données personnelles », accessible en bas de chaque page, explique aux familles ce que
le club enregistre sur les adhérents et leurs responsables, pourquoi, qui y a accès, combien de
temps, et comment consulter, corriger ou supprimer ces informations ou retirer un accord. Elle est
signalée dans l'espace membres, sur la page de connexion et dans le message qui accompagne chaque
lien de connexion. Le club tient aussi son registre des traitements. Le site public ne sera mis à
jour qu'une fois les dernières informations confirmées par le club.

#### Ajouts

- Page « Données personnelles » (responsable, données, finalités, destinataires, durées, droits,
  cookies, sécurité) et lien dans le pied de page
- Renvois vers cette page : espace « Mes enfants », page de connexion, message WhatsApp du lien de
  connexion, aide intégrée, mentions légales
- Registre des traitements du club
- Contrôle automatique : pas de mise en ligne tant qu'une information attend la confirmation du club

## [0.7.2] — 2026-09-24

### Accès direct à l'espace membres, badge de qualification lisible

#### Notes client

Un bouton en haut de chaque page mène directement à l'espace membres, y compris sur téléphone
sans ouvrir le menu : « Mon espace » quand on est connecté, « Espace membres » sinon (la page
explique alors comment se connecter). Sur le site de qualification, le badge en bas à droite
indique la version testée et ne masque plus le bas de page.

#### Ajouts

- Bouton « Mon espace » / « Espace membres » dans l'en-tête, visible sur tous les écrans

#### Modifications

- Badge « Preview / Qualif » : affiche la version ; marge en fin de page pour ne plus masquer la
  version du pied de page
- Menu complet affiché à partir des grands écrans (1280 px), menu compact en dessous

## [0.7.1] — 2026-09-24

### Sauvegarde de la base hors Cloudflare

#### Notes client

Les données du site sont désormais sauvegardées chaque nuit en dehors de l'hébergeur, et
systématiquement avant chaque évolution de la base. Les sauvegardes sont chiffrées : seul le
responsable du site détient la clé qui permet de les relire. Elles sont conservées un mois au
jour le jour, puis une par mois pendant un an, et leur restauration a une procédure testée.

#### Ajouts

- Sauvegarde chiffrée quotidienne de la base, conservée dans un espace privé distinct du site
- Sauvegarde automatique avant toute évolution de la base ; en cas d'échec, la mise à jour du
  site est bloquée
- Procédure de restauration vers le site de qualification (où les données sont anonymisées)

## [0.7.0] — 2026-09-24

### Dossiers d'adhésion de la saison

#### Notes client

Le bureau peut désormais ressaisir sur le site les formulaires d'inscription papier de la saison
2026/2027. Pour chaque adhérent : la formule (proposée d'après l'âge), le montant calculé
automatiquement (passeport, hors commune, réduction famille, paiement en 3 fois), le mode de
paiement, la formalité médicale reçue (sans aucune information de santé), l'autorisation de soins
d'urgence et les consentements (droit à l'image, groupe WhatsApp). Un écran « Dossiers » montre
d'un coup d'œil ce qui manque pour chacun et le total des montants. La ceinture se choisit dans la
liste officielle de France Judo.

#### Ajouts

- Bloc « Adhésion 2026/2027 » sur la fiche de chaque adhérent : saisie guidée, montant en direct,
  statut « à compléter / complet / validé », enchaînement vers l'adhérent suivant
- Écran « Dossiers 2026/2027 » : tous les adhérents, filtres, ce qui manque, total des montants
- Consentements et autorisations datés, avec le nom de qui les a saisis
- Aide intégrée : rubrique « Dossiers d'adhésion »

#### Modifications

- Ceinture : liste officielle (dont ceintures bicolores des enfants) au lieu d'un texte libre
- Fiche d'un enfant sans responsable : le formulaire d'ajout s'ouvre directement

## [0.6.1] — 2026-09-24

### Site de qualification sans données réelles des familles

#### Notes client

Le site de qualification (site de test réservé au bureau) reçoit une copie du site public pour
vérifier chaque nouvelle version. Désormais, cette copie est rendue anonyme à chaque mise à jour :
les noms, coordonnées et dates de naissance des familles et des enfants y sont remplacés par des
valeurs fictives. Seuls les comptes des membres du bureau, qui font les tests, restent inchangés.

#### Ajouts

- Anonymisation automatique de la copie de qualification (familles, adhérents, personnes
  autorisées) ; les accès ouverts sur le site public n'y sont jamais valables
- Contrôle automatique : toute nouvelle information enregistrée par le site doit être classée
  (anonymisée ou non) avant de pouvoir être livrée

## [0.6.0] — 2026-09-24

### Aide intégrée à l'espace membres

#### Notes client

L'espace membres a désormais sa propre aide, adaptée à chacun : un parent y trouve comment se
connecter, ce que signifient les droits sur ses enfants et comment corriger une information ; le
bureau y ajoute la saisie des adhérents, des responsables et l'envoi des liens de connexion ;
l'administrateur y trouve en plus la gestion des rôles. Un bouton « Aide » en haut de chaque écran
mène directement à la bonne réponse.

#### Ajouts

- Page « Aide » dans Mon espace : questions / réponses par thème, filtrées selon le profil
- Bouton « Aide » sur chaque écran de l'espace, vers la rubrique correspondante ; tuile « Aide »
  sur l'accueil de l'espace

## [0.5.1] — 2026-09-24

### Le yoga sur tout le site, qualification repérable

#### Notes client

Le yoga figure désormais partout sur le site, au même titre que le judo, le jujitsu et le taïso :
accroche de l'accueil, présentation dans la page Disciplines (séances le lundi et le jeudi), pied
de page et référencement dans les moteurs de recherche. Sur le site de qualification, l'onglet du
navigateur commence par « Qualif » pour ne jamais le confondre avec le site public.

#### Ajouts

- Présentation du yoga (postures, respiration, détente ; lundi et jeudi), visible sur le site
  public — texte à affiner avec le club
- Mention « Qualif · » devant le titre de l'onglet, sur le site de qualification uniquement

#### Modifications

- Accueil, page Disciplines, pied de page, titre et description du site : quatre disciplines au
  lieu de trois ; ces textes suivent désormais automatiquement la liste des disciplines

## [0.5.0] — 2026-09-24

### Connexion à l'espace membres par lien personnel

#### Notes client

Les familles et le bureau peuvent désormais se connecter au site, sans mot de passe. Le bureau
envoie à chaque adulte un lien personnel sur WhatsApp : un geste suffit, et l'on reste connecté
six mois (chaque visite prolonge ce délai). Un lien ne sert qu'une fois et expire au bout de sept
jours ; en cas de téléphone perdu, le bureau coupe l'accès en un clic. La reconnexion autonome par
code reçu par e-mail viendra ensuite, une fois le nom de domaine du club choisi.

#### Ajouts

- Page de connexion : accueil personnalisé (« Bonjour Claire »), bouton « Me connecter sur cet
  appareil », messages clairs pour un lien expiré ou déjà utilisé, conseil si le lien s'ouvre dans
  le navigateur intégré d'une application
- Bureau : « Créer un lien de connexion » depuis un compte ou un responsable, avec « Envoyer sur
  WhatsApp » (directement au numéro du parent) et « Copier le lien »
- « Se déconnecter » dans Mon espace ; « Déconnecter tous ses appareils » pour le bureau
- Lien « Espace membres » en bas de chaque page
- Outil d'installation pour connecter le premier administrateur

#### Modifications

- Seul un administrateur peut créer un lien de connexion pour un membre du bureau
- Supprimer un compte coupe immédiatement tous ses accès
- Mentions légales : cookie de connexion de l'espace membres

## [0.4.0] — 2026-09-24

### Adhérents, responsables légaux et rôles du bureau

#### Notes client

Le site sait désormais qui est responsable de quel enfant. Le bureau peut enregistrer les
adhérents, leurs parents ou tuteurs (deux parents séparés peuvent chacun avoir leur accès), les
personnes autorisées à venir chercher l'enfant, et choisir pour chaque parent s'il peut inscrire
l'enfant, le récupérer et être prévenu. Les membres du bureau reçoivent des rôles (bureau,
trésorier, encadrant, gestion du site). Chaque parent verra uniquement ses propres enfants.
Ces écrans ouvriront aux familles et au bureau avec la connexion au site, prochaine étape.

#### Ajouts

- Espace connecté « Mon espace » : accueil, fiches des adhérents (identité, ceinture, licence,
  adresse), responsables légaux avec leurs droits, personnes autorisées à récupérer l'enfant
- Gestion des comptes : création, modification, suppression, attribution des rôles (réservée à
  l'administrateur ; il reste toujours au moins un administrateur)
- Espace famille : un parent consulte les fiches de ses enfants et met à jour son téléphone
- Saisie guidée sur mobile : messages d'erreur sous chaque champ, noms et téléphones remis en
  forme, proposition de relier un parent déjà connu plutôt que de créer un doublon
- Protection des formulaires contre les envois frauduleux depuis un autre site

#### Modifications

- Un compte peut cumuler plusieurs rôles (le rôle unique « admin » est repris automatiquement)

## [0.3.0] — 2026-09-24

### Tarifs de la saison 2026/2027

#### Notes client

Les tarifs de la saison 2026/2027 sont en ligne : judo (par âge), taïso et yoga, licence France
Judo comprise, avec le détail du paiement en 3 fois, les suppléments (passeport, hors commune) et
la réduction famille. Les horaires des cours suivront dès qu'ils seront confirmés.

#### Ajouts

- Page « Tarifs » : une carte par formule (total, participation, licence, échéancier en 3 fois),
  suppléments et réductions, modes de paiement
- Discipline yoga préparée (présentation à fournir par le club, visible en qualification seulement)

#### Modifications

- Passeport sportif présenté comme recommandé pour les compétiteurs (et non plus obligatoire),
  conformément aux textes officiels France Judo 2026/2027

## [0.2.1] — 2026-09-24

### Menu mobile lisible

#### Notes client

Sur téléphone et sur les écrans étroits, le menu s'affiche de nouveau correctement : les rubriques
apparaissent sur un fond blanc, bien lisibles, au lieu de se superposer à la page.

#### Corrections

- Menu du téléphone : panneau plein écran sur fond blanc (il s'affichait en transparence par-dessus
  la page), marges alignées sur l'en-tête en tablette

## [0.2.0] — 2026-09-23

### Site vitrine du club

#### Notes client

Le nouveau site du club remplace l'ancien site : il présente le club, ses trois disciplines
(judo avec l'éveil judo dès 4 ans, jujitsu, taïso), le code moral du judo, l'équipe, le dojo et
le règlement intérieur. Il est pensé d'abord pour le téléphone : menu simple, gros boutons,
itinéraire vers le dojo en un geste. Le site ne dépose aucun cookie et ne collecte aucune donnée.

#### Ajouts

- Pages Accueil, Disciplines, Horaires et tarifs, Le club, Règlement intérieur, Contact et Mentions légales
- Règlement intérieur mis à jour selon la réglementation France Judo en vigueur (questionnaire de
  santé pour les mineurs, formalités médicales des majeurs, pièces demandées en compétition)
- Mentions légales avec l'identité officielle de l'association
- Horaires, tarifs, coordonnées et partenaires préparés en qualification, publiés dès que le club
  les aura confirmés
- Textes repris de l'ancien site du club ; code moral officiel de France Judo
- Liens d'itinéraire vers le dojo, page Facebook du club, prise de licence France Judo
- Identité visuelle reprise du logo du club (noir, rouge, blanc) ; affiliation France Judo

#### Corrections

- Script de release : la Release GitHub est créée correctement quand un seul artefact est attaché

## [0.1.0] — 2026-09-23

### Initialisation

#### Notes client

Première version du projet : la base technique du futur site du club est en place. Aucune
fonctionnalité n'est encore ouverte aux familles.

#### Ajouts

- Initialisation du projet : workspace (workflows, templates, backlog), socle applicatif
  (Worker Cloudflare, API Hono, base D1, front React), scripts de déploiement et CI GitHub Actions
- Seam d'identité : point unique de résolution de l'utilisateur, prêt pour l'authentification de
  l'application ; utilisateur simulé en développement local
- Mise en place Cloudflare : bases D1 prod et preview hébergées dans l'Union européenne ;
  environnement de qualification verrouillé par Cloudflare Access (accès au site uniquement, sans
  lien avec l'authentification de l'application)

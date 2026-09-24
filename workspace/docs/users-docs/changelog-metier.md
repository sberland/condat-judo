# Changelog métier — Condat Judo

Historique des versions, destiné aux utilisateurs et équipes support.

---

## v0.7.2 — 24 septembre 2026

Un bouton en haut de chaque page mène directement à l'espace membres, y compris sur téléphone
sans ouvrir le menu : « Mon espace » quand on est connecté, « Espace membres » sinon (la page
explique alors comment se connecter). Sur le site de qualification, le badge en bas à droite
indique la version testée et ne masque plus le bas de page.

---

## v0.7.1 — 24 septembre 2026

Les données du site sont désormais sauvegardées chaque nuit en dehors de l'hébergeur, et
systématiquement avant chaque évolution de la base. Les sauvegardes sont chiffrées : seul le
responsable du site détient la clé qui permet de les relire. Elles sont conservées un mois au
jour le jour, puis une par mois pendant un an, et leur restauration a une procédure testée.

---

## v0.7.0 — 24 septembre 2026

Le bureau peut désormais ressaisir sur le site les formulaires d'inscription papier de la saison
2026/2027. Pour chaque adhérent : la formule (proposée d'après l'âge), le montant calculé
automatiquement (passeport, hors commune, réduction famille, paiement en 3 fois), le mode de
paiement, la formalité médicale reçue (sans aucune information de santé), l'autorisation de soins
d'urgence et les consentements (droit à l'image, groupe WhatsApp). Un écran « Dossiers » montre
d'un coup d'œil ce qui manque pour chacun et le total des montants. La ceinture se choisit dans la
liste officielle de France Judo.

---

## v0.6.1 — 24 septembre 2026

Le site de qualification (site de test réservé au bureau) reçoit une copie du site public pour
vérifier chaque nouvelle version. Désormais, cette copie est rendue anonyme à chaque mise à jour :
les noms, coordonnées et dates de naissance des familles et des enfants y sont remplacés par des
valeurs fictives. Seuls les comptes des membres du bureau, qui font les tests, restent inchangés.

---

## v0.6.0 — 24 septembre 2026

L'espace membres a désormais sa propre aide, adaptée à chacun : un parent y trouve comment se
connecter, ce que signifient les droits sur ses enfants et comment corriger une information ; le
bureau y ajoute la saisie des adhérents, des responsables et l'envoi des liens de connexion ;
l'administrateur y trouve en plus la gestion des rôles. Un bouton « Aide » en haut de chaque écran
mène directement à la bonne réponse.

---

## v0.5.1 — 24 septembre 2026

Le yoga figure désormais partout sur le site, au même titre que le judo, le jujitsu et le taïso :
accroche de l'accueil, présentation dans la page Disciplines (séances le lundi et le jeudi), pied
de page et référencement dans les moteurs de recherche. Sur le site de qualification, l'onglet du
navigateur commence par « Qualif » pour ne jamais le confondre avec le site public.

---

## v0.5.0 — 24 septembre 2026

Les familles et le bureau peuvent désormais se connecter au site, sans mot de passe. Le bureau
envoie à chaque adulte un lien personnel sur WhatsApp : un geste suffit, et l'on reste connecté
six mois (chaque visite prolonge ce délai). Un lien ne sert qu'une fois et expire au bout de sept
jours ; en cas de téléphone perdu, le bureau coupe l'accès en un clic. La reconnexion autonome par
code reçu par e-mail viendra ensuite, une fois le nom de domaine du club choisi.

---

## v0.4.0 — 24 septembre 2026

Le site sait désormais qui est responsable de quel enfant. Le bureau peut enregistrer les
adhérents, leurs parents ou tuteurs (deux parents séparés peuvent chacun avoir leur accès), les
personnes autorisées à venir chercher l'enfant, et choisir pour chaque parent s'il peut inscrire
l'enfant, le récupérer et être prévenu. Les membres du bureau reçoivent des rôles (bureau,
trésorier, encadrant, gestion du site). Chaque parent verra uniquement ses propres enfants.
Ces écrans ouvriront aux familles et au bureau avec la connexion au site, prochaine étape.

---

## v0.3.0 — 24 septembre 2026

Les tarifs de la saison 2026/2027 sont en ligne : judo (par âge), taïso et yoga, licence France
Judo comprise, avec le détail du paiement en 3 fois, les suppléments (passeport, hors commune) et
la réduction famille. Les horaires des cours suivront dès qu'ils seront confirmés.

---

## v0.2.1 — 24 septembre 2026

Sur téléphone et sur les écrans étroits, le menu s'affiche de nouveau correctement : les rubriques
apparaissent sur un fond blanc, bien lisibles, au lieu de se superposer à la page.

---

## v0.2.0 — 23 septembre 2026

Le nouveau site du club remplace l'ancien site : il présente le club, ses trois disciplines
(judo avec l'éveil judo dès 4 ans, jujitsu, taïso), le code moral du judo, l'équipe, le dojo et
le règlement intérieur. Il est pensé d'abord pour le téléphone : menu simple, gros boutons,
itinéraire vers le dojo en un geste. Le site ne dépose aucun cookie et ne collecte aucune donnée.

---

## v0.1.0 — 23 septembre 2026

Première version du projet : la base technique du futur site du club est en place. Aucune
fonctionnalité n'est encore ouverte aux familles.

---

*(Alimenté automatiquement par `deploy\prepare-changelog.ps1` lors de la préparation de chaque release)*

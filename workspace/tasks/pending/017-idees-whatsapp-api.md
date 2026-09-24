# 017 — Idées : envoyer des messages WhatsApp depuis le site

> **Proposition exploratoire** (2026-09-24) : des idées, pas un engagement. Probablement hors du
> périmètre du site ; à rouvrir si le besoin se confirme.

## Pourquoi

Les familles vivent sur WhatsApp. Aujourd'hui, le bureau envoie à la main, depuis son propre
téléphone, les liens de connexion (005a) et les annonces. Le site pourrait envoyer lui-même :
lien de connexion personnel, rappel de compétition, confirmation de garderie…

## Idées

1. **Compte WhatsApp du club** : un numéro dédié au club (et non celui d'un bénévole), géré par
   plusieurs membres du bureau.
2. **Envoi depuis le site** (WhatsApp Business Platform / Cloud API de Meta, directement ou via
   un prestataire) :
   - lien de connexion personnel envoyé en un clic depuis l'écran Comptes (remplace « Envoyer
     sur WhatsApp » qui ouvre le téléphone du bureau) ;
   - code de connexion par WhatsApp en alternative au code par e-mail (005b) ;
   - rappels : compétition à laquelle l'enfant est inscrit (009), garderie du mercredi (012).
3. **Agent conversationnel** branché sur le compte du club : répond aux questions courantes des
   parents (horaires, tarifs, « comment me connecter ? ») à partir de l'aide intégrée (016) et
   des contenus du site ; passe la main au bureau sinon.
4. **Groupes** : lien d'invitation au groupe WhatsApp du club envoyé aux seules familles qui ont
   consenti (010a / 006).

## Contraintes connues (à vérifier le moment venu)

- **Numéro dédié** : un numéro utilisé par l'API ne peut plus servir dans l'application WhatsApp
  classique ; il doit pouvoir recevoir un SMS ou un appel de vérification.
- **Compte Meta Business**, nom d'affichage approuvé, politique de confidentialité publiée ;
  vérification de l'entreprise (association) pour dépasser 250 conversations / 24 h.
- **Modèles de messages approuvés par Meta** pour tout message à l'initiative du club (catégories
  authentification, utilitaire, marketing) ; réponse libre seulement dans les 24 h qui suivent un
  message du parent.
- **Coût** : facturation par message depuis juillet 2025 (quelques centimes en Europe pour un
  message d'authentification) ; ordre de grandeur pour ~20 familles : quelques euros par saison,
  à chiffrer. Pas de coût d'accès à l'API elle-même.
- **Consentement** explicite (opt-in) exigé par Meta et par le RGPD ; Meta devient destinataire
  des numéros et des messages (transfert hors UE) → registre des traitements (006).
- **À exclure** : les bibliothèques non officielles qui pilotent un compte WhatsApp « normal »
  (contraires aux conditions de WhatsApp, risque de blocage du numéro).

## Questions ouvertes

- Le club veut-il un numéro dédié (carte SIM, ligne virtuelle) ?
- Budget acceptable par saison ? Prestataire (simplicité) ou API Meta en direct (coût) ?
- Priorité réelle face au code par e-mail (005b), gratuit ?

## Références

- Tarifs de la plateforme : <https://whatsappbusiness.com/products/platform-pricing/>
- Enregistrement d'un numéro : <https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/registration>

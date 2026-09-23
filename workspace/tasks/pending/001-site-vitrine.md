# 001 — Site vitrine public du club

## Pourquoi

Le club n'a aujourd'hui qu'un site Jimdo daté (en partie vide) et une page Facebook. Première
brique du nouveau site : une vitrine publique, moderne et lisible sur téléphone, qui présente le
club et remplace le site Jimdo — avant les fonctionnalités réservées aux familles.

## Quoi

Site public (aucune connexion), **mobile d'abord**, au style des sites grand public : en-tête
fixe avec menu burger sur mobile, grandes zones cliquables, sections aérées, pied de page complet.
Identité visuelle reprise du **logo du club** (noir, rouge, blanc).

Pages :

| Route | Contenu (repris du site Jimdo, textes produits par le club) |
| --- | --- |
| `/` | Accueil : bandeau d'accroche (club de judo, jujitsu et taïso à Condat-sur-Vienne, éveil judo dès 4 ans), disciplines en cartes, extrait du code moral, infos pratiques (dojo, saison), appel à contact |
| `/disciplines` | Judo (dont éveil judo 4-5 ans), jujitsu, taïso — textes du club |
| `/club` | Le club : professeur, bureau, dojo (adresse + itinéraire), code moral complet (France Judo), partenaires, affiliation France Judo, liens utiles |
| `/reglement` | Règlement intérieur complet (sections dépliables) |
| `/contact` | Adresse du dojo + itinéraire, page Facebook, lien de prise de licence France Judo |
| `/mentions-legales` | Éditeur, hébergeur (Cloudflare), données personnelles (aucun cookie, aucun traceur) |

Contenu **non repris** (règle : une section sans donnée n'est pas créée) : horaires, tarifs,
inscriptions, groupes par âge (images seules), yoga et self-défense (titres sans texte),
actualités (renvoi vers Facebook). Aucune photo d'enfant. Liens morts non repris (Comité 87,
Ligue du Limousin).

Technique :

- Front React existant (TanStack Router) : une route par page, titre + description par page.
- Contenu en données TypeScript (`web/src/content/`) — pas de base : rien de dynamique ici.
- Carte : **lien** d'itinéraire (OpenStreetMap / Google Maps), **pas d'intégration** (une carte
  intégrée déposerait des cookies tiers → bandeau de consentement).
- Police auto-hébergée (paquet npm), aucune ressource tierce chargée par le site.
- Logos : club (`/logo-judo-condat.png`, repris du site Jimdo), France Judo blanc (affiliation).

## Critères d'acceptation

- [ ] Les 6 pages s'affichent et se naviguent sans rechargement, liens directs compris
- [ ] Utilisable à 360 px de large (menu burger, pas de défilement horizontal), confortable sur desktop
- [ ] Textes du club repris fidèlement (orthographe corrigée seulement)
- [ ] Aucune ressource tierce chargée (police, carte, images) ; aucun cookie
- [ ] Bandeau « pas la production » toujours visible en preview / local
- [ ] Build, typecheck, tests OK ; prod publique après tag

## Hors périmètre

- Espace membres, connexion, formulaires (contact, inscription) — specs dédiées
- Horaires / tarifs tant que le club ne les a pas fournis
- Nom de domaine personnalisé

## Notes — points à valider (valeurs par défaut appliquées)

| Point | Défaut retenu | À confirmer |
| --- | --- | --- |
| Contact | Page Facebook + adresse du dojo. **L'email personnel du président (visible sur Jimdo) n'est pas publié** sans son accord | Adresse email / téléphone officiels du club ? |
| Noms (professeur, bureau) | Repris : déjà publiés par le club sur Jimdo | OK pour les publier ? |
| Mentions légales | Éditeur « Judo Condat — Condat-sur-Vienne », directeur de publication = président du club, hébergeur Cloudflare | Nom officiel de l'association, siège, n° RNA ? |
| Logo France Judo | Affiché dans le pied de page (« club affilié ») avec lien | Usage de la marque par un club affilié à confirmer auprès de la fédération |
| Horaires, tarifs | Absents (aucune donnée) | Le club peut-il les fournir (IntraMuros, Facebook) ? |
| Partenaire | Sof't Café (Tabac · Presse · Loto · PMU · Librairie · Café, 60 avenue de Limoges) | Toujours partenaire ? |

## Références

- Site actuel : <https://judo-condat.jimdofree.com/>
- Code moral : <https://www.ffjudo.com/le-code-moral-du-judo>
- Expression du besoin : [`expression-besoin.md`](../../docs/spec-fonctionnelle/expression-besoin.md)

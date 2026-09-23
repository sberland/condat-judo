// Contenu du site vitrine (spec 001). Textes produits par le club sur son ancien site
// (judo-condat.jimdofree.com), repris fidèlement — orthographe et ponctuation corrigées.
// Code moral : texte officiel de France Judo (ffjudo.com/le-code-moral-du-judo).
// ⚠️ Dépôt public : n'ajouter ici que des informations que le club publie déjà.

export const CLUB = {
  nom: 'Judo Condat',
  nomComplet: 'Judo Condat-sur-Vienne',
  ville: 'Condat-sur-Vienne',
  dojo: {
    nom: 'Dojo de Condat-sur-Vienne',
    adresse: '9 rue Jules Ferry',
    codePostal: '87920',
    ville: 'Condat-sur-Vienne',
  },
  facebook: 'https://www.facebook.com/p/Judo-Condat-100010470662307/',
} as const

const adresseComplete = `${CLUB.dojo.adresse}, ${CLUB.dojo.codePostal} ${CLUB.dojo.ville}`

// Liens d'itinéraire (pas de carte intégrée : elle déposerait des cookies tiers).
export const ITINERAIRE = {
  adresse: adresseComplete,
  googleMaps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresseComplete)}`,
  openStreetMap: `https://www.openstreetmap.org/search?query=${encodeURIComponent(adresseComplete)}`,
}

export const SAISON = {
  resume: 'De septembre à juin',
  detail:
    'Les cours sont assurés pendant toute la saison sportive, de septembre à juin. Ils ne sont pas assurés pendant les vacances scolaires et les jours fériés.',
}

export const EQUIPE = {
  professeur: { role: 'Professeur', nom: 'Jason Guillot' },
  bureau: [
    { role: 'Président', nom: 'Eric Granet' },
    { role: 'Trésorière', nom: 'Elodie Chambon' },
    { role: 'Secrétaire', nom: 'Catherine Granet' },
  ],
}

export type Discipline = {
  id: 'judo' | 'jujitsu' | 'taiso'
  nom: string
  accroche: string
  public: string
  paragraphes: string[]
  liste?: { intro: string; items: string[] }
  encart?: { titre: string; texte: string }
  conclusion?: string
}

export const DISCIPLINES: Discipline[] = [
  {
    id: 'judo',
    nom: 'Judo',
    accroche: 'Sport d’équilibre, sport éducatif, sport de défense.',
    public: 'Dès 4 ans avec l’éveil judo',
    paragraphes: [
      'Sport d’équilibre, sport éducatif, sport de défense, le judo est adapté à toutes les tranches d’âge.',
      'Véritable sport éducatif, le judo permet à chacun de devenir plus adroit, plus souple, plus fort, mais aussi d’apprendre à respecter des règles, de découvrir l’entraide, d’évaluer ses forces et ses faiblesses pour progresser.',
      'Le judo est un sport pour tous qui procure un véritable équilibre. Activité de détente et de plaisir, le judo est une discipline basée sur l’échange et la progression.',
      'L’apprentissage se fait de manière progressive, en fonction des aptitudes de l’individu, ce qui permet à chacun d’évoluer à son rythme.',
    ],
    encart: {
      titre: 'L’éveil judo, pour les 4-5 ans',
      texte:
        'Une pédagogie adaptée, qui permet le développement physique et intellectuel des très jeunes pratiquants. Le programme éveil judo est délibérément construit autour de l’intérêt de l’enfant, pour faciliter ses futurs apprentissages du judo et des activités sportives et artistiques en général.',
    },
  },
  {
    id: 'jujitsu',
    nom: 'Jujitsu',
    accroche: 'Science, art de la souplesse.',
    public: 'Art martial et self-défense',
    paragraphes: [
      'Le jujitsu vise essentiellement à vaincre un adversaire par tous les moyens, en utilisant le minimum de force. De ce fait, les adeptes du jujitsu doivent se conformer à diverses disciplines.',
    ],
    liste: {
      intro: 'Il leur faut :',
      items: [
        'savoir juger et utiliser la force de l’adversaire ;',
        'esquiver ses attaques le plus possible ;',
        'déséquilibrer l’adversaire ;',
        'savoir attaquer ses points faibles ;',
        'savoir le renverser à l’aide de la technique du levier ;',
        'être capable de l’immobiliser à terre ;',
        'savoir le frapper.',
      ],
    },
    conclusion:
      'Le jujitsu est proposé comme art martial : une véritable méthode de self-défense, efficace et attrayante, qui permet d’améliorer l’ensemble des qualités physiques et mentales.',
  },
  {
    id: 'taiso',
    nom: 'Taïso',
    accroche: 'Un sport en douceur qui accueille tout public.',
    public: 'Tout public',
    paragraphes: [
      'Le taïso se pratique de façon décontractée, dans des tenues amples permettant des mouvements aisés. C’est une excellente solution pour éliminer le stress accumulé pendant la journée, et cela dans une ambiance conviviale.',
      'Véritable échauffement, il permet de garder la forme et d’améliorer sa condition physique. Du petit matériel peut être utilisé : des élastiques, des cerceaux, des bâtons…',
      'Son objectif est de permettre l’entretien et l’amélioration du potentiel de chaque pratiquant, en utilisant des exercices adaptés à l’âge et aux aptitudes de chacun.',
      'Ces exercices améliorent le système cardio-vasculaire et le système respiratoire, le fonctionnement du système neuromusculaire, les qualités musculaires ainsi que les amplitudes articulaires.',
    ],
    conclusion:
      'Exercices d’échauffement précédant une activité physique, mais aussi exercices spécifiques de renforcement musculaire, d’étirement ou de relaxation : le taïso est une méthode accessible à tous, et non réservée aux seuls pratiquants d’arts martiaux.',
  },
]

export type Valeur = { nom: string; definition: string; lignes: string[] }

// Les 8 valeurs du code moral du judo — texte officiel France Judo.
export const CODE_MORAL: Valeur[] = [
  {
    nom: 'Amitié',
    definition: 'C’est partager et évoluer ensemble.',
    lignes: ['S’entraider, progresser, se faire confiance.', 'L’amitié, c’est apprendre ensemble, en se soutenant et en s’amusant.'],
  },
  {
    nom: 'Courage',
    definition: 'C’est dépasser sa peur.',
    lignes: ['Essayer, tomber, recommencer.', 'Le courage, c’est oser même quand on ne sait pas si on va y arriver.'],
  },
  {
    nom: 'Respect',
    definition: 'C’est écouter les autres et les considérer.',
    lignes: [
      'Reconnaître la valeur de chaque personne et ce qu’elle apporte.',
      'Le respect, c’est accepter les différences et reconnaître les efforts.',
    ],
  },
  {
    nom: 'Contrôle de soi',
    definition: 'C’est garder son calme.',
    lignes: ['Respirer, réfléchir, se maîtriser.', 'Se contrôler, c’est choisir la paix pour soi et avec les autres.'],
  },
  {
    nom: 'Honneur',
    definition: 'C’est faire ce que l’on dit.',
    lignes: [
      'Tenir ses promesses, être juste et respecter ses engagements.',
      'L’honneur, c’est faire ce qui est bien, même quand personne ne regarde.',
    ],
  },
  {
    nom: 'Politesse',
    definition: 'C’est dire les mots magiques.',
    lignes: ['Un bonjour, une écoute, un merci.', 'La politesse, c’est prendre soin des autres, sur le tatami comme dans la vie.'],
  },
  {
    nom: 'Sincérité',
    definition: 'C’est dire la vérité.',
    lignes: ['Être honnête, même quand ce n’est pas facile.', 'La sincérité, c’est être soi-même, sans tricher avec les autres.'],
  },
  {
    nom: 'Modestie',
    definition: 'C’est être fier sans se faire remarquer.',
    lignes: [
      'On progresse, on apprend, on s’améliore en gardant les pieds sur terre.',
      'La modestie, c’est rester curieux, et laisser les autres briller aussi.',
    ],
  },
]

export type ArticleReglement = { titre: string; paragraphes?: string[]; liste?: string[]; apresListe?: string }

export const REGLEMENT: ArticleReglement[] = [
  {
    titre: 'Licence',
    paragraphes: ['Le participant doit être licencié à la Fédération française de judo et disciplines associées.'],
  },
  {
    titre: 'Certificat médical',
    paragraphes: [
      'Le certificat médical attestant l’aptitude à la pratique du judo en compétition est obligatoire pour l’inscription. Ce certificat doit être renouvelé chaque année. Si le club n’est pas en possession de ce document, l’accès au tatami sera refusé au pratiquant.',
    ],
  },
  {
    titre: 'Responsabilité des parents',
    paragraphes: ['Les parents sont responsables de leurs enfants :'],
    liste: ['jusqu’à l’arrivée du professeur ;', 'après la fin de la séance d’entraînement.'],
    apresListe:
      'Pour assurer un meilleur déroulement des cours et ne pas déconcentrer les pratiquants, il est demandé aux parents de ne pas assister aux cours, sauf autorisation exceptionnelle du professeur.',
  },
  {
    titre: 'Ponctualité',
    paragraphes: [
      'Les pratiquants doivent arriver à l’heure à leur cours et ne peuvent le quitter sans l’autorisation du professeur.',
      'Les parents ou les représentants légaux des enfants doivent venir chercher les jeunes pratiquants à la fin du cours et avant le début du cours suivant.',
    ],
  },
  {
    titre: 'Tenue',
    liste: [
      'Le pratiquant ne peut pénétrer sur le tatami qu’en kimono.',
      'Port du tee-shirt sous le kimono pour les filles.',
      'Tous les bijoux sont interdits sur les tatamis (montres, bracelets, etc.).',
      'Le pratiquant doit se déplacer dans le dojo et ses abords immédiats en claquettes.',
      'Prévoir une petite bouteille d’eau à déposer au bord des tatamis.',
    ],
  },
  {
    titre: 'Dossier d’inscription',
    paragraphes: ['Le dossier d’inscription se compose :'],
    liste: [
      'd’une fiche de renseignements ;',
      'd’un certificat médical d’aptitude à la pratique du judo en compétition ;',
      'de la licence.',
    ],
  },
  {
    titre: 'Hygiène',
    paragraphes: ['Tous les membres, parents et visiteurs sont tenus de veiller à la propreté générale du dojo :'],
    liste: ['utiliser les poubelles ;', 'ne pas circuler pieds nus dans les locaux ;', 'maintenir propres les abords des tatamis.'],
  },
  {
    titre: 'Animation et compétition',
    paragraphes: ['Les judokas devront être en possession de leur :'],
    liste: ['passeport (obligatoire à partir de poussins) ;', 'certificat médical ;', 'licence en cours.'],
  },
  {
    titre: 'Saison sportive',
    paragraphes: [SAISON.detail],
  },
]

export const PARTENAIRES = [
  {
    nom: 'Sof’t Café',
    activite: 'Tabac · Presse · Loto · PMU · Librairie · Café',
    adresse: '60 avenue de Limoges, 87920 Condat-sur-Vienne',
  },
]

export const LIENS_UTILES = [
  { libelle: 'France Judo', description: 'Fédération française de judo et disciplines associées', url: 'https://www.ffjudo.com/' },
  { libelle: 'Prendre sa licence', description: 'Espace licencié France Judo', url: 'https://moncompte.ffjudo.com/prise-licence' },
  { libelle: 'Passages de grades', description: 'Règles et programmes, France Judo', url: 'https://www.ffjudo.com/passages-de-grades' },
  { libelle: 'Mairie de Condat-sur-Vienne', description: 'Site de la commune', url: 'https://www.condatsurvienne.fr/' },
]

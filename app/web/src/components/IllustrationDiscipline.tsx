// Illustration de chaque discipline (retours vitrine, spec 020) : pictogramme vectoriel maison,
// sans image externe, repris partout où une discipline est évoquée (accueil, page Disciplines,
// horaires, tarifs). Une couleur d'accent par discipline, sur la palette du club.

export type IdDiscipline = 'judo' | 'jujitsu' | 'taiso' | 'yoga'

const COULEURS: Record<IdDiscipline, { fond: string; accent: string }> = {
  judo: { fond: '#fdecec', accent: '#d9161c' },
  jujitsu: { fond: '#eceef4', accent: '#3b4a6b' },
  taiso: { fond: '#fff3e0', accent: '#e07b00' },
  yoga: { fond: '#e5f5ef', accent: '#12876a' },
}

const TRAIT = { fill: 'none', stroke: '#16161a', strokeWidth: 8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/** Discipline d'un cours ou d'une formule d'après son nom (« Judo jeunes », « Yoga — lundi »…). */
export function disciplineDe(texte: string): IdDiscipline | null {
  const t = texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
  if (t.includes('jujitsu') || t.includes('ju-jitsu')) return 'jujitsu'
  if (t.includes('judo')) return 'judo'
  if (t.includes('taiso')) return 'taiso'
  if (t.includes('yoga')) return 'yoga'
  return null
}

export function IllustrationDiscipline({ id, className = 'size-16' }: { id: string; className?: string }) {
  if (!(id in COULEURS)) return null
  const d = id as IdDiscipline
  const { fond, accent } = COULEURS[d]
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-hidden focusable="false">
      <circle cx="60" cy="60" r="58" fill={fond} />
      <path d="M26 106h68" stroke={accent} strokeWidth="5" strokeLinecap="round" opacity="0.35" />
      {d === 'judo' && (
        // Deux judokas face à face, en saisie (kumikata).
        <g>
          <circle cx="38" cy="30" r="8" fill="#16161a" />
          <circle cx="82" cy="30" r="8" fill="#16161a" />
          <path d="M40 42 L44 72 M44 72 L34 102 M44 72 L54 102" {...TRAIT} />
          <path d="M80 42 L76 72 M76 72 L86 102 M76 72 L66 102" {...TRAIT} />
          <path d="M41 50 L60 56 L79 50" {...TRAIT} />
          <path d="M36 70 L52 68" stroke={accent} strokeWidth="6" strokeLinecap="round" />
          <path d="M68 68 L84 70" stroke="#16161a" strokeWidth="6" strokeLinecap="round" opacity="0.55" />
        </g>
      )}
      {d === 'jujitsu' && (
        // Coup de pied haut, garde haute.
        <g>
          <circle cx="40" cy="32" r="8" fill="#16161a" />
          <path d="M43 43 L50 70 M50 70 L44 102 M50 70 L92 50" {...TRAIT} />
          <path d="M45 52 L32 60 M45 52 L58 46" {...TRAIT} />
          <path d="M44 69 L57 66" stroke={accent} strokeWidth="6" strokeLinecap="round" />
          <path d="M98 36 L104 32 M101 46 L108 45 M98 57 L104 61" stroke={accent} strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      {d === 'taiso' && (
        // Flexion, bâton tenu au-dessus de la tête.
        <g>
          <path d="M26 18 L94 18" stroke={accent} strokeWidth="7" strokeLinecap="round" />
          <circle cx="60" cy="38" r="8" fill="#16161a" />
          <path d="M60 49 L60 74" {...TRAIT} />
          <path d="M60 55 L40 41 L36 19 M60 55 L80 41 L84 19" {...TRAIT} />
          <path d="M60 74 L44 86 L42 102 M60 74 L76 86 L78 102" {...TRAIT} />
        </g>
      )}
      {d === 'yoga' && (
        // Posture de l'arbre, mains jointes au-dessus de la tête.
        <g>
          <circle cx="60" cy="40" r="7.5" fill="#16161a" />
          <path d="M60 51 L60 76 L60 102" {...TRAIT} />
          <path d="M60 76 L78 86 L62 92" {...TRAIT} />
          <path d="M60 55 L41 42 L57 15 M60 55 L79 42 L63 15" {...TRAIT} />
          <path d="M22 60 Q18 44 28 34 M98 60 Q102 44 92 34" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
        </g>
      )}
    </svg>
  )
}

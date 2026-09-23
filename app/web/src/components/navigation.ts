import { HORAIRES, TARIFS } from '../content/club'
import { useProvisoireVisible } from './Provisoire'

export type Route =
  | '/'
  | '/disciplines'
  | '/horaires-tarifs'
  | '/club'
  | '/reglement'
  | '/contact'
  | '/mentions-legales'

type Entree = { to: Route; libelle: string; provisoire?: boolean }

const NAVIGATION: Entree[] = [
  { to: '/', libelle: 'Accueil' },
  { to: '/disciplines', libelle: 'Disciplines' },
  // Page entièrement provisoire tant que le club n'a pas fourni horaires et tarifs.
  { to: '/horaires-tarifs', libelle: 'Horaires & tarifs', provisoire: HORAIRES.provisoire && TARIFS.provisoire },
  { to: '/club', libelle: 'Le club' },
  { to: '/reglement', libelle: 'Règlement' },
  { to: '/contact', libelle: 'Contact' },
]

/** Entrées du menu, sans les pages provisoires en production. */
export function useNavigation(): Entree[] {
  const provisoireVisible = useProvisoireVisible()
  return NAVIGATION.filter((e) => !e.provisoire || provisoireVisible)
}

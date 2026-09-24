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

/** Entrées du menu, sans les pages provisoires en production. */
export function useNavigation(): Entree[] {
  const provisoireVisible = useProvisoireVisible()
  const horairesVisibles = !HORAIRES.provisoire || provisoireVisible

  const navigation: Entree[] = [
    { to: '/', libelle: 'Accueil' },
    { to: '/disciplines', libelle: 'Disciplines' },
    // Page provisoire tant que ni horaires ni tarifs ne sont fournis ; « Tarifs » seuls sinon.
    {
      to: '/horaires-tarifs',
      libelle: horairesVisibles ? 'Horaires & tarifs' : 'Tarifs',
      provisoire: HORAIRES.provisoire && TARIFS.provisoire,
    },
    { to: '/club', libelle: 'Le club' },
    { to: '/reglement', libelle: 'Règlement' },
    { to: '/contact', libelle: 'Contact' },
  ]
  return navigation.filter((e) => !e.provisoire || provisoireVisible)
}

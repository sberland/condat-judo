import { HORAIRES, TARIFS } from '../content/club'
import { useMe } from '../lib/api'
import { useProvisoireVisible } from './Provisoire'

export type Route =
  | '/'
  | '/disciplines'
  | '/horaires-tarifs'
  | '/club'
  | '/reglement'
  | '/contact'
  | '/mentions-legales'
  | '/espace'

type Entree = { to: Route; libelle: string; provisoire?: boolean }

/** Entrées du menu, sans les pages provisoires en production ; « Mon espace » si l'utilisateur est reconnu. */
export function useNavigation(): Entree[] {
  const provisoireVisible = useProvisoireVisible()
  const { data: me } = useMe()
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
  if (me?.etat === 'ok') navigation.push({ to: '/espace', libelle: 'Mon espace' })
  return navigation.filter((e) => !e.provisoire || provisoireVisible)
}

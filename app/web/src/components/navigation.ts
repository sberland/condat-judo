import { useReferentiel } from '../lib/saison'
import { useMe } from '../lib/api'
import { useProvisoireVisible } from './Provisoire'

export type Route =
  | '/'
  | '/disciplines'
  | '/horaires-tarifs'
  | '/evenements'
  | '/actualites'
  | '/club'
  | '/reglement'
  | '/contact'
  | '/mentions-legales'
  | '/espace'

type Entree = { to: Route; libelle: string; provisoire?: boolean }

/**
 * Accès à l'espace membres (bouton de l'en-tête, lien du pied de page) : « Mon espace » si
 * l'utilisateur est reconnu, sinon « Espace membres » vers la page de connexion.
 */
export function useAccesEspace(): { to: '/espace' | '/connexion'; libelle: string; connecte: boolean } {
  const { data: me } = useMe()
  return me?.etat === 'ok'
    ? { to: '/espace', libelle: 'Mon espace', connecte: true }
    : { to: '/connexion', libelle: 'Espace membres', connecte: false }
}

/** Entrées du menu (pages publiques), sans les pages provisoires en production. */
export function useNavigation(): Entree[] {
  const provisoireVisible = useProvisoireVisible()
  // Référentiel pas encore chargé : on n'annonce pas d'horaires (« Tarifs »).
  const r = useReferentiel()
  const horairesProvisoires = r?.horaires.provisoire ?? true
  const tarifsProvisoires = r?.tarifs.provisoire ?? false
  const horairesVisibles = !horairesProvisoires || provisoireVisible

  const navigation: Entree[] = [
    { to: '/', libelle: 'Accueil' },
    { to: '/club', libelle: 'Le club' },
    { to: '/disciplines', libelle: 'Disciplines' },
    // Page provisoire tant que ni horaires ni tarifs ne sont fournis ; « Tarifs » seuls sinon.
    {
      to: '/horaires-tarifs',
      libelle: horairesVisibles ? 'Horaires & tarifs' : 'Tarifs',
      provisoire: horairesProvisoires && tarifsProvisoires,
    },
    { to: '/evenements', libelle: 'Événements' },
    { to: '/reglement', libelle: 'Règlement' },
    { to: '/contact', libelle: 'Contact' },
  ]
  return navigation.filter((e) => !e.provisoire || provisoireVisible)
}

export type Route = '/' | '/disciplines' | '/club' | '/reglement' | '/contact' | '/mentions-legales'

export const NAVIGATION: { to: Route; libelle: string }[] = [
  { to: '/', libelle: 'Accueil' },
  { to: '/disciplines', libelle: 'Disciplines' },
  { to: '/club', libelle: 'Le club' },
  { to: '/reglement', libelle: 'Règlement' },
  { to: '/contact', libelle: 'Contact' },
]

import type { Formule } from '../content/tarifs'

/** Total d'une formule (participation + licence), en centimes. */
export const totalFormule = (f: Formule): number => f.participation + f.licence

/** Montant en euros, à la française : « 128 € », « 75,20 € » (centimes affichés seulement s'il y en a). */
export function euros(centimes: number): string {
  const valeur = centimes / 100
  const texte = Number.isInteger(valeur)
    ? String(valeur)
    : valeur.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${texte} €`
}

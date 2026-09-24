// Export CSV « à la française » (séparateur ;) — ouvert tel quel par Excel ou LibreOffice.
// Généré dans le navigateur : rien n'est stocké côté serveur.

/** Tableau (première ligne = en-têtes) → CSV ; guillemets doublés si besoin, fins de ligne CRLF. */
export function versCsv(lignes: string[][]): string {
  const cellule = (v: string) => (/[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  return lignes.map((cols) => cols.map(cellule).join(';')).join('\r\n')
}

/** Tableau → texte à coller dans un tableur (tabulations, espaces normalisés). */
export function versTexte(lignes: string[][]): string {
  return lignes.map((cols) => cols.map((v) => v.replace(/\s+/g, ' ')).join('\t')).join('\n')
}

/** « Tournoi de l’Épée — Limoges » → « tournoi-de-l-epee-limoges » (noms de fichiers). */
export const slug = (texte: string) =>
  texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** Téléchargement (BOM pour que les accents s'affichent sous Excel). */
export function telechargerCsv(nomFichier: string, lignes: string[][]): void {
  const url = URL.createObjectURL(new Blob([String.fromCharCode(0xfeff), versCsv(lignes)], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nomFichier
  a.click()
  URL.revokeObjectURL(url)
}

import { describe, expect, it } from 'vitest'
import { REFERENTIEL_2026_2027 } from '../content/referentiel-initial'
import { etatInscriptions, heureFr, libelleCriteres, libelleParticipants, messageWhatsApp, nomFichierCsv, versCsv, versTexte, type CompetitionDetail, type LigneInscrit } from './competitions'

const ligne = (p: Partial<LigneInscrit> = {}): LigneInscrit => ({
  id: 1,
  prenom: 'Léa',
  nom: 'Dev',
  date_naissance: '2017-03-12',
  sexe: 'F',
  categorie: 'Poussins',
  grade: 'Jaune',
  numero_licence: null,
  inscrit_le: null,
  inscrit_par: null,
  ressaisi_le: null,
  alertes: [],
  ...p,
})

const competition = (p: Partial<CompetitionDetail> = {}): CompetitionDetail => ({
  id: 1,
  type: 'competition',
  inscription: 'enfants',
  nom: 'Tournoi',
  date: '2026-10-14',
  heure: null,
  lieu: 'Limoges',
  adresse: null,
  lien_officiel: null,
  infos: null,
  categories: ['poussins'],
  sexe: null,
  date_limite: '2026-10-04',
  statut: 'ouverte',
  inscriptionsOuvertes: true,
  ...p,
})

describe('libelleCriteres', () => {
  it('suit l’ordre de la table officielle, quel que soit l’ordre saisi', () => {
    expect(libelleCriteres({ categories: ['benjamins', 'mini-poussins', 'poussins'], sexe: null }, REFERENTIEL_2026_2027.categories)).toBe('Mini-poussins, Poussins, Benjamins')
  })
  it('précise le sexe d’une compétition non mixte', () => {
    expect(libelleCriteres({ categories: ['minimes'], sexe: 'F' }, REFERENTIEL_2026_2027.categories)).toBe('Minimes · filles')
    expect(libelleCriteres({ categories: ['minimes'], sexe: 'M' }, REFERENTIEL_2026_2027.categories)).toBe('Minimes · garçons')
  })
})

describe('etatInscriptions', () => {
  it('annulée prime sur tout', () => {
    expect(etatInscriptions(competition({ statut: 'annulee' })).ton).toBe('annule')
  })
  it('ouverte : date limite sans l’année', () => {
    expect(etatInscriptions(competition())).toEqual({ libelle: 'Inscriptions jusqu’au dimanche 4 octobre inclus', ton: 'ouvert' })
  })
  it('close après la date limite ou une fois clôturée', () => {
    expect(etatInscriptions(competition({ inscriptionsOuvertes: false })).ton).toBe('ferme')
  })
})

describe('liste des inscrits', () => {
  it('texte à coller : en-têtes puis une ligne par inscrit, séparés par des tabulations', () => {
    expect(versTexte([ligne(), ligne({ prenom: 'Hugo', sexe: 'M', numero_licence: 'M123' })]).split('\n')).toEqual([
      'Nom\tPrénom\tDate de naissance\tSexe\tCatégorie\tCeinture\tN° de licence',
      'Dev\tLéa\t12/03/2017\tF\tPoussins\tJaune\t',
      'Dev\tHugo\t12/03/2017\tM\tPoussins\tJaune\tM123',
    ])
  })
  it('CSV : point-virgule, guillemets doublés si besoin', () => {
    const csv = versCsv([ligne({ nom: 'Dupont; "dit" Jo' })]).split('\r\n')
    expect(csv[0]).toBe('Nom;Prénom;Date de naissance;Sexe;Catégorie;Ceinture;N° de licence')
    expect(csv[1]).toBe('"Dupont; ""dit"" Jo";Léa;12/03/2017;F;Poussins;Jaune;')
  })
  it('nom de fichier sans accent ni espace', () => {
    expect(nomFichierCsv({ date: '2026-10-14', nom: 'Tournoi de l’Épée — Limoges' })).toBe('inscrits-2026-10-14-tournoi-de-l-epee-limoges.csv')
  })
})

describe('événements (spec 021)', () => {
  it('aucune catégorie : tous les enfants', () => {
    expect(libelleCriteres({ categories: [], sexe: null }, REFERENTIEL_2026_2027.categories)).toBe('Tous les enfants')
  })
  it('participants et heures en français', () => {
    expect(libelleParticipants({ adultes: 2, enfants: 1 })).toBe('2 adultes et 1 enfant')
    expect(libelleParticipants({ adultes: 0, enfants: 3 })).toBe('3 enfants')
    expect(heureFr('19:00')).toBe('19 h')
    expect(heureFr('09:30')).toBe('9 h 30')
  })
  it('sans inscription, et message WhatsApp d’un repas', () => {
    const repas = competition({ type: 'repas', inscription: 'famille', nom: 'Repas du club', heure: '19:30', date: '2026-12-12', date_limite: '2026-12-05' })
    expect(etatInscriptions({ ...repas, inscription: 'aucune' }).libelle).toBe('Sans inscription')
    const m = messageWhatsApp(repas, 'https://exemple.test/evenements/1', REFERENTIEL_2026_2027.categories)
    expect(m).toContain('à 19 h 30')
    expect(m).toContain('Inscrivez votre famille')
    expect(m).not.toContain('Pour :')
  })
})

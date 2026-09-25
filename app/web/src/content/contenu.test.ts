import { describe, expect, it } from 'vitest'
import { DEFINITIONS, iconeArticle, itineraire, validerChamps, validerContenu } from './contenu'
import { CONTENU_INITIAL } from './contenu-initial'

describe('validation du contenu du site', () => {
  it('le contenu initial est valide, inchangé par la validation', () => {
    for (const cle of Object.keys(DEFINITIONS) as (keyof typeof DEFINITIONS)[]) {
      expect(validerContenu(cle, CONTENU_INITIAL[cle]), cle).toEqual({ ok: true, valeur: CONTENU_INITIAL[cle] })
    }
  })

  it('nettoie les espaces, refuse les champs obligatoires vides, e-mail et téléphone invalides', () => {
    const r = validerContenu('contact', { email: '  pas-un-email ', telephone: '' })
    expect(r).toEqual({ ok: false, erreurs: { email: 'E-mail invalide', telephone: 'Obligatoire' } })
    expect(validerContenu('contact', { email: ' club@exemple.fr ', telephone: '05  55 00 00 00' })).toEqual({
      ok: true,
      valeur: { email: 'club@exemple.fr', telephone: '05 55 00 00 00' },
    })
  })

  it('exige des adresses web en https, et indexe les erreurs de liste par chemin', () => {
    const r = validerContenu('liens', { liens: [{ libelle: 'A', description: 'B', url: 'https://ok.fr' }, { libelle: '', description: 'B', url: 'http://non.fr' }] })
    expect(r).toEqual({ ok: false, erreurs: { 'liens.1.libelle': 'Obligatoire', 'liens.1.url': 'Adresse web invalide (https://…)' } })
  })

  it('ignore les champs inconnus ; un objet facultatif vide disparaît ; les listes de textes sont nettoyées', () => {
    const erreurs = {}
    const d = validerChamps(DEFINITIONS.disciplines.champs, {
      disciplines: [
        {
          id: 'judo',
          nom: 'Judo',
          accroche: 'A',
          enBref: 'B',
          public: 'C',
          paragraphes: [' Un ', '', '  '],
          encart: { titre: '', texte: '' },
          pirate: '<script>',
          provisoire: 'oui',
        },
      ],
    }, erreurs)
    expect(erreurs).toEqual({})
    expect(d).toEqual({ disciplines: [{ id: 'judo', nom: 'Judo', accroche: 'A', enBref: 'B', public: 'C', paragraphes: ['Un'] }] })
  })

  it('refuse un identifiant de liste fixe invalide', () => {
    const r = validerContenu('disciplines', { disciplines: [{ id: 'Judo !', nom: 'J', accroche: 'A', enBref: 'B', public: 'C', paragraphes: ['P'] }] })
    expect(r.ok).toBe(false)
  })

  it('itinéraire depuis l’adresse du dojo', () => {
    expect(itineraire(CONTENU_INITIAL.club).adresse).toBe('9 rue Jules Ferry, 87920 Condat-sur-Vienne')
    expect(itineraire(CONTENU_INITIAL.club).googleMaps).toContain('9%20rue%20Jules%20Ferry')
  })
})

describe('icônes du règlement (spec 022)', () => {
  it('chaque article initial a une icône déduite de son titre, jamais « autre »', () => {
    for (const a of CONTENU_INITIAL.reglement.articles) expect(iconeArticle(a), a.titre).not.toBe('autre')
  })
  it('le choix du club prime, un titre inconnu donne « autre »', () => {
    expect(iconeArticle({ titre: 'Licence', icone: 'image' })).toBe('image')
    expect(iconeArticle({ titre: 'Divers' })).toBe('autre')
    expect(iconeArticle({ titre: 'Hygiène et sécurité' })).toBe('hygiene')
  })
  it('valide l’icône choisie', () => {
    const article = { titre: 'Tenue', paragraphes: ['Judogi obligatoire.'] }
    const base = { miseAJour: 'septembre 2026', sources: [] }
    expect(validerContenu('reglement', { ...base, articles: [{ ...article, icone: 'tenue' }] }).ok).toBe(true)
    expect(validerContenu('reglement', { ...base, articles: [{ ...article, icone: 'licorne' }] })).toEqual({ ok: false, erreurs: { 'articles.0.icone': 'Valeur inconnue' } })
  })
})

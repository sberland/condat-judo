import { describe, expect, it } from 'vitest'
import { validerDossierFamille } from './validation'
import { REFERENTIEL_2026_2027 } from '../../web/src/content/referentiel-initial'

const T = REFERENTIEL_2026_2027.tarifs

const COMPLET = {
  formule: 'judo-poussins-juniors',
  passeport: true,
  paiement_mode: 'cheque',
  paiement_3_fois: true,
  sante: 'attestation',
  soins_urgence: 'oui',
  droit_image: 'non',
  whatsapp: 'oui',
  photo_garderie: 'oui',
  engagements: true,
  adresse: ' 1  rue du Dojo ',
  code_postal: '87920',
  ville: 'Condat-sur-Vienne',
}

describe('dossier envoyé par la famille (spec 010b)', () => {
  it('accepte un dossier complet et normalise la saisie', () => {
    const r = validerDossierFamille(COMPLET, T, true)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.valeur).toMatchObject({ passeport: 1, paiement_3_fois: 1, adresse: '1 rue du Dojo', soins_urgence: 'oui', photo_garderie: 'oui' })
  })

  it('exige une réponse explicite à chaque consentement : jamais « non recueilli »', () => {
    const r = validerDossierFamille({ ...COMPLET, droit_image: 'non_recueilli', whatsapp: undefined }, T, true)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.erreurs).sort()).toEqual(['droit_image', 'whatsapp'])
  })

  it('majeur : ni soins d’urgence ni photo pour la garderie', () => {
    const r = validerDossierFamille({ ...COMPLET, formule: 'judo-adulte', soins_urgence: undefined, photo_garderie: undefined }, T, false)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.valeur).toMatchObject({ soins_urgence: 'non_recueilli', photo_garderie: 'non_recueilli' })
  })

  it('refuse sans engagements, formule, paiement, formalité ni adresse', () => {
    const r = validerDossierFamille(
      { ...COMPLET, engagements: 'oui', formule: 'inconnue', paiement_mode: 'bitcoin', sante: '', adresse: '', code_postal: '8792', ville: '' },
      T,
      true,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.erreurs).sort()).toEqual(['adresse', 'code_postal', 'engagements', 'formule', 'paiement_mode', 'sante', 'ville'])
  })
})

import { useState, type FormEvent } from 'react'
import { MODES_ENCAISSEMENT, repartir, type ModeEncaissement } from '../../content/paiements'
import { appel, ErreurApi } from '../../lib/api'
import { lireEuros, saisieEuros, type DossierTresorerie } from '../../lib/paiements'
import { euros } from '../../lib/tarifs'
import { Alerte, Bouton, Champ, Selection } from '../formulaire'

const aujourdhui = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' })
const AVEC_REFERENCE: ModeEncaissement[] = ['cheque', 'cheques_vacances', 'virement', 'autre']
const OPTIONS_MODE = (Object.keys(MODES_ENCAISSEMENT) as ModeEncaissement[]).map((m) => ({ valeur: m, libelle: MODES_ENCAISSEMENT[m] }))

/**
 * Enregistrer ce que la famille remet : un montant, réparti automatiquement sur les dossiers des
 * enfants au prorata de leur restant dû (répartition modifiable). Pensé pour le téléphone : les
 * valeurs par défaut (restant dû, chèque, reçu aujourd'hui) suffisent le plus souvent.
 */
export function FormulairePaiement({ dossiers, onEnregistre }: { dossiers: DossierTresorerie[]; onEnregistre: () => Promise<void> }) {
  const restantTotal = dossiers.reduce((s, d) => s + d.restant, 0)
  const [montant, setMontant] = useState(restantTotal > 0 ? saisieEuros(restantTotal) : '')
  const [mode, setMode] = useState<ModeEncaissement | ''>('cheque')
  const [reference, setReference] = useState('')
  const [recuLe, setRecuLe] = useState(aujourdhui())
  const [encaisserLe, setEncaisserLe] = useState('')
  const [partsManuelles, setPartsManuelles] = useState<Record<number, string> | null>(null)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  const centimes = lireEuros(montant)
  const auto = repartir(centimes ?? 0, dossiers.map((d) => d.restant))
  const parts = dossiers.map((d, i) => ({
    adhesion_id: d.adhesion_id,
    montant: partsManuelles ? (lireEuros(partsManuelles[d.adhesion_id] ?? '') ?? 0) : (auto[i] ?? 0),
  }))
  const sommeParts = parts.reduce((s, p) => s + p.montant, 0)
  const ecart = centimes !== null && dossiers.length > 1 && sommeParts !== centimes

  async function enregistrer(ev: FormEvent) {
    ev.preventDefault()
    setErreurs({})
    setErreur('')
    if (centimes === null) return setErreurs({ montant: 'Montant invalide (ex. 130 ou 45,50)' })
    if (!mode) return setErreurs({ mode: 'Mode de paiement obligatoire' })
    if (ecart) return setErreurs({ parts: `La répartition fait ${euros(sommeParts)} pour un paiement de ${euros(centimes)}` })
    setEnCours(true)
    try {
      await appel('POST', '/api/tresorerie/paiements', {
        paiements: [
          {
            montant: centimes,
            mode,
            reference: AVEC_REFERENCE.includes(mode) ? reference : '',
            recu_le: recuLe,
            encaisser_le: mode === 'cheque' ? encaisserLe : '',
            parts: parts.filter((p) => p.montant > 0),
          },
        ],
      })
      await onEnregistre()
    } catch (err) {
      if (err instanceof ErreurApi) {
        setErreurs(err.erreurs)
        setErreur(Object.keys(err.erreurs).length ? 'Vérifiez les champs signalés.' : err.message)
      } else setErreur('Enregistrement impossible.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <form onSubmit={enregistrer} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ
          id="paiement-montant"
          libelle="Montant (€)"
          valeur={montant}
          onChange={(v) => {
            setMontant(v)
            setPartsManuelles(null)
          }}
          inputMode="decimal"
          erreur={erreurs.montant}
          requis
        />
        <Selection id="paiement-mode" libelle="Mode" valeur={mode} options={OPTIONS_MODE} onChange={setMode} erreur={erreurs.mode} requis />
      </div>
      {mode && AVEC_REFERENCE.includes(mode) && (
        <Champ
          id="paiement-reference"
          libelle="Référence"
          valeur={reference}
          onChange={setReference}
          aide={mode === 'cheque' ? 'N° du chèque et banque.' : undefined}
          erreur={erreurs.reference}
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ id="paiement-recu" libelle="Reçu le" type="date" valeur={recuLe} onChange={setRecuLe} erreur={erreurs.recu_le} requis />
        {mode === 'cheque' && (
          <Champ
            id="paiement-encaisser"
            libelle="À encaisser le"
            type="date"
            valeur={encaisserLe}
            onChange={setEncaisserLe}
            erreur={erreurs.encaisser_le}
            aide="Seulement pour un chèque à encaisser plus tard."
          />
        )}
      </div>

      {dossiers.length > 1 && (
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-sm font-semibold">Répartition entre les enfants</legend>
          {dossiers.map((d, i) => (
            <label key={d.adhesion_id} htmlFor={`paiement-part-${d.adhesion_id}`} className="flex items-center gap-3">
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{d.prenom}</span>
                <span className="block text-sm text-muted-foreground">reste {euros(d.restant)}</span>
              </span>
              <input
                id={`paiement-part-${d.adhesion_id}`}
                inputMode="decimal"
                value={partsManuelles ? (partsManuelles[d.adhesion_id] ?? '') : saisieEuros(auto[i] ?? 0)}
                onChange={(e) =>
                  setPartsManuelles({
                    ...Object.fromEntries(dossiers.map((x, j) => [x.adhesion_id, saisieEuros(auto[j] ?? 0)])),
                    ...partsManuelles,
                    [d.adhesion_id]: e.target.value,
                  })
                }
                className="min-h-12 w-28 rounded-xl border bg-white px-3 text-right text-base outline-none focus:border-brand"
                aria-label={`Part de ${d.prenom} (€)`}
              />
            </label>
          ))}
          {(ecart || erreurs.parts) && (
            <p className="text-sm font-medium text-brand">
              {erreurs.parts ?? `La répartition fait ${euros(sommeParts)} pour un paiement de ${euros(centimes ?? 0)}.`}
            </p>
          )}
        </fieldset>
      )}

      <Alerte>{erreur}</Alerte>
      <div>
        <Bouton type="submit" enCours={enCours}>
          Enregistrer le paiement
        </Bouton>
      </div>
    </form>
  )
}

/**
 * Paiement en 3 fois : les 3 chèques d'un dossier, remis ensemble à l'inscription, enregistrés en
 * une fois avec leurs dates d'encaissement (le 1er tout de suite, les suivants aux échéances).
 */
export function TroisCheques({
  dossier: d,
  dates,
  onEnregistre,
  onAnnule,
}: {
  dossier: DossierTresorerie
  dates: [string, string]
  onEnregistre: () => Promise<void>
  onAnnule: () => void
}) {
  const montants = [d.echeance_1, d.echeance_2, d.echeance_3]
  const [references, setReferences] = useState(['', '', ''])
  const [encaisser, setEncaisser] = useState(['', dates[0], dates[1]])
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  async function enregistrer(ev: FormEvent) {
    ev.preventDefault()
    setEnCours(true)
    setErreur('')
    try {
      await appel('POST', '/api/tresorerie/paiements', {
        paiements: montants.map((montant, i) => ({
          montant,
          mode: 'cheque',
          reference: references[i],
          recu_le: aujourdhui(),
          encaisser_le: encaisser[i],
          parts: [{ adhesion_id: d.adhesion_id, montant }],
        })),
      })
      await onEnregistre()
    } catch (err) {
      setErreur(err instanceof ErreurApi ? (Object.values(err.erreurs)[0] ?? err.message) : 'Enregistrement impossible.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <form onSubmit={enregistrer} className="grid gap-4" noValidate>
      {montants.map((m, i) => (
        <div key={i} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[auto_1fr_1fr] sm:items-end">
          <p className="font-semibold sm:pb-3">
            Chèque {i + 1} · {euros(m)}
          </p>
          <Champ
            id={`cheques-${d.adhesion_id}-ref-${i}`}
            libelle="N° et banque"
            valeur={references[i] ?? ''}
            onChange={(v) => setReferences(references.map((r, j) => (j === i ? v : r)))}
          />
          <Champ
            id={`cheques-${d.adhesion_id}-date-${i}`}
            libelle="À encaisser le"
            type="date"
            valeur={encaisser[i] ?? ''}
            onChange={(v) => setEncaisser(encaisser.map((x, j) => (j === i ? v : x)))}
          />
        </div>
      ))}
      <Alerte>{erreur}</Alerte>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Bouton type="submit" enCours={enCours}>
          Enregistrer les 3 chèques
        </Bouton>
        <Bouton variante="secondaire" onClick={onAnnule}>
          Annuler
        </Bouton>
      </div>
    </form>
  )
}

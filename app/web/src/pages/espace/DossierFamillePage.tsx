import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, CircleCheck, Send } from 'lucide-react'
import { Bloc, Espace } from '../../components/espace/Garde'
import { Alerte, Bouton, Case, Champ, Selection } from '../../components/formulaire'
import {
  calculerMontant,
  CEINTURES,
  FORMALITES,
  formuleParId,
  horsCommuneSuggere,
  INFORMATION_ASSURANCE,
  MODES_PAIEMENT,
  passeportPossible,
  RECUEILS,
  type ModePaiement,
  type Recueil,
} from '../../content/adhesion'
import type { Tarifs } from '../../content/tarifs'
import type { Echeances } from '../../content/paiements'
import { appel, dateFr, ErreurApi, QUALITES } from '../../lib/api'
import {
  ecrireBrouillon,
  lireBrouillon,
  saisieInitiale,
  statutFamille,
  type AdherentInscription,
  type DossierFamille,
  type SaisieFamille,
} from '../../lib/inscriptions'
import { euros } from '../../lib/tarifs'
import { useInscriptions } from './InscriptionsPage'

// Dossier d'adhésion rempli par la famille (spec 010b), étape par étape sur mobile. Le Worker
// recalcule et fige le montant ; l'écran en montre une estimation. Brouillon gardé sur le
// téléphone jusqu'à l'envoi.

const ETAPES = ['Adhérent', 'Activité', 'Paiement', 'Santé', 'Autorisations', 'Engagements', 'Envoi'] as const

/** Étape de chaque champ, pour y ramener la famille si le serveur le refuse. */
const ETAPE_DU_CHAMP: Record<string, number> = {
  adresse: 0,
  code_postal: 0,
  ville: 0,
  formule: 1,
  paiement_mode: 2,
  sante: 3,
  soins_urgence: 4,
  droit_image: 4,
  whatsapp: 4,
  photo_garderie: 4,
  engagements: 5,
}

type Saison = { id: string; libelle: string; tarifs: Tarifs; echeances3Fois: Echeances }

export function DossierFamillePage() {
  const { id } = useParams({ from: '/espace/inscriptions/$id' })
  const { data, isPending, isError } = useInscriptions()
  const a = data?.adherents.find((x) => x.adherent.id === Number(id))
  const titre = a ? `Dossier de ${a.adherent.prenom}` : 'Dossier d’inscription'

  return (
    <Espace titre={titre} retour={{ to: '/espace/inscriptions', libelle: 'Inscriptions' }} aide="inscriptions">
      {() => {
        if (isPending) return <p className="text-muted-foreground">Chargement…</p>
        if (isError || !data) return <Alerte>Impossible de charger le dossier.</Alerte>
        if (!data.saison) return <Alerte>Les inscriptions en ligne ne sont pas ouvertes.</Alerte>
        if (!a) return <Alerte>Vous ne pouvez pas remplir le dossier de cet adhérent.</Alerte>
        return a.modifiable ? (
          <Assistant key={a.adherent.id} saison={data.saison} a={a} suivants={data.adherents.filter((x) => !x.dossier && x.adherent.id !== a.adherent.id)} />
        ) : (
          <Consultation saison={data.saison} a={a} />
        )
      }}
    </Espace>
  )
}

function Assistant({ saison, a, suivants }: { saison: Saison; a: AdherentInscription; suivants: AdherentInscription[] }) {
  const client = useQueryClient()
  const [etape, setEtape] = useState(0)
  const [s, setS] = useState<SaisieFamille>(() => lireBrouillon(saison.id, a.adherent.id) ?? saisieInitiale(a))
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [envoye, setEnvoye] = useState(false)
  const haut = useRef<HTMLDivElement>(null)
  const { tarifs } = saison
  const prenom = a.adherent.prenom

  useEffect(() => {
    if (!envoye) ecrireBrouillon(saison.id, a.adherent.id, s)
  }, [s, envoye, saison.id, a.adherent.id])

  const maj = <K extends keyof SaisieFamille>(champ: K) => (v: SaisieFamille[K]) => {
    setS((p) => ({ ...p, [champ]: v }))
    setMessage('')
    setErreurs((e) => {
      const { [champ]: _, ...reste } = e
      return reste
    })
  }
  const aller = (n: number) => {
    setEtape(n)
    setMessage('')
    haut.current?.scrollIntoView({ block: 'start' })
  }

  /** Contrôles de l'étape avant d'avancer (le serveur revérifie tout à l'envoi). */
  function controler(n: number): Record<string, string> {
    const e: Record<string, string> = {}
    if (n === 0) {
      if (!s.adresse.trim()) e.adresse = 'Adresse obligatoire'
      if (!/^\d{5}$/.test(s.code_postal.trim())) e.code_postal = 'Code postal à 5 chiffres'
      if (!s.ville.trim()) e.ville = 'Ville obligatoire'
    }
    if (n === 1 && !formuleParId(tarifs, s.formule)) e.formule = 'Choisissez une formule'
    if (n === 2 && !s.paiement_mode) e.paiement_mode = 'Choisissez un mode de paiement'
    if (n === 3 && !s.sante) e.sante = 'Choisissez une réponse'
    if (n === 4) {
      const champs = [...(a.mineur ? (['soins_urgence', 'photo_garderie'] as const) : []), 'droit_image', 'whatsapp'] as const
      for (const c of champs) if (!s[c]) e[c] = 'Répondez oui ou non'
    }
    if (n === 5 && !(s.reglement && s.assurance && s.donnees)) e.engagements = 'Cochez les trois engagements'
    return e
  }

  function suivant() {
    const e = controler(etape)
    setErreurs(e)
    if (Object.keys(e).length) {
      setMessage('Complétez cette étape pour continuer.')
      return
    }
    aller(etape + 1)
  }

  async function envoyer() {
    setEnCours(true)
    setMessage('')
    setErreurs({})
    try {
      await appel('PUT', `/api/famille/inscriptions/${a.adherent.id}`, {
        ...s,
        passeport: s.passeport && passeportPossible(tarifs, s.formule),
        engagements: s.reglement && s.assurance && s.donnees,
      })
      ecrireBrouillon(saison.id, a.adherent.id, null)
      setEnvoye(true)
      await client.invalidateQueries({ queryKey: ['famille'] })
      haut.current?.scrollIntoView({ block: 'start' })
    } catch (err) {
      if (err instanceof ErreurApi && Object.keys(err.erreurs).length) {
        setErreurs(err.erreurs)
        const premiere = Math.min(...Object.keys(err.erreurs).map((c) => ETAPE_DU_CHAMP[c] ?? ETAPES.length - 1))
        aller(premiere)
        setMessage('Vérifiez les réponses signalées.')
      } else setMessage(err instanceof ErreurApi ? err.message : 'Envoi impossible, réessayez.')
    } finally {
      setEnCours(false)
    }
  }

  if (envoye) {
    const suivant = suivants[0]
    return (
      <div ref={haut} className="grid gap-4">
        <section className="grid gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <p className="flex items-center gap-2 text-lg font-bold">
            <CircleCheck className="size-6" aria-hidden /> Dossier de {prenom} envoyé
          </p>
          <p>
            Le bureau va le vérifier. Vous pouvez encore le modifier tant qu’il n’est pas validé.
            {s.sante === 'certificat' && ' Pensez à remettre le certificat médical au club.'}
          </p>
        </section>
        <div className="flex flex-col gap-3 sm:flex-row">
          {suivant && (
            <Link
              to="/espace/inscriptions/$id"
              params={{ id: String(suivant.adherent.id) }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand px-5 font-semibold text-white hover:bg-brand-dark"
            >
              Dossier de {suivant.adherent.prenom} <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
          <Link to="/espace/inscriptions" className="inline-flex min-h-12 items-center justify-center rounded-full border bg-white px-5 font-semibold hover:border-brand/40 hover:text-brand">
            Retour aux inscriptions
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div ref={haut} className="grid scroll-mt-24 gap-5">
      <Progression etape={etape} />
      {a.dossier?.envoye_le && etape === 0 && (
        <p className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          Dossier envoyé le {dateFr(a.dossier.envoye_le.slice(0, 10))}, pas encore validé : vous pouvez le modifier et le renvoyer.
        </p>
      )}

      {etape === 0 && <EtapeAdherent a={a} s={s} maj={maj} erreurs={erreurs} />}
      {etape === 1 && <EtapeActivite a={a} tarifs={tarifs} s={s} maj={maj} erreurs={erreurs} />}
      {etape === 2 && <EtapePaiement saison={saison} s={s} maj={maj} erreurs={erreurs} />}
      {etape === 3 && <EtapeSante a={a} s={s} maj={maj} erreurs={erreurs} />}
      {etape === 4 && <EtapeAutorisations a={a} s={s} maj={maj} erreurs={erreurs} />}
      {etape === 5 && <EtapeEngagements s={s} maj={maj} erreurs={erreurs} />}
      {etape === 6 && <Recapitulatif a={a} tarifs={tarifs} s={s} aller={aller} />}

      <Alerte>{message}</Alerte>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {etape > 0 ? (
          <Bouton variante="secondaire" onClick={() => aller(etape - 1)}>
            <ArrowLeft className="size-4" aria-hidden /> Retour
          </Bouton>
        ) : (
          <span />
        )}
        {etape < ETAPES.length - 1 ? (
          <Bouton onClick={suivant}>
            Suivant <ArrowRight className="size-4" aria-hidden />
          </Bouton>
        ) : (
          <Bouton enCours={enCours} onClick={envoyer}>
            <Send className="size-4" aria-hidden /> Envoyer au club
          </Bouton>
        )}
      </div>
    </div>
  )
}

function Progression({ etape }: { etape: number }) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-semibold text-muted-foreground">
        Étape {etape + 1} sur {ETAPES.length} · <span className="text-foreground">{ETAPES[etape]}</span>
      </p>
      <div className="flex gap-1" aria-hidden>
        {ETAPES.map((e, i) => (
          <span key={e} className={`h-1.5 flex-1 rounded-full ${i <= etape ? 'bg-brand' : 'bg-border'}`} />
        ))}
      </div>
    </div>
  )
}

type Etape = {
  s: SaisieFamille
  maj: <K extends keyof SaisieFamille>(champ: K) => (v: SaisieFamille[K]) => void
  erreurs: Record<string, string>
}

function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">{titre}</h2>
      {children}
    </section>
  )
}

function Ligne({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{libelle}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  )
}

function EtapeAdherent({ a, s, maj, erreurs }: Etape & { a: AdherentInscription }) {
  const f = a.adherent
  const [correction, setCorrection] = useState(false)
  return (
    <>
      <Section titre={a.moi ? 'Vous' : f.prenom}>
        {correction ? (
          <CorrectionFiche a={a} fermer={() => setCorrection(false)} />
        ) : (
          <>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Ligne libelle="Nom">
                {f.prenom} {f.nom}
              </Ligne>
              <Ligne libelle="Date de naissance">{dateFr(f.date_naissance)}</Ligne>
              <Ligne libelle="Ceinture">{f.grade ?? '—'}</Ligne>
              <Ligne libelle="N° de licence">{f.numero_licence ?? '—'}</Ligne>
            </dl>
            {a.ficheModifiable ? (
              <div>
                <Bouton variante="secondaire" onClick={() => setCorrection(true)}>
                  Corriger sa fiche
                </Bouton>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Une erreur ? Signalez-la au bureau : il met les fiches à jour.</p>
            )}
          </>
        )}
      </Section>
      <Section titre="Adresse">
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1.5fr]">
          <Champ id="dossier-adresse" libelle="Adresse" valeur={s.adresse} onChange={maj('adresse')} erreur={erreurs.adresse} autoComplete="street-address" requis />
          <Champ id="dossier-cp" libelle="Code postal" valeur={s.code_postal} onChange={maj('code_postal')} erreur={erreurs.code_postal} inputMode="numeric" autoComplete="postal-code" requis />
          <Champ id="dossier-ville" libelle="Ville" valeur={s.ville} onChange={maj('ville')} erreur={erreurs.ville} autoComplete="address-level2" requis />
        </div>
      </Section>
      {a.mineur && (
        <Section titre="Responsables légaux">
          <ul className="grid gap-1">
            {a.responsables.map((r, i) => (
              <li key={i}>
                {r.prenom} {r.nom} <span className="text-sm text-muted-foreground">· {QUALITES[r.qualite as keyof typeof QUALITES] ?? r.qualite}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Leurs coordonnées sont celles de leur compte. Un autre responsable à ajouter ? Signalez-le au bureau.
          </p>
        </Section>
      )}
    </>
  )
}

/** Fiche d'un enfant ajouté par la famille, corrigeable tant que le bureau ne l'a pas vérifiée. */
function CorrectionFiche({ a, fermer }: { a: AdherentInscription; fermer: () => void }) {
  const client = useQueryClient()
  const f = a.adherent
  const [s, setS] = useState({ prenom: f.prenom, nom: f.nom, date_naissance: f.date_naissance, sexe: f.sexe as 'F' | 'M' | '', grade: f.grade ?? '' })
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [enCours, setEnCours] = useState(false)
  const maj = (champ: keyof typeof s) => (v: string) => setS((p) => ({ ...p, [champ]: v }))
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ id="fiche-prenom" libelle="Prénom" valeur={s.prenom} onChange={maj('prenom')} erreur={erreurs.prenom} />
        <Champ id="fiche-nom" libelle="Nom" valeur={s.nom} onChange={maj('nom')} erreur={erreurs.nom} />
        <Champ id="fiche-naissance" libelle="Date de naissance" type="date" valeur={s.date_naissance} onChange={maj('date_naissance')} erreur={erreurs.date_naissance} />
        <Selection
          id="fiche-sexe"
          libelle="Sexe"
          valeur={s.sexe}
          options={[
            { valeur: 'F', libelle: 'Fille' },
            { valeur: 'M', libelle: 'Garçon' },
          ]}
          onChange={maj('sexe')}
          erreur={erreurs.sexe}
        />
        <Selection id="fiche-grade" libelle="Ceinture" valeur={s.grade} options={CEINTURES.map((c) => ({ valeur: c, libelle: c }))} onChange={maj('grade')} vide="Aucune (débutant)" />
      </div>
      <Alerte>{message}</Alerte>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Bouton
          enCours={enCours}
          onClick={async () => {
            setEnCours(true)
            setErreurs({})
            setMessage('')
            try {
              await appel('PUT', `/api/famille/inscriptions/enfants/${f.id}`, { ...s, grade: s.grade || null, numero_licence: f.numero_licence })
              await client.invalidateQueries({ queryKey: ['famille'] })
              fermer()
            } catch (err) {
              if (err instanceof ErreurApi) {
                setErreurs(err.erreurs)
                setMessage(Object.keys(err.erreurs).length ? 'Vérifiez les champs signalés.' : err.message)
              } else setMessage('Enregistrement impossible.')
            } finally {
              setEnCours(false)
            }
          }}
        >
          Enregistrer la fiche
        </Bouton>
        <Bouton variante="secondaire" onClick={fermer}>
          Annuler
        </Bouton>
      </div>
    </div>
  )
}

function EtapeActivite({ a, tarifs, s, maj, erreurs }: Etape & { a: AdherentInscription; tarifs: Tarifs }) {
  const horsCommune = horsCommuneSuggere(s.code_postal.trim() || null)
  const reductionFamille = a.proposition.reductionFamille
  const montant = calculerMontant(tarifs, { formule: s.formule, passeport: s.passeport && passeportPossible(tarifs, s.formule), horsCommune, reductionFamille })
  return (
    <>
      <Section titre="Formule">
        {tarifs.groupes.map((g) => (
          <div key={g.titre} className="grid gap-2">
            <p className="text-sm font-semibold text-muted-foreground">{g.titre}</p>
            {g.formules.map((f) => (
              <label
                key={f.id}
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 ${s.formule === f.id ? 'border-ink ring-1 ring-ink' : 'bg-white'}`}
              >
                <input type="radio" name="formule" value={f.id} checked={s.formule === f.id} onChange={() => maj('formule')(f.id)} className="size-5 shrink-0 accent-brand" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">
                    {f.nom}
                    {a.precedent?.formule === f.id && <Badge>l’an dernier</Badge>}
                    {a.proposition.formule === f.id && a.precedent?.formule !== f.id && <Badge>d’après l’âge</Badge>}
                  </span>
                  <span className="block text-sm text-muted-foreground">{f.public}</span>
                </span>
                <span className="shrink-0 font-semibold">{euros(f.participation + f.licence)}</span>
              </label>
            ))}
          </div>
        ))}
        {erreurs.formule && <p className="text-sm font-medium text-brand">{erreurs.formule}</p>}
        {passeportPossible(tarifs, s.formule) && (
          <Case
            id="dossier-passeport"
            libelle={`Passeport sportif (+${euros(tarifs.passeport.montant)})`}
            aide={tarifs.passeport.precision || 'Recommandé pour les compétitions'}
            coche={s.passeport}
            onChange={maj('passeport')}
          />
        )}
      </Section>
      {montant && (
        <div className="rounded-2xl bg-surface p-5">
          <p className="flex items-baseline justify-between gap-3">
            <span className="font-bold">Total estimé</span>
            <span className="text-2xl font-extrabold">{euros(montant.total)}</span>
          </p>
          <ul className="mt-1 text-sm text-muted-foreground">
            <li>
              Activité {euros(montant.participation)} + licence {euros(montant.licence)}
            </li>
            {s.passeport && passeportPossible(tarifs, s.formule) && <li>Passeport : +{euros(tarifs.passeport.montant)}</li>}
            {horsCommune && <li>Hors de Condat-sur-Vienne : +{euros(tarifs.horsCommune.montant)}</li>}
            {reductionFamille && <li>Réduction famille (2ᵉ licence) : −{euros(tarifs.reductionFamille.montant)}</li>}
          </ul>
        </div>
      )}
    </>
  )
}

const Badge = ({ children }: { children: ReactNode }) => (
  <span className="ml-2 inline-block rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">{children}</span>
)

function EtapePaiement({ saison, s, maj, erreurs }: Etape & { saison: Saison }) {
  const [d1, d2] = saison.echeances3Fois.dates
  return (
    <Section titre="Paiement">
      <fieldset className="grid gap-2">
        <legend className="mb-1.5 text-sm font-semibold">Mode de paiement</legend>
        {(Object.keys(MODES_PAIEMENT) as ModePaiement[]).map((m) => (
          <label key={m} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3.5 ${s.paiement_mode === m ? 'border-ink ring-1 ring-ink' : 'bg-white'}`}>
            <input type="radio" name="paiement_mode" checked={s.paiement_mode === m} onChange={() => maj('paiement_mode')(m)} className="size-5 accent-brand" />
            <span className="font-medium">{MODES_PAIEMENT[m]}</span>
          </label>
        ))}
        {erreurs.paiement_mode && <p className="text-sm font-medium text-brand">{erreurs.paiement_mode}</p>}
      </fieldset>
      <Case
        id="dossier-3-fois"
        libelle="Payer en 3 fois"
        aide={d1 && d2 ? `À l’inscription, puis le ${dateFr(d1)} et le ${dateFr(d2)}` : undefined}
        coche={s.paiement_3_fois}
        onChange={maj('paiement_3_fois')}
      />
      <p className="text-sm text-muted-foreground">Le dossier ne vaut pas paiement : le trésorier vous indique comment régler.</p>
    </Section>
  )
}

function Choix({ nom, valeur, options, onChange, erreur }: { nom: string; valeur: string; options: { valeur: string; libelle: string; aide?: string }[]; onChange: (v: string) => void; erreur?: string }) {
  return (
    <div className="grid gap-2">
      {options.map((o) => (
        <label key={o.valeur} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 ${valeur === o.valeur ? 'border-ink ring-1 ring-ink' : 'bg-white'}`}>
          <input type="radio" name={nom} checked={valeur === o.valeur} onChange={() => onChange(o.valeur)} className="mt-0.5 size-5 shrink-0 accent-brand" />
          <span>
            <span className="block font-medium">{o.libelle}</span>
            {o.aide && <span className="block text-sm text-muted-foreground">{o.aide}</span>}
          </span>
        </label>
      ))}
      {erreur && <p className="text-sm font-medium text-brand">{erreur}</p>}
    </div>
  )
}

function EtapeSante({ a, s, maj, erreurs }: Etape & { a: AdherentInscription }) {
  const options = a.mineur
    ? [
        {
          valeur: 'attestation',
          libelle: 'J’atteste que toutes les réponses au questionnaire de santé sont « non »',
          aide: `Questionnaire de santé du mineur, rempli avec ${a.adherent.prenom} : pas de certificat médical à fournir.`,
        },
        { valeur: 'certificat', libelle: 'Au moins une réponse est « oui » : je fournirai un certificat médical', aide: 'À remettre au club avant la reprise.' },
      ]
    : [
        { valeur: 'attestation', libelle: 'Renouvellement : j’atteste avoir répondu « non » à toutes les questions du questionnaire QS-SPORT' },
        { valeur: 'certificat', libelle: 'Première licence, ou une réponse « oui » : je fournirai un certificat médical', aide: 'À remettre au club avant la reprise.' },
      ]
  return (
    <Section titre="Formalité médicale">
      <p className="text-sm text-muted-foreground">
        Le questionnaire reste chez vous : le club n’enregistre que votre réponse ci-dessous et sa date, jamais le contenu du
        questionnaire ni aucune information de santé.
      </p>
      <Choix nom="sante" valeur={s.sante} options={options} onChange={(v) => maj('sante')(v as SaisieFamille['sante'])} erreur={erreurs.sante} />
    </Section>
  )
}

function OuiNon({ id, libelle, aide, rappel, valeur, onChange, erreur }: { id: string; libelle: string; aide: string; rappel?: Recueil; valeur: 'oui' | 'non' | ''; onChange: (v: 'oui' | 'non') => void; erreur?: string }) {
  return (
    <fieldset className="grid gap-2 rounded-xl border p-4">
      <legend className="px-1 font-semibold">{libelle}</legend>
      <p className="text-sm text-muted-foreground">{aide}</p>
      {rappel && rappel !== 'non_recueilli' && <p className="text-sm text-muted-foreground">L’an dernier : {RECUEILS[rappel].toLowerCase()}.</p>}
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={libelle}>
        {(['oui', 'non'] as const).map((v) => (
          <label
            key={v}
            className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold transition-colors ${valeur === v ? 'border-ink bg-ink text-white' : 'bg-white hover:border-brand/40'}`}
          >
            <input type="radio" name={id} value={v} checked={valeur === v} onChange={() => onChange(v)} className="sr-only" />
            {v === 'oui' ? 'Oui' : 'Non'}
          </label>
        ))}
      </div>
      {erreur && <p className="text-sm font-medium text-brand">{erreur}</p>}
    </fieldset>
  )
}

function EtapeAutorisations({ a, s, maj, erreurs }: Etape & { a: AdherentInscription }) {
  const p = a.precedent
  const prenom = a.moi ? 'vous' : a.adherent.prenom
  return (
    <Section titre="Autorisations">
      <p className="text-sm text-muted-foreground">Répondez à chaque question : votre réponse est datée et enregistrée à votre nom. Vous pourrez la changer à tout moment depuis « Mes enfants ».</p>
      {a.mineur && (
        <OuiNon
          id="soins_urgence"
          libelle="Soins d’urgence"
          aide={`En cas d’urgence, j’autorise le club à faire soigner ${prenom}, y compris une hospitalisation ou une intervention décidée par un médecin.`}
          rappel={p?.soins_urgence}
          valeur={s.soins_urgence}
          onChange={maj('soins_urgence')}
          erreur={erreurs.soins_urgence}
        />
      )}
      <OuiNon
        id="droit_image"
        libelle="Photos et vidéos"
        aide={`Le club peut publier des photos ou vidéos où ${prenom} est reconnaissable (site, réseaux du club).`}
        rappel={p?.droit_image}
        valeur={s.droit_image}
        onChange={maj('droit_image')}
        erreur={erreurs.droit_image}
      />
      <OuiNon
        id="whatsapp"
        libelle="Groupe WhatsApp du club"
        aide="Ajout de votre numéro au groupe WhatsApp des familles du club."
        rappel={p?.whatsapp}
        valeur={s.whatsapp}
        onChange={maj('whatsapp')}
        erreur={erreurs.whatsapp}
      />
      {a.mineur && (
        <OuiNon
          id="photo_garderie"
          libelle="Photo pour la garderie du mercredi"
          aide={`Une photo de ${prenom}, montrée aux seuls encadrants le mercredi, pour le reconnaître à la garderie.`}
          rappel={p?.photo_garderie}
          valeur={s.photo_garderie}
          onChange={maj('photo_garderie')}
          erreur={erreurs.photo_garderie}
        />
      )}
      {a.mineur && (
        <p className="text-sm text-muted-foreground">
          Qui peut venir chercher {a.adherent.prenom} ? La liste se gère dans{' '}
          <Link to="/espace/famille" className="font-semibold text-brand">
            Mes enfants
          </Link>
          .
        </p>
      )}
    </Section>
  )
}

function Engagement({ id, coche, onChange, children }: { id: string; coche: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-xl border bg-white px-3.5 py-3">
      <input id={id} type="checkbox" checked={coche} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-brand" />
      <span className="grid gap-1">{children}</span>
    </label>
  )
}

function EtapeEngagements({ s, maj, erreurs }: Etape) {
  return (
    <Section titre="Engagements">
      <Engagement id="engagement-reglement" coche={s.reglement} onChange={maj('reglement')}>
        <span className="font-medium">J’ai lu le règlement intérieur du club et je l’accepte</span>
        <Link to="/reglement" target="_blank" className="text-sm font-semibold text-brand">
          Lire le règlement
        </Link>
      </Engagement>
      <Engagement id="engagement-assurance" coche={s.assurance} onChange={maj('assurance')}>
        <span className="font-medium">J’ai pris connaissance de l’information sur l’assurance</span>
        <span className="text-sm text-muted-foreground">{INFORMATION_ASSURANCE}</span>
      </Engagement>
      <Engagement id="engagement-donnees" coche={s.donnees} onChange={maj('donnees')}>
        <span className="font-medium">J’ai lu comment le club utilise et protège les données de ma famille</span>
        <Link to="/donnees-personnelles" target="_blank" className="text-sm font-semibold text-brand">
          Données personnelles
        </Link>
      </Engagement>
      {erreurs.engagements && <p className="text-sm font-medium text-brand">{erreurs.engagements}</p>}
    </Section>
  )
}

function Recapitulatif({ a, tarifs, s, aller }: { a: AdherentInscription; tarifs: Tarifs; s: SaisieFamille; aller: (n: number) => void }) {
  const horsCommune = horsCommuneSuggere(s.code_postal.trim() || null)
  const passeport = s.passeport && passeportPossible(tarifs, s.formule)
  const montant = calculerMontant(tarifs, { formule: s.formule, passeport, horsCommune, reductionFamille: a.proposition.reductionFamille })
  const oui = (v: string) => (v === 'oui' ? 'Oui' : 'Non')
  const modifier = (n: number) => (
    <button type="button" onClick={() => aller(n)} className="text-sm font-semibold text-brand">
      Modifier
    </button>
  )
  return (
    <Section titre="Vérifier et envoyer">
      <dl className="grid gap-4">
        <div className="flex items-start justify-between gap-3">
          <Ligne libelle="Adresse">
            {s.adresse}, {s.code_postal} {s.ville}
          </Ligne>
          {modifier(0)}
        </div>
        <div className="flex items-start justify-between gap-3">
          <Ligne libelle="Formule">
            {formuleParId(tarifs, s.formule)?.nom}
            {passeport && ' · passeport'}
          </Ligne>
          {modifier(1)}
        </div>
        <div className="flex items-start justify-between gap-3">
          <Ligne libelle="Paiement">
            {s.paiement_mode && MODES_PAIEMENT[s.paiement_mode]}
            {s.paiement_3_fois && montant && <span className="block text-sm font-normal text-muted-foreground">En 3 fois : {montant.echeancier.map(euros).join(', ')}</span>}
          </Ligne>
          {modifier(2)}
        </div>
        <div className="flex items-start justify-between gap-3">
          <Ligne libelle="Formalité médicale">{s.sante === 'certificat' ? 'Certificat médical à remettre au club' : 'Questionnaire de santé : attestation'}</Ligne>
          {modifier(3)}
        </div>
        <div className="flex items-start justify-between gap-3">
          <Ligne libelle="Autorisations">
            <span className="block font-normal">
              {a.mineur && <>Soins d’urgence : {oui(s.soins_urgence)} · </>}
              Photos et vidéos : {oui(s.droit_image)} · WhatsApp : {oui(s.whatsapp)}
              {a.mineur && <> · Photo garderie : {oui(s.photo_garderie)}</>}
            </span>
          </Ligne>
          {modifier(4)}
        </div>
      </dl>
      {montant && (
        <p className="flex items-baseline justify-between gap-3 rounded-xl bg-surface p-4">
          <span className="font-bold">Total</span>
          <span className="text-2xl font-extrabold">{euros(montant.total)}</span>
        </p>
      )}
      <p className="text-sm text-muted-foreground">Le montant est confirmé par le club à l’envoi du dossier.</p>
    </Section>
  )
}

/** Dossier validé par le bureau, ou saisi par le club : consultation seulement. */
function Consultation({ saison, a }: { saison: Saison; a: AdherentInscription }) {
  const d = a.dossier as DossierFamille
  const statut = statutFamille(a)
  const f = formuleParId(saison.tarifs, d.formule)
  return (
    <Bloc titre={`Dossier ${saison.libelle}`}>
      <div className="grid gap-4">
        <p className="font-semibold">{statut.libelle}</p>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Ligne libelle="Formule">{f?.nom ?? d.formule}</Ligne>
          <Ligne libelle="Montant">{euros(d.montant_total)}</Ligne>
          <Ligne libelle="Paiement">
            {d.paiement_mode ? MODES_PAIEMENT[d.paiement_mode] : 'à préciser'}
            {d.paiement_3_fois === 1 && <span className="block text-sm font-normal text-muted-foreground">En 3 fois : {[d.echeance_1, d.echeance_2, d.echeance_3].map(euros).join(', ')}</span>}
          </Ligne>
          <Ligne libelle="Formalité médicale">
            {d.formalite_recue_le ? `${d.formalite_type ? FORMALITES[d.formalite_type] : 'Pièce'} — le ${dateFr(d.formalite_recue_le)}` : 'À remettre au club'}
          </Ligne>
          {a.mineur && <Ligne libelle="Soins d’urgence">{RECUEILS[d.soins_urgence]}</Ligne>}
          <Ligne libelle="Photos et vidéos">{RECUEILS[d.droit_image]}</Ligne>
          <Ligne libelle="Groupe WhatsApp">{RECUEILS[d.whatsapp]}</Ligne>
          {a.mineur && <Ligne libelle="Photo pour la garderie">{RECUEILS[d.photo_garderie]}</Ligne>}
        </dl>
        <p className="text-sm text-muted-foreground">
          Pour modifier ce dossier, adressez-vous au bureau. Vos autorisations (photos, WhatsApp, photo pour la garderie) se changent à tout
          moment dans{' '}
          <Link to="/espace/famille" className="font-semibold text-brand">
            Mes enfants
          </Link>
          .
        </p>
      </div>
    </Bloc>
  )
}

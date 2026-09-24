import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Bloc, Espace } from '../../components/espace/Garde'
import { Alerte, Bouton, Case, Champ, Selection, ZoneTexte } from '../../components/formulaire'
import { Pastille } from '../../components/ui'
import { libelleCategorie, type Categorie } from '../../content/categories'
import { coursTries, heure, JOURS, type Cours, type Jour, type Referentiel, type Saison } from '../../content/referentiel'
import type { Ajustement, Formule, Tarifs } from '../../content/tarifs'
import { appel, dateFr, ErreurApi } from '../../lib/api'
import { slug } from '../../lib/csv'
import { lireEuros, saisieEuros } from '../../lib/paiements'
import { euros } from '../../lib/tarifs'

type Enregistrer = (r: Referentiel, inscriptions?: boolean) => Promise<void>

export function SaisonPage() {
  const { id } = useParams({ from: '/espace/saisons/$id' })
  const client = useQueryClient()
  const { data, isPending, isError } = useQuery({
    queryKey: ['admin', 'saison', id],
    queryFn: () => appel<Saison>('GET', `/api/admin/saisons/${id}`),
  })
  const rafraichir = () => Promise.all([client.invalidateQueries({ queryKey: ['admin'] }), client.invalidateQueries({ queryKey: ['saison'] })])

  return (
    <Espace titre={`Saison ${data?.libelle ?? ''}`.trim()} retour={{ to: '/espace/saisons', libelle: 'Saisons' }} roles={['bureau', 'admin']} aide="saisons">
      {() => {
        if (isPending) return <p className="text-muted-foreground">Chargement…</p>
        if (isError) return <Alerte>Saison introuvable.</Alerte>
        const enregistrer: Enregistrer = async (referentiel, inscriptions = data.inscriptions_ouvertes) => {
          await appel('PUT', `/api/admin/saisons/${id}`, { referentiel, inscriptions_ouvertes: inscriptions })
          await rafraichir()
        }
        const r = data.referentiel
        return (
          <div className="grid grid-cols-1 gap-6">
            <Entete saison={data} enregistrer={enregistrer} rafraichir={rafraichir} />
            <Section
              titre="Catégories d’âge"
              prefixe="categories"
              valeur={r.categories}
              enregistrer={(categories) => enregistrer({ ...r, categories: categories.map((c) => ({ ...c, id: c.id || slug(c.nom) })) })}
              lecture={(cats) => (
                <ul className="grid gap-1 sm:grid-cols-2">
                  {cats.map((c) => (
                    <li key={c.id}>{libelleCategorie(c)}</li>
                  ))}
                </ul>
              )}
              edition={(cats, maj) => <EditeurCategories categories={cats} maj={maj} />}
            />
            <Section
              titre="Tarifs"
              prefixe="tarifs"
              valeur={r.tarifs}
              enregistrer={(tarifs) =>
                enregistrer({
                  ...r,
                  tarifs: { ...tarifs, groupes: tarifs.groupes.map((g) => ({ ...g, formules: g.formules.map((f) => ({ ...f, id: f.id || slug(f.nom) })) })) },
                })
              }
              lecture={(t) => <LectureTarifs tarifs={t} />}
              edition={(t, maj) => <EditeurTarifs tarifs={t} maj={maj} />}
            />
            <Section
              titre="Paiement en 3 fois"
              prefixe="echeances3Fois"
              valeur={r.echeances3Fois}
              enregistrer={(echeances3Fois) => enregistrer({ ...r, echeances3Fois })}
              lecture={(e) => (
                <p>
                  1er versement à l’inscription, 2e le {dateFr(e.dates[0])}, 3e le {dateFr(e.dates[1])}
                  {e.provisoire && <span className="text-amber-800"> (dates à confirmer)</span>}.
                </p>
              )}
              edition={(e, maj) => (
                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Champ id="echeance-2" libelle="2e versement le" type="date" valeur={e.dates[0]} onChange={(v) => maj({ ...e, dates: [v, e.dates[1]] })} />
                    <Champ id="echeance-3" libelle="3e versement le" type="date" valeur={e.dates[1]} onChange={(v) => maj({ ...e, dates: [e.dates[0], v] })} />
                  </div>
                  <Case id="echeances-provisoires" libelle="Dates à confirmer" coche={e.provisoire} onChange={(v) => maj({ ...e, provisoire: v })} />
                </div>
              )}
            />
            <Section
              titre="Horaires des cours"
              prefixe="horaires"
              valeur={r.horaires}
              enregistrer={(horaires) => enregistrer({ ...r, horaires })}
              lecture={(h) => (
                <>
                  {h.provisoire && <p className="mb-2 text-sm font-medium text-amber-800">À confirmer : masqués sur le site public.</p>}
                  {h.cours.length === 0 ? (
                    <p className="text-muted-foreground">Aucun cours saisi.</p>
                  ) : (
                    <ul className="grid gap-1">
                      {coursTries(h.cours).map((c, i) => (
                        <li key={i}>
                          <span className="capitalize">{c.jour}</span> {heure(c.debut)} – {heure(c.fin)} · <strong>{c.cours}</strong>
                          {c.public && <span className="text-muted-foreground"> · {c.public}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              edition={(h, maj) => <EditeurHoraires horaires={h} maj={maj} />}
            />
          </div>
        )
      }}
    </Espace>
  )
}

// --- En-tête : saison courante, inscriptions, bascule, suppression ---

function Entete({ saison: s, enregistrer, rafraichir }: { saison: Saison; enregistrer: Enregistrer; rafraichir: () => Promise<unknown> }) {
  const navigate = useNavigate()
  const [confirmer, setConfirmer] = useState<'courante' | 'suppression' | null>(null)
  const [erreur, setErreur] = useState('')

  async function agir(action: () => Promise<unknown>, apres?: () => void) {
    setErreur('')
    try {
      await action()
      await rafraichir()
      setConfirmer(null)
      apres?.()
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Action impossible.')
    }
  }

  return (
    <Bloc titre="Saison" action={s.courante ? <Pastille ton="ouvert">Saison courante</Pastille> : <Pastille ton="ferme">En préparation</Pastille>}>
      <div className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          Du {dateFr(s.debut)} au {dateFr(s.fin)}.{' '}
          {s.courante
            ? 'Les dossiers, la trésorerie, les compétitions et la page publique utilisent cette saison.'
            : 'Préparez-la tranquillement : rien ne change sur le site tant qu’elle n’est pas courante.'}
        </p>
        <Case
          id="inscriptions-ouvertes"
          libelle="Inscriptions ouvertes"
          aide="Pour le dossier d’inscription en ligne des familles (à venir)."
          coche={s.inscriptions_ouvertes}
          onChange={(v) => agir(() => enregistrer(s.referentiel, v))}
        />
        {confirmer === 'courante' ? (
          <div className="grid gap-3 rounded-xl border border-brand/30 p-4">
            <p className="text-sm">
              Rendre la saison <strong>{s.libelle}</strong> courante ? Les nouveaux dossiers, la trésorerie, les catégories et la page publique
              « Horaires & tarifs » passent sur cette saison.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Bouton onClick={() => agir(() => appel('POST', `/api/admin/saisons/${s.id}/courante`))}>Confirmer</Bouton>
              <Bouton variante="secondaire" onClick={() => setConfirmer(null)}>
                Annuler
              </Bouton>
            </div>
          </div>
        ) : confirmer === 'suppression' ? (
          <div className="grid gap-3 rounded-xl border border-brand/30 p-4">
            <p className="text-sm">Supprimer la saison {s.libelle} ? Possible seulement si aucun dossier ne s’y rattache.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Bouton
                variante="danger"
                onClick={() => agir(() => appel('DELETE', `/api/admin/saisons/${s.id}`), () => navigate({ to: '/espace/saisons' }))}
              >
                Confirmer la suppression
              </Bouton>
              <Bouton variante="secondaire" onClick={() => setConfirmer(null)}>
                Annuler
              </Bouton>
            </div>
          </div>
        ) : (
          !s.courante && (
            <div className="flex flex-wrap items-center gap-3">
              <Bouton onClick={() => setConfirmer('courante')}>Rendre cette saison courante</Bouton>
              <button type="button" onClick={() => setConfirmer('suppression')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                <Trash2 className="size-4" aria-hidden /> Supprimer
              </button>
            </div>
          )
        )}
        <Alerte>{erreur}</Alerte>
      </div>
    </Bloc>
  )
}

// --- Section générique : lecture, modification sur un brouillon, enregistrement ---

function Section<T>({
  titre,
  prefixe,
  valeur,
  lecture,
  edition,
  enregistrer,
}: {
  titre: string
  prefixe: string
  valeur: T
  lecture: (v: T) => ReactNode
  edition: (brouillon: T, maj: (v: T) => void) => ReactNode
  enregistrer: (v: T) => Promise<void>
}) {
  const [brouillon, setBrouillon] = useState<T | null>(null)
  const [erreurs, setErreurs] = useState<string[]>([])
  const [enCours, setEnCours] = useState(false)

  async function valider() {
    if (brouillon === null) return
    setEnCours(true)
    setErreurs([])
    try {
      await enregistrer(brouillon)
      setBrouillon(null)
    } catch (err) {
      // Erreurs de la validation du Worker, rattachées à cette section (« categories.2 » → « Ligne 3 »).
      const liste =
        err instanceof ErreurApi
          ? Object.entries(err.erreurs)
              .filter(([k]) => k.startsWith(prefixe))
              .map(([k, m]) => {
                const n = k.match(/\.(\d+)$/)
                return n ? `Ligne ${Number(n[1]) + 1} : ${m}` : m
              })
          : []
      setErreurs(liste.length ? liste : [err instanceof ErreurApi ? err.message : 'Enregistrement impossible.'])
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Bloc
      titre={titre}
      action={
        brouillon === null && (
          <Bouton variante="secondaire" onClick={() => setBrouillon(structuredClone(valeur))}>
            <Pencil className="size-4" aria-hidden /> Modifier
          </Bouton>
        )
      }
    >
      {brouillon === null ? (
        lecture(valeur)
      ) : (
        <div className="grid gap-4">
          {edition(brouillon, setBrouillon)}
          {erreurs.length > 0 && (
            <Alerte>
              {erreurs.map((e) => (
                <span key={e} className="block">
                  {e}
                </span>
              ))}
            </Alerte>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Bouton onClick={valider} enCours={enCours}>
              Enregistrer
            </Bouton>
            <Bouton variante="secondaire" onClick={() => setBrouillon(null)}>
              Annuler
            </Bouton>
          </div>
        </div>
      )}
    </Bloc>
  )
}

// --- Champs compacts ---

const CHAMP = 'min-h-11 w-full rounded-xl border bg-white px-3 text-base outline-none focus:border-brand aria-[invalid=true]:border-brand'

function Petit({ id, libelle, children }: { id: string; libelle: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-muted-foreground">
        {libelle}
      </label>
      {children}
    </div>
  )
}

/** Montant en euros (0 accepté) ; la valeur n'est transmise que si la saisie est lisible. */
function ChampEuros({ id, libelle, centimes, onChange }: { id: string; libelle: string; centimes: number; onChange: (c: number) => void }) {
  const [texte, setTexte] = useState(saisieEuros(centimes))
  const lire = (s: string) => (/^\s*0+([,.]0*)?\s*€?\s*$/.test(s) ? 0 : lireEuros(s))
  return (
    <Petit id={id} libelle={libelle}>
      <input
        id={id}
        inputMode="decimal"
        value={texte}
        aria-invalid={lire(texte) === null}
        onChange={(e) => {
          setTexte(e.target.value)
          const c = lire(e.target.value)
          if (c !== null) onChange(c)
        }}
        className={`${CHAMP} text-right`}
      />
    </Petit>
  )
}

function ChampAnnee({ id, libelle, valeur, onChange }: { id: string; libelle: string; valeur: number; onChange: (n: number) => void }) {
  return (
    <Petit id={id} libelle={libelle}>
      <input id={id} type="number" inputMode="numeric" value={valeur} onChange={(e) => onChange(Number(e.target.value))} className={CHAMP} />
    </Petit>
  )
}

function Retirer({ onClick, libelle }: { onClick: () => void; libelle: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={libelle} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand">
      <Trash2 className="size-4" aria-hidden /> Retirer
    </button>
  )
}

function Ajouter({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex min-h-11 items-center gap-1.5 justify-self-start text-sm font-semibold text-brand">
      <Plus className="size-4" aria-hidden /> {children}
    </button>
  )
}

const remplacer = <T,>(liste: T[], i: number, v: T) => liste.map((x, j) => (j === i ? v : x))

// --- Catégories ---

function EditeurCategories({ categories, maj }: { categories: Categorie[]; maj: (c: Categorie[]) => void }) {
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">Années de naissance incluses ; pour « … et avant », mettre 1900 en première année.</p>
      {categories.map((c, i) => (
        <div key={i} className="grid grid-cols-[1fr_5.5rem_5.5rem] items-end gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_7rem_7rem_auto]">
          <Petit id={`cat-${i}-nom`} libelle="Nom">
            <input id={`cat-${i}-nom`} value={c.nom} onChange={(e) => maj(remplacer(categories, i, { ...c, nom: e.target.value }))} className={CHAMP} />
          </Petit>
          <ChampAnnee id={`cat-${i}-de`} libelle="De" valeur={c.de} onChange={(de) => maj(remplacer(categories, i, { ...c, de }))} />
          <ChampAnnee id={`cat-${i}-a`} libelle="À" valeur={c.a} onChange={(a) => maj(remplacer(categories, i, { ...c, a }))} />
          <div className="col-span-3 sm:col-span-1">
            <Retirer libelle={`Retirer ${c.nom}`} onClick={() => maj(categories.filter((_, j) => j !== i))} />
          </div>
        </div>
      ))}
      <Ajouter onClick={() => maj([...categories, { id: '', nom: '', de: new Date().getFullYear(), a: new Date().getFullYear() }])}>
        Ajouter une catégorie
      </Ajouter>
    </div>
  )
}

// --- Tarifs ---

function LectureTarifs({ tarifs: t }: { tarifs: Tarifs }) {
  return (
    <div className="grid gap-4">
      {t.provisoire && <p className="text-sm font-medium text-amber-800">À confirmer : masqués sur le site public.</p>}
      {t.groupes.map((g) => (
        <div key={g.titre}>
          <p className="font-semibold">{g.titre}</p>
          <ul className="mt-1 grid gap-1 text-sm">
            {g.formules.map((f) => (
              <li key={f.id}>
                {f.nom} — <strong>{euros(f.participation + f.licence)}</strong>
                <span className="text-muted-foreground">
                  {' '}
                  (dont licence {euros(f.licence)} ; en 3 fois : {f.echeancier.map(euros).join(' + ')}
                  {f.annees ? ` ; nés ${f.annees.de === 1900 ? `en ${f.annees.a} et avant` : `de ${f.annees.de} à ${f.annees.a}`}` : ''})
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="text-sm">
        Passeport + {euros(t.passeport.montant)} · hors commune + {euros(t.horsCommune.montant)} · réduction famille − {euros(t.reductionFamille.montant)}
      </p>
      <p className="text-sm text-muted-foreground">Modes de paiement : {t.modesPaiement.join(', ')}</p>
    </div>
  )
}

function EditeurTarifs({ tarifs: t, maj }: { tarifs: Tarifs; maj: (t: Tarifs) => void }) {
  const majFormule = (gi: number, fi: number, f: Formule) =>
    maj({ ...t, groupes: remplacer(t.groupes, gi, { ...t.groupes[gi]!, formules: remplacer(t.groupes[gi]!.formules, fi, f) }) })
  const ajustement = (cle: 'passeport' | 'horsCommune' | 'reductionFamille', libelle: string) => {
    const a: Ajustement = t[cle]
    return (
      <div className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[8rem_1fr]">
        <ChampEuros id={`aj-${cle}`} libelle={libelle} centimes={a.montant} onChange={(montant) => maj({ ...t, [cle]: { ...a, montant } })} />
        <Petit id={`aj-${cle}-precision`} libelle="Précision affichée">
          <input
            id={`aj-${cle}-precision`}
            value={a.precision}
            onChange={(e) => maj({ ...t, [cle]: { ...a, precision: e.target.value } })}
            className={CHAMP}
          />
        </Petit>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {t.groupes.map((g, gi) => (
        <fieldset key={gi} className="grid gap-3">
          <legend className="mb-1 font-semibold">{g.titre}</legend>
          {g.formules.map((f, fi) => {
            const total = f.participation + f.licence
            const versements = f.echeancier[0] + f.echeancier[1] + f.echeancier[2]
            const p = `f-${gi}-${fi}`
            return (
              <div key={fi} className="grid gap-3 rounded-xl border p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Petit id={`${p}-nom`} libelle="Formule">
                    <input id={`${p}-nom`} value={f.nom} onChange={(e) => majFormule(gi, fi, { ...f, nom: e.target.value })} className={CHAMP} />
                  </Petit>
                  <Petit id={`${p}-public`} libelle="Public">
                    <input id={`${p}-public`} value={f.public} onChange={(e) => majFormule(gi, fi, { ...f, public: e.target.value })} className={CHAMP} />
                  </Petit>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <ChampEuros id={`${p}-participation`} libelle="Participation (€)" centimes={f.participation} onChange={(participation) => majFormule(gi, fi, { ...f, participation })} />
                  <ChampEuros id={`${p}-licence`} libelle="Licence (€)" centimes={f.licence} onChange={(licence) => majFormule(gi, fi, { ...f, licence })} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((k) => (
                    <ChampEuros
                      key={k}
                      id={`${p}-e${k}`}
                      libelle={`${k + 1}${k === 0 ? 'er' : 'e'} versement`}
                      centimes={f.echeancier[k]!}
                      onChange={(m) => majFormule(gi, fi, { ...f, echeancier: f.echeancier.map((x, j) => (j === k ? m : x)) as [number, number, number] })}
                    />
                  ))}
                </div>
                <p className={`text-sm ${versements === total ? 'text-muted-foreground' : 'font-medium text-brand'}`}>
                  Total {euros(total)} · 3 versements : {euros(versements)}
                  {versements !== total && ' — doivent totaliser le montant'}
                </p>
                <div className="flex flex-wrap items-end gap-3">
                  <label htmlFor={`${p}-judo`} className="flex min-h-11 items-center gap-2 text-sm font-medium">
                    <input
                      id={`${p}-judo`}
                      type="checkbox"
                      checked={f.judo}
                      onChange={(e) => majFormule(gi, fi, { ...f, judo: e.target.checked, annees: e.target.checked ? (f.annees ?? { de: 1900, a: 2000 }) : null })}
                      className="size-5 accent-brand"
                    />
                    Judo (passeport possible)
                  </label>
                  {f.judo && f.annees && (
                    <div className="grid grid-cols-2 gap-2">
                      <ChampAnnee id={`${p}-de`} libelle="Nés de" valeur={f.annees.de} onChange={(de) => majFormule(gi, fi, { ...f, annees: { ...f.annees!, de } })} />
                      <ChampAnnee id={`${p}-a`} libelle="à" valeur={f.annees.a} onChange={(a) => majFormule(gi, fi, { ...f, annees: { ...f.annees!, a } })} />
                    </div>
                  )}
                  <Retirer
                    libelle={`Retirer ${f.nom}`}
                    onClick={() => maj({ ...t, groupes: remplacer(t.groupes, gi, { ...g, formules: g.formules.filter((_, j) => j !== fi) }) })}
                  />
                </div>
              </div>
            )
          })}
          <Ajouter
            onClick={() =>
              maj({
                ...t,
                groupes: remplacer(t.groupes, gi, {
                  ...g,
                  formules: [...g.formules, { id: '', nom: '', public: '', participation: 0, licence: 0, echeancier: [0, 0, 0], judo: false, annees: null }],
                }),
              })
            }
          >
            Ajouter une formule
          </Ajouter>
        </fieldset>
      ))}
      <div className="grid gap-3">
        <p className="font-semibold">Suppléments et réduction</p>
        {ajustement('passeport', 'Passeport (€)')}
        {ajustement('horsCommune', 'Hors commune (€)')}
        {ajustement('reductionFamille', 'Réduction famille (€)')}
      </div>
      <ZoneTexte
        id="modes-paiement"
        libelle="Modes de paiement (un par ligne)"
        valeur={t.modesPaiement.join('\n')}
        onChange={(v) => maj({ ...t, modesPaiement: v.split('\n') })}
        lignes={4}
      />
      <Case id="tarifs-provisoires" libelle="Tarifs à confirmer" aide="Masqués sur le site public tant que la case est cochée." coche={t.provisoire} onChange={(v) => maj({ ...t, provisoire: v })} />
    </div>
  )
}

// --- Horaires ---

const OPTIONS_JOURS = JOURS.map((j) => ({ valeur: j, libelle: j.charAt(0).toUpperCase() + j.slice(1) }))

function EditeurHoraires({ horaires: h, maj }: { horaires: Referentiel['horaires']; maj: (h: Referentiel['horaires']) => void }) {
  const majCours = (i: number, c: Cours) => maj({ ...h, cours: remplacer(h.cours, i, c) })
  return (
    <div className="grid gap-3">
      {h.cours.map((c, i) => (
        <div key={i} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[9rem_6.5rem_6.5rem_1fr_1fr_auto] sm:items-end">
          <Selection id={`cours-${i}-jour`} libelle="Jour" valeur={c.jour} options={OPTIONS_JOURS} onChange={(jour) => jour && majCours(i, { ...c, jour: jour as Jour })} />
          <div className="grid grid-cols-2 gap-2 sm:contents">
            <Petit id={`cours-${i}-debut`} libelle="Début">
              <input id={`cours-${i}-debut`} type="time" value={c.debut} onChange={(e) => majCours(i, { ...c, debut: e.target.value })} className={CHAMP} />
            </Petit>
            <Petit id={`cours-${i}-fin`} libelle="Fin">
              <input id={`cours-${i}-fin`} type="time" value={c.fin} onChange={(e) => majCours(i, { ...c, fin: e.target.value })} className={CHAMP} />
            </Petit>
          </div>
          <Petit id={`cours-${i}-cours`} libelle="Cours">
            <input id={`cours-${i}-cours`} value={c.cours} onChange={(e) => majCours(i, { ...c, cours: e.target.value })} className={CHAMP} />
          </Petit>
          <Petit id={`cours-${i}-public`} libelle="Public">
            <input id={`cours-${i}-public`} value={c.public} onChange={(e) => majCours(i, { ...c, public: e.target.value })} className={CHAMP} />
          </Petit>
          <Retirer libelle={`Retirer ${c.cours}`} onClick={() => maj({ ...h, cours: h.cours.filter((_, j) => j !== i) })} />
        </div>
      ))}
      <Ajouter onClick={() => maj({ ...h, cours: [...h.cours, { jour: 'lundi', debut: '18:00', fin: '19:00', cours: '', public: '' }] })}>Ajouter un cours</Ajouter>
      <Case id="horaires-provisoires" libelle="Horaires à confirmer" aide="Masqués sur le site public tant que la case est cochée." coche={h.provisoire} onChange={(v) => maj({ ...h, provisoire: v })} />
    </div>
  )
}

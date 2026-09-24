import { useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Check, Copy, Download, ExternalLink, MessageCircle, Pencil, Trash2, UserPlus } from 'lucide-react'
import { Bloc, Espace } from '../../components/espace/Garde'
import { FormulaireCompetition } from '../../components/espace/FormulaireCompetition'
import { Alerte, Bouton, Champ, LienBouton } from '../../components/formulaire'
import { Pastille } from '../../components/ui'
import { appel, dateFr, dateHeureFr, ErreurApi, urlWhatsApp } from '../../lib/api'
import {
  dateLongue,
  etatInscriptions,
  libelleCriteres,
  LIBELLES_STATUT_COMPETITION,
  messageWhatsApp,
  telechargerCsv,
  urlCompetition,
  versTexte,
  type InscriptionsBureau,
  type LigneInscrit,
} from '../../lib/competitions'

export function CompetitionGestionPage() {
  const { id } = useParams({ from: '/espace/competitions/$id' })
  const client = useQueryClient()
  const { data, isPending, isError } = useQuery({
    queryKey: ['admin', 'competitions', id],
    queryFn: () => appel<InscriptionsBureau>('GET', `/api/admin/competitions/${id}/inscriptions`),
  })
  // Une modification touche aussi la liste du bureau, les pages publiques et l'espace famille.
  const rafraichir = async () => {
    await Promise.all(['admin', 'competitions', 'famille'].map((k) => client.invalidateQueries({ queryKey: [k] })))
  }

  return (
    <Espace
      titre={data?.competition.nom ?? 'Compétition'}
      retour={{ to: '/espace/competitions', libelle: 'Compétitions' }}
      roles={['bureau', 'admin']}
      aide="competitions-bureau"
    >
      {() => {
        if (isPending) return <p className="text-muted-foreground">Chargement…</p>
        if (isError) return <Alerte>Compétition introuvable.</Alerte>
        return (
          <div className="grid gap-6">
            <Informations donnees={data} rafraichir={rafraichir} />
            {data.competition.statut !== 'annulee' && <Partage donnees={data} />}
            <Inscrits donnees={data} rafraichir={rafraichir} />
            {data.competition.statut !== 'annulee' && <Candidats donnees={data} rafraichir={rafraichir} />}
          </div>
        )
      }}
    </Espace>
  )
}

type PropsBloc = { donnees: InscriptionsBureau; rafraichir: () => Promise<void> }

// --- Informations ---

function Informations({ donnees, rafraichir }: PropsBloc) {
  const c = donnees.competition
  const navigate = useNavigate()
  const [edition, setEdition] = useState(false)
  const [confirmer, setConfirmer] = useState(false)
  const [erreur, setErreur] = useState('')

  if (edition) {
    return (
      <Bloc titre="Modifier la compétition">
        <FormulaireCompetition
          competition={c}
          onEnregistre={async () => {
            await rafraichir()
            setEdition(false)
          }}
          onAnnule={() => setEdition(false)}
        />
      </Bloc>
    )
  }

  const etat = etatInscriptions(c)
  const lignes: [string, string][] = [
    ['Date', dateLongue(c.date)],
    ['Lieu', [c.lieu, c.adresse].filter(Boolean).join(' — ')],
    ['Pour', libelleCriteres(c)],
    ['Date limite', dateLongue(c.date_limite)],
  ]
  return (
    <Bloc
      titre="Informations"
      action={
        <Bouton variante="secondaire" onClick={() => setEdition(true)}>
          <Pencil className="size-4" aria-hidden /> Modifier
        </Bouton>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Pastille ton={c.statut === 'annulee' ? 'annule' : c.statut === 'cloturee' ? 'ferme' : 'ouvert'}>{LIBELLES_STATUT_COMPETITION[c.statut]}</Pastille>
        {c.statut === 'ouverte' && <Pastille ton={etat.ton}>{etat.libelle}</Pastille>}
      </div>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {lignes.map(([l, v]) => (
          <div key={l}>
            <dt className="text-sm text-muted-foreground">{l}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      {c.infos && <p className="mt-4 rounded-xl bg-surface p-4 whitespace-pre-line">{c.infos}</p>}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
        <Link to="/competitions/$id" params={{ id: String(c.id) }} className="inline-flex items-center gap-1.5 text-brand">
          <ExternalLink className="size-4" aria-hidden /> Voir la page publique
        </Link>
        {c.lien_officiel && (
          <a href={c.lien_officiel} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-brand">
            <ExternalLink className="size-4" aria-hidden /> Page officielle
          </a>
        )}
      </div>

      <div className="mt-6 border-t pt-4">
        {donnees.inscrits.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Pour renoncer à une compétition qui a des inscrits : « Modifier » → statut « Annulée » (les inscriptions restent visibles).
          </p>
        ) : confirmer ? (
          <div className="grid gap-3">
            <p className="text-sm">
              Supprimer <strong>{c.nom}</strong> ? Aucun enfant n’y est inscrit.
            </p>
            <Alerte>{erreur}</Alerte>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Bouton
                variante="danger"
                onClick={async () => {
                  try {
                    await appel('DELETE', `/api/admin/competitions/${c.id}`)
                    await rafraichir()
                    navigate({ to: '/espace/competitions' })
                  } catch (err) {
                    setErreur(err instanceof ErreurApi ? err.message : 'Suppression impossible.')
                  }
                }}
              >
                Confirmer la suppression
              </Bouton>
              <Bouton variante="secondaire" onClick={() => setConfirmer(false)}>
                Annuler
              </Bouton>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmer(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
            <Trash2 className="size-4" aria-hidden /> Supprimer la compétition
          </button>
        )}
      </div>
    </Bloc>
  )
}

// --- Partage dans le groupe WhatsApp ---

function Partage({ donnees: { competition: c } }: { donnees: InscriptionsBureau }) {
  const [copie, setCopie] = useState(false)
  const url = urlCompetition(c.id)
  return (
    <Bloc titre="Partager">
      <p className="mb-3 text-sm text-muted-foreground">
        Postez ce lien dans le groupe WhatsApp du club : la page est publique (sans aucune information sur les enfants), les parents s’y
        connectent pour inscrire les leurs.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <LienBouton href={urlWhatsApp(messageWhatsApp(c, url), null)}>
          <MessageCircle className="size-4" aria-hidden /> Envoyer sur WhatsApp
        </LienBouton>
        <Bouton
          variante="secondaire"
          onClick={async () => {
            await navigator.clipboard.writeText(url)
            setCopie(true)
          }}
        >
          {copie ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copie ? 'Lien copié' : 'Copier le lien'}
        </Bouton>
      </div>
    </Bloc>
  )
}

// --- Inscrits : liste à ressaisir sur le site fédéral ---

function Inscrits({ donnees, rafraichir }: PropsBloc) {
  const c = donnees.competition
  const [copie, setCopie] = useState(false)
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState<number | null>(null)
  const lignes = donnees.inscrits
  const aRessaisir = lignes.filter((l) => !l.ressaisi_le).length

  async function agir(adherentId: number, action: () => Promise<unknown>) {
    setEnCours(adherentId)
    setErreur('')
    try {
      await action()
      await rafraichir()
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Action impossible.')
    } finally {
      setEnCours(null)
    }
  }

  return (
    <Bloc
      titre={`Inscrits (${lignes.length})`}
      action={
        lignes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Bouton
              variante="secondaire"
              onClick={async () => {
                await navigator.clipboard.writeText(versTexte(lignes))
                setCopie(true)
              }}
            >
              {copie ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copie ? 'Liste copiée' : 'Copier'}
            </Bouton>
            <Bouton variante="secondaire" onClick={() => telechargerCsv(c, lignes)}>
              <Download className="size-4" aria-hidden /> CSV
            </Bouton>
          </div>
        )
      }
    >
      {lignes.length === 0 ? (
        <p className="text-muted-foreground">Aucun enfant inscrit pour l’instant.</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            {aRessaisir === 0 ? 'Toutes les inscriptions sont ressaisies sur le site fédéral.' : `${aRessaisir} à ressaisir sur le site fédéral.`}
          </p>
          <ul className="divide-y rounded-xl border">
            {lignes.map((l) => (
              <li key={l.id} className="grid gap-2 px-4 py-3.5">
                <Identite ligne={l} />
                <p className="text-xs text-muted-foreground">
                  Inscription {l.inscrit_par ? `par ${l.inscrit_par}` : ''}
                  {l.inscrit_le ? `, le ${dateHeureFr(l.inscrit_le)}` : ''}
                </p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <label htmlFor={`ressaisi-${l.id}`} className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-medium">
                    <input
                      id={`ressaisi-${l.id}`}
                      type="checkbox"
                      checked={!!l.ressaisi_le}
                      disabled={enCours === l.id}
                      onChange={(e) =>
                        agir(l.id, () => appel('PUT', `/api/admin/competitions/${c.id}/inscriptions/${l.id}/ressaisi`, { ressaisi: e.target.checked }))
                      }
                      className="size-5 accent-brand"
                    />
                    Ressaisi sur le site fédéral
                  </label>
                  <button
                    type="button"
                    disabled={enCours === l.id}
                    onClick={() => agir(l.id, () => appel('DELETE', `/api/admin/competitions/${c.id}/inscriptions/${l.id}`))}
                    className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand disabled:opacity-60"
                  >
                    <Trash2 className="size-4" aria-hidden /> Retirer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="mt-3">
        <Alerte>{erreur}</Alerte>
      </div>
    </Bloc>
  )
}

function Identite({ ligne: l }: { ligne: LigneInscrit }) {
  return (
    <div>
      <p className="font-semibold">
        {l.nom.toUpperCase()} {l.prenom}
      </p>
      <p className="text-sm text-muted-foreground">
        {[l.categorie ?? 'Catégorie inconnue', dateFr(l.date_naissance), l.sexe, l.grade ?? 'ceinture ?', l.numero_licence ? `licence ${l.numero_licence}` : null]
          .filter(Boolean)
          .join(' · ')}
      </p>
      {l.alertes.length > 0 && (
        <p className="mt-1 flex items-start gap-1.5 text-sm font-medium text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {l.alertes.join(', ')}
        </p>
      )}
    </div>
  )
}

// --- Inscription par le bureau (à la place des parents) ---

function Candidats({ donnees, rafraichir }: PropsBloc) {
  const c = donnees.competition
  const [recherche, setRecherche] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState<number | null>(null)
  const q = recherche.trim().toLowerCase()
  const visibles = donnees.candidats.filter((l) => !q || `${l.prenom} ${l.nom} ${l.nom} ${l.prenom}`.toLowerCase().includes(q))

  async function inscrire(adherentId: number) {
    setEnCours(adherentId)
    setErreur('')
    try {
      await appel('PUT', `/api/admin/competitions/${c.id}/inscriptions/${adherentId}`)
      await rafraichir()
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Inscription impossible.')
    } finally {
      setEnCours(null)
    }
  }

  return (
    <Bloc titre="Inscrire un enfant">
      <p className="mb-3 text-sm text-muted-foreground">
        Adhérents des catégories de la compétition, pas encore inscrits. Le bureau peut inscrire à la place des parents, même après la date
        limite.
      </p>
      {donnees.candidats.length > 6 && (
        <div className="mb-3">
          <Champ id="candidats-recherche" libelle="Rechercher" valeur={recherche} onChange={setRecherche} />
        </div>
      )}
      {donnees.candidats.length === 0 ? (
        <p className="text-muted-foreground">Tous les adhérents concernés sont inscrits.</p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {visibles.map((l) => (
            <li key={l.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <Identite ligne={l} />
              <Bouton variante="secondaire" enCours={enCours === l.id} onClick={() => inscrire(l.id)}>
                <UserPlus className="size-4" aria-hidden /> Inscrire
              </Bouton>
            </li>
          ))}
          {visibles.length === 0 && <li className="px-4 py-4 text-center text-muted-foreground">Aucun adhérent ne correspond.</li>}
        </ul>
      )}
      <div className="mt-3">
        <Alerte>{erreur}</Alerte>
      </div>
    </Bloc>
  )
}

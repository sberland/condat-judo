import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Bloc, Espace } from '../../components/espace/Garde'
import { FormulaireAdherent } from '../../components/espace/FormulaireAdherent'
import { appel } from '../../lib/api'

export function AdherentNouveauPage() {
  const navigate = useNavigate()
  const client = useQueryClient()
  return (
    <Espace titre="Nouvel adhérent" retour={{ to: '/espace/adherents', libelle: 'Adhérents' }} roles={['bureau', 'admin']} aide="adherents">
      {() => (
        <Bloc titre="Identité">
          <FormulaireAdherent
            libelleValider="Créer l’adhérent"
            annuler={() => navigate({ to: '/espace/adherents' })}
            enregistrer={async (saisie) => {
              const { id } = await appel<{ id: number }>('POST', '/api/admin/adherents', saisie)
              await client.invalidateQueries({ queryKey: ['admin'] })
              // Étape suivante naturelle : ajouter ses responsables sur la fiche.
              navigate({ to: '/espace/adherents/$id', params: { id: String(id) } })
            }}
          />
        </Bloc>
      )}
    </Espace>
  )
}

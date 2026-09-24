import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ASSOCIATION, CLUB, EQUIPE } from '../content/club'
import { Container, PageHeader } from '../components/ui'
import { usePageMeta } from '../lib/usePageMeta'

export function MentionsLegalesPage() {
  usePageMeta('Mentions légales', 'Mentions légales et données personnelles du site du club Judo Condat-sur-Vienne.')

  return (
    <div className="animate-apparition">
      <PageHeader surtitre="Informations" titre="Mentions légales" />
      <Container className="max-w-3xl space-y-10 py-12 sm:py-16">
        <Bloc titre="Éditeur du site">
          <p>
            <strong className="text-foreground">{ASSOCIATION.denomination}</strong> — {ASSOCIATION.forme}, affiliée à
            France Judo.
          </p>
          <ul className="space-y-1">
            <li>Siège social : {ASSOCIATION.siege}</li>
            <li>N° RNA : {ASSOCIATION.rna}</li>
            <li>SIREN : {ASSOCIATION.siren}</li>
            <li>
              Lieu de pratique : {CLUB.dojo.nom}, {CLUB.dojo.adresse}, {CLUB.dojo.codePostal} {CLUB.dojo.ville}
            </li>
          </ul>
          <p>Directeur de la publication : {EQUIPE.bureau[0]?.nom}, président de l’association.</p>
          <p>
            Contact : via la{' '}
            <a href={CLUB.facebook} target="_blank" rel="noopener noreferrer" className="text-brand underline">
              page Facebook du club
            </a>
            .
          </p>
        </Bloc>

        <Bloc titre="Hébergement">
          <p>
            Cloudflare, Inc. — 101 Townsend St, San Francisco, CA 94107, États-Unis. Les données du
            site sont stockées dans l’Union européenne.
          </p>
        </Bloc>

        <Bloc titre="Données personnelles et cookies">
          <p>
            Pour ses visiteurs, ce site ne collecte aucune donnée personnelle, ne dépose aucun cookie
            et n’utilise aucun outil de mesure d’audience. Il ne charge aucune ressource d’un site
            tiers (polices, cartes, vidéos).
          </p>
          <p>
            Espace membres : les personnes à qui le bureau du club a ouvert un compte reçoivent, en se
            connectant, un unique cookie strictement nécessaire au maintien de leur connexion (6 mois
            au plus, sans usage publicitaire ni mesure d’audience). Ce que le club enregistre sur les
            adhérents et leurs familles, pour combien de temps, et comment exercer vos droits :{' '}
            <Link to="/donnees-personnelles" className="text-brand underline">
              page Données personnelles
            </Link>
            .
          </p>
          <p>
            Les liens vers des sites extérieurs (France Judo, Facebook, services de cartographie)
            s’ouvrent dans un nouvel onglet ; ces sites appliquent leur propre politique de
            confidentialité.
          </p>
        </Bloc>

        <Bloc titre="Crédits">
          <p>Logo et textes : {CLUB.nomComplet}.</p>
          <p>Code moral du judo et logo : France Judo — Fédération française de judo et disciplines associées.</p>
        </Bloc>
      </Container>
    </div>
  )
}

function Bloc({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight">{titre}</h2>
      <div className="mt-3 space-y-2 leading-relaxed text-muted-foreground">{children}</div>
    </section>
  )
}

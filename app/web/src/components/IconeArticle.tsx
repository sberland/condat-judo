import { BookOpen, CalendarDays, Camera, Clock, Droplets, FileText, Handshake, HeartPulse, IdCard, ShieldCheck, Shirt, Trophy, Users, Wallet, type LucideIcon } from 'lucide-react'
import { iconeArticle, type ArticleReglement, type IconeReglement } from '../content/contenu'

// Icône d'un article du règlement intérieur (spec 022) : choisie par le club, sinon d'après le titre.
const ICONES: Record<IconeReglement, LucideIcon> = {
  licence: IdCard,
  sante: HeartPulse,
  parents: Users,
  horaires: Clock,
  tenue: Shirt,
  dossier: FileText,
  hygiene: Droplets,
  competition: Trophy,
  saison: CalendarDays,
  securite: ShieldCheck,
  respect: Handshake,
  paiement: Wallet,
  image: Camera,
  autre: BookOpen,
}

export function IconeArticle({ article, className = 'size-5' }: { article: Pick<ArticleReglement, 'titre' | 'icone'>; className?: string }) {
  const Icone = ICONES[iconeArticle(article)]
  return <Icone className={className} aria-hidden />
}

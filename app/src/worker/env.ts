export type Environnement = 'production' | 'preview' | 'local';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  /** production | preview (wrangler.toml) ; local (.dev.vars). */
  ENVIRONMENT: Environnement;
  /** Domaine de l'équipe Cloudflare Zero Trust, ex. `<equipe>.cloudflareaccess.com`. */
  CF_ACCESS_TEAM_DOMAIN?: string;
  /** « Application Audience (AUD) Tag » de l'application Access de l'environnement. */
  CF_ACCESS_AUD?: string;
  /** Dev local uniquement : subject de l'utilisateur simulé (provider `dev`). */
  DEV_SUBJECT?: string;
}

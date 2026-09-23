export type Environnement = 'production' | 'preview' | 'local';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  /** production | preview (wrangler.toml) ; local (.dev.vars). */
  ENVIRONMENT: Environnement;
  /** Dev local uniquement : subject de l'utilisateur simulé (provider `dev`). */
  DEV_SUBJECT?: string;
}

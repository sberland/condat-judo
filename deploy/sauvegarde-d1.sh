#!/usr/bin/env bash
# ------------------------------------------------------------------------------
# sauvegarde-d1.sh — Sauvegarde chiffrée de la D1 de PROD (spec 007), exécutée par GitHub Actions
# (.github/workflows/sauvegarde.yml chaque nuit, .github/workflows/deploy.yml avant migration).
#
#   D1 prod ──(export, LECTURE SEULE)──▶ base.sql ──gzip──▶ ──age (clé publique)──▶ Release du
#   dépôt PRIVÉ de sauvegarde. Rien n'est jamais écrit en clair ailleurs que dans un dossier
#   temporaire du runner, supprimé en sortie ; rien n'est affiché du contenu (journaux publics).
#
# Usage : deploy/sauvegarde-d1.sh <nom>        (ex. quotidienne-2026-09-25, avant-migration-v0.7.0)
# Env   : CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID — export de la D1
#         SAUVEGARDE_CLE_PUBLIQUE — destinataire age (« age1… ») ; la clé privée n'est QUE chez le
#                                   porteur de projet (restauration : deploy/restaurer-sauvegarde.ps1)
#         GH_TOKEN               — jeton limité au dépôt de sauvegarde (Contents : lecture/écriture)
#         SAUVEGARDE_DEPOT       — ex. sberland/condat-judo-sauvegardes
# ------------------------------------------------------------------------------
set -euo pipefail

nom="${1:?nom de la sauvegarde attendu}"
: "${SAUVEGARDE_CLE_PUBLIQUE:?variable SAUVEGARDE_CLE_PUBLIQUE absente (cf. installation.md)}"
: "${GH_TOKEN:?secret SAUVEGARDE_TOKEN absent (cf. installation.md)}"
: "${SAUVEGARDE_DEPOT:?SAUVEGARDE_DEPOT absent}"

racine="$(cd "$(dirname "$0")/.." && pwd)"
travail="$(mktemp -d)"
trap 'rm -rf "$travail"' EXIT
fichier="condat-judo-${nom}.sql.gz.age"

echo "Export de la D1 de prod (lecture seule)…"
(cd "$racine/app" && npx wrangler d1 export condat-judo --remote --output "$travail/base.sql" >/dev/null)
taille=$(wc -c < "$travail/base.sql")
echo "Export : ${taille} octets."

gzip -9 "$travail/base.sql"
age -r "$SAUVEGARDE_CLE_PUBLIQUE" -o "$travail/$fichier" "$travail/base.sql.gz"
rm -f "$travail/base.sql.gz"

echo "Dépôt de ${fichier} dans ${SAUVEGARDE_DEPOT}…"
gh release create "$nom" "$travail/$fichier" --repo "$SAUVEGARDE_DEPOT" --title "$nom" \
  --notes "Sauvegarde chiffrée (age) de la D1 condat-judo — ${taille} octets avant compression."

# Contrôle : ne jamais se fier à la seule sortie de la commande précédente.
gh release view "$nom" --repo "$SAUVEGARDE_DEPOT" --json assets -q '.assets[].name' | grep -qx "$fichier"
echo "Sauvegarde ${nom} vérifiée."

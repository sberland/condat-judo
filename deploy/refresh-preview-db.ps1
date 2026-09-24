#Requires -Version 5.1
[CmdletBinding()]
param(
    # Ne relance pas l'export prod si un snapshot récent existe déjà (debug).
    [switch] $ReuseSnapshot,

    # Restaure ce fichier SQL existant dans la preview au lieu d'exporter la prod.
    [string] $SnapshotPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ------------------------------------------------------------------------------
# refresh-preview-db.ps1 — Recopie les données de PROD dans la D1 de PREVIEW.
#
#   PROD 'condat-judo'  --(export, LECTURE SEULE)-->  snapshot.sql
#   snapshot.sql        --(purge + import)--------->  PREVIEW 'condat-judo-preview'
#
# La prod n'est jamais modifiée : seul un 'd1 export' (lecture) est fait dessus.
# Toutes les écritures ciblent la D1 de preview.
#
# Prérequis :
#   - wrangler authentifié (npx wrangler login) ou $env:CLOUDFLARE_API_TOKEN défini (jeton de
#     COMPTE avec D1:Edit — un jeton utilisateur est refusé par 'd1 export').
#   - D1 'condat-judo-preview' créée, database_id renseigné dans app/wrangler.toml [env.preview].
#
# Le workflow GitHub '.github/workflows/preview.yml' fait la même chose à chaque push sur la
# branche 'preview'. Ce script sert au refresh manuel depuis un poste.
# ------------------------------------------------------------------------------

$RepoRoot = Split-Path -Parent $PSScriptRoot
$AppDir   = Join-Path $RepoRoot "app"
$Snapshot = if ($SnapshotPath) {
    (Resolve-Path -LiteralPath $SnapshotPath -ErrorAction Stop).Path
} else {
    Join-Path ([System.IO.Path]::GetTempPath()) "condat-judo-prod-snapshot.sql"
}

$ProdDb    = "condat-judo"
$PreviewDb = "condat-judo-preview"
# Tables à purger avant import (ordre = FK : enfants avant parents). À tenir à jour à chaque
# nouvelle table, comme db:reset:local (app/package.json) et .github/workflows/preview.yml.
$DropSql   = "DROP TABLE IF EXISTS journal_acces; DROP TABLE IF EXISTS purges; DROP TABLE IF EXISTS paiement_parts; DROP TABLE IF EXISTS paiements; DROP TABLE IF EXISTS inscriptions_competition; DROP TABLE IF EXISTS competitions; DROP TABLE IF EXISTS adhesions; DROP TABLE IF EXISTS sessions; DROP TABLE IF EXISTS liens_connexion; DROP TABLE IF EXISTS liens; DROP TABLE IF EXISTS personnes_autorisees; DROP TABLE IF EXISTS identites; DROP TABLE IF EXISTS user_roles; DROP TABLE IF EXISTS adherents; DROP TABLE IF EXISTS saisons; DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS d1_migrations;"
# Anonymisation de la copie (spec 008), après import + migrations — comme preview.yml.
$Anonymisation = "src/db/anonymisation-qualif.sql"

# Appel d'un exe natif (npx wrangler) : il écrit sur stderr même en cas de succès. Sous
# EAP=Stop, PS 5.1 en ferait une erreur terminante avant la lecture de $LASTEXITCODE.
function Invoke-Native {
    param([Parameter(Mandatory = $true)][scriptblock] $Command, [Parameter(Mandatory = $true)][string] $Description)
    $prevEAP = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & $Command 2>&1 | ForEach-Object { Write-Host $_ }
        if ($LASTEXITCODE -ne 0) { throw "$Description : échec (code $LASTEXITCODE)" }
    } finally {
        $ErrorActionPreference = $prevEAP
    }
}

Write-Host ""
Write-Host "=== Refresh D1 preview  (prod -> preview) ===" -ForegroundColor Cyan
Write-Host ""

Push-Location $AppDir
try {
    # 1. Export PROD (lecture seule) vers le snapshot.
    if ($SnapshotPath) {
        Write-Host "Utilisation du snapshot fourni : $Snapshot" -ForegroundColor Yellow
    } elseif ($ReuseSnapshot -and (Test-Path $Snapshot)) {
        Write-Host "Réutilisation du snapshot existant : $Snapshot" -ForegroundColor Yellow
    } else {
        Write-Host "1/5  Export de la prod ($ProdDb) — LECTURE SEULE..." -ForegroundColor Yellow
        Invoke-Native -Description "Export prod" -Command { npx wrangler d1 export $ProdDb --remote --output $Snapshot }
    }

    # 2. Purge de la D1 de preview.
    Write-Host "2/5  Purge de la D1 de preview ($PreviewDb)..." -ForegroundColor Yellow
    Invoke-Native -Description "Purge preview" -Command { npx wrangler d1 execute $PreviewDb --env preview --remote --yes --command $DropSql }

    # 3. Import du snapshot (sauté si la prod est encore vide).
    $hasData = Select-String -LiteralPath $Snapshot -Pattern '^(CREATE|INSERT)' -Quiet
    if ($hasData) {
        Write-Host "3/5  Import du snapshot dans la preview..." -ForegroundColor Yellow
        Invoke-Native -Description "Import preview" -Command { npx wrangler d1 execute $PreviewDb --env preview --remote --yes --file $Snapshot }
    } else {
        Write-Host "3/5  Snapshot prod vide — import sauté." -ForegroundColor Yellow
    }

    # 4. Migrations plus récentes que le snapshot prod.
    Write-Host "4/5  Application des migrations sur la preview..." -ForegroundColor Yellow
    Invoke-Native -Description "Migrations preview" -Command { npx wrangler d1 migrations apply $PreviewDb --env preview --remote }

    # 5. Anonymisation (spec 008) : familles et adhérents pseudonymisés, sessions et liens de la prod supprimés.
    Write-Host "5/5  Anonymisation de la copie de la prod..." -ForegroundColor Yellow
    Invoke-Native -Description "Anonymisation preview" -Command { npx wrangler d1 execute $PreviewDb --env preview --remote --yes --file $Anonymisation }
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "=== D1 preview synchronisée sur la prod. ===" -ForegroundColor Green
Write-Host ""

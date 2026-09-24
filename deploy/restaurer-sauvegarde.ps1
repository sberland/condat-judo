#Requires -Version 5.1
[CmdletBinding()]
param(
    # Nom de la sauvegarde (Release du dépôt privé), ex. quotidienne-2026-09-25.
    # Liste : gh release list --repo sberland/condat-judo-sauvegardes
    [Parameter(Mandatory = $true)]
    [string] $Nom,

    # Chemin de la clé PRIVÉE age (créée par age-keygen, gardée hors ligne par le porteur de projet).
    [Parameter(Mandatory = $true)]
    [string] $Cle,

    [string] $Depot = 'sberland/condat-judo-sauvegardes'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ------------------------------------------------------------------------------
# restaurer-sauvegarde.ps1 — Restaure une sauvegarde chiffrée de la prod (spec 007) dans la
# QUALIFICATION, pour tester la procédure (critère d'acceptation de la 007).
#
#   Release (dépôt privé) ──gh──▶ .sql.gz.age ──age -d (clé privée)──▶ .sql.gz ──gunzip──▶ .sql
#   ──▶ deploy/refresh-preview-db.ps1 -SnapshotPath : purge, import, migrations, ANONYMISATION (008)
#
# ⚠️ Jamais vers la prod : une restauration de prod (sinistre) se fait à la main, en connaissance
#    de cause (D1 Time Travel d'abord, cf. workflow-deploy-spe.md).
# Les fichiers déchiffrés (données réelles) sont supprimés en fin de script, même en cas d'erreur.
# Prérequis : gh authentifié (accès au dépôt privé), age installé (winget install FiloSottile.age),
# wrangler authentifié (npx wrangler login).
# ------------------------------------------------------------------------------

$RepoRoot = Split-Path -Parent $PSScriptRoot

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

if (-not (Get-Command age -ErrorAction SilentlyContinue)) { throw "age introuvable : winget install FiloSottile.age (puis rouvrir le terminal)" }
$Cle = (Resolve-Path -LiteralPath $Cle -ErrorAction Stop).Path

$Travail = Join-Path ([System.IO.Path]::GetTempPath()) ("condat-judo-restauration-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $Travail | Out-Null

Write-Host ""
Write-Host "=== Restauration de $Nom dans la QUALIF ===" -ForegroundColor Cyan
try {
    Write-Host "1/4  Téléchargement depuis $Depot..." -ForegroundColor Yellow
    Invoke-Native -Description "Téléchargement" -Command { gh release download $Nom --repo $Depot --pattern '*.age' --dir $Travail }
    $Chiffre = @(Get-ChildItem -LiteralPath $Travail -Filter '*.age')
    if ($Chiffre.Count -ne 1) { throw "Sauvegarde introuvable dans la Release $Nom" }

    Write-Host "2/4  Déchiffrement..." -ForegroundColor Yellow
    $Gz = Join-Path $Travail 'base.sql.gz'
    Invoke-Native -Description "Déchiffrement" -Command { age -d -i $Cle -o $Gz $Chiffre[0].FullName }

    Write-Host "3/4  Décompression..." -ForegroundColor Yellow
    $Sql = Join-Path $Travail 'base.sql'
    $Entree = [System.IO.File]::OpenRead($Gz)
    try {
        $Flux = New-Object System.IO.Compression.GZipStream($Entree, [System.IO.Compression.CompressionMode]::Decompress)
        $Sortie = [System.IO.File]::Create($Sql)
        try { $Flux.CopyTo($Sortie) } finally { $Sortie.Dispose(); $Flux.Dispose() }
    } finally { $Entree.Dispose() }

    Write-Host "4/4  Import dans la qualif (purge, import, migrations, anonymisation)..." -ForegroundColor Yellow
    & (Join-Path $RepoRoot 'deploy\refresh-preview-db.ps1') -SnapshotPath $Sql
}
finally {
    Remove-Item -LiteralPath $Travail -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "=== $Nom restaurée dans la qualif (anonymisée). Fichiers déchiffrés supprimés. ===" -ForegroundColor Green
Write-Host ""

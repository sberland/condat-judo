#Requires -Version 5.1
[CmdletBinding()]
param(
    [switch] $Deploy
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Build du front React (app/web/dist) + archive de release deploy/current/condat-judo-X.Y.Z.zip.
# Version = app/package.json (source unique). Le Worker sert web/dist (cf. app/wrangler.toml).
# -Deploy : wrangler deploy du Worker de PROD depuis app/ (la CI le fait aussi sur tag vX.Y.Z).

$RepoRoot   = Split-Path -Parent $PSScriptRoot
$AppDir     = Join-Path $RepoRoot "app"
$DistDir    = Join-Path $AppDir "web\dist"
$PublishDir = Join-Path $RepoRoot "publish"
$CurrentDir = Join-Path $PSScriptRoot "current"

$pkg     = Get-Content (Join-Path $AppDir "package.json") -Raw -Encoding UTF8 | ConvertFrom-Json
$Version = $pkg.version
$ZipName = "condat-judo-$Version.zip"
$ZipPath = Join-Path $CurrentDir $ZipName

# Appel d'un exe natif (npm, npx…) : ces outils écrivent sur stderr même en cas de succès.
# Sous EAP=Stop, PS 5.1 en ferait une erreur terminante avant la lecture de $LASTEXITCODE :
# on relâche l'EAP localement, on relaie la sortie et on se fie au seul code de sortie.
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
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Condat Judo — Publication v$Version" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# 1. Build du front React (produit app/web/dist).
Write-Host "Build du front React (npm run build:web)..." -ForegroundColor Yellow
Push-Location $AppDir
try {
    Invoke-Native -Description "Build du front" -Command { npm run build:web }
} finally {
    Pop-Location
}

# 2. Répertoire publish (build + CHANGELOG) puis archive de release.
if (Test-Path $PublishDir) { Remove-Item $PublishDir -Recurse -Force }
New-Item -ItemType Directory -Path $PublishDir | Out-Null
New-Item -ItemType Directory -Force -Path $CurrentDir | Out-Null

Copy-Item -Path "$DistDir\*" -Destination $PublishDir -Recurse
Copy-Item (Join-Path $RepoRoot "CHANGELOG.md") $PublishDir

Write-Host "Création de $ZipName..." -ForegroundColor Yellow
Remove-Item $ZipPath -ErrorAction SilentlyContinue
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($PublishDir, $ZipPath)

# Vérification finale — ne jamais se fier à la seule sortie console.
if (-not (Test-Path $ZipPath)) { throw "Échec silencieux : $ZipName absent de deploy\current\" }

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Archive créée : $ZipPath" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# 3. Déploiement Cloudflare Workers PROD (optionnel).
if ($Deploy) {
    Write-Host "Déploiement Cloudflare Workers PROD (wrangler deploy)..." -ForegroundColor Yellow
    Push-Location $AppDir
    try {
        Invoke-Native -Description "Déploiement Cloudflare Workers" -Command { npx wrangler deploy }
    } finally {
        Pop-Location
    }
    Write-Host ""
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  Déployé sur Cloudflare Workers (prod)" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
}

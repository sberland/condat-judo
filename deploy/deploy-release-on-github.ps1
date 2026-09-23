#Requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^\d+\.\d+\.\d+$')]
    [string] $Version
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Config ────────────────────────────────────────────────────────────────────────
$Repo        = "sberland/condat-judo"
$TagName     = "v$Version"
$RepoRoot    = Split-Path -Parent $PSScriptRoot
$CurrentDir  = Join-Path $PSScriptRoot "current"
$ChangelogMd = Join-Path $RepoRoot "CHANGELOG.md"
$PackageJson = Join-Path $RepoRoot "app\package.json"

# Artefacts attachés à la Release
$Artifacts = @("condat-judo-$Version.zip")

# ── Fonctions ─────────────────────────────────────────────────────────────────────

function Get-ChangelogSection {
    param([string]$Version, [string]$Path)
    if (-not (Test-Path $Path)) { return [pscustomobject]@{ Found = $false; Lines = @(); DateIso = "" } }
    $lines = Get-Content $Path -Encoding UTF8; $inSection = $false
    $section = [System.Collections.Generic.List[string]]::new(); $dateIso = ""
    foreach ($line in $lines) {
        if ($line -match "^## \[$([regex]::Escape($Version))\] — (\d{4}-\d{2}-\d{2})") {
            $inSection = $true; $dateIso = $Matches[1]; continue
        }
        if ($inSection) { if ($line -match "^## \[") { break }; $section.Add($line) }
    }
    while ($section.Count -gt 0 -and $section[$section.Count - 1] -match "^\s*$") { $section.RemoveAt($section.Count - 1) }
    return [pscustomobject]@{ Found = ($section.Count -gt 0); Lines = $section.ToArray(); DateIso = $dateIso }
}

# Appel d'un exe natif (gh, git) : ils écrivent sur stderr même en cas de succès. Sous
# EAP=Stop, PS 5.1 en ferait une erreur terminante avant la lecture de $LASTEXITCODE :
# on relâche l'EAP localement, on relaie la sortie et on renvoie le code de sortie.
function Invoke-Native {
    param([Parameter(Mandatory = $true)][scriptblock] $Command, [switch] $Quiet)
    $prevEAP = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        if ($Quiet) { & $Command 2>&1 | Out-Null } else { & $Command 2>&1 | ForEach-Object { Write-Host $_ } }
        return $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $prevEAP
    }
}

# gh : dans le PATH, sinon emplacement d'installation winget par défaut.
$Gh = (Get-Command gh -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source)
if (-not $Gh) { $Gh = "C:\Program Files\GitHub CLI\gh.exe" }
if (-not (Test-Path $Gh)) { throw "GitHub CLI (gh) introuvable — winget install --id GitHub.cli -e" }

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  GitHub Release $TagName ($Repo)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── Vérifications préalables ──────────────────────────────────────────────────────
$pkgVersion = (Get-Content $PackageJson -Raw -Encoding UTF8 | ConvertFrom-Json).version
if ($pkgVersion -ne $Version) {
    throw "Version demandée ($Version) ≠ app/package.json ($pkgVersion). Le workflow deploy.yml refuserait le tag."
}

$Missing = $Artifacts | Where-Object { -not (Test-Path (Join-Path $CurrentDir $_)) }
if ($Missing) {
    $Missing | ForEach-Object { Write-Host "  Manquant : $_" -ForegroundColor Red }
    throw "Artefacts manquants — lancer d'abord deploy\publish.ps1."
}

if ((Invoke-Native -Quiet -Command { & $Gh auth status }) -ne 0) {
    throw "gh n'est pas authentifié — gh auth login --hostname github.com --git-protocol https --web --scopes workflow"
}

# ── Extraction CHANGELOG.md ───────────────────────────────────────────────────────
Write-Host "Lecture de CHANGELOG.md..." -ForegroundColor Yellow
$cs = Get-ChangelogSection -Version $Version -Path $ChangelogMd
$releaseNotes = if ($cs.Found) { ($cs.Lines -join "`n").Trim() } else { "Release $TagName" }
if ($cs.Found) { Write-Host "  Section [$Version] trouvée." -ForegroundColor Green }
else           { Write-Host "  Avertissement : section [$Version] introuvable." -ForegroundColor Yellow }

# ── Tag git (le push du tag déclenche .github/workflows/deploy.yml) ──────────────
if (git -C $RepoRoot tag --list $TagName) {
    Write-Host "Tag $TagName déjà présent — tag existant utilisé." -ForegroundColor Yellow
} else {
    Write-Host "Création du tag $TagName..." -ForegroundColor Yellow
    git -C $RepoRoot tag -a $TagName -m "Release $TagName"
    if ($LASTEXITCODE -ne 0) { throw "Échec de création du tag $TagName." }
}
if ((Invoke-Native -Command { git -C $RepoRoot push origin $TagName }) -ne 0) {
    throw "Échec du push du tag $TagName."
}

# ── Release GitHub ────────────────────────────────────────────────────────────────
# Notes de version dans un fichier temporaire UTF-8 sans BOM (jamais de texte long ni de JSON
# en argument d'exe natif sous PS 5.1).
$NotesFile = Join-Path $CurrentDir "_release-notes-$Version.md"
[System.IO.File]::WriteAllText($NotesFile, $releaseNotes, [System.Text.UTF8Encoding]::new($false))
# @(...) obligatoire : avec un seul artefact, le pipeline renverrait une simple chaîne, et le
# splatting @AssetPaths la passerait à gh caractère par caractère (vu en v0.1.0 : « no matches
# found for `C` »).
$AssetPaths = @($Artifacts | ForEach-Object { Join-Path $CurrentDir $_ })

try {
    if ((Invoke-Native -Quiet -Command { & $Gh release view $TagName -R $Repo }) -eq 0) {
        Write-Host "Release $TagName déjà existante — ajout/remplacement des artefacts." -ForegroundColor Yellow
        if ((Invoke-Native -Command { & $Gh release upload $TagName @AssetPaths -R $Repo --clobber }) -ne 0) {
            throw "Échec de l'upload des artefacts sur la Release $TagName."
        }
    } else {
        Write-Host "Création de la Release GitHub..." -ForegroundColor Yellow
        $code = Invoke-Native -Command { & $Gh release create $TagName @AssetPaths -R $Repo --title $TagName --notes-file $NotesFile --verify-tag }
        if ($code -ne 0) { throw "Échec de création de la Release $TagName (code $code)." }
    }
} finally {
    Remove-Item $NotesFile -Force -ErrorAction SilentlyContinue
}

# ── Vérification finale — ne jamais se fier à la seule sortie console ─────────────
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try {
    $assetNames = & $Gh release view $TagName -R $Repo --json assets --jq '.assets[].name' 2>$null
    $viewCode = $LASTEXITCODE
} finally {
    $ErrorActionPreference = $prevEAP
}
if ($viewCode -ne 0) { throw "Release $TagName introuvable après création." }
foreach ($a in $Artifacts) {
    if (-not (@($assetNames) -contains $a)) { throw "Artefact $a absent de la Release $TagName." }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Release publiée et vérifiée" -ForegroundColor Green
Write-Host "  https://github.com/$Repo/releases/tag/$TagName" -ForegroundColor Green
Write-Host "  Déploiement prod : gh run list -R $Repo --workflow deploy.yml" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

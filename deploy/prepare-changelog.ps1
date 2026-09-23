#Requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^\d+\.\d+\.\d+$')]
    [string] $Version
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot     = Split-Path -Parent $PSScriptRoot
$ChangelogMd  = Join-Path $RepoRoot "CHANGELOG.md"
$MetierMd     = Join-Path $RepoRoot "workspace\docs\users-docs\changelog-metier.md"
$InstallMdSrc = Join-Path $RepoRoot "workspace\docs\install\installation.md"
$HashFile     = Join-Path $PSScriptRoot ".installation-md.sha256"

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Préparation release v$Version (pre-merge)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── Fonctions ────────────────────────────────────────────────────────────────────

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

function Format-MetierEntry {
    param([string[]]$Lines, [string]$Version, [string]$DateIso)
    try {
        $dt = [DateTime]::ParseExact($DateIso, "yyyy-MM-dd", [System.Globalization.CultureInfo]::InvariantCulture)
        $mois = @("","janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre")
        $dateFr = if ($dt.Day -eq 1) { "1er $($mois[$dt.Month]) $($dt.Year)" } else { "$($dt.Day) $($mois[$dt.Month]) $($dt.Year)" }
    } catch { $dateFr = $DateIso }
    $notesLines = [System.Collections.Generic.List[string]]::new(); $inNotes = $false
    foreach ($line in $Lines) {
        if ($line -match "^#### Notes client") { $inNotes = $true; continue }
        if ($inNotes) { if ($line -match "^#### ") { break }; $notesLines.Add($line) }
    }
    while ($notesLines.Count -gt 0 -and $notesLines[$notesLines.Count - 1] -match "^\s*$") { $notesLines.RemoveAt($notesLines.Count - 1) }
    if ($notesLines.Count -eq 0) { return $null }
    $sb = [System.Text.StringBuilder]::new()
    [void]$sb.AppendLine("## v$Version — $dateFr")
    foreach ($line in $notesLines) { [void]$sb.AppendLine($line) }
    [void]$sb.AppendLine(); [void]$sb.AppendLine("---"); [void]$sb.AppendLine()
    return $sb.ToString()
}

function Update-MetierChangelog {
    param([string]$Path, [string]$Entry, [string]$Version)
    $fileHeader = @"
# Condat Judo — Journal des nouveautés

Résumé des évolutions à destination des chefs de projet, clients et équipes support.
Pour le détail technique complet : CHANGELOG.md à la racine du projet.

---

"@
    if (-not (Test-Path $Path)) {
        $dir = Split-Path $Path -Parent
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
        [System.IO.File]::WriteAllText($Path, $fileHeader + $Entry, [System.Text.UTF8Encoding]::new($true))
        return $true
    }
    $existing = (Get-Content $Path -Raw -Encoding UTF8) -replace "`r`n", "`n"
    if ($existing -match "(?m)^## v$([regex]::Escape($Version)) —") { return $false }
    $marker = "---`n`n"; $idx = $existing.IndexOf($marker)
    $newContent = if ($idx -ge 0) { $existing.Substring(0, $idx + $marker.Length) + $Entry + $existing.Substring($idx + $marker.Length) } `
                  else { $existing.TrimEnd() + "`n`n---`n`n" + $Entry }
    [System.IO.File]::WriteAllText($Path, $newContent, [System.Text.UTF8Encoding]::new($true))
    return $true
}

# ── 1. changelog-metier.md ───────────────────────────────────────────────────────
Write-Host "1. changelog-metier.md" -ForegroundColor Yellow
$changelogSection = Get-ChangelogSection -Version $Version -Path $ChangelogMd
if (-not $changelogSection.Found) {
    Write-Warning "Section [$Version] introuvable dans CHANGELOG.md — changelog-metier.md non mis à jour."
} else {
    $metierEntry = Format-MetierEntry -Lines $changelogSection.Lines -Version $Version -DateIso $changelogSection.DateIso
    if (-not $metierEntry) {
        Write-Host "   Section '#### Notes client' absente — changelog-metier.md non mis à jour." -ForegroundColor Yellow
    } else {
        $inserted = Update-MetierChangelog -Path $MetierMd -Entry $metierEntry -Version $Version
        if ($inserted) { Write-Host "   Mis à jour : $MetierMd" -ForegroundColor Green }
        else            { Write-Host "   Version v$Version déjà présente — ignorée." -ForegroundColor Yellow }
    }
}

# ── 2. .installation-md.sha256 ───────────────────────────────────────────────────
Write-Host "2. .installation-md.sha256" -ForegroundColor Yellow
if (-not (Test-Path $InstallMdSrc)) {
    Write-Warning "   $InstallMdSrc introuvable — sha256 non mis à jour."
} else {
    $currentHash = (Get-FileHash $InstallMdSrc -Algorithm SHA256).Hash
    $storedHash  = if (Test-Path $HashFile) { (Get-Content $HashFile -Raw -Encoding UTF8).Trim() } else { "" }
    if ($currentHash -ne $storedHash) {
        $currentHash | Set-Content $HashFile -Encoding UTF8 -NoNewline
        Write-Host "   Mis à jour : $HashFile" -ForegroundColor Green
    } else { Write-Host "   Inchangé (installation.md n'a pas évolué)." -ForegroundColor Green }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Prochaines étapes :" -ForegroundColor Cyan
Write-Host "  git add workspace/docs/users-docs/changelog-metier.md" -ForegroundColor Cyan
Write-Host "  git add deploy/.installation-md.sha256" -ForegroundColor Cyan
Write-Host "  git commit -m `"docs(release): préparer changelog-metier pour v$Version`"" -ForegroundColor Cyan
Write-Host "  Puis pousser la branche et créer la PR." -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

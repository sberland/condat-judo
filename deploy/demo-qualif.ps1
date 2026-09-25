#Requires -Version 5.1
[CmdletBinding()]
param(
    # Base visée : preview (qualif, par défaut) ou local. Jamais la production.
    [ValidateSet('preview', 'local')]
    [string] $Cible = 'preview'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ------------------------------------------------------------------------------
# demo-qualif.ps1 — Données de démonstration (spec 024).
#
# Charge le jeu de données FICTIF app/src/db/demo-qualif.sql dans la qualif (ou en local), puis
# crée les liens de connexion des deux comptes de démo : l'administrateur et le parent.
#
# À relancer après chaque déploiement de la qualif (elle est recopiée de la prod à chaque push
# sur preview) et le jour de la démo : les dates sont relatives au jour du chargement, les liens
# valables 7 jours et à usage unique. Relançable : le jeu de démo précédent est d'abord supprimé.
# ------------------------------------------------------------------------------

$RepoRoot = Split-Path -Parent $PSScriptRoot
$AppDir   = Join-Path $RepoRoot "app"
$Fichier  = 'src/db/demo-qualif.sql'

switch ($Cible) {
    'local'   { $Base = @('condat-judo', '--local');                              $Url = 'http://localhost:8789' }
    'preview' { $Base = @('condat-judo-preview', '--env', 'preview', '--remote'); $Url = 'https://condat-judo-preview.sebastien-berland.workers.dev' }
}

# npx wrangler écrit sur stderr même en cas de succès : sous EAP=Stop, PS 5.1 en ferait une erreur
# terminante. EAP local 'Continue', sortie affichée seulement en cas d'échec.
function Invoke-Native {
    param([Parameter(Mandatory = $true)][string[]] $Arguments, [Parameter(Mandatory = $true)][string] $Description)
    $prevEAP = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $tout = @(& npx @Arguments 2>&1)
        $code = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $prevEAP
    }
    if ($code -ne 0) {
        $tout | ForEach-Object { Write-Host $_ }
        throw "$Description : échec (code $code)"
    }
}

Write-Host ""
Write-Host "=== Données de démo — $Cible ===" -ForegroundColor Cyan

Push-Location $AppDir
try {
    Invoke-Native -Arguments (@('wrangler', 'd1', 'execute') + $Base + @('--yes', "--file=$Fichier")) -Description "Chargement des données de démo"
} finally {
    Pop-Location
}
Write-Host "Données de démo chargées (fictives, comptes @demo.test)." -ForegroundColor Green

# Liens de connexion des deux comptes de démo (même script que pour les testeurs).
$Comptes = @(
    @{ Email = 'alex.durand@demo.test';    Profil = 'Administrateur — Alex Durand' },
    @{ Email = 'camille.martin@demo.test'; Profil = 'Parent — Camille Martin, maman de Léo' }
)
foreach ($Compte in $Comptes) {
    Write-Host ""
    Write-Host "--- $($Compte.Profil) ---" -ForegroundColor Cyan
    $Parametres = @{ Email = $Compte.Email; Cible = $Cible }
    & (Join-Path $PSScriptRoot 'lien-connexion.ps1') @Parametres
}

$Mercredi = (Get-Date).AddDays(((3 - [int](Get-Date).DayOfWeek) + 7) % 7).ToString('d MMMM', [System.Globalization.CultureInfo]::GetCultureInfo('fr-FR'))
Write-Host ""
Write-Host "=== Ouvrir les trois vues depuis ce poste ===" -ForegroundColor Cyan
Write-Host "  Un profil de navigateur par vue (Edge : icône de profil -> Ajouter un profil) :"
Write-Host "    « Démo admin »  : ouvrir le lien de l'administrateur"
Write-Host "    « Démo parent » : ouvrir le lien de Camille Martin"
Write-Host "    « Démo public » : $Url (sans lien)"
if ($Cible -eq 'local') {
    Write-Host "  En local : liens sur :5173 à ouvrir en remplaçant le port par 8789 (worker sans utilisateur simulé)." -ForegroundColor Yellow
} else {
    Write-Host "  Chaque profil passe une fois le verrou Cloudflare Access de la qualif (code reçu par e-mail)."
}
Write-Host "  Garderie : Mon espace -> Mercredi du jour -> mercredi $Mercredi (Emma récupérée, Chloé absente, Léo et Hugo à pointer)."
Write-Host ""

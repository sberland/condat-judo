#Requires -Version 5.1
[CmdletBinding()]
param(
    # E-mail d'un compte existant (non supprimé) : le lien connectera à CE compte.
    [Parameter(Mandatory = $true)]
    [string] $Email,

    # Base visée : local (D1 locale, front http://localhost:5173), preview (qualif) ou production.
    [ValidateSet('local', 'preview', 'production')]
    [string] $Cible = 'local'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ------------------------------------------------------------------------------
# lien-connexion.ps1 — Crée un lien de connexion personnel (spec 005a) pour un compte.
#
# Sert quand personne ne peut encore en créer depuis l'application : premier administrateur en
# production, testeurs en qualification, essais en local. Ensuite, les liens se créent depuis
# « Mon espace → Comptes ».
#
# Comme dans l'application : usage unique, valable 7 jours, annule les liens encore en attente du
# compte ; seule l'empreinte SHA-256 du jeton est écrite en base.
# ⚠️ Le lien affiché donne accès au compte : le remettre uniquement à la personne concernée.
# ------------------------------------------------------------------------------

$RepoRoot = Split-Path -Parent $PSScriptRoot
$AppDir   = Join-Path $RepoRoot "app"

# Format strict : l'e-mail entre dans une requête SQL (et passe par cmd.exe via npx).
$Email = $Email.Trim().ToLowerInvariant()
if ($Email -notmatch '^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$') { throw "E-mail invalide : $Email" }

switch ($Cible) {
    'local'      { $Base = @('condat-judo', '--local');                              $Url = 'http://localhost:5173' }
    'preview'    { $Base = @('condat-judo-preview', '--env', 'preview', '--remote'); $Url = 'https://condat-judo-preview.sebastien-berland.workers.dev' }
    'production' { $Base = @('condat-judo', '--remote');                             $Url = 'https://condat-judo.sebastien-berland.workers.dev' }
}

# Jeton aléatoire de 256 bits en base64url sans remplissage (même format que app/src/worker/session.ts).
$Octets = New-Object byte[] 32
$Rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try { $Rng.GetBytes($Octets) } finally { $Rng.Dispose() }
$Jeton = [Convert]::ToBase64String($Octets).TrimEnd('=').Replace('+', '-').Replace('/', '_')

$Sha = [System.Security.Cryptography.SHA256]::Create()
try {
    $Empreinte = -join @($Sha.ComputeHash([System.Text.Encoding]::ASCII.GetBytes($Jeton)) | ForEach-Object { $_.ToString('x2') })
} finally { $Sha.Dispose() }

$Compte = "SELECT id FROM users WHERE email = '$Email' AND supprime_le IS NULL"
$Sql = "UPDATE liens_connexion SET annule_le = datetime('now') WHERE user_id IN ($Compte) AND utilise_le IS NULL AND annule_le IS NULL; " +
       "INSERT INTO liens_connexion (empreinte, user_id, expire_le) SELECT '$Empreinte', id, datetime('now', '+7 days') FROM users WHERE email = '$Email' AND supprime_le IS NULL; " +
       "SELECT count(*) AS cree FROM liens_connexion WHERE empreinte = '$Empreinte';"

# npx wrangler écrit sur stderr même en cas de succès : sous EAP=Stop, PS 5.1 en ferait une erreur
# terminante. EAP local 'Continue', stdout (JSON) séparé de stderr (affiché seulement en cas d'échec).
function Invoke-NativeJson {
    param([Parameter(Mandatory = $true)][string[]] $Arguments, [Parameter(Mandatory = $true)][string] $Description)
    $prevEAP = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $tout = @(& npx @Arguments 2>&1)
        $code = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $prevEAP
    }
    $stdout = @($tout | Where-Object { $_ -isnot [System.Management.Automation.ErrorRecord] })
    if ($code -ne 0) {
        $tout | ForEach-Object { Write-Host $_ }
        throw "$Description : échec (code $code)"
    }
    return ($stdout -join "`n")
}

Write-Host ""
Write-Host "=== Lien de connexion — $Email ($Cible) ===" -ForegroundColor Cyan

Push-Location $AppDir
try {
    $Arguments = @(@('wrangler', 'd1', 'execute') + $Base + @('--yes', '--json', '--command', $Sql))
    $Resultats = @(Invoke-NativeJson -Arguments $Arguments -Description "Création du lien" | ConvertFrom-Json)
} finally {
    Pop-Location
}

# Dernière instruction : le lien a-t-il bien été créé (compte trouvé) ?
$Cree = @($Resultats)[-1].results[0].cree
if ($Cree -ne 1) {
    throw "Aucun compte actif avec l'e-mail $Email dans la base '$Cible' : créez d'abord le compte (cf. installation.md)."
}

Write-Host ""
Write-Host "Lien créé (usage unique, valable 7 jours) :" -ForegroundColor Green
Write-Host ""
Write-Host "  $Url/connexion#$Jeton"
Write-Host ""
Write-Host "À remettre uniquement à la personne concernée : il ouvre une session sur son compte." -ForegroundColor Yellow
Write-Host ""

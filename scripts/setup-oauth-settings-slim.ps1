# --------------------------------------------------------------------------
# Interactive script to configure OAuth identity-provider secrets in
# Azure Key Vault.  Opens the relevant web portals so you can create
# OAuth apps / credentials, then stores all six values as Key Vault
# secrets via the Azure CLI.
# --------------------------------------------------------------------------

$ErrorActionPreference = "Stop"

function Write-Divider {
    Write-Host ("─" * 68)
}

function Read-NonEmpty {
    param([string]$Label)
    do {
        $value = Read-Host "  $Label"
        if ([string]::IsNullOrWhiteSpace($value)) {
            Write-Host "  Error: value cannot be empty." -ForegroundColor Red
        }
    } while ([string]::IsNullOrWhiteSpace($value))
    return $value.Trim()
}

Write-Host "Fetching your Key Vaults..."
$kvJson = az keyvault list --query "[].{name:name, rg:resourceGroup, uri:properties.vaultUri}" -o json 2>$null | ConvertFrom-Json

if (-not $kvJson -or $kvJson.Count -eq 0) {
    Write-Host "No Key Vaults found in the current subscription."
    Write-Host "Make sure you're logged in (az login) and using the right subscription."
    exit 1
}

if ($kvJson.Count -eq 1) {
    $selectedKv = $kvJson[0]
    Write-Host "  Found one vault: " -NoNewline
    Write-Host "$($selectedKv.name)" -ForegroundColor Green -NoNewline
    Write-Host " ($($selectedKv.uri))"
} else {
    Write-Host "  Available Key Vaults:"
    for ($i = 0; $i -lt $kvJson.Count; $i++) {
        Write-Host "    $($i + 1)) " -ForegroundColor Green -NoNewline
        Write-Host "$($kvJson[$i].name)  " -NoNewline
        Write-Host "($($kvJson[$i].uri))" -ForegroundColor DarkGray
    }
    Write-Host ""
    $choice = Read-Host "  Select [1-$($kvJson.Count)]"
    $idx = [int]$choice - 1
    if ($idx -lt 0 -or $idx -ge $kvJson.Count) {
        Write-Host "Invalid selection." -ForegroundColor Red
        exit 1
    }
    $selectedKv = $kvJson[$idx]
}

$KvName = $selectedKv.name

Write-Host ""
Write-Host "  Vault: " -NoNewline; Write-Host $KvName -ForegroundColor Green
Write-Host ""

$secrets = @{
    "GITHUB-CLIENT-ID"     = $GitHubClientId
    "GITHUB-CLIENT-SECRET" = $GitHubClientSecret
    "GOOGLE-CLIENT-ID"     = $GoogleClientId
    "GOOGLE-CLIENT-SECRET" = $GoogleClientSecret
    "AAD-CLIENT-ID"        = $AadClientId
    "AAD-CLIENT-SECRET"    = $AadClientSecret
}

$failed = $false
foreach ($entry in $secrets.GetEnumerator()) {
    Write-Host "  Setting $($entry.Key)..." -NoNewline
    az keyvault secret set `
        --vault-name $KvName `
        --name $entry.Key `
        --value $entry.Value `
        --output none 2>&1 | Out-Null

    if ($LASTEXITCODE -ne 0) {
        Write-Host " FAILED" -ForegroundColor Red
        $failed = $true
    } else {
        Write-Host " OK" -ForegroundColor Green
    }
}

if ($failed) {
    Write-Host ""
    Write-Host "One or more secrets failed to set. Check your Key Vault access policies." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Divider
Write-Host "Done! " -ForegroundColor Green -NoNewline; Write-Host "All 6 OAuth secrets have been stored in Key Vault."
Write-Divider
Write-Host ""

$kvId = az keyvault show --name $KvName --query id -o tsv 2>$null
Write-Host "  Verify at: " -NoNewline
Write-Host "https://portal.azure.com/#resource${kvId}/secrets" -ForegroundColor Cyan
Write-Host ""

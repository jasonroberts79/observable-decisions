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

# ------------------------------------------------------------------
# Step 0: Pick the Static Web App
# ------------------------------------------------------------------
Write-Divider
Write-Host "Step 0: Select your Azure Static Web App" -ForegroundColor White -NoNewline; Write-Host ""
Write-Divider

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Azure CLI (az) is not installed. Install from https://aka.ms/install-az-cli" -ForegroundColor Red
    exit 1
}

Write-Host "Fetching your Static Web Apps..."
$swaJson = az staticwebapp list --query "[].{name:name, rg:resourceGroup, hostname:defaultHostname}" -o json 2>$null | ConvertFrom-Json

if (-not $swaJson -or $swaJson.Count -eq 0) {
    Write-Host "No Static Web Apps found in the current subscription."
    Write-Host "Make sure you're logged in (az login) and using the right subscription."
    exit 1
}

if ($swaJson.Count -eq 1) {
    $selected = $swaJson[0]
    Write-Host "  Found one app: " -NoNewline
    Write-Host "$($selected.name)" -ForegroundColor Green -NoNewline
    Write-Host " ($($selected.hostname))"
} else {
    Write-Host "  Available Static Web Apps:"
    for ($i = 0; $i -lt $swaJson.Count; $i++) {
        Write-Host "    $($i + 1)) " -ForegroundColor Green -NoNewline
        Write-Host "$($swaJson[$i].name)  " -NoNewline
        Write-Host "($($swaJson[$i].hostname))" -ForegroundColor DarkGray
    }
    Write-Host ""
    $choice = Read-Host "  Select [1-$($swaJson.Count)]"
    $idx = [int]$choice - 1
    if ($idx -lt 0 -or $idx -ge $swaJson.Count) {
        Write-Host "Invalid selection." -ForegroundColor Red
        exit 1
    }
    $selected = $swaJson[$idx]
}

$SwaName = $selected.name
$SwaRg   = $selected.rg
$SwaHost = $selected.hostname
$CallbackBase = "https://$SwaHost"

Write-Host ""
Write-Host "  App:      " -NoNewline; Write-Host $SwaName -ForegroundColor Green
Write-Host "  Hostname: " -NoNewline; Write-Host $SwaHost -ForegroundColor Green
Write-Host ""

# ------------------------------------------------------------------
# Step 0b: Pick the Key Vault
# ------------------------------------------------------------------
Write-Divider
Write-Host "Step 0b: Select your Azure Key Vault" -ForegroundColor White -NoNewline; Write-Host ""
Write-Divider

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

# ------------------------------------------------------------------
# Step 1: GitHub OAuth App
# ------------------------------------------------------------------
Write-Divider
Write-Host "Step 1: GitHub OAuth App" -ForegroundColor White
Write-Divider
Write-Host ""
Write-Host "  Opening GitHub OAuth app creation page..."
Write-Host ""
Write-Host "  Fill in the form with:"
Write-Host "    Application name: " -NoNewline; Write-Host "Observable Decisions" -ForegroundColor DarkGray
Write-Host "    Homepage URL:     " -NoNewline; Write-Host $CallbackBase -ForegroundColor DarkGray
Write-Host "    Callback URL:     " -NoNewline; Write-Host "$CallbackBase/.auth/login/github/callback" -ForegroundColor DarkGray
Write-Host ""
Read-Host "  Press Enter to open the page"
Start-Process "https://github.com/settings/applications/new"
Write-Host ""
Write-Host "  After creating the app, copy the Client ID and generate a Client Secret."
Write-Host ""

$GitHubClientId     = Read-NonEmpty "GitHub Client ID"
$GitHubClientSecret = Read-NonEmpty "GitHub Client Secret"
Write-Host ""

# ------------------------------------------------------------------
# Step 2: Google OAuth 2.0 Credentials
# ------------------------------------------------------------------
Write-Divider
Write-Host "Step 2: Google OAuth 2.0 Credentials" -ForegroundColor White
Write-Divider
Write-Host ""
Write-Host "  Opening Google Cloud Console credentials page..."
Write-Host ""
Write-Host "  Steps:"
Write-Host "    1. Select or create a project"
Write-Host "    2. If prompted, configure the OAuth consent screen first"
Write-Host "    3. Click " -NoNewline; Write-Host "+ Create Credentials" -ForegroundColor White -NoNewline; Write-Host " > " -NoNewline; Write-Host "OAuth client ID" -ForegroundColor White
Write-Host "    4. Application type: " -NoNewline; Write-Host "Web application" -ForegroundColor White
Write-Host "    5. Add authorized redirect URI:"
Write-Host "       $CallbackBase/.auth/login/google/callback" -ForegroundColor DarkGray
Write-Host ""
Read-Host "  Press Enter to open the page"
Start-Process "https://console.cloud.google.com/apis/credentials"
Write-Host ""
Write-Host "  After creating, copy the Client ID and Client Secret."
Write-Host ""

$GoogleClientId     = Read-NonEmpty "Google Client ID"
$GoogleClientSecret = Read-NonEmpty "Google Client Secret"
Write-Host ""

# ------------------------------------------------------------------
# Step 3: Azure AD App Registration
# ------------------------------------------------------------------
Write-Divider
Write-Host "Step 3: Azure AD App Registration" -ForegroundColor White
Write-Divider
Write-Host ""
Write-Host "  Opening Azure AD app registration page..."
Write-Host ""
Write-Host "  Steps:"
Write-Host "    1. Name: " -NoNewline; Write-Host "Observable Decisions" -ForegroundColor White
Write-Host "    2. Supported account types: choose based on your needs"
Write-Host "       (""Accounts in any organizational directory"" for multi-tenant)" -ForegroundColor DarkGray
Write-Host "    3. Redirect URI > Web:"
Write-Host "       $CallbackBase/.auth/login/aad/callback" -ForegroundColor DarkGray
Write-Host "    4. Click " -NoNewline; Write-Host "Register" -ForegroundColor White
Write-Host "    5. Copy the " -NoNewline; Write-Host "Application (client) ID" -ForegroundColor White -NoNewline; Write-Host " from the overview"
Write-Host "    6. Go to " -NoNewline; Write-Host "Certificates & secrets" -ForegroundColor White -NoNewline; Write-Host " > " -NoNewline; Write-Host "New client secret" -ForegroundColor White
Write-Host ""
Read-Host "  Press Enter to open the page"
Start-Process "https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/CreateApplicationBlade"
Write-Host ""
Write-Host "  After creating, copy the Application (client) ID and the client secret value."
Write-Host ""

$AadClientId     = Read-NonEmpty "AAD Client ID"
$AadClientSecret = Read-NonEmpty "AAD Client Secret"
Write-Host ""

# ------------------------------------------------------------------
# Step 4: Store secrets in Azure Key Vault
# ------------------------------------------------------------------
Write-Divider
Write-Host "Step 4: Storing secrets in Key Vault " -NoNewline; Write-Host $KvName -ForegroundColor Green
Write-Divider
Write-Host ""
Write-Host "  Creating 6 secrets in Key Vault..."
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

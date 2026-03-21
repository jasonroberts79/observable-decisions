# --------------------------------------------------------------------------
# Interactive script to configure OAuth identity-provider secrets for an
# Azure Static Web App.  Opens the relevant web portals so you can create
# OAuth apps / credentials, then sets all six values via the Azure CLI.
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
# Step 4: Apply all settings via Azure CLI
# ------------------------------------------------------------------
Write-Divider
Write-Host "Step 4: Applying settings to " -NoNewline; Write-Host $SwaName -ForegroundColor Green
Write-Divider
Write-Host ""
Write-Host "  Setting 6 app settings via Azure CLI..."
Write-Host ""

az staticwebapp appsettings set `
    --name $SwaName `
    --resource-group $SwaRg `
    --setting-names `
        "GITHUB_CLIENT_ID=$GitHubClientId" `
        "GITHUB_CLIENT_SECRET=$GitHubClientSecret" `
        "GOOGLE_CLIENT_ID=$GoogleClientId" `
        "GOOGLE_CLIENT_SECRET=$GoogleClientSecret" `
        "AAD_CLIENT_ID=$AadClientId" `
        "AAD_CLIENT_SECRET=$AadClientSecret" `
    --output table

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Failed to set app settings. Check the error above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Divider
Write-Host "Done! " -ForegroundColor Green -NoNewline; Write-Host "All 6 OAuth settings have been configured."
Write-Divider
Write-Host ""

$swaId = az staticwebapp show --name $SwaName --resource-group $SwaRg --query id -o tsv 2>$null
Write-Host "  Verify at: " -NoNewline
Write-Host "https://portal.azure.com/#resource${swaId}/environmentVariables" -ForegroundColor Cyan
Write-Host ""

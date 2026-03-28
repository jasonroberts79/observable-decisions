# =============================================================================
# Container Registry
# =============================================================================

resource "azurerm_container_registry" "main" {
  # Name must be globally unique and alphanumeric only — change if already taken
  name                = "observabledecisions"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location_primary
  sku                 = "Basic"
  admin_enabled       = false

  tags = {}
}

# Allow GitHub Actions to push images
resource "azurerm_role_assignment" "gha_acr_push" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPush"
  principal_id         = azurerm_user_assigned_identity.gha_obs_decisions.principal_id
}

# Allow App Service managed identity to pull images
resource "azurerm_role_assignment" "app_service_acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_linux_web_app.observable_api.identity[0].principal_id
}

# =============================================================================
# App Service Plan (B1 — upgrade to S1+ to enable VNet integration)
# =============================================================================

resource "azurerm_service_plan" "api" {
  name                = "ASP-observable-api"
  location            = var.location_primary
  resource_group_name = azurerm_resource_group.main.name
  os_type             = "Linux"
  sku_name            = "F1"

  tags = {}
}

# =============================================================================
# App Service: observable-api
# =============================================================================

resource "azurerm_linux_web_app" "observable_api" {
  name                = "observable-api"
  location            = var.location_primary
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.api.id
  https_only          = true

  identity {
    type = "SystemAssigned"
  }

  app_settings = {
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.observable_decisions.connection_string
    "AZURE_STORAGE_CONNECTION_STRING"       = azurerm_storage_account.decisions.primary_connection_string
    "AZURE_STORAGE_CONTAINER"               = "decisions"
    "WEBSITES_PORT"                         = "8000"
  }

  site_config {
    minimum_tls_version                     = "1.2"
    http2_enabled                           = true
    container_registry_use_managed_identity = true

    application_stack {
      docker_image_name   = "observable-api:latest"
      docker_registry_url = "https://${azurerm_container_registry.main.login_server}"
    }
  }

  tags = {
    "hidden-link: /app-insights-resource-id" = azurerm_application_insights.observable_decisions.id
  }

  lifecycle {
    ignore_changes = [
      # Updated on every deploy — managed by CI/CD
      site_config[0].application_stack[0].docker_image_name,
    ]
  }
}

# =============================================================================
# Static Web App: observable-decisions (note: original name has typo)
# =============================================================================

resource "azurerm_static_web_app" "observable_decisions" {
  name                = "observable-decisions"
  location            = var.location_primary
  resource_group_name = azurerm_resource_group.main.name
  sku_tier            = "Standard"
  sku_size            = "Standard"
  identity {
    type = "SystemAssigned"
  }
  app_settings = {
    "GITHUB_CLIENT_ID" = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=GITHUB-CLIENT-ID)"
    "GITHUB_CLIENT_SECRET" = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=GITHUB-CLIENT-SECRET)"
    "GOOGLE_CLIENT_ID" = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=GOOGLE-CLIENT-ID)"
    "GOOGLE_CLIENT_SECRET" = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=GOOGLE-CLIENT-SECRET)"
    "AAD_CLIENT_ID" = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=AAD-CLIENT-ID)"
    "AAD_CLIENT_SECRET" = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=AAD-CLIENT-SECRET)"
  }
  tags = {}
  lifecycle {
    ignore_changes = [ repository_branch, repository_url ]
  }
}

# =============================================================================
# App Service Plan (Flex Consumption)
# =============================================================================

resource "azurerm_service_plan" "functions" {
  name                = "ASP-myResourceGroup-932d"
  location            = var.location_primary
  resource_group_name = azurerm_resource_group.main.name
  os_type             = "Linux"
  sku_name            = "FC1"

  tags = {}
}

# =============================================================================
# Function App: observable-api (Python 3.13, Flex Consumption)
# =============================================================================
resource "azurerm_function_app_flex_consumption" "observable_api" {
  app_settings                       = {
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.observable_decisions.connection_string
    "AZURE_STORAGE_CONNECTION_STRING"       = azurerm_storage_account.decisions.primary_connection_string
    "AZURE_STORAGE_CONTAINER"               = "decisions"
  }
  client_certificate_enabled         = false  
  client_certificate_mode            = "Required"
  enabled                            = true
  https_only                         = true
  instance_memory_in_mb              = 512
  location                           = var.location_primary
  maximum_instance_count             = 100
  name                               = "observable-api"
  public_network_access_enabled      = true
  resource_group_name                = azurerm_resource_group.main.name
  runtime_name                       = "python"
  runtime_version                    = "3.13"
  service_plan_id                    = azurerm_service_plan.functions.id
  storage_access_key                 = azurerm_storage_account.decisions.primary_access_key
  storage_authentication_type        = "StorageAccountConnectionString"
  storage_container_endpoint         = "${azurerm_storage_account.decisions.primary_blob_endpoint}${azurerm_storage_container.decisions.name}"
  storage_container_type             = "blobContainer"
  tags = {
    "hidden-link: /app-insights-resource-id" = azurerm_application_insights.observable_decisions.id
  }
  virtual_network_subnet_id                      = azurerm_subnet.app.id
  webdeploy_publish_basic_authentication_enabled = true  
  site_config {
    container_registry_use_managed_identity       = false
    default_documents                             = ["Default.htm", "Default.html", "Default.asp", "index.htm", "index.html", "iisstart.htm", "default.aspx", "index.php"]
    elastic_instance_minimum                      = 0
    http2_enabled                                 = true
    ip_restriction_default_action                 = "Deny"
    load_balancing_mode                           = "LeastRequests"
    managed_pipeline_mode                         = "Integrated"
    minimum_tls_version                           = "1.2"
    remote_debugging_enabled                      = false
    runtime_scale_monitoring_enabled              = false
    scm_ip_restriction_default_action             = "Allow"
    scm_minimum_tls_version                       = "1.2"
    scm_use_main_ip_restriction                   = false
    use_32_bit_worker                             = false
    vnet_route_all_enabled                        = true
    websockets_enabled                            = false
    worker_count                                  = 1
    cors {
      allowed_origins     = ["https://portal.azure.com"]
      support_credentials = false
    }
  }
  lifecycle {
    ignore_changes = [
      # Deployment-managed settings that change on each deploy
      app_settings["AzureWebJobsStorage"],
      site_config["application_insights_connection_string"]
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

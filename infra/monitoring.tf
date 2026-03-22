# =============================================================================
# Application Insights: observable-decisions (eastus2, linked to external default workspace)
# =============================================================================

resource "azurerm_application_insights" "observable_decisions" {
  name                = "observable-decisions"
  location            = var.location_primary
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.alaw.id
  application_type    = "web"

  tags = {
    status = "prototype"
  }
}

resource "azurerm_log_analytics_workspace" "alaw" {
  name                = "alaw"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}
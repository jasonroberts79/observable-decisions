resource "azurerm_key_vault" "main" {
  name                        = "jasonr-dev-keyvault"
  location                    = var.location_secondary
  resource_group_name         = azurerm_resource_group.main.name
  tenant_id                   = var.tenant_id
  sku_name                    = "standard"
  rbac_authorization_enabled  = false
  enabled_for_deployment      = true
  enabled_for_disk_encryption = true
  enabled_for_template_deployment = true
  soft_delete_retention_days  = 90
  purge_protection_enabled    = false
  public_network_access_enabled = true

  tags = {}
}

resource "azurerm_key_vault_access_policy" "default_access_policy" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id = var.tenant_id
  object_id = azurerm_static_web_app.observable_decisions.identity[0].principal_id

  key_permissions = [
    "Get",
  ]

  secret_permissions = [
    "Get",
  ]
}
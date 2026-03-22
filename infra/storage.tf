resource "azurerm_storage_account" "decisions" {
  name                          = "decisions"
  resource_group_name           = azurerm_resource_group.main.name
  location                      = var.location_primary
  account_tier                  = "Standard"
  account_replication_type      = "RAGRS"
  account_kind                  = "StorageV2"
  access_tier                   = "Hot"
  min_tls_version               = "TLS1_2"
  https_traffic_only_enabled    = true
  allow_nested_items_to_be_public = false
  cross_tenant_replication_enabled = false
  public_network_access_enabled = true

  network_rules {
    default_action = "Allow"
    bypass         = ["AzureServices"]
  }

  tags = {}
}

resource "azurerm_storage_container" "decisions" {
  name                  = "decisions"
  storage_account_id    = azurerm_storage_account.decisions.id
  container_access_type = "private"
}

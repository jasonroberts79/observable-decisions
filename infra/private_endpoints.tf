# =============================================================================
# Private DNS Zones
# =============================================================================

resource "azurerm_private_dns_zone" "blob" {
  name                = "privatelink.blob.core.windows.net"
  resource_group_name = azurerm_resource_group.main.name

  tags = {}
}

resource "azurerm_private_dns_zone" "websites" {
  name                = "privatelink.azurewebsites.net"
  resource_group_name = azurerm_resource_group.main.name
}

# =============================================================================
# Private DNS Zone VNet Links
# =============================================================================

resource "azurerm_private_dns_zone_virtual_network_link" "blob_to_main" {
  name                  = "p4xhy7eslittq"
  resource_group_name   = azurerm_resource_group.main.name
  private_dns_zone_name = azurerm_private_dns_zone.blob.name
  virtual_network_id    = azurerm_virtual_network.main.id
  registration_enabled  = false
}

resource "azurerm_private_dns_zone_virtual_network_link" "websites_to_main" {
  name                  = "observable-api-link"
  resource_group_name   = azurerm_resource_group.main.name
  private_dns_zone_name = azurerm_private_dns_zone.websites.name
  virtual_network_id    = azurerm_virtual_network.main.id
  registration_enabled  = false
}

# =============================================================================
# Private Endpoint: func-pep (Storage Account blob)
# =============================================================================

resource "azurerm_private_endpoint" "storage_blob" {
  name                          = "func-pep"
  location                      = var.location_primary
  resource_group_name           = azurerm_resource_group.main.name
  subnet_id                     = azurerm_subnet.core.id
  custom_network_interface_name = "func-pep-nic"

  private_service_connection {
    name                           = "func-pep"
    private_connection_resource_id = azurerm_storage_account.decisions.id
    subresource_names              = ["blob"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "default"
    private_dns_zone_ids = [azurerm_private_dns_zone.blob.id]
  }

  tags = {}
}
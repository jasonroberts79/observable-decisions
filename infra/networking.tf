# =============================================================================
# Virtual Network: main (eastus2) - App + Private Endpoints
# =============================================================================

resource "azurerm_virtual_network" "main" {
  name                = "main"
  location            = var.location_primary
  resource_group_name = azurerm_resource_group.main.name
  address_space       = ["10.0.0.0/16"]

  tags = {
    status = "prototype"
  }
}

resource "azurerm_subnet" "app" {
  name                 = "app"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.0.0/24"]

  delegation {
    name = "delegation"
    service_delegation {
      name    = "Microsoft.App/environments"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }

  service_endpoints = ["Microsoft.Storage"]
}

resource "azurerm_subnet" "core" {
  name                              = "core"
  resource_group_name               = azurerm_resource_group.main.name
  virtual_network_name              = azurerm_virtual_network.main.name
  address_prefixes                  = ["10.0.1.0/25"]
  default_outbound_access_enabled   = false
  private_endpoint_network_policies = "Disabled"

  service_endpoints = ["Microsoft.Storage"]
}
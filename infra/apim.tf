resource "azurerm_api_management" "main" {
  name                = "observable-api-apim"
  location            = var.location_apim
  resource_group_name = azurerm_resource_group.main.name
  publisher_name      = var.apim_publisher_name
  publisher_email     = var.apim_publisher_email
  sku_name            = "Developer_1"

  identity {
    type = "SystemAssigned"
  }

  virtual_network_type = "External"

  virtual_network_configuration {
    subnet_id = azurerm_subnet.apim_default.id
  }

  tags = {}
}

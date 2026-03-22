resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location_secondary # Resource group is in eastus
}

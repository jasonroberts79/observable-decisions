terraform {
  required_version = ">= 1.5"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
  backend "azurerm" {
    use_cli = true
    use_azuread_auth = true
    tenant_id = "898fa8ab-f560-4db7-8cad-c12b7daeb2a0"
    resource_group_name  = "tf-state"
    storage_account_name = "myresourcegroupstate"
    container_name       = "tfstate"
    key                  = "dev.terraform.tfstate"
  }
}

provider "azurerm" {
  subscription_id = var.subscription_id
  tenant_id       = var.tenant_id

  features {
    key_vault {
      purge_soft_delete_on_destroy = false
    }
  }
}

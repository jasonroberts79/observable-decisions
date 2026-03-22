variable "tenant_id" {
  description = "Azure AD tenant ID"
  type        = string
}

variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "myResourceGroup"
}

variable "location_primary" {
  description = "Primary Azure region (eastus2) for most resources"
  type        = string
  default     = "eastus2"
}

variable "location_secondary" {
  description = "Secondary Azure region (eastus) for Key Vault, Log Analytics, etc."
  type        = string
  default     = "eastus"
}

variable "location_apim" {
  description = "Azure region for API Management"
  type        = string
  default     = "westus2"
}

variable "apim_publisher_name" {
  description = "APIM publisher organization name"
  type        = string
  default     = "jasonroberts.io"
}

variable "apim_publisher_email" {
  description = "APIM publisher email"
  type        = string
  default     = "jason@jasonroberts.io"
}

variable "github_repo_observable_decisions" {
  description = "GitHub repo for observable-decisions (org/repo format)"
  type        = string
  default     = "jasonroberts79/observable-decisions"
}

variable "github_repo_azuredev" {
  description = "GitHub repo for AzureDev (org/repo format)"
  type        = string
  default     = "jasonroberts79/AzureDev"
}

variable "external_log_analytics_workspace_id" {
  description = "Resource ID of the external default Log Analytics workspace used by observable-decisions App Insights"
  type        = string
  default     = "/subscriptions/0e9f667e-4edf-4e2e-86cf-0a272637284e/resourceGroups/DefaultResourceGroup-EUS2/providers/Microsoft.OperationalInsights/workspaces/DefaultWorkspace-0e9f667e-4edf-4e2e-86cf-0a272637284e-EUS2"
}

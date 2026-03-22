output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "static_web_app_default_hostname" {
  value = azurerm_static_web_app.observable_decisions.default_host_name
}

output "function_app_default_hostname" {
  value = azurerm_function_app_flex_consumption.observable_api.default_hostname
}

output "storage_account_name" {
  value = azurerm_storage_account.decisions.name
}

output "key_vault_uri" {
  value = azurerm_key_vault.main.vault_uri
}

output "gha_obs_decisions_client_id" {
  description = "Client ID for the observable-decisions GitHub Actions managed identity (use as AZURE_CLIENT_ID in workflows)"
  value       = azurerm_user_assigned_identity.gha_obs_decisions.client_id
}
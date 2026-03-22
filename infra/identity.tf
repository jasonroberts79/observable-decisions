# =============================================================================
# User Assigned Identity: gha-obs-decisions (eastus2) - for observable-decisions repo
# =============================================================================

resource "azurerm_user_assigned_identity" "gha_obs_decisions" {
  name                = "gha-obs-decisions"
  location            = var.location_primary
  resource_group_name = azurerm_resource_group.main.name

  tags = {}
}

resource "azurerm_federated_identity_credential" "gha_obs_decisions" {
  name                = "gha-observe"
  user_assigned_identity_id = azurerm_user_assigned_identity.gha_obs_decisions.id
  audience            = ["api://AzureADTokenExchange"]
  issuer              = "https://token.actions.githubusercontent.com"
  subject             = "repo:${var.github_repo_observable_decisions}:ref:refs/heads/main"
}

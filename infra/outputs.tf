output "cloud_run_url" {
  value = google_cloud_run_v2_service.api.uri
}

output "artifact_registry_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/observable-api"
}

output "workload_identity_provider" {
  description = "Use as GCP_WORKLOAD_IDENTITY_PROVIDER in GitHub Actions secrets"
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "github_actions_service_account" {
  description = "Use as GCP_SERVICE_ACCOUNT in GitHub Actions secrets"
  value       = google_service_account.github_actions.email
}

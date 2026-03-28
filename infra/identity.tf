# =============================================================================
# Service Accounts
# =============================================================================

resource "google_service_account" "cloud_run" {
  account_id   = "cloud-run-api"
  display_name = "Cloud Run API"
}

resource "google_service_account" "github_actions" {
  account_id   = "github-actions"
  display_name = "GitHub Actions"
}

# =============================================================================
# Workload Identity Federation for GitHub Actions
# =============================================================================

resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github-pool"
  display_name              = "GitHub Actions"
  depends_on                = [google_project_service.apis]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub OIDC"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.actor"      = "assertion.actor"
  }

  attribute_condition = "assertion.repository == '${var.github_repo}'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# Allow GitHub Actions to impersonate the github-actions SA
resource "google_service_account_iam_member" "gha_wif" {
  service_account_id = google_service_account.github_actions.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repo}"
}

# =============================================================================
# GitHub Actions SA permissions
# =============================================================================

resource "google_project_iam_member" "gha_ar_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_project_iam_member" "gha_run_developer" {
  project = var.project_id
  role    = "roles/run.developer"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Needed to deploy Cloud Run with a specific service account
resource "google_service_account_iam_member" "gha_act_as_cloud_run" {
  service_account_id = google_service_account.cloud_run.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_actions.email}"
}

# Deploy Firebase Hosting
resource "google_project_iam_member" "gha_firebase_hosting" {
  project = var.project_id
  role    = "roles/firebasehosting.admin"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# =============================================================================
# Cloud Run SA permissions
# =============================================================================

# Read/write decisions bucket
resource "google_storage_bucket_iam_member" "cloud_run_storage" {
  bucket = google_storage_bucket.decisions.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Sign GCS URLs for the share feature
resource "google_service_account_iam_member" "cloud_run_token_creator" {
  service_account_id = google_service_account.cloud_run.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.cloud_run.email}"
}

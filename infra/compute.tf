# =============================================================================
# Enable required GCP APIs
# =============================================================================

resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "firebase.googleapis.com",
    "firebasehosting.googleapis.com",
  ])
  service            = each.value
  disable_on_destroy = false
}

# =============================================================================
# Artifact Registry
# =============================================================================

resource "google_artifact_registry_repository" "api" {
  repository_id = "observable-api"
  format        = "DOCKER"
  location      = var.region

  depends_on = [google_project_service.apis]
}

# =============================================================================
# Cloud Run: observable-api
# =============================================================================

resource "google_cloud_run_v2_service" "api" {
  name     = "observable-api"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false
  template {
    service_account = google_service_account.cloud_run.email

    containers {
      # Placeholder for initial provisioning — replaced by CI/CD on first deploy
      image = "us-docker.pkg.dev/cloudrun/container/hello:latest"

      env {
        name  = "GCS_BUCKET_NAME"
        value = google_storage_bucket.decisions.name
      }
      env {
        name  = "FIREBASE_PROJECT_ID"
        value = var.project_id
      }

      ports {
        container_port = 8000
      }
    }
  }

  lifecycle {
    ignore_changes = [
      # Image tag is managed by CI/CD
      template[0].containers[0].image,
    ]
  }

  depends_on = [
    google_project_service.apis,
    google_artifact_registry_repository.api,
  ]
}

# Allow unauthenticated invocations — Firebase JWT auth is enforced at app level
resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_storage_bucket" "decisions" {
  name          = "${var.project_id}-decisions"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true
}

variable "project_id" {
  description = "GCP project ID"
  type        = string
  default     = "observable-decisions"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-east4"
}

variable "github_repo" {
  description = "GitHub repository in org/repo format"
  type        = string
  default     = "jasonroberts79/observable-decisions"
}

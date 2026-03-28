terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }

  # Create this bucket before running terraform init:
  # gcloud storage buckets create gs://observable-decisions-tfstate --location=us-east4
  backend "gcs" {
    bucket = "observable-decisions-tfstate"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

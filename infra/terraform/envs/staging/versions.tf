terraform {
  required_version = "~> 1.17.2"
  backend "s3" {}
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 6.71.0" }
  }
}

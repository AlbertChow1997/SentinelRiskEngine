variable "owner" { type = string }
variable "state_bucket_name" { type = string }
variable "existing_github_oidc_provider_arn" {
  type    = string
  default = null
}
variable "region" {
  description = "AWS Region. The project in the new AWS experience is locked to eu-north-1 (ADR-0015)."
  type        = string
  default     = "eu-north-1"
  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.region))
    error_message = "Use an AWS Region code such as eu-north-1."
  }
}

variable "name" { type = string }
variable "repository" { type = string }
variable "state_bucket_name" { type = string }
variable "ecr_repositories" { type = set(string) }
variable "existing_provider_arn" {
  type    = string
  default = null
}
variable "ami_parameter_name" {
  description = "Public SSM parameter the host reads its AMI from; the plan role may read only this one."
  type        = string
}
variable "plan_secret_parameters" {
  type    = set(string)
  default = []
}
variable "enable_deploy_role" {
  type    = bool
  default = false
}
variable "subject_prefix" {
  description = "OIDC sub prefix GitHub issues for the repository (GET /repos/{owner}/{repo}/actions/oidc/customization/sub). Null means the legacy repo:OWNER/REPO form."
  type        = string
  default     = null
  validation {
    condition     = var.subject_prefix == null || startswith(coalesce(var.subject_prefix, "repo:"), "repo:")
    error_message = "The subject prefix must start with repo:."
  }
}

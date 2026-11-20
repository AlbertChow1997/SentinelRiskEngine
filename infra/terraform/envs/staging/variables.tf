variable "owner" { type = string }
variable "state_bucket_name" { type = string }
variable "existing_github_oidc_provider_arn" {
  type    = string
  default = null
}

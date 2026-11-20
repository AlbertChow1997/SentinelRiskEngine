variable "owner" { type = string }
variable "state_bucket_name" { type = string }
variable "existing_github_oidc_provider_arn" {
  type    = string
  default = null
}

variable "start_cron" {
  type    = string
  default = "cron(0 9 ? * MON-FRI *)"
}
variable "stop_cron" {
  type    = string
  default = "cron(0 23 ? * MON-FRI *)"
}
variable "schedule_enabled" {
  type    = bool
  default = true
}

variable "website_bucket_name" { type = string }
variable "staging_deploy_gate_verified" {
  type        = bool
  default     = false
  description = "Enable only after verifying actual required-reviewer, prevent-self-review and exact-main GitHub environment controls."
}

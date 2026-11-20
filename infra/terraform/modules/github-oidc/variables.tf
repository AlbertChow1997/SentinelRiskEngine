variable "name" { type = string }
variable "repository" { type = string }
variable "state_bucket_name" { type = string }
variable "ecr_repositories" { type = set(string) }
variable "existing_provider_arn" {
  type    = string
  default = null
}
variable "plan_secret_parameters" {
  type    = set(string)
  default = []
}

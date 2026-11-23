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

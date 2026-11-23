variable "name" { type = string }
variable "cluster_arn" { type = string }
variable "image" { type = string }
variable "image_repository_arn" { type = string }
variable "port" { type = number }
variable "container_port" {
  type    = number
  default = null
}
variable "memory" { type = number }
variable "environment" {
  type    = map(string)
  default = {}
}
variable "secrets" {
  description = "Environment name -> full SSM parameter or Secrets Manager ARN (IAM needs ARNs, not names)."
  type        = map(string)
  default     = {}
  validation {
    condition     = alltrue([for v in values(var.secrets) : startswith(v, "arn:")])
    error_message = "Pass full ARNs in secrets; plain parameter names work for ECS but not in the IAM policy."
  }
}
variable "mounts" {
  type    = map(object({ host_path = string, container_path = string, read_only = optional(bool, false) }))
  default = {}
}
variable "health_check" {
  type    = object({ command = list(string), interval = optional(number, 30), timeout = optional(number, 5), retries = optional(number, 3), startPeriod = optional(number, 60) })
  default = null
}

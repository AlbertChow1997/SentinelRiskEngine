variable "name" { type = string }
variable "cluster_arn" { type = string }
variable "image" { type = string }
variable "image_repository_arn" { type = string }
variable "port" { type = number }
variable "memory" { type = number }
variable "environment" {
  type    = map(string)
  default = {}
}
variable "secrets" {
  type    = map(string)
  default = {}
}
variable "mounts" {
  type    = map(object({ host_path = string, container_path = string, read_only = optional(bool, false) }))
  default = {}
}
variable "health_check" {
  type    = object({ command = list(string), interval = optional(number, 30), timeout = optional(number, 5), retries = optional(number, 3), startPeriod = optional(number, 60) })
  default = null
}

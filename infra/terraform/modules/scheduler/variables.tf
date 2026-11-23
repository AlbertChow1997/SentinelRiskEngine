variable "name" { type = string }
variable "instance_id" { type = string }
variable "instance_arn" { type = string }
variable "start_cron" {
  description = "EventBridge Scheduler cron for StartInstances, Europe/Dublin time."
  type        = string
}
variable "stop_cron" {
  description = "EventBridge Scheduler cron for StopInstances, Europe/Dublin time."
  type        = string
}
variable "enabled" {
  type    = bool
  default = true
}

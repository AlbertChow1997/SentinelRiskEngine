variable "name" { type = string }
variable "instance_id" { type = string }
variable "instance_arn" { type = string }
variable "start_cron" {
  type    = string
  default = "cron(0 9 ? * MON-FRI *)"
}
variable "stop_cron" {
  type    = string
  default = "cron(0 23 ? * MON-FRI *)"
}
variable "enabled" {
  type    = bool
  default = true
}

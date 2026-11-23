variable "name" { type = string }
variable "bucket_name" { type = string }
variable "origin_hostname" { type = string }
variable "secret_parameter_name" {
  type    = string
  default = "/sentinel/staging/origin-secret"
}

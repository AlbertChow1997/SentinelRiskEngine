variable "bucket_name" { type = string }
variable "owner" { type = string }
variable "billing_email" {
  type      = string
  sensitive = true
  validation {
    condition     = can(regex("^[^@ ]+@[^@ ]+\\.[^@ ]+$", var.billing_email))
    error_message = "Supply a valid budget notification address through private configuration."
  }
}

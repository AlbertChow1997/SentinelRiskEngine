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
variable "region" {
  description = "AWS Region. The project in the new AWS experience is locked to eu-north-1 (ADR-0015)."
  type        = string
  default     = "eu-north-1"
  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.region))
    error_message = "Use an AWS Region code such as eu-north-1."
  }
}

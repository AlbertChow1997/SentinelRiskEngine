variable "name" { type = string }
variable "subnet_id" { type = string }
variable "security_group_id" { type = string }
variable "availability_zone" { type = string }
variable "ami_parameter_name" {
  description = "Public SSM parameter holding the ECS-optimised AMI ID."
  type        = string
  default     = "/aws/service/ecs/optimized-ami/amazon-linux-2023/arm64/recommended/image_id"
}
variable "instance_type" {
  description = "ARM64 Graviton type; images and task definitions are linux/arm64 only."
  type        = string
  validation {
    condition     = can(regex("^(t4g|m7g|c7g|r7g|m8g|c8g)[.]", var.instance_type))
    error_message = "Use an ARM64 Graviton instance type (images are linux/arm64 only)."
  }
}

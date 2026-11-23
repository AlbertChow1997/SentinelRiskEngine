variable "name" { type = string }
variable "subnet_id" { type = string }
variable "security_group_id" { type = string }
variable "availability_zone" { type = string }
variable "ami_parameter_name" {
  description = "Public SSM parameter holding the ECS-optimised AMI ID."
  type        = string
  default     = "/aws/service/ecs/optimized-ami/amazon-linux-2023/arm64/recommended/image_id"
}

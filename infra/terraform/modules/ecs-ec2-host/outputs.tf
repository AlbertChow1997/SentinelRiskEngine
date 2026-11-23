output "instance_id" { value = aws_instance.this.id }
output "instance_arn" { value = aws_instance.this.arn }
output "cluster_name" { value = aws_ecs_cluster.this.name }
output "cluster_arn" { value = aws_ecs_cluster.this.arn }
output "public_ip" { value = aws_eip.this.public_ip }
output "data_volume_id" { value = aws_ebs_volume.data.id }
output "ami_parameter_name" { value = var.ami_parameter_name }

data "aws_partition" "current" {}
data "aws_ssm_parameter" "ami" { name = var.ami_parameter_name }
resource "aws_ecs_cluster" "this" { name = var.name }
resource "aws_iam_role" "host" {
  name               = "${var.name}-host"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Action = "sts:AssumeRole", Principal = { Service = "ec2.amazonaws.com" } }] })
}
resource "aws_iam_role_policy_attachment" "host" {
  for_each   = toset(["service-role/AmazonEC2ContainerServiceforEC2Role", "AmazonSSMManagedInstanceCore"])
  role       = aws_iam_role.host.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/${each.key}"
}
resource "aws_iam_instance_profile" "this" {
  name = var.name
  role = aws_iam_role.host.name
}
resource "aws_ebs_volume" "data" {
  availability_zone = var.availability_zone
  size              = 20
  type              = "gp3"
  encrypted         = true
  tags              = { Name = "${var.name}-data" }
  lifecycle { prevent_destroy = true }
}
resource "aws_instance" "this" {
  ami                    = nonsensitive(data.aws_ssm_parameter.ami.value)
  instance_type          = "t4g.medium"
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [var.security_group_id]
  iam_instance_profile   = aws_iam_instance_profile.this.name
  # Temporary launch address allows bootstrap before the persistent EIP attaches.
  associate_public_ip_address = true
  user_data                   = templatefile("${path.module}/user-data.sh.tftpl", { cluster = aws_ecs_cluster.this.name, volume_id = replace(aws_ebs_volume.data.id, "-", "") })
  user_data_replace_on_change = true
  metadata_options {
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }
  root_block_device {
    volume_type = "gp3"
    volume_size = 30
    encrypted   = true
    tags        = { Name = "${var.name}-root" }
  }
  tags       = { Name = var.name }
  depends_on = [aws_iam_role_policy_attachment.host]
  # A new recommended AMI must not replace the host (and detach /data) on a routine apply.
  # Roll AMIs deliberately: see docs/runbooks/staging-platform.md ("Rolling the AMI").
  lifecycle { ignore_changes = [ami] }
}
resource "aws_volume_attachment" "data" {
  device_name = "/dev/sdf"
  volume_id   = aws_ebs_volume.data.id
  instance_id = aws_instance.this.id
}
resource "aws_eip" "this" {
  domain   = "vpc"
  instance = aws_instance.this.id
  tags     = { Name = var.name }
}

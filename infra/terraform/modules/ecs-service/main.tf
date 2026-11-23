data "aws_region" "current" {}
resource "aws_cloudwatch_log_group" "this" {
  name              = "/ecs/${var.name}"
  retention_in_days = 7
}
locals {
  task_trust = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Action = "sts:AssumeRole", Principal = { Service = "ecs-tasks.amazonaws.com" } }] })
}
resource "aws_iam_role" "execution" {
  name               = "${var.name}-execution"
  assume_role_policy = local.task_trust
}
resource "aws_iam_role" "task" {
  name               = "${var.name}-task"
  assume_role_policy = local.task_trust
}
resource "aws_iam_role_policy" "execution" {
  role = aws_iam_role.execution.id
  policy = jsonencode({ Version = "2012-10-17", Statement = concat([
    { Effect = "Allow", Action = ["ecr:GetAuthorizationToken"], Resource = "*" },
    { Effect = "Allow", Action = ["ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer", "ecr:BatchCheckLayerAvailability"], Resource = var.image_repository_arn },
    { Effect = "Allow", Action = ["logs:CreateLogStream", "logs:PutLogEvents"], Resource = "${aws_cloudwatch_log_group.this.arn}:*" }
  ], length(var.secrets) == 0 ? [] : [{ Effect = "Allow", Action = ["ssm:GetParameters"], Resource = values(var.secrets) }]) })
}
resource "aws_ecs_task_definition" "this" {
  family                   = var.name
  network_mode             = "bridge"
  requires_compatibilities = ["EC2"]
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn
  runtime_platform {
    cpu_architecture        = "ARM64"
    operating_system_family = "LINUX"
  }
  dynamic "volume" {
    for_each = var.mounts
    content {
      name      = volume.key
      host_path = volume.value.host_path
    }
  }
  container_definitions = jsonencode([merge({
    name         = var.name, image = var.image, essential = true, memory = var.memory,
    portMappings = [{ containerPort = coalesce(var.container_port, var.port), hostPort = var.port, protocol = "tcp" }],
    environment = [for k, v in var.environment : {
    name = k, value = v }],
    secrets = [for k, v in var.secrets : {
    name = k, valueFrom = v }],
    mountPoints      = [for k, v in var.mounts : { sourceVolume = k, containerPath = v.container_path, readOnly = v.read_only }],
    logConfiguration = { logDriver = "awslogs", options = { awslogs-group = aws_cloudwatch_log_group.this.name, awslogs-region = data.aws_region.current.region, awslogs-stream-prefix = "ecs" } }
  }, var.health_check == null ? {} : { healthCheck = var.health_check })])
}
resource "aws_ecs_service" "this" {
  name                               = var.name
  cluster                            = var.cluster_arn
  task_definition                    = aws_ecs_task_definition.this.arn
  desired_count                      = 0
  launch_type                        = "EC2"
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  # CD owns image revisions/count after the first explicit deployment.
  lifecycle { ignore_changes = [task_definition, desired_count] }
}

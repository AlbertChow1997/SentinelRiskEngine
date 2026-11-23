data "aws_partition" "current" {}
resource "aws_scheduler_schedule_group" "this" { name = var.name }
resource "aws_iam_role" "this" {
  name = "${var.name}-scheduler"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{
    Effect    = "Allow", Action = "sts:AssumeRole", Principal = { Service = "scheduler.amazonaws.com" },
    Condition = { ArnEquals = { "aws:SourceArn" = aws_scheduler_schedule_group.this.arn } }
  }] })
}
resource "aws_iam_role_policy" "this" {
  role   = aws_iam_role.this.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Action = ["ec2:StartInstances", "ec2:StopInstances"], Resource = var.instance_arn }] })
}
resource "aws_scheduler_schedule" "this" {
  for_each                     = { start = { cron = var.start_cron, api = "startInstances" }, stop = { cron = var.stop_cron, api = "stopInstances" } }
  name                         = each.key
  group_name                   = aws_scheduler_schedule_group.this.name
  schedule_expression          = each.value.cron
  schedule_expression_timezone = "Europe/Dublin"
  state                        = var.enabled ? "ENABLED" : "DISABLED"
  flexible_time_window { mode = "OFF" }
  target {
    arn      = "arn:${data.aws_partition.current.partition}:scheduler:::aws-sdk:ec2:${each.value.api}"
    role_arn = aws_iam_role.this.arn
    input    = jsonencode({ InstanceIds = [var.instance_id] })
    retry_policy {
      maximum_event_age_in_seconds = 300
      maximum_retry_attempts       = 2
    }
  }
  depends_on = [aws_iam_role_policy.this]
}

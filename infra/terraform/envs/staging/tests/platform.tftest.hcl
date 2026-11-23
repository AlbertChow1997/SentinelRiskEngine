mock_provider "aws" {
  mock_data "aws_partition" { defaults = { partition = "aws" } }
  mock_data "aws_ssm_parameter" { defaults = { value = "ami-0123456789abcdef0" } }
}
run "host_plan" {
  command = plan
  module { source = "../../modules/ecs-ec2-host" }
  variables {
    name              = "test-host"
    subnet_id         = "subnet-test"
    security_group_id = "sg-test"
    availability_zone = "eu-north-1a"
  }
  assert {
    condition     = aws_instance.this.instance_type == "t4g.medium" && aws_instance.this.metadata_options[0].http_tokens == "required" && aws_ebs_volume.data.size == 20 && aws_ebs_volume.data.encrypted
    error_message = "Host must remain ARM64, IMDSv2-only and backed by an encrypted data disk."
  }
  assert {
    condition     = aws_ebs_volume.data.availability_zone == "eu-north-1a"
    error_message = "The data volume must be created in the AZ it is given (the subnet's AZ)."
  }
}
run "schedule_plan" {
  command = plan
  module { source = "../../modules/scheduler" }
  variables {
    name         = "test-schedule"
    instance_id  = "i-0123456789abcdef0"
    instance_arn = "arn:aws:ec2:eu-north-1:000000000000:instance/i-0123456789abcdef0"
    start_cron   = "cron(0 19 * * ? *)"
    stop_cron    = "cron(0 2 * * ? *)"
  }
  assert {
    condition     = aws_scheduler_schedule.this["start"].schedule_expression_timezone == "Europe/Dublin" && aws_scheduler_schedule.this["stop"].schedule_expression_timezone == "Europe/Dublin"
    error_message = "The window must stay in Dublin local time, including DST."
  }
  assert {
    condition     = jsondecode(aws_iam_role_policy.this.policy).Statement[0].Resource == "arn:aws:ec2:eu-north-1:000000000000:instance/i-0123456789abcdef0"
    error_message = "The scheduler role may start and stop only this host."
  }
  assert {
    condition     = alltrue([for k in ["start", "stop"] : jsondecode(aws_scheduler_schedule.this[k].target[0].input).InstanceIds == ["i-0123456789abcdef0"]])
    error_message = "Both schedules must target exactly this host."
  }
}

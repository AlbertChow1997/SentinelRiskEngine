mock_provider "aws" {
  mock_data "aws_partition" { defaults = { partition = "aws" } }
  mock_data "aws_ssm_parameter" { defaults = { value = "ami-0123456789abcdef0" } }
}
variables {
  owner             = "test-owner"
  state_bucket_name = "sentinel-test-state"
}
run "host_plan" {
  command = plan
  module { source = "../../modules/ecs-ec2-host" }
  variables {
    name              = "test-host"
    subnet_id         = "subnet-test"
    security_group_id = "sg-test"
    availability_zone = "eu-west-1a"
  }
  assert {
    condition     = aws_instance.this.instance_type == "t4g.medium" && aws_instance.this.metadata_options[0].http_tokens == "required" && aws_ebs_volume.data.size == 20 && aws_ebs_volume.data.encrypted
    error_message = "Host must remain ARM64, IMDSv2-only and backed by an encrypted data disk."
  }
}
run "schedule_plan" {
  command = plan
  module { source = "../../modules/scheduler" }
  variables {
    name         = "test-schedule"
    instance_id  = "i-test"
    instance_arn = "REPLACE_WITH_INSTANCE_REFERENCE"
  }
  assert {
    condition     = aws_scheduler_schedule.this["start"].schedule_expression_timezone == "Europe/Dublin" && aws_scheduler_schedule.this["start"].schedule_expression == "cron(0 9 ? * MON-FRI *)" && aws_scheduler_schedule.this["stop"].schedule_expression == "cron(0 23 ? * MON-FRI *)"
    error_message = "Weekday hours must stay in Dublin local time, including DST."
  }
}

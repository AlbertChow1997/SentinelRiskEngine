mock_provider "aws" {
  mock_data "aws_partition" { defaults = { partition = "aws" } }
  mock_data "aws_region" { defaults = { region = "eu-north-1" } }
  mock_data "aws_ssm_parameter" { defaults = { value = "ami-0123456789abcdef0" } }
}
variables {
  website_bucket_name = "sentinel-test-website"
  owner               = "test-owner"
  state_bucket_name   = "sentinel-test-state"
}
run "foundation_plan" {
  command = plan
  assert {
    condition     = length(module.ecr.repositories) == 6
    error_message = "All six planned component image repositories must exist."
  }
  assert {
    condition     = var.region == "eu-north-1"
    error_message = "Staging must default to the project's locked Region, eu-north-1 (ADR-0015)."
  }
  assert {
    condition     = var.start_cron == "cron(0 19 * * ? *)" && var.stop_cron == "cron(0 2 * * ? *)"
    error_message = "Development window is every day 19:00-02:00 Europe/Dublin until RISK-117 switches it."
  }
}

override_data {
  target = module.cdn.data.aws_ssm_parameter.secret
  values = {
    value = "test-origin-secret-0123456789abcdef0123456789abcdef"
    arn   = "arn:aws:ssm:eu-north-1:000000000000:parameter/sentinel/staging/origin-secret"
  }
}

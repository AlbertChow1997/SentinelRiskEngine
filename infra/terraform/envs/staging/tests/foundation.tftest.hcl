mock_provider "aws" {
  mock_data "aws_partition" { defaults = { partition = "aws" } }
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
}

override_data {
  target = module.cdn.data.aws_ssm_parameter.secret
  values = { value = "test-origin-secret-0123456789abcdef0123456789abcdef" }
}

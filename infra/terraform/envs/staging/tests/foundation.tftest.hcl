mock_provider "aws" {
  override_during = plan
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
  assert {
    condition     = module.github_oidc.deploy_role_arn == null && length(aws_iam_role_policy.deploy_platform) == 0
    error_message = "Deploy credentials must not exist before the real environment gate is verified."
  }
}

run "explicitly_enabled_deploy_is_scoped" {
  command = plan
  variables { staging_deploy_gate_verified = true }
  assert {
    condition     = length(aws_iam_role_policy.deploy_platform) == 1 && !contains(flatten([for statement in local.deploy_statements : statement.Action]), "ec2:StopInstances")
    error_message = "The explicitly enabled role may deploy/start, but never stop arbitrary compute."
  }
}

override_data {
  target = module.cdn.data.aws_ssm_parameter.secret
  values = { value = "test-origin-secret-0123456789abcdef0123456789abcdef" }
}

mock_provider "aws" {
  override_during = plan
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
  assert {
    condition     = var.github_oidc_subject_prefix == "repo:AlbertChow1997@48938877/SentinelRiskEngine@1453999663"
    error_message = "Trust must use the repository's immutable OIDC subject, or GitHub tokens are refused."
  }
  assert {
    condition     = var.instance_type == "t4g.small"
    error_message = "The Free plan allows only Free-Tier-eligible types; t4g.small is the ARM64 default (ADR-0016)."
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
  assert {
    condition     = anytrue([for statement in local.deploy_statements : statement.Resource == "*" && contains(statement.Action, "ecs:DescribeTaskDefinition")])
    error_message = "ecs:DescribeTaskDefinition has no resource-level permissions; it must be granted on * or deployment fails."
  }
}

override_data {
  target = module.cdn.data.aws_ssm_parameter.secret
  values = {
    value = "test-origin-secret-0123456789abcdef0123456789abcdef"
    arn   = "arn:aws:ssm:eu-north-1:000000000000:parameter/sentinel/staging/origin-secret"
  }
}

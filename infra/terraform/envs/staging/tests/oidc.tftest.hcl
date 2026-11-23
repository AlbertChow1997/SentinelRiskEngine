mock_provider "aws" {
  mock_data "aws_partition" { defaults = { partition = "aws" } }
  mock_data "aws_region" { defaults = { region = "eu-north-1" } }
}
run "exact_subjects" {
  command = plan
  module { source = "../../modules/github-oidc" }
  variables {
    name                  = "test-oidc"
    repository            = "example/repository"
    state_bucket_name     = "sentinel-test-state"
    ecr_repositories      = []
    ami_parameter_name    = "/aws/service/ecs/optimized-ami/amazon-linux-2023/arm64/recommended/image_id"
    existing_provider_arn = "REPLACE_WITH_PROVIDER_REFERENCE"
  }
  assert {
    condition     = jsondecode(aws_iam_role.github["deploy"].assume_role_policy).Statement[0].Condition.StringEquals["token.actions.githubusercontent.com:sub"] == "repo:example/repository:environment:staging"
    error_message = "Deploy trust must be restricted to the exact staging environment."
  }
  assert {
    condition     = jsondecode(aws_iam_role.github["plan"].assume_role_policy).Statement[0].Condition.StringEquals["token.actions.githubusercontent.com:sub"] == "repo:example/repository:pull_request"
    error_message = "Plan trust must not accept arbitrary repositories or subjects."
  }
}
run "empty_existing_provider_creates_one" {
  command = plan
  module { source = "../../modules/github-oidc" }
  variables {
    name                  = "test-oidc"
    repository            = "example/repository"
    state_bucket_name     = "sentinel-test-state"
    ecr_repositories      = []
    ami_parameter_name    = "/aws/service/ecs/optimized-ami/amazon-linux-2023/arm64/recommended/image_id"
    existing_provider_arn = ""
  }
  assert {
    condition     = length(aws_iam_openid_connect_provider.github) == 1
    error_message = "An unset CI variable (empty string) must create the provider, not reference a blank ARN."
  }
}
run "plan_role_can_read_everything_the_plan_refreshes" {
  command = plan
  module { source = "../../modules/github-oidc" }
  variables {
    name               = "test-oidc"
    repository         = "example/repository"
    state_bucket_name  = "sentinel-test-state"
    ecr_repositories   = []
    ami_parameter_name = "/aws/service/ecs/optimized-ami/amazon-linux-2023/arm64/recommended/image_id"
  }
  assert {
    condition     = alltrue([for action in ["ec2:GetManagedPrefixListEntries", "ecr:ListTagsForResource"] : contains(jsondecode(aws_iam_role_policy.plan.policy).Statement[0].Action, action)])
    error_message = "The plan role must read the CloudFront prefix list entries and ECR repository tags."
  }
}
run "plan_role_reads_only_the_host_ami_parameter" {
  command = plan
  module { source = "../../modules/github-oidc" }
  variables {
    name               = "test-oidc"
    repository         = "example/repository"
    state_bucket_name  = "sentinel-test-state"
    ecr_repositories   = []
    ami_parameter_name = "/aws/service/ecs/optimized-ami/amazon-linux-2023/arm64/recommended/image_id"
  }
  assert {
    condition     = jsondecode(aws_iam_role_policy.plan.policy).Statement[1].Resource == "arn:aws:ssm:eu-north-1::parameter/aws/service/ecs/optimized-ami/amazon-linux-2023/arm64/recommended/image_id"
    error_message = "The SSM read must be built from the current Region and the host's parameter, not hard-coded."
  }
}

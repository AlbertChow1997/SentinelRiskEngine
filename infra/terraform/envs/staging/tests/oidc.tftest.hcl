mock_provider "aws" {}
run "exact_subjects" {
  command = plan
  module { source = "../../modules/github-oidc" }
  variables {
    name                  = "test-oidc"
    repository            = "example/repository"
    state_bucket_name     = "sentinel-test-state"
    ecr_repositories      = []
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

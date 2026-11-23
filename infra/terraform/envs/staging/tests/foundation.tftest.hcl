mock_provider "aws" {}
variables {
  owner             = "test-owner"
  state_bucket_name = "sentinel-test-state"
}
run "foundation_plan" {
  command = plan
  assert {
    condition     = length(module.ecr.repositories) == 6
    error_message = "All six planned component image repositories must exist."
  }
}

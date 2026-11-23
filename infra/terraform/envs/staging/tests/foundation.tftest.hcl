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
  assert {
    condition     = var.region == "eu-north-1"
    error_message = "Staging must default to the project's locked Region, eu-north-1 (ADR-0015)."
  }
}

mock_provider "aws" {}
variables {
  owner         = "test-owner"
  bucket_name   = "sentinel-test-state"
  billing_email = "billing@example.invalid"
}
run "first_apply_guardrails" {
  command = plan
  assert {
    condition     = length(aws_budgets_budget.staging.notification) == 2 && aws_budgets_budget.staging.limit_amount == "25"
    error_message = "The first apply must include both cost alerts."
  }
  assert {
    condition     = aws_s3_bucket_public_access_block.state.block_public_policy && aws_s3_bucket_versioning.state.versioning_configuration[0].status == "Enabled"
    error_message = "Remote state must remain private and versioned."
  }
}

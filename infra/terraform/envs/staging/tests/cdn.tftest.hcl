mock_provider "aws" {
  mock_data "aws_ssm_parameter" {
    defaults = { value = "synthetic-origin-secret-0123456789abcdef" }
  }
}
run "private_site_and_uncached_api" {
  command = plan
  module { source = "../../modules/cdn" }
  variables {
    name            = "test-cdn"
    bucket_name     = "sentinel-test-website"
    origin_hostname = "origin.example.invalid"
  }
  assert {
    condition     = aws_s3_bucket_public_access_block.web.block_public_policy && aws_cloudfront_origin_access_control.web.signing_behavior == "always"
    error_message = "Website objects must remain private and read through signed OAC."
  }
  assert {
    condition     = aws_cloudfront_distribution.this.ordered_cache_behavior[0].path_pattern == "/api/*" && aws_cloudfront_distribution.this.ordered_cache_behavior[0].viewer_protocol_policy == "https-only" && length(aws_cloudfront_distribution.this.custom_error_response) == 0
    error_message = "API must use HTTPS with no global error-to-HTML rewrite."
  }
}

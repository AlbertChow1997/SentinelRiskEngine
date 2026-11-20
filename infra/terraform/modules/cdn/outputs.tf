output "bucket_name" { value = aws_s3_bucket.web.id }
output "bucket_arn" { value = aws_s3_bucket.web.arn }
output "distribution_id" { value = aws_cloudfront_distribution.this.id }
output "distribution_arn" { value = aws_cloudfront_distribution.this.arn }
output "url" { value = "https://${aws_cloudfront_distribution.this.domain_name}" }
output "secret_parameter_arn" { value = data.aws_ssm_parameter.secret.arn }

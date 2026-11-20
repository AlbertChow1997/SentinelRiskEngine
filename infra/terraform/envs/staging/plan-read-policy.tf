resource "aws_iam_role_policy" "cdn_plan" {
  name = "read-staging-website-plan"
  role = module.github_oidc.plan_role_name
  policy = jsonencode({ Version = "2012-10-17", Statement = [{
    Effect = "Allow", Action = ["s3:GetBucket*", "s3:GetEncryptionConfiguration", "s3:GetLifecycleConfiguration", "s3:ListBucket"], Resource = module.cdn.bucket_arn
  }] })
}

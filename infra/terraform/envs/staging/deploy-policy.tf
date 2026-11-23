locals {
  task_families = [for arn in [module.risk_engine.task_definition_arn, module.nginx.task_definition_arn] : replace(arn, "/:[0-9]+$/", ":*")]
  deploy_statements = [
    { Effect = "Allow", Action = ["ec2:DescribeInstances", "ec2:DescribeInstanceStatus", "ecs:ListContainerInstances", "ecs:DescribeContainerInstances", "ecs:ListServices"], Resource = "*" },
    { Effect = "Allow", Action = ["ec2:StartInstances"], Resource = module.host.instance_arn },
    { Effect = "Allow", Action = ["ecs:DescribeServices", "ecs:UpdateService"], Resource = [module.risk_engine.service_arn, module.nginx.service_arn] },
    { Effect = "Allow", Action = ["ecs:DescribeTaskDefinition", "ecs:TagResource"], Resource = local.task_families },
    { Effect = "Allow", Action = ["ecs:RegisterTaskDefinition"], Resource = "*", Condition = { StringEquals = { "aws:RequestTag/project" = "sentinel-pay", "aws:RequestTag/env" = "staging" } } },
    { Effect = "Allow", Action = ["iam:PassRole"], Resource = [module.risk_engine.execution_role_arn, module.risk_engine.task_role_arn, module.nginx.execution_role_arn, module.nginx.task_role_arn], Condition = { StringEquals = { "iam:PassedToService" = "ecs-tasks.amazonaws.com" } } },
    { Effect = "Allow", Action = ["s3:ListBucket", "s3:GetBucketLocation"], Resource = module.cdn.bucket_arn },
    { Effect = "Allow", Action = ["s3:GetObject", "s3:PutObject"], Resource = "${module.cdn.bucket_arn}/*" },
    { Effect = "Allow", Action = ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"], Resource = module.cdn.distribution_arn }
  ]
}
resource "aws_iam_role_policy" "deploy_platform" {
  count  = var.staging_deploy_gate_verified ? 1 : 0
  name   = "deploy-staging-platform"
  role   = module.github_oidc.deploy_role_name
  policy = jsonencode({ Version = "2012-10-17", Statement = local.deploy_statements })
}

data "aws_partition" "current" {}
resource "aws_iam_openid_connect_provider" "github" {
  count          = var.existing_provider_arn == null ? 1 : 0
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}
locals {
  provider_arn = var.existing_provider_arn != null ? var.existing_provider_arn : aws_iam_openid_connect_provider.github[0].arn
  subjects     = { plan = "repo:${var.repository}:pull_request", deploy = "repo:${var.repository}:environment:staging" }
  bucket_arn   = "arn:${data.aws_partition.current.partition}:s3:::${var.state_bucket_name}"
}
resource "aws_iam_role" "github" {
  for_each             = local.subjects
  name                 = "${var.name}-github-${each.key}"
  max_session_duration = 3600
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{
    Effect    = "Allow", Action = "sts:AssumeRoleWithWebIdentity",
    Principal = { Federated = local.provider_arn },
    Condition = { StringEquals = {
      "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com",
      "token.actions.githubusercontent.com:sub" = each.value
    } }
  }] })
}
resource "aws_iam_role_policy" "plan" {
  name = "read-staging-plan"
  role = aws_iam_role.github["plan"].id
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Action = ["ec2:Describe*", "ecr:Describe*", "ecr:GetLifecyclePolicy", "iam:GetRole", "iam:GetRolePolicy", "iam:ListRolePolicies", "iam:ListAttachedRolePolicies", "iam:GetOpenIDConnectProvider", "iam:ListOpenIDConnectProviders", "iam:ListRoleTags", "iam:GetInstanceProfile", "ecs:DescribeClusters", "ecs:DescribeServices", "ecs:DescribeTaskDefinition", "ecs:ListTagsForResource", "logs:DescribeLogGroups", "logs:ListTagsForResource", "scheduler:GetSchedule", "scheduler:GetScheduleGroup", "scheduler:ListTagsForResource", "ecr:ListTagsForResource"], Resource = "*" },
    { Effect = "Allow", Action = ["ssm:GetParameter"], Resource = "arn:${data.aws_partition.current.partition}:ssm:eu-west-1::parameter/aws/service/ecs/optimized-ami/amazon-linux-2023/arm64/recommended/image_id" },
    { Effect = "Allow", Action = ["s3:ListBucket"], Resource = local.bucket_arn },
    { Effect = "Allow", Action = ["s3:GetObject"], Resource = "${local.bucket_arn}/staging/terraform.tfstate" },
    { Effect = "Allow", Action = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"], Resource = "${local.bucket_arn}/staging/terraform.tfstate.tflock" }
  ] })
}
resource "aws_iam_role_policy" "deploy" {
  name = "publish-staging-images"
  role = aws_iam_role.github["deploy"].id
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Action = ["ecr:GetAuthorizationToken"], Resource = "*" },
    { Effect = "Allow", Action = ["ecr:BatchCheckLayerAvailability", "ecr:InitiateLayerUpload", "ecr:UploadLayerPart", "ecr:CompleteLayerUpload", "ecr:PutImage", "ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer"], Resource = var.ecr_repositories }
  ] })
}

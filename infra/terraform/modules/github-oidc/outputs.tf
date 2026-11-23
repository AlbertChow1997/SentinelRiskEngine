output "plan_role_arn" { value = aws_iam_role.github["plan"].arn }
output "deploy_role_arn" { value = try(aws_iam_role.github["deploy"].arn, null) }
output "deploy_role_name" { value = try(aws_iam_role.github["deploy"].name, null) }
output "plan_role_name" { value = aws_iam_role.github["plan"].name }

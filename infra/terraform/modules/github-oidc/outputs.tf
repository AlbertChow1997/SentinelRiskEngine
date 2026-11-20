output "plan_role_arn" { value = aws_iam_role.github["plan"].arn }
output "deploy_role_arn" { value = aws_iam_role.github["deploy"].arn }
output "plan_role_name" { value = aws_iam_role.github["plan"].name }

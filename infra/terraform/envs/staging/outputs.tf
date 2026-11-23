output "repositories" { value = module.ecr.repositories }
output "plan_role_arn" { value = module.github_oidc.plan_role_arn }
output "deploy_role_arn" { value = module.github_oidc.deploy_role_arn }

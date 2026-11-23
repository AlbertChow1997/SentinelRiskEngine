output "repositories" { value = module.ecr.repositories }
output "plan_role_arn" { value = module.github_oidc.plan_role_arn }
output "deploy_role_arn" { value = module.github_oidc.deploy_role_arn }

output "instance_id" { value = module.host.instance_id }
output "cluster_name" { value = module.host.cluster_name }
output "origin_ip" { value = module.host.public_ip }
output "schedule_group" { value = module.schedule.group_name }
output "risk_service" { value = module.risk_engine.service_name }

output "website_bucket" { value = module.cdn.bucket_name }
output "distribution_id" { value = module.cdn.distribution_id }
output "staging_url" { value = module.cdn.url }
output "nginx_service" { value = module.nginx.service_name }

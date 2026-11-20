provider "aws" {
  region = "eu-west-1"
  default_tags { tags = { project = "sentinel-pay", owner = var.owner, env = "staging" } }
}
module "network" {
  source            = "../../modules/network"
  name              = "sentinel-staging"
  availability_zone = "eu-west-1a"
}
module "ecr" {
  source = "../../modules/ecr"
  name   = "sentinel-staging"
  images = ["risk-engine", "payment-gateway", "ml-scorer", "ml-feedback", "llm-insights", "nginx"]
}
module "github_oidc" {
  source                 = "../../modules/github-oidc"
  name                   = "sentinel-staging"
  repository             = "AlbertChow1997/SentinelRiskEngine"
  state_bucket_name      = var.state_bucket_name
  existing_provider_arn  = var.existing_github_oidc_provider_arn
  ecr_repositories       = [for repo in module.ecr.repositories : repo.arn]
  plan_secret_parameters = [module.cdn.secret_parameter_arn]
  enable_deploy_role     = var.staging_deploy_gate_verified
}

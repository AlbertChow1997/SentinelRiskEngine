module "host" {
  source            = "../../modules/ecs-ec2-host"
  name              = "sentinel-staging"
  availability_zone = module.network.availability_zone
  instance_type     = var.instance_type
  subnet_id         = module.network.subnet_id
  security_group_id = module.network.security_group_id
  depends_on        = [module.network]
}
module "schedule" {
  source       = "../../modules/scheduler"
  name         = "sentinel-staging"
  instance_id  = module.host.instance_id
  instance_arn = module.host.instance_arn
  start_cron   = var.start_cron
  stop_cron    = var.stop_cron
  enabled      = var.schedule_enabled
}
module "risk_engine" {
  source               = "../../modules/ecs-service"
  name                 = "sentinel-staging-risk-engine"
  cluster_arn          = module.host.cluster_arn
  image                = "${module.ecr.repositories["risk-engine"].url}:unpublished"
  image_repository_arn = module.ecr.repositories["risk-engine"].arn
  port                 = 8081
  memory               = 512
  health_check         = { command = ["CMD-SHELL", "curl -fsS http://localhost:8081/actuator/health >/dev/null || exit 1"] }
}

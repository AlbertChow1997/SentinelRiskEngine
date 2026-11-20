module "cdn" {
  source          = "../../modules/cdn"
  name            = "sentinel-staging"
  bucket_name     = var.website_bucket_name
  origin_hostname = "ec2-${replace(module.host.public_ip, ".", "-")}.eu-west-1.compute.amazonaws.com"
}
module "nginx" {
  source               = "../../modules/ecs-service"
  name                 = "sentinel-staging-nginx"
  cluster_arn          = module.host.cluster_arn
  image                = "${module.ecr.repositories["nginx"].url}:unpublished"
  image_repository_arn = module.ecr.repositories["nginx"].arn
  port                 = 80
  container_port       = 8080
  memory               = 64
  secrets              = { ORIGIN_SECRET = module.cdn.secret_parameter_arn }
  health_check         = { command = ["CMD-SHELL", "wget -qO- http://127.0.0.1:8080/internal-health >/dev/null || exit 1"] }
}

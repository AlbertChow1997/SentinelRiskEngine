mock_provider "aws" {}
run "safe_single_host_deploy" {
  command = plan
  module { source = "../../modules/ecs-service" }
  variables {
    name                 = "test-service"
    cluster_arn          = "REPLACE_WITH_CLUSTER_REFERENCE"
    image                = "example.invalid/risk-engine:test"
    image_repository_arn = "REPLACE_WITH_IMAGE_REPOSITORY_REFERENCE"
    port                 = 8081
    memory               = 512
    health_check         = { command = ["CMD-SHELL", "curl -fsS http://localhost:8081/actuator/health || exit 1"] }
  }
  assert {
    condition     = aws_ecs_task_definition.this.network_mode == "bridge" && aws_ecs_task_definition.this.runtime_platform[0].cpu_architecture == "ARM64" && aws_ecs_service.this.desired_count == 0
    error_message = "Unpublished tasks must not start and must target ARM64 bridge networking."
  }
  assert {
    condition     = aws_ecs_service.this.deployment_minimum_healthy_percent == 0 && aws_ecs_service.this.deployment_maximum_percent == 100 && aws_ecs_service.this.deployment_circuit_breaker[0].rollback
    error_message = "Static ports require stop-before-start with circuit-breaker rollback."
  }
}
run "secrets_must_be_arns" {
  command = plan
  module { source = "../../modules/ecs-service" }
  variables {
    name                 = "test-service"
    cluster_arn          = "REPLACE_WITH_CLUSTER_REFERENCE"
    image                = "example.invalid/risk-engine:test"
    image_repository_arn = "REPLACE_WITH_IMAGE_REPOSITORY_REFERENCE"
    port                 = 8081
    memory               = 512
    secrets              = { DB_PASSWORD = "/sentinel/staging/db-password" }
  }
  expect_failures = [var.secrets]
}

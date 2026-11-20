output "repositories" {
  value = { for name, repo in aws_ecr_repository.this : name => { arn = repo.arn, url = repo.repository_url, name = repo.name } }
}

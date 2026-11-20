# Staging root

Wires network, ECR and repository OIDC modules in eu-west-1 with required
project/owner/env tags. Inputs are in terraform.tfvars.example. Backend setup and
approval sequence: ../../README.md. Terraform has not been applied.
Run init -backend=false, validate and test for credential-free mock plans.
For live plans, copy backend config privately and reinitialise with that config.
Do not copy account-specific outputs into Git. See ADR-0011 and issue #8.

terraform {
  # Modules state a minimum only; the roots and their lock files pin exact versions,
  # so a Dependabot bump in one directory cannot make the set unsatisfiable.
  required_version = ">= 1.17.2"
  required_providers {
    aws = { source = "hashicorp/aws", version = ">= 6.71.0" }
  }
}

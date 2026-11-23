mock_provider "aws" {}
run "cloudfront_only_ingress" {
  command = plan
  module { source = "../../modules/network" }
  variables {
    name              = "test-network"
    availability_zone = "eu-north-1a"
  }
  assert {
    condition     = aws_vpc_security_group_ingress_rule.cloudfront.from_port == 80 && aws_vpc_security_group_ingress_rule.cloudfront.to_port == 80 && aws_vpc_security_group_ingress_rule.cloudfront.cidr_ipv4 == null
    error_message = "Only HTTP from the CloudFront prefix list may enter the host."
  }
  assert {
    condition     = !aws_subnet.public.map_public_ip_on_launch
    error_message = "Only the explicitly associated host address may be public."
  }
}

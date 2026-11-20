# Network

One VPC/public subnet and internet route in a caller-selected AZ. No NAT or ALB.
Only port 80 from the AWS CloudFront origin-facing prefix list is admitted;
there is no SSH or public service/database port. HTTP origin authentication is
also required in nginx (RISK-104). Outbound permits package/image/AWS API access.
Inputs: name, availability_zone, optional CIDRs. Outputs: VPC, subnet and SG IDs.
Provider default tags are inherited. Planning is read-only; apply needs approval.

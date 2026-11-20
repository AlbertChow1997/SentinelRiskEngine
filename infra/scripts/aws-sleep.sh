#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/aws-common.sh"
confirm stop
aws ec2 stop-instances --instance-ids "$instance" >/dev/null
aws ec2 wait instance-stopped --instance-ids "$instance"
echo 'Compute stopped. EBS, EIP, stored images and CDN can still incur charges.'

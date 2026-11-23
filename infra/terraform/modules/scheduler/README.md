# Start/stop scheduling

EventBridge Scheduler invokes only EC2 StartInstances/StopInstances for the supplied
instance, in Europe/Dublin time (DST handled by Scheduler). The module has no default
window: the root decides (currently every day 19:00 start / 02:00 stop; RISK-117).
Inputs: name, instance_id/arn, start_cron, stop_cron, enabled. Output: group_name.
Trust is restricted to the schedule group; execution role cannot control any
other instance. Short bounded retries avoid carrying a stale start into another
window. No schedule is active until an approved Terraform apply creates it.
This stops compute only: EIP, EBS, CDN and stored images can still incur charges.

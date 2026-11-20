# Remote-state bootstrap (not applied)

Uses local state initially. The first approved apply creates a protected,
versioned, AES256-encrypted private state bucket, TLS-only bucket policy, and an
account-wide monthly budget with $15 forecast/$25 actual email alerts. Account-wide
scope deliberately avoids missing untagged resources. Alerts are not a spending
cap; forecasting may need usage history. Enable billing/IAM access in the account.

Copy terraform.tfvars.example to ignored terraform.tfvars and supply a real
notification address privately. Run init, validate, test and plan. After explicit
approval only, apply the reviewed saved plan. Keep the local bootstrap state in
private encrypted backup, never Git. State cannot provision its own backend;
staging is a separate root using the created bucket with native S3 locking.
No AWS resource has been created by committing these files.

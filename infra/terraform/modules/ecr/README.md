# ECR

Creates an immutable, AES256-encrypted scan-on-push repository per image name,
keeping the newest ten images. Inputs: name prefix and set of images. Output:
repositories indexed by image (name, URL, ARN). No image is built or published by
Terraform. Deployments use SHA tags/digests, not mutable latest. Keep deployed
rollback revisions within retention; do not redeploy an expired image blindly.

# CDN and private static site

Private/versioned/SSE-S3 bucket with OAC read-only access restricted to this
distribution, TLS-only bucket policy, seven-day noncurrent version retention.
Static routes use a CloudFront Function SPA rewrite; API behaviour has no SPA
error rewrite, no cache and forwards viewer Authorization/cookies/query strings
using Managed-AllViewerExceptHostHeader. API viewers must use HTTPS.

Inputs: name, unique bucket_name, public origin_hostname (DNS, not a bare IP),
secret_parameter_name. Outputs: bucket/distribution references, URL and SSM ARN.
Before live plan/apply, create a 32-128 character URL-safe SecureString privately
at that name using short-term AWS credentials and explicit approval. No secret
value or real config is committed. State contains the decrypted origin header:
protect the private encrypted state; do not publish full plans/state.

CloudFront sends X-Sentinel-Origin over the deliberately accepted HTTP origin
hop; SG prefix restriction and nginx's matching check are both required. The
default CloudFront certificate forces TLSv1 policy regardless of requested
minimum; stricter TLS needs an own domain/ACM and is the production upgrade path.
SSE-S3/no-WAF scan exceptions are resource-local and
expire 31 Jan 2027; see DESIGN section 19.2/D14. No live CDN is claimed.

Rotate with overlapping old/new secrets or a coordinated maintenance window:
CloudFront propagation and ECS secret refresh are not atomic. Verify both bad
header rejection and CDN health after rotation; never print the secret value.

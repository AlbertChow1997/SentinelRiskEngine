# Staging reverse proxy

Pinned patched official nginx 1.30.7-alpine; runs as nginx on container 8080,
mapped to host 80. CloudFront adds X-Sentinel-Origin, whose SecureString value is
injected by ECS as ORIGIN_SECRET. No default secret; invalid/missing values refuse
startup. Only known environment variables are rendered, without logging secrets.

All API requests require the matching header; it is stripped before forwarding.
Gateway receives payments/ops/merchants; Risk receives risk-assessments/stats/
blocklist; LLM receives insights/llm. Unimplemented services may return 502 until
their own deployment. No ML/admin/actuator passthrough. /api/health proxies the
risk actuator health; /internal-health is loopback-only for the container check.
Logs omit query strings, bodies and authentication headers. The origin header is
an ingress control; JWT/API-key validation still belongs in each service.

Default upstreams are the documented docker0 host address and service ports.
Local container tests override these with loopback stubs; no AWS is contacted.
Verify the actual docker0 address after first boot before enabling deployment.
Never run nginx -T with real configuration: it exposes the rendered secret.
Rotate the SSM value and redeploy nginx in coordination with CloudFront.

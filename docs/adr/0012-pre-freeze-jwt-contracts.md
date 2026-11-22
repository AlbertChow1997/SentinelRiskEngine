# ADR-0012: Replace anonymous demo contracts with authenticated browser APIs

Status: Proposed — producer and consumer approval required in RISK-100 / PR #26.
Date: 20 November 2026.

The imported Gateway ops and Risk Engine contracts allowed anonymous access.
DESIGN sections 6.7 and 14 require Cognito JWTs before their first public release.
These contracts have not frozen or shipped as a supported anonymous API.

Specify Cognito access-token validation (signature, issuer, expiry, token_use,
client_id and configured resource audience) and analyst/admin group checks. Keep
health anonymous and programmatic Gateway payments authenticated with API keys.
The additive merchant provisioning operation requires the merchant group and
derives identity from the verified subject; concurrent calls must return one link.
`x-required-roles` documents group checks; OpenAPI bearer scopes remain empty.

This deliberately removes anonymous access on twelve existing operations. It is
not backward compatible for anonymous callers. Preserve v1 paths before freeze,
bump draft document versions, and require producer/consumer approval. After freeze,
breaking changes require a new API version. Runtime JWT and provisioning code
remain separate tasks; a contract is not an implemented security boundary.

Q12 is explicitly deferred to RISK-111 before Gateway/LLM integration: choose and
review service authentication there. No network-only trust, user-token reuse, or
anonymous security alternative is authorised by this ADR.

The compatibility script permits only the exact anonymous-to-BearerAuth findings
for the listed operations against SHA-256 hashes of the imported base files.
All other breaking changes fail normally. Once main contains the JWT contracts,
the hashes no longer match and the exceptions do not apply; remove the obsolete
files in the next cleanup. No blanket severity override or endpoint exclusion.

Rollback: revert contracts, compatibility metadata and documentation together
before implementation; never deploy an anonymous rollback of a public service.

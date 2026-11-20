# RISK-100 and RISK-101 readiness audit

Audit date: 19 Nov 2026. Repository baseline: `e52d693` on `main`.
Related issues: [RISK-100 / #4](https://github.com/AlbertChow1997/SentinelRiskEngine/issues/4),
[RISK-101 / #5](https://github.com/AlbertChow1997/SentinelRiskEngine/issues/5).

## Conclusion

Neither issue is complete. Keep both open. A reviewed ML contract (#18), backend scaffold (#19), frontend scaffold (#20)
and UI-kit ADR (#21) do not satisfy the separate RISK-100 contracts or all RISK-101 repository controls.
This audit changes documentation and issue checklists only; it does not configure repository settings or deploy resources.

## RISK-100: contracts

| Acceptance criterion | Result | Evidence / remaining work |
|---|---|---|
| LLM Insights OpenAPI with five endpoints | Missing | `contracts/openapi-llm-insights-v1.yaml` does not exist |
| `risk.insights.v1` and `RiskInsightGenerated` | Missing | Neither is present in the AsyncAPI contract |
| Gateway bearer JWT / ops roles | Missing | Only `ApiKeyAuth` is defined; ops operations still use `security: []` |
| `POST /api/v1/merchants/me` | Missing | Path absent from the gateway contract |
| Risk Engine bearer JWT / security lint | Missing | No bearer scheme; `security-defined` remains `warn` |
| Validation and breaking-change checks for this work | Not demonstrated | No RISK-100 implementation PR or CI evidence; previous ML contract validation is a different change |
| LLM contract CODEOWNERS | Present | Existing rule lists producer `zliu-59` and consumers `jiajunxiao-work`, `AlbertChow1997` |

Q12 (service-to-service authentication) remains open. Its decision or explicit deferral belongs in the RISK-100 PR.
Do not infer that documented target endpoints have already been added to the machine-readable contracts.

## RISK-101: GitHub setup

| Acceptance criterion | Result | Evidence / remaining work |
|---|---|---|
| Project and required fields / backlog coverage | Present | Project 2, "Sentinel Pay", has Status, Estimate and Iteration; all eight currently open repository issues are included |
| Weekly iterations | Present | GraphQL reports duration 7 days, Monday start; S1-S5 configured |
| Project built-in workflows | Not verified | Configuration is not exposed by the APIs used; closed issues #6, #12, #13 and #14 still display To do on the board, so automatic status sync cannot be claimed |
| Squash merging only | Not configured | Repository API reports squash, merge commits and rebase merging all enabled |
| Enforced main protection | Unavailable under current repository entitlement | Rulesets and branch-protection APIs return HTTP 403: "Upgrade to GitHub Pro or make this repository public to enable this feature" |
| Staging environment / reviewer gate | Missing | Environment list is empty; `environments/staging` returns 404; availability of the reviewer gate must be checked separately |
| PostgreSQL 18 baseline and major-update policy | Present | Merged #19; design, Compose volume and Dependabot major-ignore rule agree |
| Jiajun collaborator invitation | Accepted | Permission API reports write access for `jiajunxiao-work` |

Required reviewers on environments have different plan restrictions from branch protection; upgrading to Pro alone must
not be presented as a guarantee of a private-repository deployment reviewer gate. See the
[official environment documentation](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).
The current entitlement limitation is now documented in DESIGN Q21, as issue #5 permits, but the remaining unchecked
configuration and automation criteria still prevent closing the issue.

## Evidence and review

- Read GitHub repository merge settings, rulesets, branch protection, environments and collaborator permission through REST.
- Read Project 2 and its fields/items through GitHub CLI; query Iteration configuration through GraphQL.
- Compare the eight open issue numbers with the twelve existing Project items; all open issues are covered.
- Inspect committed YAML contracts, CODEOWNERS, Compose and Dependabot policy at the baseline above.
- No AWS API calls, resource creation, paid-plan changes, visibility changes or GitHub settings mutations were performed.
- Project workflow enabled/disabled state remains unverified; stale cards are evidence of unsynchronised state, not proof
  of a specific toggle setting. Verify the workflows in the Project UI before checking that criterion.

Request teammate review of this audit before accepting the recorded exceptions. Do not close #4/#5 merely because this
audit PR merges. Backend CI (RISK-12 / #7) is a dependency-ready next task because #6 is already merged; it can proceed
without credentials, AWS deployment or resolving the future authenticated API contracts.

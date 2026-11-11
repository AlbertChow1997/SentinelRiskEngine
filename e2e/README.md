# End-to-end tests

| What | Tool | Where | Scenarios |
|---|---|---|---|
| API scenarios | Postman collection run with Newman | `e2e/*.postman_collection.json` | E1–E9 (risk engine), P1–P14 (payments), L1–L4 (LLM insights) — `docs/DESIGN.md` §12.3 |
| UI smoke tests | Playwright | `frontend/` (config and specs live with the frontend) | Homepage, sample flow, login redirect, role-based dashboard |
| Sample events | JSON files, one per event type | `e2e/events/` | Taken from `contracts/asyncapi-events-v1.yaml`; consumers test against them before the producers exist |

Run everything against the local stack with `make e2e`. Nothing exists here yet; the collections arrive with milestones M1, M2 and M4.

End-to-end tests never call paid external APIs: the LLM step runs with `StubProvider`.

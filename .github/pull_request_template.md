<!-- Title: Conventional Commit with the backlog ID, e.g. `feat(gateway): RISK-73 add idempotency key replay` -->

## Links

- Closes #<!-- the GitHub issue for this work, titled [RISK-<n>] … -->

## What and why

<!-- What does this PR change, and what problem does it solve? -->

## How it was tested

<!-- Commands you ran and what they showed. New behaviour needs new tests. -->

- [ ] Component checks pass locally (`make test-<component>`, `make lint`)

## Screenshots (UI changes only)

## Risk and rollback plan

<!-- What could go wrong, how we would notice, and how to roll back. -->

## Checklist

- [ ] One ticket, one purpose; under ~400 changed lines (excluding generated code and lockfiles)
- [ ] **Docs updated?** `DESIGN.md` / `ROADMAP.md` / `TECH_DECISIONS.md` / runbooks, or not needed
- [ ] **Contract changed?** If yes: `contracts/` changed first, the change is additive, producer and consumers approve
- [ ] No secrets, personal data or card numbers in code, tests, logs or prompts
- [ ] English only

## AI assistance used

<!-- Yes/No. If yes, name the parts (e.g. "MSW handlers generated, then reviewed and edited"). You own every line you merge. -->

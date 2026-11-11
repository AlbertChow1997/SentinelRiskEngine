# ADR-0001: Record architecture decisions

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 11 Nov 2026 |
| **Deciders** | Jiawei Zhou (tech lead) |
| **Related** | RISK-10 · `docs/TECH_DECISIONS.md` |

## Context

Sentinel Pay is built by three people with separate areas, over several months, alongside university work. Decisions are made in
chat, in calls and in AI-assisted sessions. Without a written record, the reasons are lost within weeks, the same questions come
back, and nobody can explain in an interview why the system looks the way it does.

The project also aims to work the way an enterprise team works, where significant technical choices are written down, reviewed
and kept with the code.

## Options

1. **No formal record** — rely on PR descriptions and chat history. No overhead, but the reasoning is scattered and hard to find.
2. **One large decisions document** — easy to browse, but it turns into a document nobody dares to edit, and it hides the history of each decision.
3. **Architecture Decision Records (ADRs) plus an index** — one short Markdown file per decision, in the repository, reviewed through a PR like code.

## Decision

We record every significant technical decision as an ADR in `docs/adr/`, following Michael Nygard's format with an explicit
Options section:

- File name: `NNNN-title-in-kebab-case.md`, numbered in order. Start from `0000-template.md`.
- Sections: **Context**, **Options**, **Decision**, **Consequences**.
- Status: `Proposed` → `Accepted` → (later, possibly) `Superseded by ADR-NNNN`. An accepted ADR is not rewritten; a change of mind is a new ADR that supersedes it.
- Each ADR is merged through a PR approved by the owner of the affected area.
- `docs/TECH_DECISIONS.md` is the index: it lists every ADR and holds the comparison table (options × fit, learning curve, cost, ecosystem / hiring signal, operational burden) for each technology choice.

A decision is "significant" when it adds or replaces a dependency, service or cloud resource, changes how components talk to each
other, or would be expensive to reverse.

## Consequences

- New teammates and reviewers can find out why something was chosen without asking.
- Each ADR is interview material: context, options, trade-offs and outcome on one page.
- Writing an ADR costs about fifteen minutes per decision; this is accepted.
- Decisions taken in design v2.0 (ADRs 0002–0006 and 0008 in the index) still need their files written; until then `DESIGN.md` is their record.
- ADR numbers cited in `DESIGN.md` must stay stable, so numbers are never reused.

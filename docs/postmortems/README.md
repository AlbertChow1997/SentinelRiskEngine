# Post-incident reviews

Incidents and major bugs get a **blameless** review. The question is always "what in the system made this possible?", never
"who did it?".

File name: `YYYY-MM-DD-short-title.md`. Write it within a week of the incident and link it from the progress log in
`docs/ROADMAP.md`.

## Template

```markdown
# Post-incident review: <short title>

| | |
|---|---|
| **Date of incident** | |
| **Duration** | |
| **Severity** | Low / Medium / High |
| **Author** | |
| **Status** | Draft / Reviewed |

## Summary
Two or three sentences: what happened and what the impact was.

## Timeline (Irish time)
| Time | Event |

## Root cause
What actually went wrong, traced back with "why?" until a cause in the system or process is reached.

## What went well

## What went badly

## Where we got lucky

## Actions
| Action | Type (prevent / detect / mitigate) | Owner | Jira | Due |
```

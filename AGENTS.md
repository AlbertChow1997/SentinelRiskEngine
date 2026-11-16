# Repository instructions

Read `CLAUDE.md` and the relevant component guide before implementing changes. Keep committed repository content,
commit messages, pull requests and issues in English. Follow the user's language for conversation.

## Required local change notes

The owner requires a Chinese explanation document for every substantive change or completed review, merge,
configuration or documentation update in this repository. Complete the note before the final handoff.

- Read `local-notes/README.md` and a recent numbered note first. Follow their format and continue the existing sequence.
  If the ignored notes are absent on a new checkout, create the directory and index using these requirements.
- Create `local-notes/YYYY-MM-DD-NN-topic.md`, using the owner's Europe/Dublin date. Group intermediate edits belonging
  to the same change into one note; update that note when its validation or review status changes.
- Include the date, branch and available issue/PR/commit references; what changed and why; affected files;
  implementation steps; relevant design choices; actual validation commands/results; limitations, rollback and next steps.
- Use tables, diagrams and comparisons where they help explain the change. Do not invent tests or outcomes.
  Distinguish local checks from CI, and implementation from approval, merge and deployment.
- Add the note to `local-notes/README.md`. Preserve historical records; add a dated correction linking to the new note
  when an earlier recommendation has been superseded.
- Keep Chinese notes, supporting assets and local evidence inside the git-ignored `local-notes/` directory.
  Never force-add them or include credentials, tokens or personal/payment data.
- Update public design docs, ADRs, READMEs and changelogs separately when applicable; local notes do not replace them.

This requirement applies to subsequent changes as well as the current task. At handoff, link the new local note(s).

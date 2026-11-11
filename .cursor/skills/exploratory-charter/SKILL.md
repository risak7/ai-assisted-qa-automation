---
name: exploratory-charter
description: >-
  Formats an exploratory test charter and a session findings template from a
  feature and a risk the human supplies. Use when the user asks for a session
  charter, exploratory charter, risk-based exploration, or ET charter before
  manual testing — not for Gherkin plans (explore-and-generate) or Jira tickets
  (jira-ticket-to-gherkin).
---

# Exploratory charter

The thinking is human; the skill just keeps the format.

Do not open the app, invent scenarios, or rank risks beyond what the human
stated. If **feature** or **risk** is missing, ask for them once, then stop.

## Inputs

Collect (from the message or one short follow-up):

| Input | Required | Notes |
|-------|----------|--------|
| Feature | Yes | Name or one-line scope (page, workflow, ticket title). |
| Risk | Yes | What could go wrong or what we doubt (data, auth, edge, regression). |
| Time box | No | Default `60 min` if omitted. |
| Environment | No | e.g. staging URL, role, build — only if the human gives it. |
| Focus hints | No | Areas or questions the human already has — paste verbatim. |

## Procedure

1. Confirm feature and risk in one sentence each (no new analysis).
2. Emit **Charter** using the template below (fill blanks; leave `[TBD]` only
   where the human gave nothing and the field is optional).
3. Emit **Findings template** unchanged except session metadata filled from
   step 1.
4. Stop. Do not add Playwright steps, Gherkin, or automation tasks.

Optional: if the human asks to save, write
`charters/<kebab-feature-slug>-<YYYYMMDD>.md` with both sections in one file.

## Charter template

Output this structure:

```markdown
# Exploratory charter: [FEATURE]

**Risk under study:** [RISK — human wording, lightly trimmed only]

| Field | Value |
|-------|-------|
| Session ID | [FEATURE]-[YYYYMMDD] |
| Time box | [TIME_BOX] |
| Environment | [ENV or TBD] |
| Tester | [name or TBD] |

## Mission

Explore **[FEATURE]** with attention to **[RISK]**.

## In scope

- [Human focus hints, or single bullet restating feature scope]

## Out of scope

- [TBD unless human stated exclusions]

## Oracles

How we'll know something is wrong (human-supplied or generic placeholders):

- [ ] Matches ticket / spec / prior behavior the human cited
- [ ] No unexpected errors (UI, console, API) during the mission
- [ ] [Optional: human-stated oracle]

## Notes (preflight)

- Charter only — ideas and paths are filled during the session in Findings.
```

## Findings template

Output this structure (empty rows for the tester):

```markdown
# Findings: [FEATURE] — [SESSION_ID]

**Risk under study:** [RISK]
**Time box:** [TIME_BOX] | **Actual duration:** ___
**Environment:** [ENV or TBD]

## Coverage sketch

| Area / path | Time spent | Done? |
|-------------|------------|-------|
| | | ☐ |

## Observations

| # | What I did | What I saw | Severity (info/low/high) |
|---|------------|------------|---------------------------|
| 1 | | | |

## Defects

| # | Summary | Steps | Expected | Actual | Evidence |
|---|---------|-------|----------|--------|----------|
| | | | | | |

## Questions / assumptions

- 

## Handoff

- [ ] Log bugs (keys): ___
- [ ] Follow-up charter needed: ___
- [ ] Automation candidate (flow + risk): ___
```

## Examples

**User:** Feature: Programs save dialog. Risk: unsaved changes lost on navigate away.

**Agent:** Fills mission, scope, and metadata; leaves findings tables empty for the
tester; does not list ten test ideas.

## Related skills

| Goal | Skill |
|------|--------|
| Untested UI → Gherkin plan | explore-and-generate |
| Jira ticket → Gherkin plan | jira-ticket-to-gherkin |
| Red run → diagnosis | triage / ci-failure-triage |

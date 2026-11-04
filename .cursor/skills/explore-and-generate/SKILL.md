---
name: explore-and-generate
description: >-
  Finds untested UI flows and produces a Gherkin test plan when there is no
  Jira ticket. Use immediately when the user says "find what we're not
  testing", "explore <page> for untested flows", or "expand coverage". Do NOT
  use when a ticket already exists — that is jira-ticket-analyzer; this is for
  when there's no ticket.
---

# Explore and Generate

Read-only exploration. Map what tests already cover, crawl the live UI, find
the highest-value coverage gap, and hand a Gherkin plan to the test-writer.
Do not write Playwright specs, edit app code, or mutate product data beyond
what navigation requires.

## When to use

- User asks to find what we're not testing, explore a page for untested flows,
  or expand coverage
- No Jira ticket is provided

If a ticket key exists (e.g. DS-1), stop and use jira-ticket-analyzer instead.

## Steps

1. **Map covered flows** — Read `tests/` (and related `features/` if present).
   List the user flows already asserted: page, actions, and outcomes.

2. **Crawl the target** — Open the target page via the Playwright MCP
   (`user-Playwright`). Read tool schemas first. Sign in using credentials from
   `.env` if needed. Capture structure with `browser_snapshot` (a11y tree).
   Do **not** rely on screenshots or pixels for flow discovery.

3. **Enumerate real user flows** — From the a11y tree and interactive controls
   only, list the flows the UI actually supports (create, edit, delete, filter,
   validate, cancel, navigate, etc.). Do not invent flows the UI does not expose.

4. **Diff for coverage gaps** — Diff the enumerated flows against the suite
   from step 1. Produce the uncovered set.

5. **Pick one flow** — Choose the single highest-value uncovered flow for this
   run. State the reason (risk, frequency, or criticality). One flow per run —
   do not batch multiple plans.

6. **Write a Gherkin test plan** — Save
   `features/explore-<area>-<flow>.feature` for the test-writer to implement:
   - One happy-path `Scenario`
   - One edge-case `Scenario`
   - Every `Then` must be something a Playwright assertion can check
     (visible text, role, state, URL) — no vague outcomes
   - Note real controls observed in step 2 beside the steps that use them

## Output

Write to `features/explore-<area>-<flow>.feature`.

```gherkin
Feature: <uncovered flow name>
  Coverage gap — <one-line reason this flow was chosen>

  # Happy path

  Scenario: <positive path>
    Given ...
    When ...
    Then ...
    # Observed: <page / control from a11y tree>

  # Edge case

  Scenario: <one edge case>
    Given ...
    When ...
    Then ...
```

Stop after the plan. The test-writer implements it. Do not write Playwright
specs in this skill.

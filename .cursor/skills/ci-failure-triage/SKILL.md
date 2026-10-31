---
name: ci-failure-triage
description: When a CI run is red, pull the run's logs and the playwright-report artifact via gh CLI, read the Playwright error and trace, cross-reference the spec, POM, and app source in the repo, classify real app bug vs test issue, and post a structured diagnosis to the PR. Use whenever a build fails — even if triage isn't asked for.
---

# CI Failure Triage

## Steps
1. Pull the failed run's logs + playwright-report artifact (GitHub MCP / gh CLI).
2. Read the Playwright error: failing test, expected vs received, trace path.
3. Cross-reference: the spec, the POM, and the Didaxis source in the repo if exist.
4. Classify: real app bug (route to a Jira bug via bug-reporter) vs
   test issue (propose a patch for human review) vs informational a11y
   (report the violations; do not file and do not patch).
5. Report: post root cause, affected file, expected/actual, suggested fix,
   and evidence (trace/screenshot + run id) as a PR comment.

## Rules
- Never merge a fix automatically — propose, a human approves.
- For a real defect, reuse the bug-reporter skill and link the story.
- An `@a11y` result is not a real defect. Report the violations (rule id, impact, target, help URL) and stop. Do not file a bug and do not propose `.disableRules()` or a spec change. A11y must not fail CI.
- The diagnosis must name the source location and cause, not just the symptom.

## Resolve the failed run

Use `gh` for all GitHub operations. Request `network` / `all` permissions when downloading artifacts.

**PR context** — prefer the check tied to the current branch:

```bash
gh pr checks --watch=false
gh pr view --json number,headRefName,commits
```

**Run id** — from the failing check URL or:

```bash
gh run list --workflow=e2e.yml --limit 5
gh run view <run-id> --log-failed
```

Workflow artifact name: `playwright-report` (see `.github/workflows/e2e.yml`).

```bash
mkdir -p .ci-triage/<run-id>
gh run download <run-id> -n playwright-report -D .ci-triage/<run-id>/playwright-report
```

Open `playwright-report/index.html` indirectly: read embedded failure text from CI logs first, then inspect `test-results/` and trace zip paths referenced in the log. Unzip traces under `.ci-triage/<run-id>/` when you need step-level DOM/network evidence.

## Investigation checklist

Copy and track:

```
- [ ] Failing spec path and exact test title (`-g` title)
- [ ] Assertion: expected vs received (from log or report)
- [ ] Stack points to spec vs `pages/` POM
- [ ] POM locators/actions match current UI (apply pom-conventions)
- [ ] Ticket key from `test.describe`, title, or `features/<KEY>.feature`
- [ ] Didaxis app source in repo (if any) vs test-only repo
- [ ] Env/secrets/credentials called out in log (not a product bug)
- [ ] Classification: product defect | test issue | env/flake | informational a11y
```

## Classification

| Outcome | Action |
|---------|--------|
| **Product defect** | Follow [jira-bug-reporter](../jira-bug-reporter/SKILL.md). Include CI run id and artifact paths in the Bug description. |
| **Test issue** | Draft a minimal patch (spec and/or POM). Do not merge; leave for review. |
| **Locator / wait flake** | Test issue, not environment. CSS or XPath → user-facing locator (`getByRole`, then `getByLabel` / `getByPlaceholder`, then `getByText`, then `getByTestId` with a comment on why). `waitForTimeout` → `expect(locator).toBeVisible()` / `.toBeEnabled()` / `.toHaveText()`. `expect(await locator.isVisible()).toBe(true)` → `expect(locator).toBeVisible()`. Multi-match `.first()` → `.filter({ hasText })`. Do not change what the assertion checks. |
| **Relative timestamp or date-format drift** | Test issue, not environment/flake. A label such as `just now`, `N minutes ago`, or `today` whose spec never calls `page.clock.install` must freeze time before navigation, then assert the stable copy. A local-vs-CI date string is a test issue when the spec formats the date itself; `use.locale` is `en-US` and `use.timezoneId` is `America/Toronto` in `playwright.config.ts`. Do not recommend `retries` above 2 or `workers: 1`. Do not substitute another locale or timezone. |
| **Mocked subject or invented copy** | Test issue. `page.route` on the endpoint the test is verifying, or an error/empty-state string that was not read from the live page, is not a product defect. Re-read the UI (programs-network-edge-cases) and assert only that copy, or state that the app renders nothing. |
| **Env / credentials / flake** | Explain in the PR comment. Do not file a product Bug. |
| **Informational a11y** | `tests/*.a11y.spec.ts`, tag `@a11y`, or an `axe-violations.json` / warning annotation. List rule id, impact, target, and help URL for the dev team. Do not file a Bug, do not propose `.disableRules()` or a spec patch, and do not treat it as the cause of a red build. A11y checks report violations and must not fail CI (`expectNoAxeViolations` / `runCiSoftA11y` in `tests/helpers/accessibility.ts`). |

## PR comment template

Post with `gh pr comment <number> --body-file ...` (never auto-merge fixes):

```markdown
## CI failure triage

**Run:** [<run-id>](https://github.com/<owner>/<repo>/actions/runs/<run-id>)
**Workflow:** E2E Tests (`e2e.yml`)

### Summary
<one sentence root cause, not symptom>

### Classification
Product defect | Test issue | Environment | Informational a11y

### Failing test
- Spec: `tests/...`
- Title: `<exact title>`

### Expected vs actual
- **Expected:** ...
- **Actual:** ...

### Source location
- **File:** `path:line` — <why this line causes the failure>

### Suggested fix
<concrete next step or patch summary; link Jira DS-xxx if filed>

### Evidence
- Log excerpt or assertion message
- Trace/screenshot path from `playwright-report` or `test-results/`
```

If triage runs on a push to `main` with no open PR, post the same structure as a commit comment or summarize in chat with the run URL.

## Related skills

- [jira-bug-reporter](../jira-bug-reporter/SKILL.md) — Jira Bug when classification is product defect
- [pom-conventions](../pom-conventions/SKILL.md) — locator and POM structure when the failure is test-side
- [api-cleanup](../api-cleanup/SKILL.md) — if the failure involves leftover test data
- [programs-network-edge-cases](../programs-network-edge-cases/SKILL.md) — if a programs test mocked the call it claims to verify, or asserted error/empty copy that was not on the live page
- [a11y-checks](../a11y-checks/SKILL.md) — if the signal is an `@a11y` spec or an axe violation report; that is info for the dev team and must not fail CI
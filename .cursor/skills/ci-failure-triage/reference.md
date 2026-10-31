# CI failure triage — reference

## Resolve the failed run

From the repo root, with `gh` authenticated:

```bash
# PR associated with current branch
gh pr view --json number,headRefName,url

# Latest failed E2E run for this PR (adjust workflow name if needed)
gh run list --workflow=e2e.yml --branch "$(git branch --show-current)" --limit 5

# Or by run ID from the PR checks UI
gh run view <run-id> --log-failed
```

Workflow uploads artifact **`playwright-report`** (see `.github/workflows/e2e.yml`).

```bash
mkdir -p ci-downloads
gh run download <run-id> -n playwright-report -D ci-downloads/run-<run-id>
```

Open `ci-downloads/run-<run-id>/index.html` or read embedded `data/*.md` / PNG / trace zips under that tree.

## Parse the failure

Extract from logs or report:

- Spec file and test title
- Assertion: expected vs received
- Screenshot paths under report `data/`
- Trace zip if present (`npx playwright show-trace <path-to-trace.zip>` locally)

Cross-check in repo:

| Layer | Typical paths |
|-------|----------------|
| Spec | `tests/**/*.spec.ts`, `features/DS-*.feature` |
| POM | `pages/**/*.ts` (no inline locators in specs — see `pom-conventions`) |
| App | Didaxis source only if present in this repo or linked submodule |

## Classify

| Signal | Likely classification |
|--------|------------------------|
| UI/API behavior contradicts AC/feature file | App bug → `jira-bug-reporter` |
| Stale/wrong locator, timing, test data, missing cleanup | Test issue → propose patch |
| CSS/XPath, `waitForTimeout`, `expect(await locator.isVisible()).toBe(true)`, or `.first()` on a multi-match | Test issue (markup coupling, fixed sleep, non-retrying assert, or ambiguous match) → pom-conventions replacement; not environment/flake |
| Relative timestamp (`just now`, `N minutes ago`, `today`) with no `page.clock.install`, or a date string that differs only by locale/timezone | Test issue. Freeze time in the spec before navigation. Do not recommend `retries` above 2 or `workers: 1`. Locale is `en-US` and timezone is `America/Toronto` in `playwright.config.ts` `use`. Do not substitute another pair. |
| `page.route` fulfills the endpoint the test verifies, or the assertion string was not read off the live page | Test issue → programs-network-edge-cases; not an app bug |
| Secrets/env missing in CI log | Infra/setup — call out in PR; do not file app bug unless user asks |
| `tests/*.a11y.spec.ts`, tag `@a11y`, `axe-violations.json`, or a warning annotation | Informational a11y — list rule id, impact, target, help URL for the dev team. Not an app bug, not a test patch, not `.disableRules()`. Must not fail CI (`tests/helpers/accessibility.ts`). |

## PR comment template

Post with `gh pr comment <number> --body-file -` (heredoc) or GitHub MCP:

```markdown
## CI failure triage

**Run:** [<run-id>](https://github.com/<owner>/<repo>/actions/runs/<run-id>)
**Check:** E2E Tests
**Classification:** App bug | Test issue | Environment | Informational a11y

### Failing test
`<spec>` — `<test title>`

### Root cause
[One paragraph: source file + line or component, and *why* it failed — not only the assertion text.]

### Expected vs actual
- **Expected:** …
- **Actual:** …

### Suggested fix
- [ ] App: … (Jira: DS-xxx if filed)
- [ ] Test: … (proposed diff for review — not merged automatically)

### Evidence
- Screenshot: `ci-downloads/run-<run-id>/…`
- Trace: `…` (if available)
```

## App bugs

Follow `.cursor/skills/jira-bug-reporter/SKILL.md`: duplicate check, reproduce when possible, attach screenshots, sub-task under parent story (DS-N from describe/feature name).

## Local reproduction (optional)

```bash
npx playwright test <spec-file> -g "<test title>" --workers=1
node scripts/collect-failure-screenshots.mjs --latest
```

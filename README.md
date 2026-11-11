# AI-assisted QA automation

Playwright end-to-end tests for Didaxis, plus Cursor agents and skills for ticket-driven test generation, triage, and self-heal.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- Chromium (installed automatically via `npm` postinstall)

## Install

```bash
git clone https://github.com/risak7/ai-assisted-qa-automation.git
cd ai-assisted-qa-automation
npm ci
```

`postinstall` runs `playwright install` so browsers are ready for local runs.

## Environment

1. Copy the example file:

   ```bash
   cp .env.example .env
   ```

2. Fill in the **Run tests** variables in `.env` (see comments in [`.env.example`](.env.example)):
   - `DIDAXIS_URL`, `DIDAXIS_EMAIL`, `DIDAXIS_PASSWORD`, `DIDAXIS_API_TOKEN`
   - Optional: `DIDAXIS_ALT_EMAIL`, `DIDAXIS_ALT_PASSWORD` for permission probes. A few specs still look for `DIDAXIS_NON_ADMIN_EMAIL` / `DIDAXIS_NON_ADMIN_PASSWORD`; point those at the same alt account if you run those cases.

Do not commit `.env`. Agent/CI variables (`CURSOR_API_KEY`, `ATLASSIAN_*`) are only needed for backlog automation and MCP—not for running the suite locally.

## Run tests

Full suite (setup project logs in once, then chromium specs):

```bash
npx playwright test
```

Useful npm scripts from [`package.json`](package.json):

| Command | Purpose |
|--------|---------|
| `npm test` | Same as `npx playwright test` |
| `npm run test:ui` | Playwright UI mode |
| `npm run test:headed` | Headed browser |
| `npm run test:smoke` … `test:destructive` | Suite tag slices (`test:destructive` uses `--workers=1`) |
| `npm run report` | Open the HTML report after a run |

Auth is handled by [`tests/auth.setup.ts`](tests/auth.setup.ts), which writes `playwright/.auth/user.json` for the chromium project.

## Run a tagged slice

Each test has exactly one suite tag: `@smoke`, `@sanity`, `@regression`, `@api`, `@e2e`, or `@destructive`. Run a slice with npm or `--grep`:

```bash
npm run test:smoke
npm run test:sanity
npm run test:regression
npm run test:api
npm run test:e2e
npm run test:destructive   # --workers=1; serial shared-state tests
```

```bash
npx playwright test --grep @regression
```

Run a single test by title substring:

```bash
npx playwright test -g "TC-001"
```

Run one file:

```bash
npx playwright test tests/ds1-create-new-academic-program.spec.ts
```

Convention details live in [`.cursor/rules/playwright-conventions.mdc`](.cursor/rules/playwright-conventions.mdc) and [`.cursor/rules/constitution.mdc`](.cursor/rules/constitution.mdc).

## Cursor agents and skills

This repo ships orchestration under [`.cursor/`](.cursor/):

| Path | Role |
|------|------|
| [`.cursor/rules/`](.cursor/rules/) | QA routing, Playwright norms, project constitution |
| [`.cursor/agents/`](.cursor/agents/) | `test-writer`, `triage`, `bug-reporter` subagent prompts |
| [`.cursor/skills/`](.cursor/skills/) | Ticket → Gherkin, self-heal, API cleanup, a11y, CI triage, etc. |

**Local use:** Open the repo in [Cursor](https://cursor.com). Project rules apply automatically. For Jira/Confluence from the agent, configure the Atlassian MCP in Cursor settings with the same `ATLASSIAN_EMAIL` and `ATLASSIAN_API_TOKEN` you would use for the REST API (optional for test runs).

**CI backlog:** [`.github/workflows/test-generation.yml`](.github/workflows/test-generation.yml) runs headless `agent` on a schedule/dispatch. Store `DIDAXIS_*`, `CURSOR_API_KEY`, and `ATLASSIAN_*` as GitHub Actions secrets. Playwright CI uses [`.github/workflows/e2e.yml`](.github/workflows/e2e.yml) with Didaxis secrets only.

Human approval is required for merges and filed bugs; agents open PRs and reports but do not merge.

## Reliability eval report

[`eval-report.md`](eval-report.md) scores flake rate, heal success, generation-gate pass rate, and ask-vs-guess. Refresh locally:

```bash
npm run eval:report
```

The report is regenerated automatically at the end of [`test-generation.yml`](.github/workflows/test-generation.yml) and on local agent runs via Cursor `stop` / `sessionEnd` hooks (see [`.cursor/hooks.json`](.cursor/hooks.json)).

## CI

[`.github/workflows/e2e.yml`](.github/workflows/e2e.yml) runs tagged slices when repository secrets are set:

| Trigger | Job | Command |
|---------|-----|---------|
| `pull_request` | Smoke | `npm run test:smoke` (`@smoke`) |
| `push` | Sanity | `npm run test:sanity` (`@sanity`) |
| `workflow_dispatch` | Regression (full suite) | `npx playwright test` |

A PR update runs **smoke** (PR event) and **sanity** (push to the branch). Run the full suite on demand from **Actions → E2E Tests → Run workflow**.

Smoke and sanity use `--pass-with-no-tests` until every spec carries `@smoke` or `@sanity`. Failures can be triaged with the `ci-failure-triage` skill and the `triage` agent.

## Further reading

- [`auth-strategy.md`](auth-strategy.md) — when to use storageState vs UI login
- [Playwright docs](https://playwright.dev/docs/intro)

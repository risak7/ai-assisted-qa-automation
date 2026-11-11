# Suite reliability eval report

Generated: 2026-11-11T02:39:48.756Z  
Trigger: `test-generation`  
CI window: last 30 `e2e.yml` workflow runs

> Cursor has no built-in reliability telemetry. Metrics below are derived from GitHub Actions logs, pull-request history, constitution scans, and local agent session transcripts.

## Flake rate

| Metric | Value |
|--------|-------|
| Unique tests that passed only on retry | **0** |
| E2E workflow runs in window | 30 (logs fetched for 24) |
| Flake rate (flaky tests ÷ runs) | **0.0%** |

**How measured:** Parsed last 30 `e2e.yml` runs via `gh run view --log`, counting unique test titles that show Playwright `(retry #n)` (CI `retries: 2` in playwright.config.ts).

**What it tells us:** No retry-only passes detected in the sampled CI window — suite looks stable or logs omit retries.

## Heal success rate

| Metric | Value |
|--------|-------|
| Heal PRs (clean / total) | **0 / 3** |
| Heal success rate | **0.0%** |
| Masked regressions (must be 0) | **2** |

**How measured:** GitHub PRs whose branch starts with `heal/` (or title mentions heal). Clean = smoke/E2E check passed and no `tests/**` or `features/**` diff (POM-only per self-heal policy). Masked regression = heal PR that touched spec/feature files.

**What it tells us:** At least one heal changed assertions or specs — constitution violation risk.

## Generation-gate pass rate

| Metric | Value |
|--------|-------|
| First-PR passes (green + conforming + maps-to-AC) | **1 / 12** |
| Pass rate | **8.3%** |

**How measured:** PRs from `test/*` or `cursor/*` branches or DS-* titles. Pass = earliest `e2e.yml` run on the PR branch succeeded, constitution WON'T scan clean on new specs, and matching `features/DS-*.feature` contains `@AC-` tags with related spec files.

**What it tells us:** Some first-cut PRs missed green, conformity, or AC mapping — tighten test-writer checklist.

## Ask vs guess

| Metric | Value |
|--------|-------|
| Times agent asked (AskQuestion + hooks) | **0** |
| Times agent likely invented a value (heuristic) | **0** |
| Ask ratio (asks ÷ asks+guesses) | **n/a** |

**How measured:** Session review: 0 Cursor agent transcript `.jsonl` files under `/home/runner/.cursor/projects/c-GIT-Legion-Automation-ai-assisted-qa-automation/agent-transcripts` (last 30d) — count `AskQuestion` tool uses + `.eval/telemetry.json` hook tally; guesses use assistant phrasing heuristics (`assuming`, `defaulting to`, etc.). No built-in Cursor telemetry.

**What it tells us:** Agents lean toward asking — keep AskQuestion for env, ticket scope, and merge approvals.

## Summary

**Top reliability risk:** Heal PRs that edited specs/assertions (masked regression).

**Next action:** Revert spec changes on heal branches; enforce POM-only self-heal and re-run triage before repair.

---

Refresh this report: `npm run eval:report` (local) or automatically after [`test-generation.yml`](.github/workflows/test-generation.yml) and on Cursor `stop` / `sessionEnd` hooks when running agents locally.

---
name: a11y-checks
description: Adds @axe-core/playwright accessibility scans and keyboard
  coverage when generating or reviewing Playwright tests for new pages or
  components. Apply whenever creating, extending, or reviewing UI tests —
  even if the user does not mention accessibility, a11y, or axe. Real
  violations are an info report for the dev team and must not fail CI.
---

# Accessibility Checks

Every Playwright test for a new page or component **must** include axe-core
coverage plus a keyboard path axe cannot cover. This does not require the
user to ask. Prefer dedicated specs under `tests/<feature>.a11y.spec.ts`
(see programs page below).

## When to apply

- Generate or extend a Playwright spec for a page, modal, drawer, or widget
- Review or refactor any UI test — even with no a11y mention

## Required axe pattern

```typescript
import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

const results = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa"])
  .analyze();

await expect(results.violations).toEqual([]);
```

- Load the target UI via POMs; wait with web-first `expect` before scanning.
- Assert with `expect(results.violations).toEqual([])` — never bare `assert`
  or manual length checks.
- Scope with `.include()` / `.exclude()` **only** if a third-party widget is
  noisy, and comment why. Prefer full-page scans for page-level coverage.

## Keyboard test (axe cannot do this)

For the programs page (and other primary CTAs):

1. Navigate via POM (`ProgramsPage.goto()`).
2. Tab to the primary control (e.g. `+ New Program`) using role-based POM locators.
3. `await expect(primaryControl).toBeFocused()`.
4. Press Enter; assert the dialog opens (`expect(modal.dialog).toBeVisible()`).

Role-based locators throughout. No inline locators in the spec.

## Programs page coverage

Add (or keep) both in `tests/programs.a11y.spec.ts`:

1. Axe scan of the Programs page with `withTags(['wcag2a','wcag2aa'])`, asserted with `expect(results.violations).toEqual([])`.
2. Keyboard: tab → primary control focused → Enter → New Program dialog open.

**One tag per test:** `{ tag: '@a11y' }` only. Drive all interaction through existing POMs (`ProgramsPage`, `NewProgramModal`). No inline locators in the spec.

If that file already calls `expectNoAxeViolations` / `runCiSoftA11y`, leave it. Do not add a second bare `expect(results.violations).toEqual([])` next to the helper, and do not change its `.include()` / `.exclude()` scope.

## Violations are info — they must not turn CI red

A real violation is a report for the dev team to cover later. It is not a failed E2E job and it is not a bug to file.

Apply the assertion through `tests/helpers/accessibility.ts`:

- **Scan.** `expectNoAxeViolations(page, { tags: ["wcag2a", "wcag2aa"] })` runs `new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()`. When `CI` is set and violations exist, it attaches `axe-violations.json` (rule id, impact, help, help URL, sample targets), pushes a `warning` annotation, logs the summary, and returns. The test stays green. Locally a non-empty list still fails, which is the same gate as `expect(results.violations).toEqual([])`. Do not also put that bare expect in the spec — a bare expect fails CI.
- **Keyboard.** Wrap the `toBeFocused()` / Enter / dialog asserts in `runCiSoftA11y`. In CI a failure is attached and annotated; the job stays green. Locally it still asserts.

When you report a run, list each violation: rule id, impact, target, help URL, and the spec name. That list is the info state. Do not call `.disableRules()` to hide a violation. Do not drop the expect to make a local run green. Do not hand the list to bug-reporter.

`.include()` / `.exclude()` stay limited to a noisy third-party widget, with a comment on that call that says why. A comment that exists only to shrink the scan is not a reason.

## File placement

- Dedicated: `tests/<feature>.a11y.spec.ts`
- Or an axe assertion at the end of a functional test that already reaches the UI

Keep axe scans and keyboard asserts in specs, not POMs. POMs may expose
`axeIncludeSelector()` only when a scan must scope out a noisy third-party widget.

## Checklists

Generating:

- [ ] `AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()`
- [ ] `await expect(results.violations).toEqual([])` via `expectNoAxeViolations` (CI stays green; violations attached)
- [ ] Keyboard path with `toBeFocused()` + Enter opens dialog, via `runCiSoftA11y` where CI must not fail
- [ ] POMs only; one tag, `{ tag: '@a11y' }`
- [ ] Real violations listed (rule id, impact, target, help URL) as info for the dev team — not silenced, not filed

Reviewing:

- [ ] New page/component has axe + keyboard coverage
- [ ] Tags are `wcag2a` / `wcag2aa`; the test tag is `@a11y` only
- [ ] No `.disableRules()` hiding a real violation
- [ ] `.include()`/`.exclude()` only for noisy third-party, with a comment why
- [ ] CI path reports violations and does not fail the job

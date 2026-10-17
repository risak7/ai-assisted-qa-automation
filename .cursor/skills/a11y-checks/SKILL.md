---
name: a11y-checks
description: Adds @axe-core/playwright accessibility scans and keyboard
  coverage when generating or reviewing Playwright tests for new pages or
  components. Apply whenever creating, extending, or reviewing UI tests —
  even if the user does not mention accessibility, a11y, or axe.
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
  noisy, and comment why. Prefer full-page scans for page-level coverage;
  for a modal/component under test, `.include()` from a role-based POM helper
  (e.g. `NewProgramModal.axeIncludeSelector()`) is fine.

## Keyboard test (axe cannot do this)

For the programs page (and other primary CTAs):

1. Navigate via POM (`ProgramsPage.goto()`).
2. Tab to the primary control (e.g. `+ New Program`) using role-based POM locators.
3. `await expect(primaryControl).toBeFocused()`.
4. Press Enter; assert the dialog opens (`expect(modal.dialog).toBeVisible()`).

Role-based locators throughout. No inline locators in the spec.

## Programs page coverage

Add (or keep) both in `tests/programs.a11y.spec.ts` (or equivalent):

1. Axe scan of the Programs page with `withTags(['wcag2a','wcag2aa'])`.
2. Keyboard: tab → primary control focused → Enter → New Program dialog open.

**One tag per test.** Drive all interaction through existing POMs.

## Violations — never silence to go green

If the scan finds **real** violations, do **not** call `.disableRules()` to make the test pass. Record each violation (rule id, impact, target, help URL, and the failing spec). Those records are input for the bug-reporter skill; file them when they are product defects.

`.disableRules()` is allowed only with a comment on the same call that states why the rule does not apply (for example a known third-party false positive). A comment that exists only to turn the suite green is not a reason.

## File placement

- Dedicated: `tests/<feature>.a11y.spec.ts`
- Or an axe assertion at the end of a functional test that already reaches the UI

Keep axe scans and keyboard asserts in specs, not POMs. POMs may expose
`axeIncludeSelector()` helpers only.

## Checklists

Generating:

- [ ] `AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()`
- [ ] `await expect(results.violations).toEqual([])`
- [ ] Keyboard path with `toBeFocused()` + Enter opens dialog (where applicable)
- [ ] POMs only; one tag per test
- [ ] Real violations recorded for the bug reporter; `.disableRules()` only with a commented reason

Reviewing:

- [ ] New page/component has axe + keyboard coverage
- [ ] Tags are `wcag2a` / `wcag2aa`
- [ ] `.disableRules()` appears only with a comment that explains why the rule does not apply
- [ ] `.include()`/`.exclude()` only for noisy third-party, with comment

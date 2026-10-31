---
name: pom-conventions
description: Page Object Model conventions for Playwright tests in this
  project. Apply whenever generating, refactoring, or reviewing any
  Playwright test that interacts with the Didaxis UI — even if the user
  doesn't say "POM". Tests should never contain inline locators.
---

# Page Object Model Conventions

All UI interactions go through Page Objects in `pages/`. Tests describe
intent; POMs handle mechanics.

## Steps

1. One Page Object class per page or distinct component.
   Examples: `LoginPage`, `ProgramsPage`, `NewProgramModal`.

2. Define locators as `readonly` properties in the constructor, in this
   priority order only:
   `getByRole` → `getByLabel` / `getByPlaceholder` → `getByText` →
   `getByTestId` (escape hatch only — comment why nothing higher worked).
   Never CSS selectors, XPath, or brittle text.

3. If a locator matches more than one element, disambiguate with
   `.filter({ hasText })` — do not use `.first()`.

4. Provide methods for user actions: `goto`, `clickX`, `fillY`, `submit`.
   Methods perform actions; they do not assert. Never use
   `waitForTimeout` inside POMs — callers wait with web-first
   `expect(locator).toBeVisible()` / `.toBeEnabled()` / `.toHaveText()`.

5. **No assertions inside Page Objects.** All `expect(...)` calls
   live in the test files, never in `pages/`. Prefer auto-retrying
   web-first expects; never `expect(await locator.isVisible()).toBe(true)`.

6. Compose POMs when a page contains distinct components — e.g.
   `ProgramsPage` holds a `NewProgramModal` instance.

7. Import POMs at the top of each spec; instantiate with `new XxxPage(page)`.

8. `page.route` stays in the spec. POM methods stay user actions. Programs-flow network edge cases follow the programs-network-edge-cases skill: fulfill only the call under the UI assertion, and route clicks, fills, and navigation through the existing page objects. One tag per test. A relative-timestamp assertion freezes time in the spec with `page.clock.install({ time: new Date('...') })` before the POM navigation. Page objects do not install the clock.

9. Accessibility specs (`tests/*.a11y.spec.ts`) use those same page objects. The spec has no locators: tab to the POM's primary control, then `toBeFocused()`, Enter, and the POM dialog. A POM may expose `axeIncludeSelector()` only when a scan must scope out a noisy third-party widget; the spec comments why. Follow the a11y-checks skill — one `{ tag: '@a11y' }` per test. Violations are an info report and must not fail CI.

## Output
Page Object files in `pages/`. Tests in `tests/` that import them.

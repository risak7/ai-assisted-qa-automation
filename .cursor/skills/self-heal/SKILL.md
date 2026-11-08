---
name: self-heal
description: >-
  Heals one drifted Playwright locator in its page object and opens a pull
  request once the same spec is green with assertions unchanged. Use when
  the user says "the build is red because a locator broke", "fix the drifted
  selector", "the test broke after a UI change", or "heal the suite". Use it
  ONLY after triage classifies the red run as a test issue (drift), never
  for a real app bug.
---

# Self-heal

One repair per run. Every heal becomes a PR. Do not merge. A human approves.

Do not edit application source, CI config, or `playwright.config.ts`. Do not edit a spec. Follow [pom-conventions](../pom-conventions/SKILL.md): `getByRole` with the accessible name, then `getByLabel` / `getByPlaceholder`, then `getByText`, then `getByTestId` only with a comment on why. No CSS, no XPath, no `.first()`.

## Steps

1. Require triage's drift classification, else stop and route to bug-reporter.

   Read the triage diagnosis for this red run (spec path, error, trace or run URL). If triage has not classified it, stop and delegate to `triage`. Do not patch yet.

   Continue only when triage says **test issue (drift)**: the failure is a locator that no longer matches the UI, and the behavior under the assertion is still correct.

   Any other classification — product defect, env/flake, informational a11y, timestamp or copy drift, anything that is not locator drift — stop. Do not edit the POM or the spec. Route a product defect to `bug-reporter` only after a human confirms the defect. Do not file an a11y finding or an env/flake as a bug.

2. From the trace, find the failing locator and its POM.

   From the Playwright error and trace (`test-results/`, or the `playwright-report` artifact), record:

   - spec path and test title
   - the locator call that failed (role, name, and the `pages/` file and property)
   - the stack frame in `pages/`, not an inline locator in `tests/`

   That one locator is the repair. If the error is an assertion mismatch on text, count, or status with the element found, this is not drift — go back to step 1.

3. Re-discover the element via the Agent-Browser a11y tree by its role + current accessible name.

   Open the live app with the agent-browser CLI. Read `DIDAXIS_URL`, `DIDAXIS_EMAIL`, and `DIDAXIS_PASSWORD` from `.env`. URL defaults to `https://test.didaxis.studio`. Sign in, then open the page the failing step was on.

   ```bash
   npx agent-browser open <url>
   npx agent-browser snapshot -i
   ```

   `snapshot -i` is the a11y tree. Match the element by its **role** and **current accessible name**. Do not pick a CSS selector or a visually similar control with a different role. Close with `npx agent-browser close` when the name is recorded.

   If login or the page fails, stop and report that. Do not invent a name. If the control is gone or the action no longer exists, this is not drift — stop and route to bug-reporter.

4. Patch the locator in the POM, minimal role-based diff, never the spec's assertions.

   Change only that one locator in `pages/`, to the role and accessible name from the a11y tree:

   ```ts
   page.getByRole('<role>', { name: '<current accessible name>' })
   ```

   Keep the same property and the same method. Do not rewrite the page object, do not add waits, and do not touch `tests/`. `git diff -- tests/` must stay empty.

5. Re-run and prove green WITH assertions unchanged (green via a weakened assertion is a bug, escalate).

   ```bash
   npx playwright test <spec-path> -g "<test title>"
   ```

   Before calling it green, diff the spec against the tree from before this repair. Assertions, matchers, tags, and expected copy must be byte-for-byte the same. A pass that depends on a removed, loosened, or rewritten assertion is a bug: revert the POM and the spec, stop, and escalate to bug-reporter. Do not open a PR.

   One re-run of this same failure. If it is still red for the same locator, stop. Do not try a second selector.

6. Report the old→new locator diff + the green run.

   ```
   Spec: <path> — <title>
   POM: <pages/File.ts> <property>
   Old: getByRole('<role>', { name: '<old name>' })
   New: getByRole('<role>', { name: '<new name>' })
   Assertions: unchanged
   Green run: npx playwright test <spec> -g "<title>" — passed
   PR: <url>
   ```

   Then open the PR. One commit, the POM locator only. Do not merge.

   ```bash
   git checkout -b heal/<spec-basename>-<locator-property>
   git add pages/<File>.ts
   git commit -m "$(cat <<'EOF'
   Heal drifted <property> locator after the UI rename.

   EOF
   )"
   git push -u origin HEAD
   gh pr create --title "Heal drifted <property> locator" --body "$(cat <<'EOF'
   ## Summary
   - Triage classified this red run as a test issue (drift).
   - <POM property>: `<old locator>` → `<new locator>` from the agent-browser a11y tree.
   - Spec assertions are unchanged. `npx playwright test <spec> -g "<title>"` passed.

   ## Test plan
   - [ ] Confirm the diff is one `getByRole` name/role change in `pages/`
   - [ ] Confirm `tests/` is untouched
   - [ ] Re-run the spec

   EOF
   )"
   ```

   On Windows PowerShell, pass the commit message and PR body as a here-string instead of `$(cat <<'EOF' ...)`. Do not commit `.env`.

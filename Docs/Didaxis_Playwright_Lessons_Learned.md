# Didaxis Studio — Playwright lessons learned (DS-1)

This document captures what we fixed while building `tests/ds1-create-program.spec.ts`. Use it as a checklist **before** writing or running DS-2 … DS-5 so tests do not fail for environment, timing, or locator reasons while the app works manually.

Shared helpers: `tests/helpers/didaxis-programs.ts`. Specs DS-1 through DS-5 import that module. Do not copy the helpers back into each spec.

---

## 1. Credentials and “all tests skipped”

### Symptom
Every test is **skipped** with a message about missing `DIDAXIS_EMAIL` / `DIDAXIS_PASSWORD`.

### Cause
- `.env` is empty, wrong path, or missing keys.
- Dotenv loaded from the wrong folder (we moved env to the **repo root**).

### Fix
1. Create **`.env`** at the project root (not under `Docs/`).
2. One variable per line, for example:

   ```env
   DIDAXIS_URL=https://test.didaxis.studio
   DIDAXIS_EMAIL=your-admin@email
   DIDAXIS_PASSWORD=your-password
   ```

3. Load env in two places:
   - `playwright.config.ts` → `path.resolve(__dirname, '.env')`
   - Each Didaxis spec → `import '../load-env'` (see `load-env.ts`)

4. Verify without printing secrets:

   ```bash
   node -e "require('dotenv').config(); console.log(!!process.env.DIDAXIS_EMAIL, !!process.env.DIDAXIS_PASSWORD)"
   ```

   Expect: `true true`.

### Rule for new specs
- Never hardcode passwords in test files.
- Use `test.skip()` when required env vars are missing, with a message that points to root `.env`.

---

## 2. Browser / “Executable doesn’t exist”

### Symptom
Tests fail immediately on `browserType.launch` (Chromium/Firefox/WebKit not installed).

### Cause
- `npx playwright install` not run, or download timed out.
- Running **all projects** while only Chrome is available locally.

### Fix
- `playwright.config.ts` uses **`channel: 'chrome'`** for the chromium project (installed Google Chrome).
- For local Didaxis work, prefer:

  ```bash
  npx playwright test tests/ds1-create-program.spec.ts --project=chromium
  ```

- Install Playwright browsers when you need Firefox/WebKit:

  ```bash
  npx playwright install
  ```

---

## 3. Timing: app works, test fails on list or modal

### Symptom
Manual create succeeds; test fails on “modal hidden” or “program not in list”.

### Cause
The UI closes the modal before the table finishes refetching. Asserting the row too early fails even though the program was created.

### Fix — use the same three-step pattern everywhere you create a program

1. **`clickCreateProgram(page)`**  
   Start waiting for `POST` to the **programs collection** (`…/programs`), then click **Create** (`Promise.all`).

2. **`submitCreateProgram(page)`** (happy path)  
   - Assert `POST` response is OK.  
   - Assert the **New Program** dialog is hidden (15s).  
   - Then wait for the programs list `GET` (ignored if it already finished).  
   - Do **not** click Cancel when the hidden check fails. The dialog is often already gone by then, and looking for a disabled Create button fails with "element not found" (this broke Firefox TC-002).

3. **`expectProgramInList(page, name)`**  
   - **`expect.poll`** until row count is `1` (timeout **15s**).  
   - **`scrollIntoViewIfNeeded()`** on the row (long program lists scroll).  
   - Assert row **visible**.

Do **not** use only:

```typescript
await createButton(page).click();
await expect(programRowByName(page, name)).toBeVisible();
```

That pattern is flaky on Didaxis.

### Duplicate / negative create (TC-007, TC-014)
- First program: `submitCreateProgram` + `expectProgramInList`.
- Second attempt (may fail API or stay open): `clickCreateProgram` only, then poll row counts or check validation message — do not require `response.ok()` on the second click.

### Rejected create (TC-013)
- If Create is enabled but program must not appear: `clickCreateProgram` + `expectProgramNotInList` (or poll count `0`).

---

## 4. API response matching

### Pitfall
`response.url().includes('/programs')` also matches nested routes (e.g. `/programs/{id}/semesters`).

### Fix
Treat **collection** endpoints only — pathname ends with `/programs`:

```typescript
function programsCollectionPath(response: Response): string {
  return new URL(response.url()).pathname.replace(/\/$/, '');
}
// POST create: method POST && pathname.endsWith('/programs')
// List refresh: method GET && pathname.endsWith('/programs') && response.ok()
```

---

## 5. Locators (best practice for Didaxis)

| Area | Recommended locator | Notes |
|------|---------------------|--------|
| Login | `getByLabel('Email')`, `getByLabel('Password')`, `getByRole('button', { name: 'Sign In' })` | Verified on live login page |
| Programs page ready | Heading **Programs** (level 2), then **+ New Program**, **Create Program**, or the empty-state text | Do **not** require `role=table` before the list loads. Firefox often shows the header button while the Mantine table is still missing from the accessibility tree. |
| Open create | `getByRole('button', { name: '+ New Program' }).or(getByRole('button', { name: 'Create Program' }))` then a real Playwright `click()` | Do **not** use `locator.evaluate(el => el.click())`. That does not run the app's React handler, so the dialog never opens (this broke Chromium). Do **not** click a second time: the overlay from the first click blocks the retry. |
| Modal | `getByRole('dialog', { name: 'New Program' })` only | Do not `.or()` a dialog that merely contains the Program Name label. That also matches **Edit Program**, so "modal hidden" stays true while the wrong dialog is open. |
| Fields | `dialog.getByLabel('Program Name')`, `dialog.getByLabel('Description')` | Avoid page-wide label match |
| Create | `dialog.getByRole('button', { name: 'Create' })` | |
| Table row | `getByRole('table').locator('tbody tr', { has: page.locator('td').getByText(name, { exact: true }) })` | Avoid matching header row “Program” |

Always scope modal actions to **`createProgramModal(page)`**, not `page` alone.

---

## 6. Parallel runs vs one admin account

### Symptom
Random failures when many workers hit create at once (modal not opening, wrong POST matched, list stale).

### Fix
For specs that share one admin and mutate the same program list:

```typescript
test.describe.configure({ mode: 'serial', timeout: 120_000 });
```

Keep **`fullyParallel`** at config level if you want; serial mode on the describe/file overrides for that suite.

Use **`Date.now()`** (or similar) in program names so data stays unique even in serial runs.

---

## 7. Assertions vs real UI (avoid false failures)

### Trimmed program names (TC-011)
- Backend/client **trim** names on save (`name.trim()`).
- List cell may show **name + description** in one `<td>`; do not assert `row.innerText()` equals name only.
- Enough for trim case: `submitCreateProgram` + `expectProgramInList(page, trimmedName)`.

### Long names / descriptions
- Very long names may need longer test timeout; list uses `lineClamp` for description — assert a **prefix** of description text in the row, not the full 1000 characters in the cell.

---

## 8. Cross-browser runs (what we actually measured)

DS-1 is `test.describe.configure({ mode: 'serial', timeout: 120_000 })`. A full `npx playwright test tests/ds1-create-program.spec.ts` runs **16 tests × 3 projects = 48 tests**. With the default worker count, Chrome, Firefox, and WebKit share one admin at the same time.

### “N did not run” is not a skip

Serial mode **stops the rest of that browser’s file** after the first failure. Example from a 48-test run: WebKit failed TC-001, so the other 15 WebKit tests never started. Chromium and Firefox can still pass in the same run. **Skipped** (TC-008 without non-admin credentials) is a different counter from **did not run**.

### Firefox — test bug, then fixed

**Symptom:** TC-001 failed in `gotoPrograms`. The heading and **+ New Program** were on screen. The assertion `getByRole('table').or(empty-state text)` found nothing for 15s.

**Cause:** The header renders before the program list. Firefox did not put the Mantine `<table>` in the accessibility tree while the list was still loading. Chrome was fast enough that the table appeared inside the timeout.

**Fix:** `gotoPrograms` waits for **+ New Program**, **Create Program**, or the empty-state sentence. It does not require a table. Row checks stay in `expectProgramInList`, which polls after create.

**Result:** Firefox DS-1 completed: 15 passed, TC-008 skipped.

### Where the problem is

| Piece | Verdict |
|-------|---------|
| Didaxis | Not the bug. Chrome and Firefox complete the same create flow. A person in Safari can still click **+ New Program**. |
| Playwright | Not the bug. It waits until a button is stable, then clicks. That is the correct action. |
| Test code and test data | The bug. Firefox was waiting for a table that was not in the accessibility tree yet. WebKit never sees **+ New Program** as stable because this admin account now has a huge program list built by earlier runs. Workarounds that replaced `click()` then broke Chrome and Firefox and were reverted. |

### WebKit — how to run it without breaking Chrome or Firefox

Do not change `openNewProgramModal` or `submitCreateProgram` to suit WebKit. Those functions are the path Chromium and Firefox already pass. A WebKit-only idea must be behind `test.info().project.name === 'webkit'`, and Chromium DS-1 must be re-run before that idea stays.

**Current code (kept):** a normal Playwright `click()` on **+ New Program** or **Create Program**. `submitCreateProgram` waits for the dialog to hide. No second click, no in-page `element.click()`, no Cancel fallback.

**Steps:**

1. Delete old test programs, or use an admin whose list is short. WebKit’s click stability fails on the crowded table and passes when the table is small. No special click is required.
2. Run WebKit alone, after Chromium (and Firefox if you want it):

```bash
npx playwright test tests/ds1-create-program.spec.ts --project=webkit --workers=1
```

3. If that still fails, stop after one guarded attempt. Do not stack another click strategy.

**What we tried on the shared helper, and why it was reverted:**

| Attempt | Result |
|---------|--------|
| Default 30s test timeout | Died during login + open + create. Raised to **120s**. Kept. |
| Second click when the dialog was slow | Overlay from the first click blocked the retry until the 120s timeout. Reverted. |
| `click({ force: true })` | Flaky. Sometimes opened the dialog, sometimes the locator never resolved. Reverted. |
| `locator.evaluate(button => button.click())` | Does not run the React handler. Chromium TC-005 stopped opening the dialog. Reverted. |
| Dialog `.or(dialog that has Program Name)` | Also matched **Edit Program**. Reverted. |
| After POST, if Create is disabled, click Cancel | Firefox TC-002: the dialog had already closed, so Create was "element not found". Reverted. |

**What to run day to day:**

```bash
# Gate. Chromium only (installed Chrome via channel: 'chrome').
npm run test:didaxis

# Firefox alone, after the table-wait fix.
npx playwright test tests/ds1-create-program.spec.ts --project=firefox --workers=1

# WebKit alone. Only useful once the program list is small.
npx playwright test tests/ds1-create-program.spec.ts --project=webkit --workers=1
```

Do not use `npm run test:didaxis:cross-browser` as the daily gate. It runs all three projects in one command. One WebKit failure then marks the rest of that project "did not run" and makes the suite look worse than the Chrome result.

### Sandbox vs your machine

Cursor’s shell sets `PLAYWRIGHT_BROWSERS_PATH` to a sandbox cache that does not contain Firefox or WebKit, even when `%USERPROFILE%\AppData\Local\ms-playwright` already has `firefox-1543` and `webkit-2359`. A launch error that names `cursor-sandbox-cache` means the run did not see the installed browsers. Point `PLAYWRIGHT_BROWSERS_PATH` at `ms-playwright`, or run the command from a normal terminal.

---

## 9. Test run checklist (before blaming the app)

```bash
# 1. Env loaded
node -e "require('dotenv').config(); console.log(!!process.env.DIDAXIS_EMAIL, !!process.env.DIDAXIS_PASSWORD)"

# 2. Single browser, Didaxis suite
npx playwright test tests/ds1-create-program.spec.ts --project=chromium

# 3. One failing test with trace
npx playwright test tests/ds1-create-program.spec.ts --grep "TC-002" --project=chromium --trace on
```

If the trace shows **POST 200** and modal closed but **no row**, add/wait for list refresh (`expectProgramInList`), not more click retries.

---

## 10. Applying this to DS-2 … DS-5

DS-1 through DS-5 already import `tests/helpers/didaxis-programs.ts`. Change waits and locators there, not in each spec.

1. **`import '../load-env'`** at the top of a new spec (the helper also loads it).
2. **`test.describe.configure({ mode: 'serial', timeout: 120_000 })`**.
3. Every successful create: **`submitCreateProgram` → `expectProgramInList`**.
4. Open the form with **`openNewProgramModal`** (normal Playwright `click()`). Do not replace that click with `element.click()`, `force: true`, or a second click unless the change is WebKit-only and Chromium DS-1 still passes afterward.
5. Daily run: **`npm run test:didaxis`** (`--project=chromium`).
6. After a failure, read the error-context snapshot: heading + **+ New Program** with no dialog means the open click never landed. A dialog whose **Create** button is disabled means the save cleared the form and the close step is what failed.

---

## 11. Quick “failure → likely cause” map

| Failure message | Likely cause | What to check |
|-----------------|--------------|----------------|
| All tests skipped | Missing `.env` keys | Root `.env`, `load-env` import |
| Executable doesn’t exist | Browser not installed | `--project=chromium` or `playwright install` |
| Modal not visible | Open click never landed | `openNewProgramModal` must stay a real Playwright `click()`. In-page `element.click()` does not run React and breaks Chromium. |
| Click timeout, overlay intercepts pointer events | A second click hit `.mantine-Modal-overlay` | Do not retry the click. The first click already opened the modal. |
| WebKit click never finishes, button looks visible | Huge program table; WebKit never marks the button stable | Run `--project=webkit` alone after deleting old programs. Do not change the Chrome click path. |
| Modal not hidden after Create, Create **disabled** | Save succeeded; dialog still painted | Do not click Cancel from the helper. That fails when the dialog has already closed (Firefox TC-002). |
| Modal not hidden, Create still **enabled** | POST did not finish the success path | Network tab for `POST /programs`. |
| Firefox: heading visible, table not found | List not in the accessibility tree yet | `gotoPrograms` waits for **+ New Program**, not `role=table`. |
| Row not visible / count 0 | List not refreshed yet, or row below the fold | `expectProgramInList` poll + scroll. |
| Row count > 1 on duplicate test | API allows duplicates | Adjust the assertion to product behavior. |
| N did not run | Serial mode stopped that browser after an earlier failure | Fix the first failure in that project. Not the same as `test.skip()`. |
| Firefox/WebKit “Executable doesn’t exist” under `cursor-sandbox-cache` | Sandbox browser path, not a missing install on disk | Use the real `ms-playwright` directory, or run outside the sandbox. Prefer `npm run test:didaxis`. |

---

*Last updated after reverting the WebKit click experiments. Chromium DS-1 is 15 passed, 1 skipped. Firefox passes with the `gotoPrograms` button wait. WebKit stays on the normal click and needs a short program list.*

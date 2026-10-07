# Worked example — DS-2 program validation failure

## Failure signal

```
Error: expect(locator).toBeVisible() failed
Locator: getByRole('alert').filter({ hasText: 'Program name is required' })
Expected: visible
Received: hidden
```

Spec: `tests/ds2-create-program.spec.ts`  
Describe: `DS-2: Create new academic program`  
Test: `TC-011 rejects empty program name with validation message`

## Agent steps

1. Re-run once:  
   `npx playwright test tests/ds2-create-program.spec.ts -g "TC-011" --workers=1`

2. Collect PNGs:  
   `node scripts/collect-failure-screenshots.mjs --latest`

3. Duplicate check (JQL):  
   `parent = DS-2 AND issuetype = Sub-task AND text ~ "validation message"`

4. Create sub-task via MCP:
   - **summary:** `[Composer] Empty program name does not show required validation alert`
   - **parent:** `DS-2`
   - **priority:** High
   - **description:** full template + exact Playwright error above

5. Attach evidence:  
   `node scripts/jira-attach-screenshots.mjs DS-173 $(node scripts/collect-failure-screenshots.mjs --latest)`

6. Return to user: issue key, browse URL, list of attached filenames.

## When to skip filing

- `.env` missing `DIDAXIS_EMAIL` → fix setup, do not file product bug
- Test passes on second run with no code change → note flakiness; ask user before filing
- Open duplicate sub-task found → attach screenshots to existing issue only

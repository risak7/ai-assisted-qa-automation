---
name: programs-network-edge-cases
description: Adds deterministic Playwright edge-case tests for the Didaxis programs flow by fulfilling programs API responses with page.route. Use whenever generating, extending, or reviewing programs-flow tests, network mocking, empty states, save error states, or HTTP statuses such as 503, 200, 404, 401, 403, 501, 502, or 300 — even if the user does not say "mock".
---

# Programs network edge cases

Add deterministic edge-case tests for the programs flow. Mock with `page.route` only when the test verifies the UI's reaction. Apply this whenever those tests are generated or reviewed.

Use page.route to fulfill the programs API with:
  (a) 503 Service Unavailable on save  → assert the UI's error state
  (b) 200 with an empty array          → assert the empty-state message
  (c) 200 with a malformed payload     → assert the app doesn't crash

Before writing the assertions, open the real page (use agent-browser / PW MCP) and read the actual error and empty-state copy the app renders — do not invent strings. If the app renders nothing for a case, say so instead of guessing.

Never mock the endpoint the test is actually verifying.

Route all interactions through the existing POMs. One tag per test.

## Which call to fulfill

The app's programs API, as this repo already calls it:

- List: `GET` whose path ends with `/programs` (`/api/programs`). The body is either a JSON array or `{ "data": [ ... ] }` (`programIdsFrom` in `tests/manual/delete-programs.spec.ts`).
- Create: `POST` whose path ends with `/programs`. A real 201 carries `data.id`.
- Save: `PATCH` whose path matches `/programs/<id>` (Edit Program **Save** — `ProgramsPage.submitSaveProgram` / `attemptSaveProgram`).
- Delete: `DELETE` whose path matches `/programs/<id>`.

Fulfill only the call that produces the state under test. Leave every other programs call on the network.

| Case | Fulfill | Body |
|------|---------|------|
| (a) 503 on save | `PATCH /programs/<id>` | status 503 |
| (b) 200 empty | `GET` list | status 200 and `{ "data": [] }` (an empty program array the list parser accepts) |
| (c) 200 malformed | `GET` list | status 200 and JSON that is not a program array, e.g. `{ "data": { "id": "not-a-list" } }` |

(a) needs a real program row so Save can be clicked. Create that row on the unmocked `POST`, then register the `PATCH` route, then save through the POM. (b) and (c) register the `GET` route before `ProgramsPage.goto()`.

`page.route` lives in the spec, before the POM action that sends the call. Do not fulfill inside `pages/`.

## More statuses

One test each, same rules — observed copy or an explicit "renders nothing", UI assertions only, a single tag:

- 404 Not Found on save (`PATCH`)
- 401 Unauthorized on list load (`GET`)
- 403 Forbidden on save (`PATCH`)
- 400 Bad Request on save (`PATCH`)
- 500 Internal Server Error on save (`PATCH`)
- 501 Not Implemented on save (`PATCH`)
- 502 Bad Gateway on list load (`GET`)
- 504 Gateway Timeout on list load (`GET`)
- 300 Multiple Choices on list load (`GET`)

400, 500, and 504 sit with the statuses above: client error, server error, and gateway timeout on the same programs calls. For 300, assert the app does not crash. Do not invent a redirect message.

## Assertions

Open the live app with the Playwright MCP, or the agent-browser CLI when that MCP is unavailable, using the same order as the jira-ticket-to-gherkin skill. Read `DIDAXIS_URL` from `.env` (default `https://test.didaxis.studio`). Record the empty-state sentence and any error text that is actually on screen.

Write `expect` only against that copy, via locators that already exist on `ProgramsPage` or `NewProgramModal` (`emptyProgramsText`, `heading`, dialog and alert locators). Add a POM locator only when the live page shows a string those objects do not expose yet, and follow pom-conventions when you do.

If a status is not on screen during that visit, the spec says the app renders nothing for that case. Assert the shell still stands: `expect(programs.heading).toBeVisible()` and that no `pageerror` fired. Do not `toHaveText` a guessed sentence such as "Service Unavailable" or "Something went wrong".

A crash check is that assertion. It is not an assertion that the mocked response status equals 503 — the route fulfilled that status, so the test is not verifying the API.

## Never mock the subject

`page.route` supplies a dependency so the UI can be asserted. It does not stand in for the programs API when the test is about that API.

Leave the route untouched in tests that verify a real create, a persisted edit, a delete, or that the list matches the server (the DS-1–DS-5 flows). Do not fulfill `GET /api/programs` and then treat the empty body as proof the server has no programs. Do not fulfill `PATCH` and then assert `response.status()` is 503.

## Shape

- Import `test` from `@playwright/test` when the test creates nothing. Import `test` from `fixtures/cleanup.fixture.ts` and call `trackProgram` only with a `data.id` from a real, unmocked create. A fulfilled `POST` or `PATCH` did not create a row — do not track it, and do not delete it.
- Each test has exactly one tag: `{ tag: '@edge' }`.
- Specs contain no inline locators. Clicks, fills, and navigation go through `ProgramsPage` and `NewProgramModal`.
- No `waitForTimeout`. Wait with `expect(locator).toBeVisible()` or `.toHaveText()` on the copy you read.

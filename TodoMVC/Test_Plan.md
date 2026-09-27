# Test Plan: TodoMVC

**Application:** [React • TodoMVC](https://demo.playwright.dev/todomvc/#/)
**Page title:** React • TodoMVC
**Primary actor:** Any visitor (no login)
**Entry point:** `https://demo.playwright.dev/todomvc/#/`

**Controls under test:**

| Control | How it appears |
| --- | --- |
| New todo | Text box, placeholder `What needs to be done?` |
| Todo row | List item, `data-testid="todo-item"`, title in `data-testid="todo-title"` |
| Complete | Checkbox, accessible name `Toggle Todo` |
| Delete | Button, accessible name `Delete` (shown when the row is hovered) |
| Complete all | Checkbox label `Mark all as complete` |
| Count | `data-testid="todo-count"`, for example `1 item left` |
| Filters | Links `All` (`#/`), `Active` (`#/active`), `Completed` (`#/completed`) |
| Clear completed | Button `Clear completed` (shown only when at least one todo is completed) |
| Edit | Text box, accessible name `Edit` (opened by double-clicking the todo title) |

**Storage:** Todos are kept in `localStorage` under the key `react-todos`.

## Positive flows

### TC-001: "Buy milk" is added to the list and the input is cleared

**Preconditions:**
- The browser is open at `https://demo.playwright.dev/todomvc/#/`
- `localStorage` key `react-todos` is empty, so the list has no todos
- The footer and `Mark all as complete` are not shown

**Steps:**
1. Click the text box `What needs to be done?`
2. Type `Buy milk`
3. Press Enter

**Expected result:** The list shows one todo titled `Buy milk`. The text box is empty and still focused. The footer shows `1 item left`. The `All` filter is selected. `Mark all as complete` is unchecked. The `Toggle Todo` checkbox for `Buy milk` is unchecked.

### TC-002: Todos stay in the order they were entered

**Preconditions:**
- The list is empty at `https://demo.playwright.dev/todomvc/#/`

**Steps:**
1. Type `Buy milk` in `What needs to be done?` and press Enter
2. Type `Walk the dog` in `What needs to be done?` and press Enter
3. Type `Read a book` in `What needs to be done?` and press Enter

**Expected result:** The list shows three todos, top to bottom: `Buy milk`, `Walk the dog`, `Read a book`. The footer shows `3 items left`. The text box is empty.

### TC-003: Completing "Buy milk" marks it complete and the active count drops

**Preconditions:**
- The list contains one active todo titled `Buy milk`
- The footer shows `1 item left`
- The `All` filter (`#/`) is selected

**Steps:**
1. Check the `Toggle Todo` checkbox on the `Buy milk` row

**Expected result:** `Buy milk` stays on the list and is shown as completed (struck through). Its `Toggle Todo` checkbox is checked. The footer shows `0 items left`. The `Clear completed` button is visible. `Mark all as complete` is checked.

### TC-004: A completed todo becomes active again

**Preconditions:**
- The list contains one completed todo titled `Buy milk`
- The footer shows `0 items left`
- The `All` filter is selected

**Steps:**
1. Uncheck the `Toggle Todo` checkbox on the `Buy milk` row

**Expected result:** `Buy milk` is shown as active (not struck through). Its checkbox is unchecked. The footer shows `1 item left`. `Clear completed` is not shown. `Mark all as complete` is unchecked.

### TC-005: "Walk the dog" is removed and "Buy milk" remains

**Preconditions:**
- The list contains `Buy milk` and `Walk the dog`, both active
- The footer shows `2 items left`
- The `All` filter is selected

**Steps:**
1. Hover the `Walk the dog` row
2. Click the `Delete` button on that row

**Expected result:** The list shows only `Buy milk`. The footer shows `1 item left`. `Walk the dog` is not in the list.

### TC-006: The list, footer, and complete-all control disappear after the last todo is deleted

**Preconditions:**
- The list contains one todo titled `Buy milk`
- The footer shows `1 item left`

**Steps:**
1. Hover the `Buy milk` row
2. Click the `Delete` button on that row

**Expected result:** No todo rows are shown. The footer (count and filters) is hidden. `Mark all as complete` is hidden. The `What needs to be done?` text box is still shown and empty. The hint `Double-click to edit a todo` remains under the app.

### TC-007: "Mark all as complete" completes every active todo

**Preconditions:**
- The list contains active todos `Buy milk` and `Walk the dog`
- The footer shows `2 items left`
- `Mark all as complete` is unchecked

**Steps:**
1. Check `Mark all as complete`

**Expected result:** Both `Buy milk` and `Walk the dog` are completed and struck through. Both `Toggle Todo` checkboxes are checked. The footer shows `0 items left`. `Clear completed` is visible. `Mark all as complete` stays checked.

### TC-008: Active and Completed filters show only the matching todos

**Preconditions:**
- The list contains active todo `Buy milk` and completed todo `Walk the dog`
- The current URL is `https://demo.playwright.dev/todomvc/#/`
- The footer shows `1 item left`

**Steps:**
1. Click the `Active` link
2. Click the `Completed` link
3. Click the `All` link

**Expected result:**
- After step 1, the URL is `https://demo.playwright.dev/todomvc/#/active`, `Active` is selected, and only `Buy milk` is listed. The count still reads `1 item left`.
- After step 2, the URL is `https://demo.playwright.dev/todomvc/#/completed`, `Completed` is selected, and only `Walk the dog` is listed.
- After step 3, the URL is `https://demo.playwright.dev/todomvc/#/`, `All` is selected, and both `Buy milk` and `Walk the dog` are listed.

### TC-009: "Clear completed" removes completed todos and keeps active ones

**Preconditions:**
- The list contains active todo `Buy milk` and completed todo `Walk the dog`
- The `All` filter is selected
- `Clear completed` is visible
- The footer shows `1 item left`

**Steps:**
1. Click `Clear completed`

**Expected result:** The list shows only `Buy milk`. `Walk the dog` is gone. The footer shows `1 item left`. `Clear completed` is hidden. `Mark all as complete` is unchecked.

### TC-010: A double-clicked todo saves the new title "Buy oat milk"

**Preconditions:**
- The list contains one active todo titled `Buy milk`
- The footer shows `1 item left`

**Steps:**
1. Double-click the title `Buy milk`
2. In the `Edit` text box, replace the text with `Buy oat milk`
3. Press Enter

**Expected result:** The row title is `Buy oat milk`. The edit box is closed. The todo stays active. The footer still shows `1 item left`.

### TC-011: Todos are still present after the page is reloaded

**Preconditions:**
- The list contains active todo `Buy milk` and completed todo `Walk the dog`
- `localStorage` key `react-todos` holds both todos

**Steps:**
1. Reload `https://demo.playwright.dev/todomvc/#/`

**Expected result:** `Buy milk` is listed as active and `Walk the dog` is listed as completed. The footer shows `1 item left`. `Clear completed` is visible.

## Negative flows

### TC-012: Pressing Enter in an empty field does not add a todo

**Preconditions:**
- The list is empty at `https://demo.playwright.dev/todomvc/#/`
- `What needs to be done?` is empty

**Steps:**
1. Click `What needs to be done?`
2. Press Enter

**Expected result:** No todo row appears. The footer stays hidden. The text box stays empty.

### TC-013: A whitespace-only entry is not added

**Preconditions:**
- The list is empty at `https://demo.playwright.dev/todomvc/#/`

**Steps:**
1. Click `What needs to be done?`
2. Type three spaces
3. Press Enter

**Expected result:** No todo row appears. The footer stays hidden. The three spaces remain in `What needs to be done?`.

### TC-014: Completing a todo does not remove it from All

**Preconditions:**
- The list contains one active todo titled `Buy milk`
- The `All` filter is selected

**Steps:**
1. Check `Toggle Todo` on `Buy milk`

**Expected result:** `Buy milk` is still listed under `All`. It is completed, not deleted. The row count on `All` is still 1. The footer shows `0 items left`.

### TC-015: Deleting one todo does not delete the other

**Preconditions:**
- The list contains `Buy milk` and `Walk the dog`, both active

**Steps:**
1. Hover `Buy milk`
2. Click `Delete` on `Buy milk`

**Expected result:** `Walk the dog` is still listed and still active. The footer shows `1 item left`. Only `Buy milk` is gone.

### TC-016: "Clear completed" does not remove active todos

**Preconditions:**
- The list contains active todo `Buy milk` and completed todos `Walk the dog` and `Read a book`
- The `All` filter is selected
- The footer shows `1 item left`

**Steps:**
1. Click `Clear completed`

**Expected result:** `Buy milk` remains, active and not struck through. `Walk the dog` and `Read a book` are gone. The footer shows `1 item left`. `Clear completed` is hidden.

### TC-017: Markup typed as a title is shown as text

**Preconditions:**
- The list is empty at `https://demo.playwright.dev/todomvc/#/`

**Steps:**
1. Type `<script>alert(1)</script>` in `What needs to be done?`
2. Press Enter

**Expected result:** One todo is added whose visible title is the literal text `<script>alert(1)</script>`. No alert dialog appears. The page title stays `React • TodoMVC`. The footer shows `1 item left`.

### TC-018: Escape during edit leaves the original title unchanged

**Preconditions:**
- The list contains one active todo titled `Buy milk`

**Steps:**
1. Double-click the title `Buy milk`
2. In the `Edit` text box, replace the text with `Buy oat milk`
3. Press Escape

**Expected result:** The edit box closes. The title is still `Buy milk`. The todo stays active. The footer still shows `1 item left`.

## Edge cases

### TC-019: Leading and trailing spaces are removed from the saved title

**Preconditions:**
- The list is empty at `https://demo.playwright.dev/todomvc/#/`

**Steps:**
1. Type `  Buy milk  ` in `What needs to be done?` (two spaces before and two spaces after)
2. Press Enter

**Expected result:** The list shows one todo titled `Buy milk`, with no leading or trailing spaces. The text box is empty. The footer shows `1 item left`.

### TC-020: Two todos may share the title "Buy milk"

**Preconditions:**
- The list is empty at `https://demo.playwright.dev/todomvc/#/`

**Steps:**
1. Type `Buy milk` and press Enter
2. Type `Buy milk` and press Enter

**Expected result:** The list shows two separate rows, both titled `Buy milk`. The footer shows `2 items left`. Checking `Toggle Todo` on the first row completes only that row. The second `Buy milk` stays active, and the footer shows `1 item left`.

### TC-021: Letters, symbols, and quotes are stored and shown as typed

**Preconditions:**
- The list is empty at `https://demo.playwright.dev/todomvc/#/`

**Steps:**
1. Type `Café & "quotes" <tag>` in `What needs to be done?`
2. Press Enter

**Expected result:** The list shows one todo titled `Café & "quotes" <tag>`. The symbols are visible as text. The footer shows `1 item left`.

### TC-022: A one-character title is accepted

**Preconditions:**
- The list is empty at `https://demo.playwright.dev/todomvc/#/`

**Steps:**
1. Type `A` in `What needs to be done?`
2. Press Enter

**Expected result:** The list shows one todo titled `A`. The text box is empty. The footer shows `1 item left`.

### TC-023: A 256-character title is stored in full

**Preconditions:**
- The list is empty at `https://demo.playwright.dev/todomvc/#/`
- `What needs to be done?` has no `maxlength` attribute

**Steps:**
1. Type 256 `A` characters in `What needs to be done?`
2. Press Enter

**Expected result:** One todo is added. Its title is 256 `A` characters, not truncated. The text box is empty. The footer shows `1 item left`.

### TC-024: The count uses "item" for one active todo and "items" otherwise

**Preconditions:**
- The list is empty at `https://demo.playwright.dev/todomvc/#/`

**Steps:**
1. Add `Buy milk` and confirm the count
2. Add `Walk the dog` and confirm the count
3. Check `Toggle Todo` on `Buy milk` and confirm the count
4. Check `Toggle Todo` on `Walk the dog` and confirm the count

**Expected result:**
- After step 1 the footer reads `1 item left`
- After step 2 the footer reads `2 items left`
- After step 3 the footer reads `1 item left`
- After step 4 the footer reads `0 items left`, both rows stay on `All`, and `Clear completed` is visible

### TC-025: Saving a blank edit removes the todo

**Preconditions:**
- The list contains `Buy milk` and `Walk the dog`, both active
- The footer shows `2 items left`

**Steps:**
1. Double-click the title `Buy milk`
2. Clear the `Edit` text box so it is empty
3. Press Enter

**Expected result:** `Buy milk` is removed. `Walk the dog` remains active. The footer shows `1 item left`.

### TC-026: Saving an edit that is only spaces removes the todo

**Preconditions:**
- The list contains one active todo titled `Buy milk`
- The footer shows `1 item left`

**Steps:**
1. Double-click the title `Buy milk`
2. Replace the `Edit` text with three spaces
3. Press Enter

**Expected result:** `Buy milk` is removed. The list is empty. The footer is hidden.

### TC-027: Internal double spaces in a title are kept

**Preconditions:**
- The list is empty at `https://demo.playwright.dev/todomvc/#/`

**Steps:**
1. Type `Buy  milk` in `What needs to be done?` (two spaces between the words)
2. Press Enter

**Expected result:** The list shows one todo titled `Buy  milk`, including the two spaces between the words. The footer shows `1 item left`.

## Ambiguities and gaps in the acceptance criteria

The acceptance criteria only say that a user can add a todo, complete an item, and delete an item. The following are not specified, but the app at `https://demo.playwright.dev/todomvc/#/` already behaves as noted.

1. **Empty and whitespace input.** The criteria do not say what Enter should do when `What needs to be done?` is empty or only spaces. The app ignores that input. A whitespace-only value is left in the field; a successful add clears the field. Only leading and trailing spaces are trimmed. Spaces inside the title are kept.
2. **What "complete" means.** The criteria do not say whether the item stays visible, how it looks, or how the count changes. The app keeps the row on `All`, strikes it through, checks `Toggle Todo`, and counts only active todos (`1 item left`, `2 items left`, `0 items left`).
3. **How to delete.** The criteria do not name the control. Delete is a `Delete` button on the row, shown on hover, and it removes that row only.
4. **Duplicates.** The criteria do not say whether titles must be unique. The app allows two rows with the same title, and each row is completed or deleted on its own.
5. **Maximum length.** The criteria do not give a limit, and `What needs to be done?` has no `maxlength`. A 256-character title is stored in full. There is no documented upper bound.
6. **Special characters.** The criteria do not say how symbols or markup should be treated. Titles are shown as text, including `<script>alert(1)</script>`.
7. **Minimum length.** A single character such as `A` is accepted. The criteria do not state a minimum other than "not empty after trim."
8. **Edit.** The page says `Double-click to edit a todo`, but editing is not in the criteria. Enter saves the trimmed title, Escape restores the original title, and a blank or whitespace-only edit deletes the todo.
9. **Other controls that are on the page but not in the criteria:** `Mark all as complete`, filters `All` / `Active` / `Completed`, and `Clear completed`.
10. **Persistence.** Todos survive a reload through `localStorage` key `react-todos`. The criteria do not say whether data should persist, or what happens in a private window or when storage is blocked.
11. **Order.** New todos are appended. The criteria do not say whether the newest item should appear first or last.
12. **Scope of complete-all and clear.** `Mark all as complete` sets every todo, including ones hidden by the current filter. `Clear completed` removes every completed todo, not only the ones on screen. Neither rule is in the criteria.

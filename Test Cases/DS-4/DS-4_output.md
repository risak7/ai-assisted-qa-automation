# Test Plan: Delete program with confirmation

**Feature:** Delete program with confirmation
**Primary actor:** Admin on the Programs page
**Entry point:** Delete icon on a program row → confirmation dialog
**Sample programs:** "Test Program", "Web Development 2026", "Informatique & IA - Niveau 2"

## Positive flows

### TC-001: The confirmation dialog appears before "Test Program" is removed

**Priority:** High

**Preconditions:**
- The user is on the Programs page
- A program named "Test Program" exists
- "Web Development 2026" also exists

**Steps:**
1. Click the delete icon for "Test Program"
2. Look at the program list while the dialog is open

```gherkin
Scenario: Delete icon opens a confirmation dialog and does not remove the program yet
  Given a program "Test Program" exists
  And a program "Web Development 2026" exists
  When I click the delete icon for "Test Program"
  Then I see a confirmation dialog
  And the program list still shows "Test Program"
  And the program list still shows "Web Development 2026"
```

**Expected result:** A confirmation dialog is shown. "Test Program" is still in the list until deletion is confirmed.

### TC-002: Confirming deletion removes "Test Program" from the list

**Priority:** High

**Preconditions:**
- The user is on the Programs page
- A program named "Test Program" exists
- The confirmation dialog is open for "Test Program"

**Steps:**
1. Confirm deletion in the dialog
2. Look at the program list without refreshing the page

```gherkin
Scenario: Delete program with confirmation
  Given a program "Test Program" exists
  When I click the delete icon for "Test Program"
  Then I see a confirmation dialog
  When I confirm deletion
  Then "Test Program" is removed from the program list
```

**Expected result:** The dialog closes and "Test Program" is no longer in the program list.

### TC-003: Cancelling the dialog leaves the program in the list

**Priority:** High

**Preconditions:**
- The user is on the Programs page
- A program named "Test Program" exists with Description "Temporary program used for deletion checks"
- The confirmation dialog is open for "Test Program"

**Steps:**
1. Click Cancel
2. Look at the program list
3. Open "Test Program" again

```gherkin
Scenario: Cancel program deletion
  Given I click the delete icon for "Test Program"
  When I see the confirmation dialog
  And I click Cancel
  Then the confirmation dialog closes
  And "Test Program" still exists in the list
  And the Description of "Test Program" is still "Temporary program used for deletion checks"
```

**Expected result:** "Test Program" remains in the list with Description "Temporary program used for deletion checks".

### TC-004: Deleting "Test Program" leaves "Web Development 2026" in the list

**Priority:** High

**Preconditions:**
- "Test Program" exists
- "Web Development 2026" exists with Description "Full-stack web development program"
- The user is on the Programs page

**Steps:**
1. Click the delete icon for "Test Program"
2. Confirm deletion
3. Check the program list for both names

```gherkin
Scenario: Only the confirmed program is removed
  Given a program "Test Program" exists
  And a program "Web Development 2026" exists with Description "Full-stack web development program"
  When I click the delete icon for "Test Program"
  And I confirm deletion
  Then "Test Program" is removed from the program list
  And the program list still shows "Web Development 2026"
  And the Description of "Web Development 2026" is still "Full-stack web development program"
```

**Expected result:** "Test Program" is gone. "Web Development 2026" and its Description are unchanged.

## Negative flows

### TC-005: The delete icon alone does not remove the program

**Priority:** High

**Preconditions:**
- The user is on the Programs page
- "Test Program" exists
- The confirmation dialog is not open

**Steps:**
1. Click the delete icon for "Test Program"
2. Do not confirm and do not cancel
3. Look at the program list

```gherkin
Scenario: Deletion waits for confirmation
  Given a program "Test Program" exists
  When I click the delete icon for "Test Program"
  And I do not confirm deletion
  Then I see a confirmation dialog
  And "Test Program" still exists in the list
```

**Expected result:** "Test Program" stays in the list while the dialog is open.

### TC-006: Closing the dialog without Confirm or Cancel keeps the program

**Priority:** High

**Preconditions:**
- The user is on the Programs page
- "Test Program" exists
- The confirmation dialog is open for "Test Program"

**Steps:**
1. Press Escape
2. Look at the program list
3. Open the delete dialog for "Test Program" again
4. Click outside the dialog
5. Look at the program list

```gherkin
Scenario: Dismissing the dialog does not delete the program
  Given I click the delete icon for "Test Program"
  When I see the confirmation dialog
  And I press Escape
  Then "Test Program" still exists in the list
  When I click the delete icon for "Test Program"
  And I click outside the confirmation dialog
  Then "Test Program" still exists in the list
```

**Expected result:** "Test Program" remains after Escape and after a click outside the dialog. Neither dismiss path is specified in the acceptance criteria.

### TC-007: A non-admin cannot delete "Test Program"

**Priority:** High

**Preconditions:**
- A non-admin user is logged in
- "Test Program" exists on the Programs page

**Steps:**
1. Navigate to the Programs page
2. Look for the delete icon on "Test Program"

```gherkin
Scenario: Non-admin cannot delete a program
  Given I am logged in as a non-admin user
  And a program "Test Program" exists
  When I am on the Programs page
  Then I do not see the delete icon for "Test Program"
  And "Test Program" still exists in the list
```

**Expected result:** No confirmation dialog opens, and "Test Program" stays in the list.

### TC-008: Cancelling "Web Development 2026" does not remove "Test Program"

**Priority:** Medium

**Preconditions:**
- "Test Program" and "Web Development 2026" both exist
- The user is on the Programs page

**Steps:**
1. Click the delete icon for "Web Development 2026"
2. Click Cancel
3. Check both names in the list

```gherkin
Scenario: Cancel leaves every program in the list
  Given a program "Test Program" exists
  And a program "Web Development 2026" exists
  When I click the delete icon for "Web Development 2026"
  And I see the confirmation dialog
  And I click Cancel
  Then "Web Development 2026" still exists in the list
  And "Test Program" still exists in the list
```

**Expected result:** Both programs remain. Cancel does not remove a different row.

### TC-009: A second confirm after the program is gone does not remove another program

**Priority:** Medium

**Preconditions:**
- "Test Program" and "Web Development 2026" exist
- The user confirms deletion of "Test Program"
- "Test Program" has been removed

**Steps:**
1. Confirm the list no longer shows "Test Program"
2. Confirm the list still shows "Web Development 2026"
3. Refresh the Programs page

```gherkin
Scenario: A completed delete does not remove a second program
  Given a program "Test Program" exists
  And a program "Web Development 2026" exists
  When I click the delete icon for "Test Program"
  And I confirm deletion
  Then "Test Program" is removed from the program list
  And the program list still shows "Web Development 2026"
  When I refresh the Programs page
  Then the program list does not show "Test Program"
  And the program list still shows "Web Development 2026"
```

**Expected result:** After refresh, "Test Program" is still absent and "Web Development 2026" is still present.

## Edge cases

### TC-010: The dialog names "Informatique & IA - Niveau 2" and only that program is removed

**Priority:** High

**Preconditions:**
- A program named "Informatique & IA - Niveau 2" exists with Description "Programme d'informatique et d'intelligence artificielle, niveau 2"
- "Test Program" also exists
- The user is on the Programs page

**Steps:**
1. Click the delete icon for "Informatique & IA - Niveau 2"
2. Read the confirmation dialog
3. Confirm deletion
4. Check the program list

```gherkin
Scenario: A program name with special characters is deleted exactly
  Given a program "Informatique & IA - Niveau 2" exists
  And a program "Test Program" exists
  When I click the delete icon for "Informatique & IA - Niveau 2"
  Then I see a confirmation dialog that shows "Informatique & IA - Niveau 2"
  When I confirm deletion
  Then "Informatique & IA - Niveau 2" is removed from the program list
  And "Test Program" still exists in the list
```

**Expected result:** The dialog shows "Informatique & IA - Niveau 2", including "&" and "-". That program is removed. "Test Program" stays.

### TC-011: Cancelling deletion of a special-character name keeps that exact name

**Priority:** Medium

**Preconditions:**
- "Informatique & IA - Niveau 2" exists
- The confirmation dialog is open for that program

**Steps:**
1. Click Cancel
2. Check the program list

```gherkin
Scenario: Cancel preserves a program name with special characters
  Given a program "Informatique & IA - Niveau 2" exists
  When I click the delete icon for "Informatique & IA - Niveau 2"
  And I see the confirmation dialog
  And I click Cancel
  Then the program list shows "Informatique & IA - Niveau 2"
```

**Expected result:** The list still shows "Informatique & IA - Niveau 2" exactly.

### TC-012: A one-character program name can be deleted after confirmation

**Priority:** Medium

**Preconditions:**
- A program named "A" exists with Description "Single-letter program name"
- "Test Program" also exists
- The user is on the Programs page

**Steps:**
1. Click the delete icon for "A"
2. Confirm the dialog shows "A"
3. Confirm deletion

```gherkin
Scenario: A one-character program name is removed after confirmation
  Given a program "A" exists
  And a program "Test Program" exists
  When I click the delete icon for "A"
  Then I see a confirmation dialog that shows "A"
  When I confirm deletion
  Then "A" is removed from the program list
  And "Test Program" still exists in the list
```

**Expected result:** "A" is removed. "Test Program" remains. The dialog identifies "A" so it is not confused with another row.

### TC-013: A 255-character Program Name is shown in the dialog and removed

**Priority:** Medium

**Preconditions:**
- A program exists whose Name is 255 characters and starts with "Test Program"
- "Web Development 2026" also exists
- The user is on the Programs page

**Steps:**
1. Click the delete icon on the 255-character program
2. Read the name in the confirmation dialog
3. Confirm deletion

```gherkin
Scenario: A max-length program name is deleted after confirmation
  Given a program exists whose Name is 255 characters and starts with "Test Program"
  And a program "Web Development 2026" exists
  When I click the delete icon for that 255-character program
  Then I see a confirmation dialog that shows the full 255-character Name
  When I confirm deletion
  Then that 255-character Name is removed from the program list
  And "Web Development 2026" still exists in the list
```

**Expected result:** The dialog shows the full name, that program is removed, and "Web Development 2026" stays. No maximum length is defined in the acceptance criteria; 255 is the candidate used in the other program tickets.

### TC-014: Deleting the only program leaves the list empty

**Priority:** Medium

**Preconditions:**
- The program list contains only "Test Program"
- The user is on the Programs page

**Steps:**
1. Click the delete icon for "Test Program"
2. Confirm deletion
3. Look at the program list

```gherkin
Scenario: The last program can be deleted
  Given the program list contains only "Test Program"
  When I click the delete icon for "Test Program"
  And I confirm deletion
  Then "Test Program" is removed from the program list
  And the program list shows no programs
```

**Expected result:** The list is empty. The page does not keep a blank row named "Test Program". The empty-list message is not specified in the acceptance criteria.

### TC-015: Only the chosen row is removed when two programs share a name

**Priority:** High

**Preconditions:**
- Two programs are both named "Test Program"
- The first has Description "Morning cohort"
- The second has Description "Evening cohort"
- The user is on the Programs page

**Steps:**
1. Click the delete icon on the "Test Program" row whose Description is "Evening cohort"
2. Read the confirmation dialog
3. Confirm deletion
4. Check the remaining "Test Program"

```gherkin
Scenario: Confirmation deletes only the selected duplicate
  Given two programs named "Test Program" exist
  And one has Description "Morning cohort"
  And the other has Description "Evening cohort"
  When I click the delete icon for the "Test Program" with Description "Evening cohort"
  And I confirm deletion
  Then one "Test Program" remains in the list
  And the remaining program has Description "Morning cohort"
  And no program with Description "Evening cohort" remains
```

**Expected result:** The evening cohort row is removed. The morning cohort row remains. Duplicate names are not allowed by the validation ticket; this case covers the gap if two rows still exist.

### TC-016: Markup in the program name is shown as text in the dialog

**Priority:** High

**Preconditions:**
- A program exists with Name `<script>alert("xss")</script>`
- "Test Program" also exists
- The user is on the Programs page

**Steps:**
1. Click the delete icon for `<script>alert("xss")</script>`
2. Read the confirmation dialog
3. Confirm deletion

```gherkin
Scenario: Markup in the program name is not executed during delete
  Given a program named "<script>alert(\"xss\")</script>" exists
  And a program "Test Program" exists
  When I click the delete icon for "<script>alert(\"xss\")</script>"
  Then I see a confirmation dialog that shows the text "<script>alert(\"xss\")</script>"
  And no script runs
  When I confirm deletion
  Then "<script>alert(\"xss\")</script>" is removed from the program list
  And "Test Program" still exists in the list
  And no script runs
```

**Expected result:** The dialog and the list treat the name as literal text. No alert or script runs when the dialog opens or when deletion is confirmed.

### TC-017: Cancel, then a later confirm, removes the program

**Priority:** Medium

**Preconditions:**
- "Test Program" exists
- The user is on the Programs page

**Steps:**
1. Click the delete icon for "Test Program"
2. Click Cancel
3. Confirm "Test Program" is still listed
4. Click the delete icon for "Test Program" again
5. Confirm deletion

```gherkin
Scenario: A cancelled deletion can be confirmed later
  Given a program "Test Program" exists
  When I click the delete icon for "Test Program"
  And I click Cancel
  Then "Test Program" still exists in the list
  When I click the delete icon for "Test Program"
  And I confirm deletion
  Then "Test Program" is removed from the program list
```

**Expected result:** Cancel does not block a later confirmed delete. The second confirmation removes "Test Program".

### TC-018: A whitespace-padded name is deleted as shown, not as a different program

**Priority:** Low

**Preconditions:**
- A program exists whose Name is "  Test Program  "
- A different program named "Test Program" also exists
- The user is on the Programs page

**Steps:**
1. Click the delete icon for "  Test Program  "
2. Read the name in the confirmation dialog
3. Confirm deletion
4. Check the list for both names

```gherkin
Scenario: The dialog deletes the padded name that was selected
  Given a program named "  Test Program  " exists
  And a program named "Test Program" exists
  When I click the delete icon for "  Test Program  "
  Then I see a confirmation dialog that shows "  Test Program  "
  When I confirm deletion
  Then "  Test Program  " is removed from the program list
  And "Test Program" still exists in the list
```

**Expected result:** Only the padded name is removed. "Test Program" stays. The acceptance criteria do not say whether stored names keep surrounding spaces.

## Ambiguities and gaps in the acceptance criteria

1. **Confirm control.** The scenario says "I confirm deletion" and does not name the button. It is not stated whether the label is Delete, Confirm, or Yes.
2. **Dialog content.** A dialog must appear. It is not stated whether the dialog includes "Test Program", the Description, or a warning about related records.
3. **Dismiss paths.** Cancel is specified. Escape, the close icon, and clicking outside the dialog are not. TC-006 assumes those paths keep the program.
4. **Who can delete.** The criteria do not say whether a non-admin sees the delete icon. TC-007 assumes non-admins cannot delete.
5. **Scope of deletion.** The list must drop "Test Program". Cascade behavior for cohorts, students, or other records linked to that program is not specified.
6. **Failure.** There is no acceptance criterion for a delete that fails. It is unclear whether the program stays in the list and what error is shown.
7. **Empty list.** Deleting the last program is not described. TC-014 expects an empty list and no blank row.
8. **Duplicate names.** The criteria assume one "Test Program". They do not say which row is removed if two share that name. TC-015 expects only the selected row to be removed.
9. **Special characters and markup.** The sample name is "Test Program". Names such as "Informatique & IA - Niveau 2" and script text are not covered. TC-010 and TC-016 expect the exact stored text in the dialog and no script execution.
10. **Length.** No maximum is given for the name shown in the dialog. TC-012 uses a 255-character name, matching the candidate limit from the other program tickets.
11. **Refresh.** Removal is required in the list. It is not stated whether that update is immediate or whether a success message appears. TC-009 checks that the result is still true after refresh.
12. **Undo.** The criteria do not offer an undo after confirm. These cases treat a confirmed delete as final.

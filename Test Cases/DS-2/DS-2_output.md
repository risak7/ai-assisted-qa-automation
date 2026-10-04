# Test Plan: Edit existing program details

**Feature:** Edit existing program details
**Jira:** [DS-2](https://legionqaschool.atlassian.net/browse/DS-2)
**Primary actor:** Admin on the Programs page
**URL:** https://test.didaxis.studio/programs
**Entry point:** Edit button on a program row → **Edit Program** dialog
**List:** One table. The only named column is **Program**. Each row shows the program name in bold and the description underneath it (the description is clamped to one line). The row actions are icon buttons whose accessible names are `Edit {Program Name}` and `Delete {Program Name}`.
**Edit Program fields:** Program Name (required), Description, Total Program Hours, Default Session Hours, Default Exam Hours, Target Audience, Focus Areas, and Sync/Async Ratio. A **Show AI Generation Config** control is in the dialog with those extra fields. Buttons are **Cancel** and **Save**. The dialog header also has a close control with no accessible name.
**Sample program:** Program Name "Web Development 2026", Description "Full-stack web development program"
**Defaults seen on edit** when hours, audience, and focus were not set: Total Program Hours empty, Default Session Hours `4`, Default Exam Hours `3`, Target Audience empty, Focus Areas empty, Sync/Async Ratio `70% sync / 30% async`.

## Positive flows

### TC-001: Edit form opens with the program's current Program Name and Description

**Priority:** High

**Preconditions:**
- The user is on the Programs page
- A program exists with Program Name "Web Development 2026" and Description "Full-stack web development program"

**Steps:**
1. Locate "Web Development 2026" in the program list
2. Click the Edit button named `Edit Web Development 2026`

```gherkin
Scenario: Open program for editing
  Given I am on the Programs page
  And a program "Web Development 2026" exists with Description "Full-stack web development program"
  When I click the Edit button on "Web Development 2026"
  Then I see the "Edit Program" dialog
  And the Program Name field shows "Web Development 2026"
  And the Description field shows "Full-stack web development program"
```

**Expected result:** The Edit Program dialog is pre-populated with Program Name "Web Development 2026" and Description "Full-stack web development program".

### TC-002: Saved Program Name replaces the old name in the list and the dialog closes

**Priority:** High

**Preconditions:**
- The user is editing "Web Development 2026"
- The Program Name field shows "Web Development 2026"
- No program named "Web Development 2026 - Updated" already exists

**Steps:**
1. Change Program Name to "Web Development 2026 - Updated"
2. Leave Description as "Full-stack web development program"
3. Click Save
4. Look at the program list without refreshing the page

```gherkin
Scenario: Successfully edit a program name
  Given I am editing "Web Development 2026"
  When I change the Program Name to "Web Development 2026 - Updated"
  And I click Save
  Then the Edit Program dialog closes
  And the program list immediately shows "Web Development 2026 - Updated"
  And the program list does not show "Web Development 2026"
```

**Expected result:** The dialog closes. The list shows "Web Development 2026 - Updated" immediately and no longer shows "Web Development 2026".

### TC-003: Changing only Description leaves Program Name unchanged

**Priority:** High

**Preconditions:**
- The user is editing "Web Development 2026"
- Program Name is "Web Development 2026"
- Description is "Full-stack web development program"

**Steps:**
1. Leave Program Name as "Web Development 2026"
2. Change Description to "Evening cohort for full-stack web development"
3. Click Save
4. Open the Edit Program dialog for "Web Development 2026" again

```gherkin
Scenario: Edit preserves unchanged fields
  Given I am editing a program named "Web Development 2026" with Description "Full-stack web development program"
  When I only change the Description to "Evening cohort for full-stack web development"
  And I click Save
  Then the Edit Program dialog closes
  And the program list shows "Web Development 2026"
  And the saved Description is "Evening cohort for full-stack web development"
  And the Program Name remains "Web Development 2026"
```

**Expected result:** Program Name stays "Web Development 2026". Description is now "Evening cohort for full-stack web development". No second program is created. The list cell shows the description under the name; the full value is confirmed by reopening Edit Program.

### TC-004: Saving without changes keeps the current Program Name and Description

**Priority:** Medium

**Preconditions:**
- The user is editing "Web Development 2026"
- Program Name is "Web Development 2026"
- Description is "Full-stack web development program"

**Steps:**
1. Do not change Program Name or Description
2. Click Save
3. Open the Edit Program dialog for "Web Development 2026" again

```gherkin
Scenario: Save with no edits keeps the current data
  Given I am editing "Web Development 2026" with Description "Full-stack web development program"
  When I do not change Program Name or Description
  And I click Save
  Then the Edit Program dialog closes
  And the program list shows "Web Development 2026"
  And the saved Description is still "Full-stack web development program"
```

**Expected result:** Save stays enabled when nothing has changed. The program is unchanged. The list still shows one "Web Development 2026" with Description "Full-stack web development program".

## Negative flows

### TC-005: An empty Program Name is not saved

**Priority:** High

**Preconditions:**
- The user is editing "Web Development 2026"
- Description is "Full-stack web development program"

**Steps:**
1. Clear the Program Name field
2. Leave Description as "Full-stack web development program"
3. Attempt to click Save
4. Close the form and check the program list

```gherkin
Scenario: Empty Program Name is rejected on edit
  Given I am editing "Web Development 2026"
  When I clear the Program Name field
  And I leave Description as "Full-stack web development program"
  Then the Save button is disabled
  And no validation message is shown
  And the program list still shows "Web Development 2026"
```

**Expected result:** Save is disabled. There is no error text. "Web Development 2026" remains in the list. Confirmed on the Edit Program dialog: clearing Program Name sets Save to disabled and leaves `aria-invalid` false.

### TC-006: A whitespace-only Program Name is not saved

**Priority:** High

**Preconditions:**
- The user is editing "Web Development 2026"

**Steps:**
1. Replace Program Name with three spaces
2. Leave Description as "Full-stack web development program"
3. Attempt to click Save

```gherkin
Scenario: Whitespace-only Program Name is rejected on edit
  Given I am editing "Web Development 2026"
  When I change the Program Name to "   "
  And I leave Description as "Full-stack web development program"
  Then the Save button is disabled
  And the program list still shows "Web Development 2026"
  And the program list does not show a blank name
```

**Expected result:** Save is disabled for a Program Name of three spaces. The original name "Web Development 2026" stays in the list.

### TC-007: Renaming onto an existing Program Name keeps both programs

**Priority:** High

**Preconditions:**
- "Web Development 2026" exists with Description "Full-stack web development program"
- "Data Analytics 2026" exists with Description "Analytics program"
- The user is editing "Web Development 2026"

**Steps:**
1. Change Program Name from "Web Development 2026" to "Data Analytics 2026"
2. Click Save
3. Review the program list

```gherkin
Scenario: Duplicate Program Name is saved on edit
  Given a program named "Data Analytics 2026" already exists with Description "Analytics program"
  And I am editing "Web Development 2026" with Description "Full-stack web development program"
  When I change the Program Name to "Data Analytics 2026"
  And I click Save
  Then the Edit Program dialog closes
  And the program list shows two programs named "Data Analytics 2026"
  And one of them still has Description "Analytics program"
  And the other still has Description "Full-stack web development program"
  And the program list does not show "Web Development 2026"
```

**Expected result:** The app does not reject the duplicate. The dialog closes, the original "Data Analytics 2026" row is not overwritten, and the edited program is renamed onto that same name. Uniqueness is not enforced. This is current behavior, not the safe behavior the acceptance criteria leave unspecified.

### TC-008: Closing the dialog without Save discards the new Program Name

**Priority:** High

**Preconditions:**
- The user is editing "Web Development 2026"
- Program Name is "Web Development 2026"

**Steps:**
1. Change Program Name to "Web Development 2026 - Updated"
2. Click Cancel
3. Look at the program list
4. Open the Edit Program dialog for "Web Development 2026" again

```gherkin
Scenario: Unsaved edits are discarded
  Given I am editing "Web Development 2026"
  When I change the Program Name to "Web Development 2026 - Updated"
  And I click Cancel
  Then the Edit Program dialog closes
  And the program list shows "Web Development 2026"
  And the program list does not show "Web Development 2026 - Updated"
  And reopening the edit form shows Program Name "Web Development 2026"
```

**Expected result:** Cancel closes the dialog and discards the typed name. The list and the stored program still use "Web Development 2026".

### TC-009: A non-admin cannot change program details

**Priority:** High

**Preconditions:**
- A non-admin user is logged in
- "Web Development 2026" exists on the Programs page

**Steps:**
1. Navigate to the Programs page
2. Look for the Edit button on "Web Development 2026"

```gherkin
Scenario: Non-admin cannot edit a program
  Given I am logged in as a non-admin user
  And a program "Web Development 2026" exists
  When I am on the Programs page
  Then I do not see the Edit button on "Web Development 2026"
  And I cannot change Program Name or Description
```

**Expected result:** The Edit Program dialog is not available. Program Name stays "Web Development 2026" and Description stays "Full-stack web development program". This was not exercised with the admin account used to explore the page.

### TC-010: Saving an edit does not add a second program

**Priority:** High

**Preconditions:**
- The user is editing "Web Development 2026"
- The list contains one program named "Web Development 2026"

**Steps:**
1. Change Program Name to "Web Development 2026 - Updated"
2. Click Save
3. Count programs in the list

```gherkin
Scenario: Edit updates the existing program
  Given I am editing "Web Development 2026"
  And the program list contains one "Web Development 2026"
  When I change the Program Name to "Web Development 2026 - Updated"
  And I click Save
  Then the program list contains one "Web Development 2026 - Updated"
  And the program list does not contain "Web Development 2026"
  And no additional program row is added
```

**Expected result:** The same program is updated. The list does not contain both the old name and the new name.

## Edge cases

### TC-011: A one-character Program Name is saved

**Priority:** Medium

**Preconditions:**
- The user is editing "Web Development 2026"
- No program with that one-character name already exists

**Steps:**
1. Change Program Name to a unique one-character value
2. Leave Description as "Full-stack web development program"
3. Click Save

```gherkin
Scenario: Minimum-length Program Name is accepted on edit
  Given I am editing "Web Development 2026"
  When I change the Program Name to a one-character value
  And I click Save
  Then Save is enabled
  And the Edit Program dialog closes
  And the program list immediately shows that one-character Program Name
  And the saved Description is still "Full-stack web development program"
```

**Expected result:** A one-character Program Name enables Save. The program is renamed and Description is unchanged. No minimum length other than non-empty is defined. Confirmed on the dialog: filling `x` enables Save.

### TC-012: Special characters in Program Name are stored and shown as entered

**Priority:** Medium

**Preconditions:**
- The user is editing "Web Development 2026"
- No program named "C++ & .NET (Cohort #1)" already exists

**Steps:**
1. Change Program Name to "C++ & .NET (Cohort #1)"
2. Leave Description as "Full-stack web development program"
3. Click Save

```gherkin
Scenario: Special characters in Program Name are preserved on edit
  Given I am editing "Web Development 2026"
  When I change the Program Name to "C++ & .NET (Cohort #1)"
  And I click Save
  Then the Edit Program dialog closes
  And the program list immediately shows "C++ & .NET (Cohort #1)"
```

**Expected result:** The list shows "C++ & .NET (Cohort #1)" exactly, including "+", "&", ".", "(", ")", and "#". The Programs page already lists names such as "C++ & C# Programming (2026)".

### TC-013: Leading and trailing spaces in Program Name are trimmed before save

**Priority:** Medium

**Preconditions:**
- The user is editing "Web Development 2026"
- No program named "Cybersecurity 2026" already exists

**Steps:**
1. Change Program Name to "  Cybersecurity 2026  "
2. Click Save

```gherkin
Scenario: Surrounding spaces are trimmed from Program Name on edit
  Given I am editing "Web Development 2026"
  When I change the Program Name to "  Cybersecurity 2026  "
  And I click Save
  Then the Edit Program dialog closes
  And the program list shows "Cybersecurity 2026"
  And the program list does not show "  Cybersecurity 2026  "
```

**Expected result:** The saved Program Name is "Cybersecurity 2026" without the leading or trailing spaces. Spaces-only input is rejected (TC-006); surrounding spaces on a real name are trimmed on save.

### TC-014: A 255-character Program Name is saved and shown in full

**Priority:** Medium

**Preconditions:**
- The user is editing "Web Development 2026"
- Program Name will be set to 255 characters beginning with "Web Development 2026 - Updated"

**Steps:**
1. Change Program Name to a 255-character value that starts with "Web Development 2026 - Updated"
2. Click Save

```gherkin
Scenario: Program Name at 255 characters is accepted on edit
  Given I am editing "Web Development 2026"
  When I change the Program Name to a 255-character value that starts with "Web Development 2026 - Updated"
  And I click Save
  Then the Edit Program dialog closes
  And the program list immediately shows the full 255-character Program Name
```

**Expected result:** The program is renamed to the full 255-character value. The Program Name input has no `maxlength`.

### TC-015: A 256-character Program Name is saved

**Priority:** Medium

**Preconditions:**
- The user is editing "Web Development 2026"

**Steps:**
1. Change Program Name to a 256-character value that starts with "Web Development 2026 - Updated"
2. Click Save
3. Check the program list

```gherkin
Scenario: Program Name over 255 characters is accepted on edit
  Given I am editing "Web Development 2026"
  When I change the Program Name to a 256-character value that starts with "Web Development 2026 - Updated"
  Then the Program Name field contains all 256 characters
  And the Save button is enabled
  And I click Save
  And the Edit Program dialog closes
  And the program list shows the 256-character Program Name
  And the program list no longer shows "Web Development 2026"
```

**Expected result:** The field accepts 256 characters and Save stays enabled. There is no max-length message. Confirmed on the open dialog: the input has no `maxlength`, the value length is 256, and Save is enabled. The save stores that name.

### TC-016: A Program Name that differs only by letter case is saved as entered

**Priority:** Medium

**Preconditions:**
- "Web Development 2026" exists
- "Data Analytics 2026" exists
- The user is editing "Web Development 2026"

**Steps:**
1. Change Program Name to "data analytics 2026"
2. Click Save

```gherkin
Scenario: A case-variant Program Name is stored as entered
  Given a program named "Data Analytics 2026" already exists
  And I am editing "Web Development 2026"
  When I change the Program Name to "data analytics 2026"
  And I click Save
  Then the Edit Program dialog closes
  And the program list still shows "Data Analytics 2026"
  And the program list shows "data analytics 2026"
  And the program list does not show "Web Development 2026"
```

**Expected result:** The case-variant name is saved as typed. The original "Data Analytics 2026" row remains. Case-insensitive uniqueness is not enforced.

### TC-017: Markup entered in Program Name is shown as text

**Priority:** High

**Preconditions:**
- The user is editing "Web Development 2026"

**Steps:**
1. Change Program Name to `<script>alert("xss")</script>`
2. Click Save
3. View the program list

```gherkin
Scenario: Markup in Program Name is not executed on edit
  Given I am editing "Web Development 2026"
  When I change the Program Name to "<script>alert(\"xss\")</script>"
  And I click Save
  Then the Edit Program dialog closes
  And the program list shows the text "<script>alert(\"xss\")</script>"
  And no script runs
```

**Expected result:** The name is displayed as literal text. No alert or script executes.

### TC-018: Clearing Description keeps the current Program Name

**Priority:** Medium

**Preconditions:**
- The user is editing "Web Development 2026"
- Description is "Full-stack web development program"

**Steps:**
1. Leave Program Name as "Web Development 2026"
2. Clear Description
3. Click Save
4. Open the Edit Program dialog again

```gherkin
Scenario: Clearing Description does not change Program Name
  Given I am editing "Web Development 2026" with Description "Full-stack web development program"
  When I clear the Description
  And I click Save
  Then the Edit Program dialog closes
  And the program list shows "Web Development 2026"
  And the saved Description is empty
  And the Program Name remains "Web Development 2026"
```

**Expected result:** Save stays enabled. Program Name stays "Web Development 2026" and Description is empty. Description is not a required field.

### TC-019: A 1000-character Description is saved and Program Name stays the same

**Priority:** Low

**Preconditions:**
- The user is editing "Web Development 2026"
- Description will be set to 1000 characters starting with "Full-stack web development program"

**Steps:**
1. Leave Program Name as "Web Development 2026"
2. Replace Description with a 1000-character value that starts with "Full-stack web development program"
3. Click Save
4. Open the Edit Program dialog again

```gherkin
Scenario: A long Description is preserved and Program Name is unchanged
  Given I am editing "Web Development 2026"
  When I only change the Description to a 1000-character value that starts with "Full-stack web development program"
  And I click Save
  Then the Edit Program dialog closes
  And the program list shows "Web Development 2026"
  And the Program column shows the start of that Description
  And the saved Description is the full 1000-character value
```

**Expected result:** Program Name remains "Web Development 2026". The full 1000-character Description is stored and shown when Edit Program is reopened. The list cell clamps the description to one line, so the row shows a prefix, not all 1000 characters.

### TC-020: Edit form shows the AI generation fields with their current values

**Priority:** Medium

**Preconditions:**
- A program was created with Program Name and Description only
- The user opens that program in Edit Program

**Steps:**
1. Open Edit Program for that program
2. Read Total Program Hours, Default Session Hours, Default Exam Hours, Target Audience, Focus Areas, and Sync/Async Ratio

```gherkin
Scenario: Edit Program shows the fields beyond Program Name and Description
  Given I created a program with only Program Name and Description
  When I open Edit Program for that program
  Then I see the "Edit Program" heading
  And I see "Show AI Generation Config"
  And Total Program Hours is empty
  And Default Session Hours is "4"
  And Default Exam Hours is "3"
  And Target Audience is empty
  And Focus Areas is empty
  And the dialog shows "Sync/Async Ratio: 70% sync / 30% async"
```

**Expected result:** Those controls are on the Edit Program dialog. For a program created with only Program Name and Description, the values above are what the form shows. Total Program Hours placeholder is "e.g. 900" and its hint is "Required for AI curriculum generation". Target Audience placeholder is "e.g. Career changers, no CS background". Focus Areas placeholder is "e.g. Python, SQL, Machine Learning, Data Visualization".

### TC-021: Changing only Description leaves session and exam hours unchanged

**Priority:** High

**Preconditions:**
- The user is editing a program created with only Program Name and Description
- Default Session Hours is "4"
- Default Exam Hours is "3"
- Total Program Hours is empty

**Steps:**
1. Change only Description
2. Click Save
3. Open Edit Program again

```gherkin
Scenario: A Description edit does not change the hour fields
  Given I am editing a program whose Default Session Hours is "4" and Default Exam Hours is "3"
  When I only change the Description
  And I click Save
  Then the Program Name is unchanged
  And the new Description is saved
  And Default Session Hours is still "4"
  And Default Exam Hours is still "3"
  And Total Program Hours is still empty
```

**Expected result:** The hour fields stay at the values they had when the dialog opened. This is the "other fields remain unchanged" rule from the acceptance criteria, applied to the fields that are actually on the form.

## Ambiguities and gaps in the acceptance criteria

1. **Field label.** The ticket says "Name". The dialog label is **Program Name**, and the textbox accessible name is "Program Name". The asterisk is visual; it is not part of the accessible name.
2. **Other fields.** The criteria say "other fields" without naming them. The dialog also has Total Program Hours, Default Session Hours, Default Exam Hours, Target Audience, Focus Areas, and Sync/Async Ratio. TC-020 and TC-021 cover those.
3. **Empty Program Name.** Confirmed on the page: Save is disabled, and no validation message is shown.
4. **Whitespace-only Program Name.** Confirmed on the page: three spaces also disable Save.
5. **Empty Description.** Description is not required. TC-018 treats a cleared Description as allowed.
6. **Uniqueness.** The app saves a rename onto an existing Program Name, including a name that differs only by case. TC-007 and TC-016 record that behavior. The original row with the target name is not overwritten.
7. **Length limits.** Program Name has no `maxlength`. A 256-character value stays in the field and Save stays enabled. TC-014 and TC-015 record that both lengths are saved. No product maximum was found on the control.
8. **Discard path.** **Cancel** closes the dialog. A header close control is also present and has no accessible name, so TC-008 uses Cancel.
9. **Who can edit.** Explored while signed in as admin. TC-009 still assumes a non-admin does not get the Edit button. That account was not available in this session.
10. **List layout.** The new name must show immediately. The description is in the same Program cell, clamped to one line. Sort order and a success message are not specified.
11. **Edit versus create.** TC-010 checks that a unique rename updates the row in place. A duplicate rename (TC-007) removes the old name and adds the new name beside the program that already had it.
12. **Page size.** The Programs table currently renders thousands of rows with no search or pagination. Tests need unique names and must scroll the row into view before clicking Edit.

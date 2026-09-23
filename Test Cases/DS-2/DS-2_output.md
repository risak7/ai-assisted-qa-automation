# Test Plan: Edit existing program details

**Feature:** Edit existing program details
**Primary actor:** Admin on the Programs page
**Entry point:** Edit icon on a program row → edit modal
**Known fields:** Name, Description
**Sample program:** Name "Web Development 2026", Description "Full-stack web development program"

## Positive flows

### TC-001: Edit form opens with the program's current Name and Description

**Priority:** High

**Preconditions:**
- The user is on the Programs page
- A program exists with Name "Web Development 2026" and Description "Full-stack web development program"

**Steps:**
1. Locate "Web Development 2026" in the program list
2. Click the edit icon on "Web Development 2026"

```gherkin
Scenario: Open program for editing
  Given I am on the Programs page
  And a program "Web Development 2026" exists with Description "Full-stack web development program"
  When I click the edit icon on "Web Development 2026"
  Then I see the edit form
  And the Name field shows "Web Development 2026"
  And the Description field shows "Full-stack web development program"
```

**Expected result:** The edit form is pre-populated with Name "Web Development 2026" and Description "Full-stack web development program".

### TC-002: Saved name replaces the old name in the list and the modal closes

**Priority:** High

**Preconditions:**
- The user is editing "Web Development 2026"
- The Name field shows "Web Development 2026"
- No program named "Web Development 2026 - Updated" already exists

**Steps:**
1. Change Name to "Web Development 2026 - Updated"
2. Leave Description as "Full-stack web development program"
3. Click Save
4. Look at the program list without refreshing the page

```gherkin
Scenario: Successfully edit a program name
  Given I am editing "Web Development 2026"
  When I change the Name to "Web Development 2026 - Updated"
  And I click Save
  Then the modal closes
  And the program list immediately shows "Web Development 2026 - Updated"
  And the program list does not show "Web Development 2026"
```

**Expected result:** The modal closes. The list shows "Web Development 2026 - Updated" immediately and no longer shows "Web Development 2026".

### TC-003: Changing only Description leaves Name unchanged

**Priority:** High

**Preconditions:**
- The user is editing "Web Development 2026"
- Name is "Web Development 2026"
- Description is "Full-stack web development program"

**Steps:**
1. Leave Name as "Web Development 2026"
2. Change Description to "Evening cohort for full-stack web development"
3. Click Save
4. Open the edit form for "Web Development 2026" again

```gherkin
Scenario: Edit preserves unchanged fields
  Given I am editing a program named "Web Development 2026" with Description "Full-stack web development program"
  When I only change the Description to "Evening cohort for full-stack web development"
  And I click Save
  Then the modal closes
  And the program list shows "Web Development 2026"
  And the saved Description is "Evening cohort for full-stack web development"
  And the Name remains "Web Development 2026"
```

**Expected result:** Name stays "Web Development 2026". Description is now "Evening cohort for full-stack web development". No second program is created.

### TC-004: Saving without changes keeps the current Name and Description

**Priority:** Medium

**Preconditions:**
- The user is editing "Web Development 2026"
- Name is "Web Development 2026"
- Description is "Full-stack web development program"

**Steps:**
1. Do not change Name or Description
2. Click Save
3. Open the edit form for "Web Development 2026" again

```gherkin
Scenario: Save with no edits keeps the current data
  Given I am editing "Web Development 2026" with Description "Full-stack web development program"
  When I do not change Name or Description
  And I click Save
  Then the modal closes
  And the program list shows "Web Development 2026"
  And the saved Description is still "Full-stack web development program"
```

**Expected result:** The program is unchanged. The list still shows one "Web Development 2026" with Description "Full-stack web development program".

## Negative flows

### TC-005: An empty Name is not saved

**Priority:** High

**Preconditions:**
- The user is editing "Web Development 2026"
- Description is "Full-stack web development program"

**Steps:**
1. Clear the Name field
2. Leave Description as "Full-stack web development program"
3. Attempt to click Save
4. Close the form and check the program list

```gherkin
Scenario: Empty Name is rejected on edit
  Given I am editing "Web Development 2026"
  When I clear the Name field
  And I leave Description as "Full-stack web development program"
  Then the Save button is disabled
  And the program list still shows "Web Development 2026"
```

**Expected result:** Save does not store a blank Name. "Web Development 2026" remains in the list. Empty-name behavior is not stated in the edit acceptance criteria; this case uses the same rule as program creation.

### TC-006: A whitespace-only Name is not saved

**Priority:** High

**Preconditions:**
- The user is editing "Web Development 2026"

**Steps:**
1. Replace Name with three spaces
2. Leave Description as "Full-stack web development program"
3. Attempt to click Save

```gherkin
Scenario: Whitespace-only Name is rejected on edit
  Given I am editing "Web Development 2026"
  When I change the Name to "   "
  And I leave Description as "Full-stack web development program"
  Then the Save button is disabled
  And the program list still shows "Web Development 2026"
  And the program list does not show a blank name
```

**Expected result:** The original name "Web Development 2026" stays in the list. A blank name is not saved.

### TC-007: Renaming to an existing program name does not overwrite that program

**Priority:** High

**Preconditions:**
- "Web Development 2026" exists with Description "Full-stack web development program"
- "Data Analytics 2026" exists with Description "Analytics program"
- The user is editing "Web Development 2026"

**Steps:**
1. Change Name from "Web Development 2026" to "Data Analytics 2026"
2. Click Save
3. Review the program list

```gherkin
Scenario: Duplicate Name is rejected on edit
  Given a program named "Data Analytics 2026" already exists
  And I am editing "Web Development 2026"
  When I change the Name to "Data Analytics 2026"
  And I click Save
  Then the modal stays open
  And I see a validation message that "Data Analytics 2026" already exists
  And the program list still shows "Web Development 2026"
  And the program list still shows one "Data Analytics 2026" with Description "Analytics program"
```

**Expected result:** Both programs remain. "Data Analytics 2026" is not overwritten, and "Web Development 2026" is not renamed. Duplicate handling is not defined in the acceptance criteria.

### TC-008: Closing the modal without Save discards the new name

**Priority:** High

**Preconditions:**
- The user is editing "Web Development 2026"
- Name is "Web Development 2026"

**Steps:**
1. Change Name to "Web Development 2026 - Updated"
2. Close the modal without clicking Save
3. Look at the program list
4. Open the edit form for "Web Development 2026" again

```gherkin
Scenario: Unsaved edits are discarded
  Given I am editing "Web Development 2026"
  When I change the Name to "Web Development 2026 - Updated"
  And I close the modal without clicking Save
  Then the program list shows "Web Development 2026"
  And the program list does not show "Web Development 2026 - Updated"
  And reopening the edit form shows Name "Web Development 2026"
```

**Expected result:** The list and the stored program still use "Web Development 2026". Cancel and dismiss behavior is not specified in the acceptance criteria.

### TC-009: A non-admin cannot change program details

**Priority:** High

**Preconditions:**
- A non-admin user is logged in
- "Web Development 2026" exists on the Programs page

**Steps:**
1. Navigate to the Programs page
2. Look for the edit icon on "Web Development 2026"

```gherkin
Scenario: Non-admin cannot edit a program
  Given I am logged in as a non-admin user
  And a program "Web Development 2026" exists
  When I am on the Programs page
  Then I do not see the edit icon on "Web Development 2026"
  And I cannot change Name or Description
```

**Expected result:** The edit form is not available. Name stays "Web Development 2026" and Description stays "Full-stack web development program".

### TC-010: Saving an edit does not add a second program

**Priority:** High

**Preconditions:**
- The user is editing "Web Development 2026"
- The list contains one program named "Web Development 2026"

**Steps:**
1. Change Name to "Web Development 2026 - Updated"
2. Click Save
3. Count programs in the list

```gherkin
Scenario: Edit updates the existing program
  Given I am editing "Web Development 2026"
  And the program list contains one "Web Development 2026"
  When I change the Name to "Web Development 2026 - Updated"
  And I click Save
  Then the program list contains one "Web Development 2026 - Updated"
  And the program list does not contain "Web Development 2026"
  And no additional program row is added
```

**Expected result:** The same program is updated. The list does not contain both the old name and the new name.

## Edge cases

### TC-011: A one-character Name is saved

**Priority:** Medium

**Preconditions:**
- The user is editing "Web Development 2026"
- No program named "A" already exists

**Steps:**
1. Change Name to "A"
2. Leave Description as "Full-stack web development program"
3. Click Save

```gherkin
Scenario: Minimum-length Name is accepted on edit
  Given I am editing "Web Development 2026"
  When I change the Name to "A"
  And I click Save
  Then the modal closes
  And the program list immediately shows "A"
  And the saved Description is still "Full-stack web development program"
```

**Expected result:** The program is renamed to "A". Description is unchanged. No minimum length other than non-empty is defined in the acceptance criteria.

### TC-012: Special characters in Name are stored and shown as entered

**Priority:** Medium

**Preconditions:**
- The user is editing "Web Development 2026"
- No program named "C++ & .NET (Cohort #1)" already exists

**Steps:**
1. Change Name to "C++ & .NET (Cohort #1)"
2. Leave Description as "Full-stack web development program"
3. Click Save

```gherkin
Scenario: Special characters in Name are preserved on edit
  Given I am editing "Web Development 2026"
  When I change the Name to "C++ & .NET (Cohort #1)"
  And I click Save
  Then the modal closes
  And the program list immediately shows "C++ & .NET (Cohort #1)"
```

**Expected result:** The list shows "C++ & .NET (Cohort #1)" exactly, including "+", "&", ".", "(", ")", and "#".

### TC-013: Leading and trailing spaces in Name are trimmed before save

**Priority:** Medium

**Preconditions:**
- The user is editing "Web Development 2026"
- No program named "Cybersecurity 2026" already exists

**Steps:**
1. Change Name to "  Cybersecurity 2026  "
2. Click Save

```gherkin
Scenario: Surrounding spaces are trimmed from Name on edit
  Given I am editing "Web Development 2026"
  When I change the Name to "  Cybersecurity 2026  "
  And I click Save
  Then the modal closes
  And the program list shows "Cybersecurity 2026"
  And the program list does not show "  Cybersecurity 2026  "
```

**Expected result:** The saved Name is "Cybersecurity 2026" without the leading or trailing spaces. Trimming is not specified in the acceptance criteria.

### TC-014: A 255-character Name is saved and shown in full

**Priority:** Medium

**Preconditions:**
- The user is editing "Web Development 2026"
- Name will be set to 255 characters beginning with "Web Development 2026 - Updated"

**Steps:**
1. Change Name to a 255-character value that starts with "Web Development 2026 - Updated"
2. Click Save

```gherkin
Scenario: Name at 255 characters is accepted on edit
  Given I am editing "Web Development 2026"
  When I change the Name to a 255-character value that starts with "Web Development 2026 - Updated"
  And I click Save
  Then the modal closes
  And the program list immediately shows the full 255-character Name
```

**Expected result:** The program is renamed to the full 255-character value. 255 is a candidate limit only; the acceptance criteria do not state a maximum.

### TC-015: A 256-character Name is not saved

**Priority:** Medium

**Preconditions:**
- The user is editing "Web Development 2026"

**Steps:**
1. Change Name to a 256-character value that starts with "Web Development 2026 - Updated"
2. Attempt to click Save
3. Check the program list

```gherkin
Scenario: Name over 255 characters is rejected on edit
  Given I am editing "Web Development 2026"
  When I change the Name to a 256-character value that starts with "Web Development 2026 - Updated"
  Then the Save button is disabled
  Or I see a validation message that Name exceeds the maximum length
  And the program list still shows "Web Development 2026"
```

**Expected result:** The name stays "Web Development 2026". The user is blocked by a disabled Save button or a max-length message. The exact limit is a gap in the acceptance criteria.

### TC-016: A Name that differs only by letter case is treated as a duplicate

**Priority:** Medium

**Preconditions:**
- "Web Development 2026" exists
- "Data Analytics 2026" exists
- The user is editing "Web Development 2026"

**Steps:**
1. Change Name to "data analytics 2026"
2. Click Save

```gherkin
Scenario: Names are unique regardless of letter case on edit
  Given a program named "Data Analytics 2026" already exists
  And I am editing "Web Development 2026"
  When I change the Name to "data analytics 2026"
  And I click Save
  Then the modal stays open
  And the program list still shows "Web Development 2026"
  And the program list still shows one "Data Analytics 2026"
```

**Expected result:** "Web Development 2026" is not renamed. Case sensitivity of uniqueness is not defined in the acceptance criteria.

### TC-017: Markup entered in Name is shown as text

**Priority:** High

**Preconditions:**
- The user is editing "Web Development 2026"

**Steps:**
1. Change Name to `<script>alert("xss")</script>`
2. Click Save
3. View the program list

```gherkin
Scenario: Markup in Name is not executed on edit
  Given I am editing "Web Development 2026"
  When I change the Name to "<script>alert(\"xss\")</script>"
  And I click Save
  Then the modal closes
  And the program list shows the text "<script>alert(\"xss\")</script>"
  And no script runs
```

**Expected result:** The name is displayed as literal text. No alert or script executes.

### TC-018: Clearing Description keeps the current Name

**Priority:** Medium

**Preconditions:**
- The user is editing "Web Development 2026"
- Description is "Full-stack web development program"

**Steps:**
1. Leave Name as "Web Development 2026"
2. Clear Description
3. Click Save
4. Open the edit form again

```gherkin
Scenario: Clearing Description does not change Name
  Given I am editing "Web Development 2026" with Description "Full-stack web development program"
  When I clear the Description
  And I click Save
  Then the modal closes
  And the program list shows "Web Development 2026"
  And the saved Description is empty
  And the Name remains "Web Development 2026"
```

**Expected result:** Name stays "Web Development 2026" and Description is empty. Whether an empty Description is allowed is not stated in the acceptance criteria.

### TC-019: A 1000-character Description is saved and Name stays the same

**Priority:** Low

**Preconditions:**
- The user is editing "Web Development 2026"
- Description will be set to 1000 characters starting with "Full-stack web development program"

**Steps:**
1. Leave Name as "Web Development 2026"
2. Replace Description with a 1000-character value that starts with "Full-stack web development program"
3. Click Save
4. Open the edit form again

```gherkin
Scenario: A long Description is preserved and Name is unchanged
  Given I am editing "Web Development 2026"
  When I only change the Description to a 1000-character value that starts with "Full-stack web development program"
  And I click Save
  Then the modal closes
  And the program list shows "Web Development 2026"
  And the saved Description is the full 1000-character value
```

**Expected result:** Name remains "Web Development 2026". The full 1000-character Description is stored. No maximum length for Description is stated in the acceptance criteria.

## Ambiguities and gaps in the acceptance criteria

1. **Field names.** Create uses "Program Name". This ticket says "Name" and also "other fields". It is not stated whether the edit form label is Name or Program Name, or which other fields exist besides Description.
2. **Pre-populated data.** The form must show "the program's current data", but the criteria do not list the fields or sample values. These cases use Name "Web Development 2026" and Description "Full-stack web development program".
3. **Empty Name.** Edit does not say what happens if Name is cleared. TC-005 and TC-006 assume Save is disabled, matching creation.
4. **Empty Description.** "Only change the Description" does not say whether Description may be cleared. TC-018 assumes an empty Description is allowed and Name stays unchanged.
5. **Uniqueness.** Renaming onto an existing name, including a name that differs only by case, is not mentioned. TC-007 and TC-016 assume names stay unique and the comparison is case-insensitive. Saving a program under its own current name must still be allowed.
6. **Length limits.** No minimum or maximum is given for Name or Description. TC-011 uses 1 character. TC-014 and TC-015 use 255 and 256 as a candidate boundary that still needs a product decision.
7. **Discard path.** Success closes the modal after Save. Cancel, clicking outside the modal, and Escape are not specified. TC-008 assumes those paths discard edits.
8. **Who can edit.** The criteria start from the Programs page and do not say whether a non-admin sees the edit icon. TC-009 assumes non-admins cannot edit.
9. **Immediate list update.** The list must show the new name immediately. Sort position, a success message, and whether Description is visible in the list are not specified.
10. **Edit versus create.** The criteria do not explicitly say the original row is updated in place. TC-010 checks that the old name is removed and no second row is added.
11. **Special characters and markup.** Allowed characters and how HTML or script text is rendered are not specified. TC-012 and TC-017 assume the value is stored and shown as plain text.
12. **Whitespace.** Trimming of leading and trailing spaces is not specified. TC-013 assumes the saved Name is trimmed.

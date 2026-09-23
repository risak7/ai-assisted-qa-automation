# Test Plan: Create new academic program

**Feature:** Create new academic program
**Primary actor:** Admin
**Entry point:** Programs page → "+ New Program"
**Fields:** Program Name, Description

## Positive flows

### TC-001: Program creation form shows Program Name and Description

**Priority:** High

**Preconditions:**
- An admin user is logged in
- The Programs page is available

**Steps:**
1. Navigate to the Programs page
2. Click "+ New Program"

```gherkin
Scenario: Navigate to program creation form
  Given I am logged in as admin
  When I navigate to the Programs page
  And I click "+ New Program"
  Then I see the program creation form
  And the form contains the field "Program Name"
  And the form contains the field "Description"
```

**Expected result:** The program creation form is displayed with the fields Program Name and Description.

### TC-002: A completed program is added to the list and the modal closes

**Priority:** High

**Preconditions:**
- An admin user is logged in
- The program creation form is open
- No program named "Web Development 2026" already exists

**Steps:**
1. Fill in Program Name with "Web Development 2026"
2. Fill in Description with "Full-stack web development program"
3. Click Create

```gherkin
Scenario: Successfully create a program
  Given I am on the program creation form
  When I fill in Program Name with "Web Development 2026"
  And I fill in Description with "Full-stack web development program"
  And I click Create
  Then the modal closes
  And the program list shows "Web Development 2026"
  And the program list does not show a second "Web Development 2026"
```

**Expected result:** The modal closes and the Programs list shows exactly one entry named "Web Development 2026".

### TC-003: Program is created when Program Name is filled and Description is left empty

**Priority:** Medium

**Preconditions:**
- An admin user is logged in
- The program creation form is open
- No program named "Data Analytics 2026" already exists

**Steps:**
1. Fill in Program Name with "Data Analytics 2026"
2. Leave Description empty
3. Click Create

```gherkin
Scenario: Create a program without a description
  Given I am on the program creation form
  When I fill in Program Name with "Data Analytics 2026"
  And I leave Description empty
  And I click Create
  Then the Create button is enabled
  And the modal closes
  And the program list shows "Data Analytics 2026"
```

**Expected result:** Create stays enabled, the modal closes, and "Data Analytics 2026" appears in the program list with an empty Description. This expectation is inferred from the acceptance criteria, which disable Create only when Program Name is empty.

## Negative flows

### TC-004: Create stays disabled when Program Name is empty

**Priority:** High

**Preconditions:**
- An admin user is logged in
- The program creation form is open

**Steps:**
1. Leave Program Name empty
2. Leave Description empty
3. Observe the Create button

```gherkin
Scenario: Validation prevents empty program name
  Given I am on the program creation form
  When I leave the Program Name field empty
  And I leave Description empty
  Then the Create button is disabled
```

**Expected result:** The Create button is disabled and no program is added to the list.

### TC-005: Filling only Description does not enable Create

**Priority:** High

**Preconditions:**
- An admin user is logged in
- The program creation form is open

**Steps:**
1. Leave Program Name empty
2. Fill in Description with "Full-stack web development program"
3. Observe the Create button

```gherkin
Scenario: Description alone does not allow program creation
  Given I am on the program creation form
  When I leave the Program Name field empty
  And I fill in Description with "Full-stack web development program"
  Then the Create button is disabled
  And the program list does not show a new program
```

**Expected result:** Create remains disabled. The program list is unchanged.

### TC-006: A whitespace-only Program Name does not create a program

**Priority:** High

**Preconditions:**
- An admin user is logged in
- The program creation form is open

**Steps:**
1. Fill in Program Name with three spaces
2. Fill in Description with "Full-stack web development program"
3. Observe the Create button

```gherkin
Scenario: Whitespace-only program name is rejected
  Given I am on the program creation form
  When I fill in Program Name with "   "
  And I fill in Description with "Full-stack web development program"
  Then the Create button is disabled
  And the program list does not show a blank program name
```

**Expected result:** Create stays disabled. No program with a blank name is added.

### TC-007: A duplicate Program Name is not added a second time

**Priority:** High

**Preconditions:**
- An admin user is logged in
- A program named "Web Development 2026" already exists
- The program creation form is open

**Steps:**
1. Fill in Program Name with "Web Development 2026"
2. Fill in Description with "Another full-stack cohort"
3. Click Create

```gherkin
Scenario: Duplicate program name is rejected
  Given a program named "Web Development 2026" already exists
  And I am on the program creation form
  When I fill in Program Name with "Web Development 2026"
  And I fill in Description with "Another full-stack cohort"
  And I click Create
  Then the modal stays open
  And I see a validation message that "Web Development 2026" already exists
  And the program list still shows only one "Web Development 2026"
```

**Expected result:** The existing program is not duplicated. The modal stays open and the user is told that "Web Development 2026" already exists. Duplicate handling is not defined in the acceptance criteria; this case records the expected safe behavior.

### TC-008: A user who is not an admin cannot open the creation form

**Priority:** High

**Preconditions:**
- A non-admin user is logged in
- The Programs page is available to that user

**Steps:**
1. Navigate to the Programs page
2. Look for "+ New Program"

```gherkin
Scenario: Non-admin cannot create a program
  Given I am logged in as a non-admin user
  When I navigate to the Programs page
  Then I do not see "+ New Program"
  And I cannot open the program creation form
```

**Expected result:** "+ New Program" is not available, and no program can be created from this session.

## Edge cases

### TC-009: A one-character Program Name is accepted

**Priority:** Medium

**Preconditions:**
- An admin user is logged in
- The program creation form is open
- No program named "A" already exists

**Steps:**
1. Fill in Program Name with "A"
2. Fill in Description with "Single-letter program name"
3. Click Create

```gherkin
Scenario: Minimum-length program name is accepted
  Given I am on the program creation form
  When I fill in Program Name with "A"
  And I fill in Description with "Single-letter program name"
  And I click Create
  Then the modal closes
  And the program list shows "A"
```

**Expected result:** The program "A" is created and shown in the list. The acceptance criteria do not define a minimum length other than non-empty.

### TC-010: Program Name with special characters is stored and shown as entered

**Priority:** Medium

**Preconditions:**
- An admin user is logged in
- The program creation form is open
- No program named "C++ & .NET (Cohort #1)" already exists

**Steps:**
1. Fill in Program Name with "C++ & .NET (Cohort #1)"
2. Fill in Description with "Systems programming with C++ and .NET"
3. Click Create

```gherkin
Scenario: Special characters in Program Name are preserved
  Given I am on the program creation form
  When I fill in Program Name with "C++ & .NET (Cohort #1)"
  And I fill in Description with "Systems programming with C++ and .NET"
  And I click Create
  Then the modal closes
  And the program list shows "C++ & .NET (Cohort #1)"
```

**Expected result:** The list shows "C++ & .NET (Cohort #1)" exactly, including "+", "&", ".", "(", ")", and "#".

### TC-011: Leading and trailing spaces in Program Name are trimmed before save

**Priority:** Medium

**Preconditions:**
- An admin user is logged in
- The program creation form is open
- No program named "Cybersecurity 2026" already exists

**Steps:**
1. Fill in Program Name with "  Cybersecurity 2026  "
2. Fill in Description with "Defensive security program"
3. Click Create

```gherkin
Scenario: Surrounding spaces are trimmed from Program Name
  Given I am on the program creation form
  When I fill in Program Name with "  Cybersecurity 2026  "
  And I fill in Description with "Defensive security program"
  And I click Create
  Then the modal closes
  And the program list shows "Cybersecurity 2026"
  And the program list does not show "  Cybersecurity 2026  "
```

**Expected result:** The saved name is "Cybersecurity 2026" without the leading or trailing spaces. Trimming is not specified in the acceptance criteria.

### TC-012: A 255-character Program Name is accepted

**Priority:** Medium

**Preconditions:**
- An admin user is logged in
- The program creation form is open
- Program Name will be set to 255 characters: "Web Development 2026 " repeated until the value is exactly 255 characters

**Steps:**
1. Fill in Program Name with a 255-character value beginning with "Web Development 2026"
2. Fill in Description with "Boundary length name"
3. Click Create

```gherkin
Scenario: Program Name at 255 characters is accepted
  Given I am on the program creation form
  When I fill in Program Name with a 255-character value that starts with "Web Development 2026"
  And I fill in Description with "Boundary length name"
  And I click Create
  Then the modal closes
  And the program list shows the full 255-character Program Name
```

**Expected result:** The program is created and the full 255-character Program Name is visible in the list. 255 is a candidate limit only; the acceptance criteria do not state a maximum.

### TC-013: A 256-character Program Name is rejected

**Priority:** Medium

**Preconditions:**
- An admin user is logged in
- The program creation form is open

**Steps:**
1. Fill in Program Name with a 256-character value beginning with "Web Development 2026"
2. Fill in Description with "Over max length name"
3. Attempt to click Create

```gherkin
Scenario: Program Name over 255 characters is rejected
  Given I am on the program creation form
  When I fill in Program Name with a 256-character value that starts with "Web Development 2026"
  And I fill in Description with "Over max length name"
  Then the Create button is disabled
  Or I see a validation message that Program Name exceeds the maximum length
  And the program list does not show that 256-character name
```

**Expected result:** The program is not created. The user is blocked by a disabled Create button or a max-length validation message. The exact limit is a gap in the acceptance criteria.

### TC-014: A Program Name that differs only by letter case is treated as a duplicate

**Priority:** Medium

**Preconditions:**
- An admin user is logged in
- A program named "Web Development 2026" already exists
- The program creation form is open

**Steps:**
1. Fill in Program Name with "web development 2026"
2. Fill in Description with "Case-variant duplicate"
3. Click Create

```gherkin
Scenario: Program names are unique regardless of letter case
  Given a program named "Web Development 2026" already exists
  And I am on the program creation form
  When I fill in Program Name with "web development 2026"
  And I fill in Description with "Case-variant duplicate"
  And I click Create
  Then the modal stays open
  And the program list still shows only one program named "Web Development 2026"
```

**Expected result:** "web development 2026" is not added as a second program. Case sensitivity of uniqueness is not defined in the acceptance criteria.

### TC-015: Markup entered in Program Name is shown as text

**Priority:** High

**Preconditions:**
- An admin user is logged in
- The program creation form is open

**Steps:**
1. Fill in Program Name with `<script>alert("xss")</script>`
2. Fill in Description with "Markup should be plain text"
3. Click Create

```gherkin
Scenario: Markup in Program Name is not executed
  Given I am on the program creation form
  When I fill in Program Name with "<script>alert(\"xss\")</script>"
  And I fill in Description with "Markup should be plain text"
  And I click Create
  Then the modal closes
  And the program list shows the text "<script>alert(\"xss\")</script>"
  And no script runs
```

**Expected result:** The name is displayed as literal text. No alert or script executes.

### TC-016: A long Description is saved with the program

**Priority:** Low

**Preconditions:**
- An admin user is logged in
- The program creation form is open
- No program named "Cloud Engineering 2026" already exists

**Steps:**
1. Fill in Program Name with "Cloud Engineering 2026"
2. Fill in Description with a 1000-character description that starts with "Full-stack web development program"
3. Click Create
4. Open the saved program

```gherkin
Scenario: A long Description is preserved
  Given I am on the program creation form
  When I fill in Program Name with "Cloud Engineering 2026"
  And I fill in Description with a 1000-character value that starts with "Full-stack web development program"
  And I click Create
  Then the modal closes
  And the program list shows "Cloud Engineering 2026"
  And the saved Description is the full 1000-character value
```

**Expected result:** "Cloud Engineering 2026" is created and its Description keeps all 1000 characters. No maximum length for Description is stated in the acceptance criteria.

## Ambiguities and gaps in the acceptance criteria

1. **Description required or optional.** Only an empty Program Name disables Create. It is not stated whether an empty Description is valid. TC-003 assumes it is optional.
2. **Whitespace.** It is not stated whether a Program Name of only spaces is empty, or whether leading and trailing spaces are trimmed. TC-006 and TC-011 assume trim-and-reject.
3. **Length limits.** No minimum or maximum is given for Program Name or Description. TC-009 uses 1 character. TC-012 and TC-013 use 255 and 256 as a candidate boundary that still needs a product decision.
4. **Uniqueness.** Duplicate names, including names that differ only by case, are not mentioned. TC-007 and TC-014 assume names must be unique and case-insensitive.
5. **Who can create.** The happy path is admin-only. It is not stated what a non-admin or a logged-out user sees on the Programs page. TC-008 assumes non-admins cannot open the form.
6. **Modal behavior.** Success closes the modal. There is no acceptance criterion for Cancel, clicking outside the modal, or the Escape key, and no statement of whether entered values are discarded.
7. **Validation feedback.** Empty Program Name disables Create, but no error message, inline hint, or required-field marker is specified.
8. **After create.** The list must show "Web Development 2026". Sort order, a success message, and whether Description is visible in the list are not specified.
9. **Special characters and markup.** Allowed characters and how HTML or script text is rendered are not specified. TC-010 and TC-015 assume the value is stored and shown as plain text.
10. **Edit and delete.** The criteria cover creation only. They do not say whether a created program can be renamed to a duplicate or cleared back to an empty name.

# Test Plan: Program list filtering and display

**Feature:** Program list filtering and display
**Primary actor:** User on the Programs page
**Entry point:** Navigate to the Programs page
**Fields shown:** Name, Description
**Sample programs:**
- Name "Web Development 2026", Description "Full-stack web development program"
- Name "Informatique & IA - Niveau 2", Description "Programme d'informatique et d'intelligence artificielle, niveau 2"
- Name "Test Program", Description "Temporary program used for deletion checks"

## Positive flows

### TC-001: The Programs page lists each program's Name and Description

**Priority:** High

**Preconditions:**
- "Web Development 2026" exists with Description "Full-stack web development program"
- "Test Program" exists with Description "Temporary program used for deletion checks"
- The user can open the Programs page

**Steps:**
1. Navigate to the Programs page
2. Read the row for "Web Development 2026"
3. Read the row for "Test Program"

```gherkin
Scenario: Display program list with key details
  Given a program "Web Development 2026" exists with Description "Full-stack web development program"
  And a program "Test Program" exists with Description "Temporary program used for deletion checks"
  When I navigate to the Programs page
  Then I see a list showing "Web Development 2026" and "Full-stack web development program"
  And I see a list showing "Test Program" and "Temporary program used for deletion checks"
```

**Expected result:** Both programs are visible. Each row shows that program's Name and its own Description.

### TC-002: An empty Programs page shows a no-programs message and a create prompt

**Priority:** High

**Preconditions:**
- No programs exist
- The user can open the Programs page

**Steps:**
1. Navigate to the Programs page
2. Read the empty-state message
3. Look for the prompt to create the first program

```gherkin
Scenario: Empty state when no programs exist
  Given no programs exist
  When I navigate to the Programs page
  Then I see a message indicating no programs have been created
  And I see a prompt to create the first program
  And I do not see a program row
```

**Expected result:** The page states that no programs have been created and offers a way to create the first one. No program row is shown. The acceptance criteria do not give the exact message text or the prompt label. The create action elsewhere on this product is "+ New Program".

### TC-003: A single program is shown with its Name and Description

**Priority:** High

**Preconditions:**
- The only program is "Web Development 2026" with Description "Full-stack web development program"
- The user can open the Programs page

**Steps:**
1. Navigate to the Programs page
2. Count the program rows
3. Read the Name and Description on that row

```gherkin
Scenario: One existing program is listed with its name and description
  Given the only program is "Web Development 2026" with Description "Full-stack web development program"
  When I navigate to the Programs page
  Then I see one program row
  And that row shows "Web Development 2026"
  And that row shows "Full-stack web development program"
  And I do not see a message indicating no programs have been created
```

**Expected result:** The list shows one row for "Web Development 2026" and "Full-stack web development program". The empty-state message is not shown.

### TC-004: Creating the first program replaces the empty state with that program

**Priority:** Medium

**Preconditions:**
- No programs exist
- The user is an admin on the Programs page
- The empty state and the create prompt are visible

**Steps:**
1. Use the prompt to create the first program
2. Enter Name "Web Development 2026"
3. Enter Description "Full-stack web development program"
4. Save the program
5. Return to the Programs page

```gherkin
Scenario: The first created program replaces the empty state
  Given no programs exist
  And I am on the Programs page
  When I use the create prompt
  And I enter Name "Web Development 2026"
  And I enter Description "Full-stack web development program"
  And I save the program
  And I navigate to the Programs page
  Then I see "Web Development 2026" and "Full-stack web development program"
  And I do not see a message indicating no programs have been created
```

**Expected result:** The list shows "Web Development 2026" and "Full-stack web development program". The empty-state message is gone.

## Negative flows

### TC-005: Programs that exist are not hidden behind the empty state

**Priority:** High

**Preconditions:**
- "Web Development 2026" exists with Description "Full-stack web development program"
- The user can open the Programs page

**Steps:**
1. Navigate to the Programs page
2. Look for the empty-state message
3. Look for "Web Development 2026"

```gherkin
Scenario: The empty state is hidden when a program exists
  Given a program "Web Development 2026" exists with Description "Full-stack web development program"
  When I navigate to the Programs page
  Then I see "Web Development 2026" and "Full-stack web development program"
  And I do not see a message indicating no programs have been created
  And I do not see a prompt to create the first program
```

**Expected result:** The list is shown. The no-programs message and the first-program prompt are not shown.

### TC-006: The empty state does not invent a program row

**Priority:** High

**Preconditions:**
- No programs exist
- The user can open the Programs page

**Steps:**
1. Navigate to the Programs page
2. Look for "Web Development 2026", "Test Program", and "Informatique & IA - Niveau 2"

```gherkin
Scenario: The empty state does not show sample programs
  Given no programs exist
  When I navigate to the Programs page
  Then I see a message indicating no programs have been created
  And I do not see "Web Development 2026"
  And I do not see "Test Program"
  And I do not see "Informatique & IA - Niveau 2"
```

**Expected result:** The page shows the empty state only. No sample or leftover program name is listed.

### TC-007: One program's Description is not shown on another program

**Priority:** High

**Preconditions:**
- "Web Development 2026" exists with Description "Full-stack web development program"
- "Test Program" exists with Description "Temporary program used for deletion checks"
- The user can open the Programs page

**Steps:**
1. Navigate to the Programs page
2. Read the Description on the "Web Development 2026" row
3. Read the Description on the "Test Program" row

```gherkin
Scenario: Each row keeps its own description
  Given a program "Web Development 2026" exists with Description "Full-stack web development program"
  And a program "Test Program" exists with Description "Temporary program used for deletion checks"
  When I navigate to the Programs page
  Then the "Web Development 2026" row shows "Full-stack web development program"
  And the "Web Development 2026" row does not show "Temporary program used for deletion checks"
  And the "Test Program" row shows "Temporary program used for deletion checks"
  And the "Test Program" row does not show "Full-stack web development program"
```

**Expected result:** Descriptions stay on the correct rows.

### TC-008: A deleted program is absent from the list

**Priority:** High

**Preconditions:**
- "Test Program" has been deleted
- "Web Development 2026" still exists with Description "Full-stack web development program"
- The user can open the Programs page

**Steps:**
1. Navigate to the Programs page
2. Look for "Test Program"
3. Look for "Web Development 2026"

```gherkin
Scenario: A deleted program is not displayed
  Given "Test Program" has been deleted
  And a program "Web Development 2026" exists with Description "Full-stack web development program"
  When I navigate to the Programs page
  Then I do not see "Test Program"
  And I see "Web Development 2026" and "Full-stack web development program"
  And I do not see a message indicating no programs have been created
```

**Expected result:** Only "Web Development 2026" is listed. The page is not in the empty state.

### TC-009: Markup in Name or Description is shown as text

**Priority:** High

**Preconditions:**
- A program exists with Name `<script>alert("xss")</script>` and Description `<img src=x onerror=alert(1)>`
- The user can open the Programs page

**Steps:**
1. Navigate to the Programs page
2. Read the Name and Description on that row

```gherkin
Scenario: Markup in the program list is not executed
  Given a program named "<script>alert(\"xss\")</script>" exists with Description "<img src=x onerror=alert(1)>"
  When I navigate to the Programs page
  Then I see the text "<script>alert(\"xss\")</script>"
  And I see the text "<img src=x onerror=alert(1)>"
  And no script runs
```

**Expected result:** Name and Description are literal text. No alert or script runs.

### TC-010: The list does not drop a program when no filter is specified

**Priority:** High

**Preconditions:**
- "Web Development 2026", "Test Program", and "Informatique & IA - Niveau 2" all exist with the Descriptions above
- The user can open the Programs page

**Steps:**
1. Navigate to the Programs page
2. Do not type in a search box and do not choose a filter
3. Look for all three programs

```gherkin
Scenario: All programs are visible when no filter is applied
  Given "Web Development 2026", "Test Program", and "Informatique & IA - Niveau 2" exist
  When I navigate to the Programs page
  And I do not apply a filter
  Then I see "Web Development 2026" and "Full-stack web development program"
  And I see "Test Program" and "Temporary program used for deletion checks"
  And I see "Informatique & IA - Niveau 2" and "Programme d'informatique et d'intelligence artificielle, niveau 2"
```

**Expected result:** Every existing program is listed with its Name and Description. The feature name includes filtering, but the acceptance criteria do not define a filter. This case checks that nothing is hidden by default.

## Edge cases

### TC-011: Special characters in Name and Description are shown as stored

**Priority:** High

**Preconditions:**
- "Informatique & IA - Niveau 2" exists with Description "Programme d'informatique et d'intelligence artificielle, niveau 2"
- The user can open the Programs page

**Steps:**
1. Navigate to the Programs page
2. Read the Name and Description for that program

```gherkin
Scenario: Special characters are preserved in the program list
  Given a program "Informatique & IA - Niveau 2" exists with Description "Programme d'informatique et d'intelligence artificielle, niveau 2"
  When I navigate to the Programs page
  Then I see "Informatique & IA - Niveau 2"
  And I see "Programme d'informatique et d'intelligence artificielle, niveau 2"
```

**Expected result:** The list shows "&", "-", "é", and "'" exactly. The name is not rewritten as "Informatique et IA Niveau 2".

### TC-012: A program with an empty Description is still listed

**Priority:** Medium

**Preconditions:**
- "Data Analytics 2026" exists with an empty Description
- "Web Development 2026" exists with Description "Full-stack web development program"
- The user can open the Programs page

**Steps:**
1. Navigate to the Programs page
2. Read the "Data Analytics 2026" row
3. Read the "Web Development 2026" row

```gherkin
Scenario: An empty Description does not hide the program
  Given a program "Data Analytics 2026" exists with an empty Description
  And a program "Web Development 2026" exists with Description "Full-stack web development program"
  When I navigate to the Programs page
  Then I see "Data Analytics 2026"
  And the Description for "Data Analytics 2026" is empty
  And I see "Web Development 2026" and "Full-stack web development program"
  And I do not see a message indicating no programs have been created
```

**Expected result:** "Data Analytics 2026" is listed with a blank Description. The page is not treated as empty.

### TC-013: A one-character Name is shown in full

**Priority:** Medium

**Preconditions:**
- A program named "A" exists with Description "Single-letter program name"
- The user can open the Programs page

**Steps:**
1. Navigate to the Programs page
2. Read the row for "A"

```gherkin
Scenario: A one-character program name is displayed
  Given a program "A" exists with Description "Single-letter program name"
  When I navigate to the Programs page
  Then I see "A"
  And I see "Single-letter program name"
```

**Expected result:** The row shows Name "A" and Description "Single-letter program name".

### TC-014: A 255-character Name and a 1000-character Description remain available

**Priority:** Medium

**Preconditions:**
- A program exists whose Name is 255 characters and starts with "Web Development 2026"
- That program's Description is 1000 characters and starts with "Full-stack web development program"
- The user can open the Programs page

**Steps:**
1. Navigate to the Programs page
2. Read the Name on that row
3. Read the Description on that row

```gherkin
Scenario: A long Name and Description are not dropped from the list
  Given a program exists whose Name is 255 characters and starts with "Web Development 2026"
  And that program's Description is 1000 characters and starts with "Full-stack web development program"
  When I navigate to the Programs page
  Then I see a row for that program
  And the row shows the Name beginning with "Web Development 2026"
  And the row shows the Description beginning with "Full-stack web development program"
  And the full Name and full Description can be read
```

**Expected result:** The program is listed. The full 255-character Name and 1000-character Description can be read, either on the row or by expanding the row. Truncation rules are not specified in the acceptance criteria.

### TC-015: Two programs with the same Name are both listed with their own Descriptions

**Priority:** Medium

**Preconditions:**
- Two programs are both named "Test Program"
- The first has Description "Morning cohort"
- The second has Description "Evening cohort"
- The user can open the Programs page

**Steps:**
1. Navigate to the Programs page
2. Count rows named "Test Program"
3. Read each Description

```gherkin
Scenario: Duplicate names are both displayed
  Given two programs named "Test Program" exist
  And one has Description "Morning cohort"
  And the other has Description "Evening cohort"
  When I navigate to the Programs page
  Then I see two rows named "Test Program"
  And one row shows "Morning cohort"
  And the other row shows "Evening cohort"
```

**Expected result:** Both rows are visible, each with its own Description. Duplicate names are not allowed by the validation ticket; this case covers the list if two rows still exist.

### TC-016: Surrounding spaces in a stored Name are shown as stored

**Priority:** Low

**Preconditions:**
- A program exists with Name "  Test Program  " and Description "Padded name"
- A program named "Test Program" exists with Description "Temporary program used for deletion checks"
- The user can open the Programs page

**Steps:**
1. Navigate to the Programs page
2. Compare the two Names

```gherkin
Scenario: A padded Name is not displayed as the trimmed Name
  Given a program named "  Test Program  " exists with Description "Padded name"
  And a program named "Test Program" exists with Description "Temporary program used for deletion checks"
  When I navigate to the Programs page
  Then I see "  Test Program  " with Description "Padded name"
  And I see "Test Program" with Description "Temporary program used for deletion checks"
```

**Expected result:** The two rows stay distinct. The list does not trim "  Test Program  " into "Test Program". Display trimming is not specified in the acceptance criteria.

### TC-017: A whitespace-only Description is shown as blank

**Priority:** Low

**Preconditions:**
- "Cloud Engineering 2026" exists with Description "   "
- The user can open the Programs page

**Steps:**
1. Navigate to the Programs page
2. Read the Description for "Cloud Engineering 2026"

```gherkin
Scenario: A whitespace-only Description is not shown as program text
  Given a program "Cloud Engineering 2026" exists with Description "   "
  When I navigate to the Programs page
  Then I see "Cloud Engineering 2026"
  And the Description for "Cloud Engineering 2026" is blank
  And the Description does not show the words "no programs have been created"
```

**Expected result:** "Cloud Engineering 2026" is listed. Its Description does not look like the empty-state message. Whether spaces are trimmed before display is not specified.

### TC-018: Every program remains listed when the list is longer than one screen

**Priority:** Medium

**Preconditions:**
- 25 programs exist, including "Web Development 2026" and "Test Program"
- Each program has its own Description
- The user can open the Programs page

**Steps:**
1. Navigate to the Programs page
2. Scroll through the list, or move through every page if the list is paged
3. Look for "Web Development 2026" and "Test Program"

```gherkin
Scenario: A long program list still shows every name and description
  Given 25 programs exist, including "Web Development 2026" and "Test Program"
  When I navigate to the Programs page
  And I move through the entire list
  Then I see "Web Development 2026" and "Full-stack web development program"
  And I see "Test Program" and "Temporary program used for deletion checks"
  And I see all 25 programs
```

**Expected result:** All 25 programs can be reached, each with Name and Description. Pagination and sort order are not specified in the acceptance criteria.

## Ambiguities and gaps in the acceptance criteria

1. **Filtering.** The feature name is "Program list filtering and display". The scenarios only cover display and the empty state. There is no filter field, no search text, and no rule for a filter that matches nothing. TC-010 only checks that the unfiltered list shows every program.
2. **Empty-state copy.** The message must indicate that no programs have been created. The exact sentence is not given.
3. **Create prompt.** A prompt to create the first program is required. The label is not given. Other program tickets use "+ New Program". It is also not stated whether that prompt is hidden once a program exists. TC-005 assumes it is hidden.
4. **Who sees the list.** The criteria do not say whether a non-admin sees Name and Description, or whether the create prompt is admin-only.
5. **Empty Description.** The list must show each Description. They do not say what to show when Description is empty or only spaces. TC-012 and TC-017 expect the Name to remain and the Description to be blank.
6. **Long values.** No maximum is given, and truncation is not mentioned. TC-014 expects a 255-character Name and a 1000-character Description to stay readable.
7. **Duplicate names.** The criteria say "each program". They do not say how two rows named "Test Program" are distinguished. TC-015 expects both rows, separated by Description.
8. **Order.** Sort order is not specified. These cases check presence, not position.
9. **Paging.** A long list has no acceptance criterion. TC-018 expects every program to remain reachable.
10. **Removed programs.** The criteria do not say that a deleted program disappears. TC-008 expects "Test Program" to be absent after deletion while other programs stay.
11. **Markup.** Rendering of HTML or script text in Name and Description is not specified. TC-009 expects plain text and no script execution.
12. **Whitespace display.** It is not stated whether the list trims Name or Description. TC-016 expects a stored padded Name to stay distinct from the trimmed Name.

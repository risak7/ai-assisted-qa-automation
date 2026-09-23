# Test Plan: Program name validation and duplicate prevention

**Feature:** Program name validation and duplicate prevention
**Primary actor:** Admin
**Entry point:** Programs page → "+ New Program" → program creation form
**Field under test:** Program Name
**Other known field:** Description

## Positive flows

### TC-001: Program Name "Informatique & IA - Niveau 2" is created

**Priority:** High

**Preconditions:**
- The user is on the program creation form
- No program named "Informatique & IA - Niveau 2" already exists

**Steps:**
1. Enter "Informatique & IA - Niveau 2" in Program Name
2. Fill in Description with "Programme d'informatique et d'intelligence artificielle, niveau 2"
3. Click Create

```gherkin
Scenario: Accept program name with special characters
  Given I am on the program creation form
  When I enter "Informatique & IA - Niveau 2" as the program name
  And I fill in Description with "Programme d'informatique et d'intelligence artificielle, niveau 2"
  And I click Create
  Then the program is created successfully
  And the program list shows "Informatique & IA - Niveau 2"
```

**Expected result:** The program is created. The list shows "Informatique & IA - Niveau 2" with "&" and "-" preserved.

### TC-002: A name with surrounding spaces is saved in trimmed form

**Priority:** High

**Preconditions:**
- The user is on the program creation form
- No program named "Informatique & IA - Niveau 2" already exists

**Steps:**
1. Enter "  Informatique & IA - Niveau 2  " in Program Name
2. Fill in Description with "Programme d'informatique et d'intelligence artificielle, niveau 2"
3. Click Create
4. Check the program list

```gherkin
Scenario: Leading and trailing spaces are trimmed from a valid program name
  Given I am on the program creation form
  When I enter "  Informatique & IA - Niveau 2  " as the program name
  And I fill in Description with "Programme d'informatique et d'intelligence artificielle, niveau 2"
  And I click Create
  Then the program is created successfully
  And the program list shows "Informatique & IA - Niveau 2"
  And the program list does not show "  Informatique & IA - Niveau 2  "
```

**Expected result:** The stored Program Name is "Informatique & IA - Niveau 2" without the leading or trailing spaces. The acceptance criteria say the name is trimmed; they only spell out the whitespace-only outcome.

### TC-003: A different Program Name is created when Description matches an existing program

**Priority:** Medium

**Preconditions:**
- A program "Web Development 2026" exists with Description "Full-stack web development program"
- The user is on the program creation form

**Steps:**
1. Enter "Data Analytics 2026" in Program Name
2. Fill in Description with "Full-stack web development program"
3. Click Create

```gherkin
Scenario: Duplicate Description does not block a unique Program Name
  Given a program "Web Development 2026" already exists with Description "Full-stack web development program"
  And I am on the program creation form
  When I enter "Data Analytics 2026" as the program name
  And I fill in Description with "Full-stack web development program"
  And I click Create
  Then the program is created successfully
  And the program list shows "Data Analytics 2026"
  And the program list still shows "Web Development 2026"
```

**Expected result:** "Data Analytics 2026" is created. Uniqueness applies to Program Name, not Description.

## Negative flows

### TC-004: A Program Name of three spaces is not submitted

**Priority:** High

**Preconditions:**
- The user is on the program creation form
- The program list does not contain a blank name

**Steps:**
1. Enter "   " in Program Name
2. Fill in Description with "Full-stack web development program"
3. Click Create
4. Check the program list

```gherkin
Scenario: Reject program name with only whitespace
  Given I am on the program creation form
  When I enter "   " as the program name
  And I fill in Description with "Full-stack web development program"
  And I click Create
  Then the form is not submitted
  And the program list does not show a blank program name
```

**Expected result:** The name is trimmed, treated as empty, and the form is not submitted. No new program appears in the list.

### TC-005: An empty Program Name is not submitted

**Priority:** High

**Preconditions:**
- The user is on the program creation form

**Steps:**
1. Leave Program Name empty
2. Fill in Description with "Full-stack web development program"
3. Click Create

```gherkin
Scenario: Empty program name is not submitted
  Given I am on the program creation form
  When I leave the program name empty
  And I fill in Description with "Full-stack web development program"
  And I click Create
  Then the form is not submitted
  And the program list is unchanged
```

**Expected result:** No program is created. An empty name is treated the same as a trimmed whitespace name. The acceptance criteria state this only for "   ".

### TC-006: Creating "Web Development 2026" again shows a duplicate-name error

**Priority:** High

**Preconditions:**
- A program "Web Development 2026" already exists with Description "Full-stack web development program"
- The user is on the program creation form

**Steps:**
1. Enter "Web Development 2026" in Program Name
2. Fill in Description with "Another full-stack cohort"
3. Click Create
4. Check the program list

```gherkin
Scenario: Reject duplicate program name
  Given a program "Web Development 2026" already exists
  And I am on the program creation form
  When I enter "Web Development 2026" as the program name
  And I fill in Description with "Another full-stack cohort"
  And I click Create
  Then I see an error indicating the name already exists
  And the form is not submitted
  And the program list still shows only one "Web Development 2026"
```

**Expected result:** The new program is not created. An error states that "Web Development 2026" already exists. The original program and its Description "Full-stack web development program" stay unchanged.

### TC-007: A name that matches an existing name after trimming is rejected

**Priority:** High

**Preconditions:**
- A program "Web Development 2026" already exists
- The user is on the program creation form

**Steps:**
1. Enter "  Web Development 2026  " in Program Name
2. Fill in Description with "Another full-stack cohort"
3. Click Create

```gherkin
Scenario: Trimmed program name is checked for duplicates
  Given a program "Web Development 2026" already exists
  And I am on the program creation form
  When I enter "  Web Development 2026  " as the program name
  And I fill in Description with "Another full-stack cohort"
  And I click Create
  Then I see an error indicating the name already exists
  And the program list still shows only one "Web Development 2026"
```

**Expected result:** Duplicate detection runs on the trimmed name. A second "Web Development 2026" is not created.

### TC-008: A name that differs only by letter case is rejected

**Priority:** High

**Preconditions:**
- A program "Web Development 2026" already exists
- The user is on the program creation form

**Steps:**
1. Enter "web development 2026" in Program Name
2. Fill in Description with "Case-variant duplicate"
3. Click Create

```gherkin
Scenario: Program names are unique regardless of letter case
  Given a program "Web Development 2026" already exists
  And I am on the program creation form
  When I enter "web development 2026" as the program name
  And I fill in Description with "Case-variant duplicate"
  And I click Create
  Then I see an error indicating the name already exists
  And the program list still shows only one "Web Development 2026"
```

**Expected result:** "web development 2026" is not created. Case sensitivity is not defined in the acceptance criteria; this case expects a case-insensitive check.

### TC-009: A tab-only Program Name is not submitted

**Priority:** Medium

**Preconditions:**
- The user is on the program creation form

**Steps:**
1. Enter a tab character in Program Name
2. Fill in Description with "Full-stack web development program"
3. Click Create

```gherkin
Scenario: A tab-only program name is treated as empty
  Given I am on the program creation form
  When I enter a tab character as the program name
  And I fill in Description with "Full-stack web development program"
  And I click Create
  Then the form is not submitted
  And the program list does not show a blank program name
```

**Expected result:** The tab is trimmed and treated as empty. The form is not submitted. The acceptance criteria only show three regular spaces.

### TC-010: A failed duplicate submit does not change the existing program

**Priority:** High

**Preconditions:**
- "Web Development 2026" exists with Description "Full-stack web development program"
- The user is on the program creation form

**Steps:**
1. Enter "Web Development 2026" in Program Name
2. Fill in Description with "This description must not replace the original"
3. Click Create
4. Open "Web Development 2026"

```gherkin
Scenario: A rejected duplicate leaves the existing program unchanged
  Given a program "Web Development 2026" already exists with Description "Full-stack web development program"
  And I am on the program creation form
  When I enter "Web Development 2026" as the program name
  And I fill in Description with "This description must not replace the original"
  And I click Create
  Then I see an error indicating the name already exists
  And "Web Development 2026" still has Description "Full-stack web development program"
```

**Expected result:** The existing program is not overwritten. Its Description remains "Full-stack web development program".

## Edge cases

### TC-011: A one-character Program Name is accepted

**Priority:** Medium

**Preconditions:**
- The user is on the program creation form
- No program named "A" already exists

**Steps:**
1. Enter "A" in Program Name
2. Fill in Description with "Single-letter program name"
3. Click Create

```gherkin
Scenario: Minimum-length program name is accepted
  Given I am on the program creation form
  When I enter "A" as the program name
  And I fill in Description with "Single-letter program name"
  And I click Create
  Then the program is created successfully
  And the program list shows "A"
```

**Expected result:** "A" is created. No minimum length other than non-empty after trim is defined in the acceptance criteria.

### TC-012: A name of spaces around one character is saved as that character

**Priority:** Medium

**Preconditions:**
- The user is on the program creation form
- No program named "A" already exists

**Steps:**
1. Enter "   A   " in Program Name
2. Fill in Description with "Trimmed single character"
3. Click Create

```gherkin
Scenario: Spaces around a real character are trimmed
  Given I am on the program creation form
  When I enter "   A   " as the program name
  And I fill in Description with "Trimmed single character"
  And I click Create
  Then the program is created successfully
  And the program list shows "A"
```

**Expected result:** The stored name is "A". The form is submitted because the trimmed name is not empty.

### TC-013: A 255-character Program Name is accepted

**Priority:** Medium

**Preconditions:**
- The user is on the program creation form
- Program Name will be a 255-character value starting with "Informatique & IA - Niveau 2"

**Steps:**
1. Enter a 255-character Program Name that starts with "Informatique & IA - Niveau 2"
2. Fill in Description with "Boundary length name"
3. Click Create

```gherkin
Scenario: Program Name at 255 characters is accepted
  Given I am on the program creation form
  When I enter a 255-character program name that starts with "Informatique & IA - Niveau 2"
  And I fill in Description with "Boundary length name"
  And I click Create
  Then the program is created successfully
  And the program list shows the full 255-character name
```

**Expected result:** The program is created and the full 255-character name is shown. 255 is a candidate limit only; the acceptance criteria do not state a maximum.

### TC-014: A 256-character Program Name is not submitted

**Priority:** Medium

**Preconditions:**
- The user is on the program creation form

**Steps:**
1. Enter a 256-character Program Name that starts with "Informatique & IA - Niveau 2"
2. Fill in Description with "Over max length name"
3. Click Create

```gherkin
Scenario: Program Name over 255 characters is rejected
  Given I am on the program creation form
  When I enter a 256-character program name that starts with "Informatique & IA - Niveau 2"
  And I fill in Description with "Over max length name"
  And I click Create
  Then the form is not submitted
  And I see a validation message that Program Name exceeds the maximum length
  And the program list does not show that 256-character name
```

**Expected result:** The program is not created. The user sees a max-length validation message. The exact limit is a gap in the acceptance criteria.

### TC-015: Additional punctuation in Program Name is preserved

**Priority:** Medium

**Preconditions:**
- The user is on the program creation form
- No program named "C++ / .NET (Cohort #1)" already exists

**Steps:**
1. Enter "C++ / .NET (Cohort #1)" in Program Name
2. Fill in Description with "Systems programming with C++ and .NET"
3. Click Create

```gherkin
Scenario: Punctuation beyond ampersand and hyphen is accepted
  Given I am on the program creation form
  When I enter "C++ / .NET (Cohort #1)" as the program name
  And I fill in Description with "Systems programming with C++ and .NET"
  And I click Create
  Then the program is created successfully
  And the program list shows "C++ / .NET (Cohort #1)"
```

**Expected result:** The list shows "C++ / .NET (Cohort #1)" exactly. The acceptance criteria only require "&" and "-" in "Informatique & IA - Niveau 2".

### TC-016: A name that differs by punctuation from an existing name is accepted

**Priority:** Medium

**Preconditions:**
- A program "Web Development 2026" already exists
- The user is on the program creation form

**Steps:**
1. Enter "Web Development 2026!" in Program Name
2. Fill in Description with "Name differs by punctuation"
3. Click Create

```gherkin
Scenario: A punctuation difference is not a duplicate
  Given a program "Web Development 2026" already exists
  And I am on the program creation form
  When I enter "Web Development 2026!" as the program name
  And I fill in Description with "Name differs by punctuation"
  And I click Create
  Then the program is created successfully
  And the program list shows "Web Development 2026"
  And the program list shows "Web Development 2026!"
```

**Expected result:** Both names exist. "Web Development 2026!" is not treated as a duplicate of "Web Development 2026".

### TC-017: Markup in Program Name is stored as text and is not executed

**Priority:** High

**Preconditions:**
- The user is on the program creation form

**Steps:**
1. Enter `<script>alert("xss")</script>` in Program Name
2. Fill in Description with "Markup should be plain text"
3. Click Create

```gherkin
Scenario: Markup in Program Name is not executed
  Given I am on the program creation form
  When I enter "<script>alert(\"xss\")</script>" as the program name
  And I fill in Description with "Markup should be plain text"
  And I click Create
  Then the program is created successfully
  And the program list shows the text "<script>alert(\"xss\")</script>"
  And no script runs
```

**Expected result:** The name is shown as literal text. No alert or script executes. If this string is later disallowed, the form must not submit and no script may run.

### TC-018: Accented characters in Program Name are preserved

**Priority:** Low

**Preconditions:**
- The user is on the program creation form
- No program named "Développement & IA - Niveau 2" already exists

**Steps:**
1. Enter "Développement & IA - Niveau 2" in Program Name
2. Fill in Description with "Programme avec caractères accentués"
3. Click Create

```gherkin
Scenario: Accented characters are preserved in Program Name
  Given I am on the program creation form
  When I enter "Développement & IA - Niveau 2" as the program name
  And I fill in Description with "Programme avec caractères accentués"
  And I click Create
  Then the program is created successfully
  And the program list shows "Développement & IA - Niveau 2"
```

**Expected result:** The list shows "Développement & IA - Niveau 2" with "é" intact. It is not stored as "Developpement & IA - Niveau 2".

## Ambiguities and gaps in the acceptance criteria

1. **Whitespace rejection versus a disabled button.** The user clicks Create, and the form is not submitted. It is not stated whether Create stays enabled, or what message is shown for a trimmed-empty name.
2. **Which characters count as whitespace.** The example is three spaces. Tabs, newlines, and non-breaking spaces are not mentioned. TC-009 assumes a tab is trimmed to empty.
3. **Trim on a valid name.** The note says the name is trimmed. It does not say the saved value drops leading and trailing spaces. TC-002 and TC-012 assume the stored name is the trimmed value.
4. **Other required fields.** The special-character scenario says to fill them, but it does not name them. These cases use Description. It is unclear whether Description is required.
5. **Error copy.** The duplicate scenario requires an error that the name already exists. The exact text, and whether it is inline on Program Name, is not given.
6. **Case sensitivity.** "The same name" is not defined. TC-008 assumes "web development 2026" duplicates "Web Development 2026".
7. **Comparison after trim.** It is not stated that "  Web Development 2026  " is a duplicate. TC-007 assumes the check uses the trimmed name.
8. **Length limits.** No minimum or maximum is given. TC-011 uses 1 character. TC-013 and TC-014 use 255 and 256 as a candidate boundary that still needs a product decision.
9. **Internal spaces.** Collapsing repeated spaces inside a name, such as "Web  Development  2026", is not specified.
10. **Edit path.** The scenarios are on the creation form. Renaming a program onto an existing name is not covered.
11. **Failed submit state.** It is not stated that the modal stays open, that entered values remain, or that the existing program is left unchanged. TC-006 and TC-010 assume that.
12. **Allowed characters.** Only "Informatique & IA - Niveau 2" is required to succeed. Other punctuation, accents, and markup are not specified. TC-015, TC-017, and TC-018 assume they are stored as plain text.
13. **What is unique.** Only Program Name is mentioned. These cases assume Description may be shared and that a punctuation difference is a different name.

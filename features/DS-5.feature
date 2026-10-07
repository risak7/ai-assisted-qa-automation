Feature: Program list filtering and display
  DS-5 — As an admin, see all programs in a clear list to quickly find and manage them.

  # Happy paths

  @TC-001 @AC-ListDisplay
  Scenario: Display program list with key details
    Given a program "Web Development 2026" exists with Description "Full-stack web development program"
    And a program "Test Program" exists with Description "Temporary program used for deletion checks"
    When I navigate to the Programs page
    Then I see a list showing "Web Development 2026" and "Full-stack web development program"
    And I see a list showing "Test Program" and "Temporary program used for deletion checks"

  @TC-002 @AC-EmptyState
  Scenario: Empty state when no programs exist
    Given no programs exist
    When I navigate to the Programs page
    Then I see a message indicating no programs have been created
    And I see a prompt to create the first program
    And I do not see a program row

  @TC-003
  Scenario: One existing program is listed with its name and description
    Given the only program is "Web Development 2026" with Description "Full-stack web development program"
    When I navigate to the Programs page
    Then I see one program row
    And that row shows "Web Development 2026"
    And that row shows "Full-stack web development program"
    And I do not see a message indicating no programs have been created

  @TC-004
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

  # Negative

  @TC-005
  Scenario: The empty state is hidden when a program exists
    Given a program "Web Development 2026" exists with Description "Full-stack web development program"
    When I navigate to the Programs page
    Then I see "Web Development 2026" and "Full-stack web development program"
    And I do not see a message indicating no programs have been created
    And I do not see a prompt to create the first program

  @TC-006
  Scenario: The empty state does not show sample programs
    Given no programs exist
    When I navigate to the Programs page
    Then I see a message indicating no programs have been created
    And I do not see "Web Development 2026"
    And I do not see "Test Program"
    And I do not see "Informatique & IA - Niveau 2"

  @TC-007
  Scenario: Each row keeps its own description
    Given a program "Web Development 2026" exists with Description "Full-stack web development program"
    And a program "Test Program" exists with Description "Temporary program used for deletion checks"
    When I navigate to the Programs page
    Then the "Web Development 2026" row shows "Full-stack web development program"
    And the "Web Development 2026" row does not show "Temporary program used for deletion checks"
    And the "Test Program" row shows "Temporary program used for deletion checks"
    And the "Test Program" row does not show "Full-stack web development program"

  @TC-008
  Scenario: A deleted program is not displayed
    Given "Test Program" has been deleted
    And a program "Web Development 2026" exists with Description "Full-stack web development program"
    When I navigate to the Programs page
    Then I do not see "Test Program"
    And I see "Web Development 2026" and "Full-stack web development program"
    And I do not see a message indicating no programs have been created

  @TC-009
  Scenario: Markup in the program list is not executed
    Given a program named "<script>alert(\"xss\")</script>" exists with Description "<img src=x onerror=alert(1)>"
    When I navigate to the Programs page
    Then I see the text "<script>alert(\"xss\")</script>"
    And I see the text "<img src=x onerror=alert(1)>"
    And no script runs

  @TC-010
  Scenario: All programs are visible when no filter is applied
    Given "Web Development 2026", "Test Program", and "Informatique & IA - Niveau 2" exist
    When I navigate to the Programs page
    And I do not apply a filter
    Then I see "Web Development 2026" and "Full-stack web development program"
    And I see "Test Program" and "Temporary program used for deletion checks"
    And I see "Informatique & IA - Niveau 2" and "Programme d'informatique et d'intelligence artificielle, niveau 2"

  # Edge cases

  @TC-011
  Scenario: Special characters are preserved in the program list
    Given a program "Informatique & IA - Niveau 2" exists with Description "Programme d'informatique et d'intelligence artificielle, niveau 2"
    When I navigate to the Programs page
    Then I see "Informatique & IA - Niveau 2"
    And I see "Programme d'informatique et d'intelligence artificielle, niveau 2"

  @TC-012
  Scenario: An empty Description does not hide the program
    Given a program "Data Analytics 2026" exists with an empty Description
    And a program "Web Development 2026" exists with Description "Full-stack web development program"
    When I navigate to the Programs page
    Then I see "Data Analytics 2026"
    And the Description for "Data Analytics 2026" is empty
    And I see "Web Development 2026" and "Full-stack web development program"
    And I do not see a message indicating no programs have been created

  @TC-013
  Scenario: A one-character program name is displayed
    Given a program "A" exists with Description "Single-letter program name"
    When I navigate to the Programs page
    Then I see "A"
    And I see "Single-letter program name"

  @TC-014
  Scenario: A long Name and Description are not dropped from the list
    Given a program exists whose Name is 255 characters and starts with "Web Development 2026"
    And that program's Description is 1000 characters and starts with "Full-stack web development program"
    When I navigate to the Programs page
    Then I see a row for that program
    And the row shows the Name beginning with "Web Development 2026"
    And the row shows the Description beginning with "Full-stack web development program"
    And the full Name and full Description can be read

  @TC-015
  Scenario: Duplicate names are both displayed
    Given two programs named "Test Program" exist
    And one has Description "Morning cohort"
    And the other has Description "Evening cohort"
    When I navigate to the Programs page
    Then I see two rows named "Test Program"
    And one row shows "Morning cohort"
    And the other row shows "Evening cohort"

  @TC-016
  Scenario: A padded Name is not displayed as the trimmed Name
    Given a program named "  Test Program  " exists with Description "Padded name"
    And a program named "Test Program" exists with Description "Temporary program used for deletion checks"
    When I navigate to the Programs page
    Then I see "  Test Program  " with Description "Padded name"
    And I see "Test Program" with Description "Temporary program used for deletion checks"

  @TC-017
  Scenario: A whitespace-only Description is not shown as program text
    Given a program "Cloud Engineering 2026" exists with Description "   "
    When I navigate to the Programs page
    Then I see "Cloud Engineering 2026"
    And the Description for "Cloud Engineering 2026" is blank
    And the Description does not show the words "no programs have been created"

  @TC-018
  Scenario: A long program list still shows every name and description
    Given 25 programs exist, including "Web Development 2026" and "Test Program"
    When I navigate to the Programs page
    And I move through the entire list
    Then I see "Web Development 2026" and "Full-stack web development program"
    And I see "Test Program" and "Temporary program used for deletion checks"
    And I see all 25 programs

  # Ambiguities and gaps
  # - Filtering. The feature name is "Program list filtering and display". The scenarios only cover display and the empty state. There is no filter field, no search text, and no rule for a filter that matches nothing. TC-010 only checks that the unfiltered list shows every program.
  # - Empty-state copy. The message must indicate that no programs have been created. The exact sentence is not given.
  # - Create prompt. A prompt to create the first program is required. The label is not given. Other program tickets use "+ New Program". It is also not stated whether that prompt is hidden once a program exists. TC-005 assumes it is hidden.
  # - Who sees the list. The criteria do not say whether a non-admin sees Name and Description, or whether the create prompt is admin-only.
  # - Empty Description. The list must show each Description. They do not say what to show when Description is empty or only spaces. TC-012 and TC-017 expect the Name to remain and the Description to be blank.
  # - Long values. No maximum is given, and truncation is not mentioned. TC-014 expects a 255-character Name and a 1000-character Description to stay readable.
  # - Duplicate names. The criteria say "each program". They do not say how two rows named "Test Program" are distinguished. TC-015 expects both rows, separated by Description.
  # - Order. Sort order is not specified. These cases check presence, not position.
  # - Paging. A long list has no acceptance criterion. TC-018 expects every program to remain reachable.
  # - Removed programs. The criteria do not say that a deleted program disappears. TC-008 expects "Test Program" to be absent after deletion while other programs stay.
  # - Markup. Rendering of HTML or script text in Name and Description is not specified. TC-009 expects plain text and no script execution.
  # - Whitespace display. It is not stated whether the list trims Name or Description. TC-016 expects a stored padded Name to stay distinct from the trimmed Name.

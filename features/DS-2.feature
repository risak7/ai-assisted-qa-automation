Feature: Edit existing program details
  DS-2 — As an admin, edit an existing program's details so program information can be corrected after creation.

  # Happy paths

  @TC-001 @AC-OpenForEditing
  Scenario: Open a program for editing
    Given I am logged in as Admin
    # Observed: sidebar shows "Admin" and "Didaxis Studio"
    And I am on the Programs page
    # Observed: heading "Programs", subtitle "Manage academic programs and semesters", button "+ New Program"
    And a program named "Web Development 2026" exists with Description "Full-stack web development program"
    When I click the Edit button on "Web Development 2026"
    # Observed: pencil icon button, accessible name "Edit {Program Name}"
    Then I see the "Edit Program" dialog
    And the Program Name field shows "Web Development 2026"
    And the Description field shows "Full-stack web development program"
    And I see the buttons "Cancel" and "Save"

  @TC-002 @AC-SuccessfulRename
  Scenario: Successfully edit a program name
    Given I am editing "Web Development 2026" with Description "Full-stack web development program"
    When I change Program Name to "Web Development 2026 - Updated"
    And I click Save
    Then the "Edit Program" dialog closes
    And the program list shows "Web Development 2026 - Updated"
    And that row still shows "Full-stack web development program"
    And the program list does not still show "Web Development 2026" for that row

  @TC-003 @AC-PreserveUnchangedFields
  Scenario: Changing only Description leaves Program Name unchanged
    Given I am editing "Web Development 2026" with Description "Full-stack web development program"
    When I change Description to "Updated full-stack curriculum"
    And I leave Program Name as "Web Development 2026"
    And I click Save
    Then the "Edit Program" dialog closes
    And the program list shows "Web Development 2026"
    And that row shows "Updated full-stack curriculum"
    And that row does not show "Full-stack web development program"

  @TC-004
  Scenario: Update Program Name and Description together
    Given I am editing "Web Development 2026" with Description "Full-stack web development program"
    When I change Program Name to "Web Development 2026 - Updated"
    And I change Description to "Updated full-stack curriculum"
    And I click Save
    Then the "Edit Program" dialog closes
    And the program list shows "Web Development 2026 - Updated"
    And that row shows "Updated full-stack curriculum"

  @TC-005
  Scenario: Clearing Description keeps the Program Name
    Given I am editing "Web Development 2026" with Description "Full-stack web development program"
    When I clear Description
    And I leave Program Name as "Web Development 2026"
    And I click Save
    # Observed: Description is not required; Save stayed enabled after Description was cleared
    Then the "Edit Program" dialog closes
    And the program list shows "Web Development 2026"
    And that row does not show "Full-stack web development program"

  @TC-006
  Scenario: Cancel discards unsaved edits
    Given I am editing "Web Development 2026" with Description "Full-stack web development program"
    When I change Program Name to "Web Development 2026 - Updated"
    And I change Description to "Updated full-stack curriculum"
    And I click Cancel
    # Observed: Cancel closed the dialog and the row kept its previous name and description
    Then the "Edit Program" dialog closes
    And the program list still shows "Web Development 2026"
    And that row still shows "Full-stack web development program"

  # Negative

  @TC-007 @AC-EmptyNameValidation
  Scenario: Empty Program Name cannot be saved
    Given I am editing "Web Development 2026"
    When I clear Program Name
    # Observed: Save became disabled, with no validation message, and aria-invalid stayed false
    Then the Save button is disabled
    And the program list still shows "Web Development 2026"

  @TC-008
  Scenario: Whitespace-only Program Name cannot be saved
    Given I am editing "Web Development 2026"
    When I change Program Name to "   "
    # Observed: Save became disabled
    Then the Save button is disabled
    And the program list does not show a blank program name

  @TC-009
  Scenario: Duplicate Program Name is rejected
    Given a program named "Data Science 2026" already exists
    And I am editing "Web Development 2026"
    When I change Program Name to "Data Science 2026"
    And I click Save
    Then the "Edit Program" dialog stays open
    And I see a validation message that "Data Science 2026" already exists
    And the program list still shows "Web Development 2026"
    And the program list shows only one "Data Science 2026"

  @TC-010
  Scenario: A non-admin cannot edit a program
    Given I am logged in as a non-admin user
    When I navigate to the Programs page
    Then I do not see an Edit button on "Web Development 2026"
    And I cannot open the "Edit Program" dialog

  # Edge cases

  @TC-011
  Scenario: A one-character Program Name is accepted
    Given I am editing "Web Development 2026"
    When I change Program Name to "A"
    # Observed: Save stayed enabled for "A"
    And I click Save
    Then the "Edit Program" dialog closes
    And the program list shows "A"

  @TC-012
  Scenario: Special characters in Program Name are preserved
    Given I am editing "Web Development 2026"
    When I change Program Name to "C++ & .NET (Cohort #1)"
    And I click Save
    Then the "Edit Program" dialog closes
    And the program list shows "C++ & .NET (Cohort #1)"

  @TC-013
  Scenario: Surrounding spaces are trimmed from Program Name
    Given I am editing "Web Development 2026"
    When I change Program Name to "  Cybersecurity 2026  "
    And I click Save
    Then the "Edit Program" dialog closes
    And the program list shows "Cybersecurity 2026"
    And the program list does not show "  Cybersecurity 2026  "

  @TC-014
  Scenario: Program Name at 255 characters is accepted
    Given I am editing "Web Development 2026"
    When I change Program Name to a 255-character value that starts with "Web Development 2026"
    And I click Save
    Then the "Edit Program" dialog closes
    And the program list shows the full 255-character Program Name

  @TC-015
  Scenario: Program Name over 255 characters is rejected
    Given I am editing "Web Development 2026"
    When I change Program Name to a 256-character value that starts with "Web Development 2026"
    Then the Save button is disabled or I see a validation message that Program Name exceeds the maximum length
    And the program list does not show that 256-character name

  @TC-016
  Scenario: Program names stay unique regardless of letter case
    Given a program named "Web Development 2026" already exists
    And I am editing "Data Science 2026"
    When I change Program Name to "web development 2026"
    And I click Save
    Then the "Edit Program" dialog stays open
    And the program list still shows only one program named "Web Development 2026"

  @TC-017
  Scenario: Markup in Program Name is stored as text
    Given I am editing "Web Development 2026"
    When I change Program Name to "<script>alert(\"xss\")</script>"
    And I click Save
    Then the "Edit Program" dialog closes
    And the program list shows the text "<script>alert(\"xss\")</script>"
    And no script runs

  @TC-018
  Scenario: A long Description is preserved
    Given I am editing "Web Development 2026"
    When I change Description to a 1000-character value that starts with "Full-stack web development program"
    And I click Save
    Then the "Edit Program" dialog closes
    And the program list shows "Web Development 2026"
    And the saved Description is the full 1000-character value

  @TC-019
  Scenario: Saving with no changes does not add a second row
    Given I am editing "Web Development 2026" with Description "Full-stack web development program"
    When I click Save without changing Program Name or Description
    Then the "Edit Program" dialog closes
    And the program list still shows one row for "Web Development 2026"
    And that row still shows "Full-stack web development program"

  @TC-020
  Scenario: Description-only edit leaves the other dialog fields unchanged
    Given I am editing "Web Development 2026"
    And Default Session Hours is "4"
    And Default Exam Hours is "3"
    And Sync/Async Ratio is "70% sync / 30% async"
    When I change only Description to "Updated full-stack curriculum"
    And I click Save
    And I open "Web Development 2026" for editing again
    Then Description is "Updated full-stack curriculum"
    And Program Name is "Web Development 2026"
    And Default Session Hours is "4"
    And Default Exam Hours is "3"
    And Sync/Async Ratio is "70% sync / 30% async"

  # Ambiguities and gaps
  # - AC says "edit icon". Live control is a pencil SVG whose accessible name is "Edit {Program Name}". The same row has "Delete {Program Name}".
  # - AC says "edit form". Live UI is a dialog titled "Edit Program" with required "Program Name", optional "Description", "Cancel", "Save", and an unlabeled close icon (SVG, no aria-label).
  # - Dialog also shows "Show AI Generation Config", "Total Program Hours", "Default Session Hours", "Default Exam Hours", "Target Audience", "Focus Areas", and "Sync/Async Ratio". The opened program showed session hours "4", exam hours "3", ratio "70% sync / 30% async", and empty Total Program Hours, Target Audience, and Focus Areas. AC does not say whether 4 / 3 / 70-30 are stored values or form defaults.
  # - Empty and whitespace-only Program Name disabled Save, with no visible error. AC does not define the message or whether surrounding spaces are trimmed on save (TC-013 was not submitted).
  # - Typing an existing name ("Data Science 2026 1793141002170") showed no duplicate error and left Save enabled. Save was not clicked. AC does not define uniqueness or case-insensitivity (TC-009, TC-016).
  # - Program Name and Description have no maxlength. A 256-character name left Save enabled. Save was not clicked. AC states no length limit (TC-014, TC-015, TC-018).
  # - Cancel discarded the edit. Escape and click-outside were not tried.
  # - Save was enabled before any field changed. AC does not say it should be disabled when nothing changed (TC-019).
  # - Double-click Save was not exercised.
  # - Non-admin access was not observed; the signed-in user was Admin (TC-010).
  # - The list has no search. The renamed row updating without a refresh (AC "immediately") was not exercised, because Save was not clicked on a real program.
  # - "Other fields" in the third AC are not named (TC-020).

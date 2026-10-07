Feature: Edit existing program details
  DS-2 — As an admin, edit an existing program's details to correct or update program information after creation.

  # Happy paths

  @TC-001 @AC-OpenForEdit
  Scenario: Open program for editing
    Given I am on the Programs page
    And a program "Web Development 2026" exists with Description "Full-stack web development program"
    When I click the Edit button on "Web Development 2026"
    Then I see the "Edit Program" dialog
    And the Program Name field shows "Web Development 2026"
    And the Description field shows "Full-stack web development program"

  @TC-002 @AC-EditName
  Scenario: Successfully edit a program name
    Given I am editing "Web Development 2026"
    When I change the Program Name to "Web Development 2026 - Updated"
    And I click Save
    Then the Edit Program dialog closes
    And the program list immediately shows "Web Development 2026 - Updated"
    And the program list does not show "Web Development 2026"

  @TC-003 @AC-PreserveFields
  Scenario: Edit preserves unchanged fields
    Given I am editing a program named "Web Development 2026" with Description "Full-stack web development program"
    When I only change the Description to "Evening cohort for full-stack web development"
    And I click Save
    Then the Edit Program dialog closes
    And the program list shows "Web Development 2026"
    And the saved Description is "Evening cohort for full-stack web development"
    And the Program Name remains "Web Development 2026"

  @TC-004
  Scenario: Save with no edits keeps the current data
    Given I am editing "Web Development 2026" with Description "Full-stack web development program"
    When I do not change Program Name or Description
    And I click Save
    Then the Edit Program dialog closes
    And the program list shows "Web Development 2026"
    And the saved Description is still "Full-stack web development program"

  # Negative

  @TC-005
  Scenario: Empty Program Name is rejected on edit
    Given I am editing "Web Development 2026"
    When I clear the Program Name field
    And I leave Description as "Full-stack web development program"
    Then the Save button is disabled
    And no validation message is shown
    And the program list still shows "Web Development 2026"

  @TC-006
  Scenario: Whitespace-only Program Name is rejected on edit
    Given I am editing "Web Development 2026"
    When I change the Program Name to "   "
    And I leave Description as "Full-stack web development program"
    Then the Save button is disabled
    And the program list still shows "Web Development 2026"
    And the program list does not show a blank name

  @TC-007
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

  @TC-008
  Scenario: Unsaved edits are discarded
    Given I am editing "Web Development 2026"
    When I change the Program Name to "Web Development 2026 - Updated"
    And I click Cancel
    Then the Edit Program dialog closes
    And the program list shows "Web Development 2026"
    And the program list does not show "Web Development 2026 - Updated"
    And reopening the edit form shows Program Name "Web Development 2026"

  @TC-009
  Scenario: Non-admin cannot edit a program
    Given I am logged in as a non-admin user
    And a program "Web Development 2026" exists
    When I am on the Programs page
    Then I do not see the Edit button on "Web Development 2026"
    And I cannot change Program Name or Description

  @TC-010
  Scenario: Edit updates the existing program
    Given I am editing "Web Development 2026"
    And the program list contains one "Web Development 2026"
    When I change the Program Name to "Web Development 2026 - Updated"
    And I click Save
    Then the program list contains one "Web Development 2026 - Updated"
    And the program list does not contain "Web Development 2026"
    And no additional program row is added

  # Edge cases

  @TC-011
  Scenario: Minimum-length Program Name is accepted on edit
    Given I am editing "Web Development 2026"
    When I change the Program Name to a one-character value
    And I click Save
    Then Save is enabled
    And the Edit Program dialog closes
    And the program list immediately shows that one-character Program Name
    And the saved Description is still "Full-stack web development program"

  @TC-012
  Scenario: Special characters in Program Name are preserved on edit
    Given I am editing "Web Development 2026"
    When I change the Program Name to "C++ & .NET (Cohort #1)"
    And I click Save
    Then the Edit Program dialog closes
    And the program list immediately shows "C++ & .NET (Cohort #1)"

  @TC-013
  Scenario: Surrounding spaces are trimmed from Program Name on edit
    Given I am editing "Web Development 2026"
    When I change the Program Name to "  Cybersecurity 2026  "
    And I click Save
    Then the Edit Program dialog closes
    And the program list shows "Cybersecurity 2026"
    And the program list does not show "  Cybersecurity 2026  "

  @TC-014
  Scenario: Program Name at 255 characters is accepted on edit
    Given I am editing "Web Development 2026"
    When I change the Program Name to a 255-character value that starts with "Web Development 2026 - Updated"
    And I click Save
    Then the Edit Program dialog closes
    And the program list immediately shows the full 255-character Program Name

  @TC-015
  Scenario: Program Name over 255 characters is accepted on edit
    Given I am editing "Web Development 2026"
    When I change the Program Name to a 256-character value that starts with "Web Development 2026 - Updated"
    Then the Program Name field contains all 256 characters
    And the Save button is enabled
    And I click Save
    And the Edit Program dialog closes
    And the program list shows the 256-character Program Name
    And the program list no longer shows "Web Development 2026"

  @TC-016
  Scenario: A case-variant Program Name is stored as entered
    Given a program named "Data Analytics 2026" already exists
    And I am editing "Web Development 2026"
    When I change the Program Name to "data analytics 2026"
    And I click Save
    Then the Edit Program dialog closes
    And the program list still shows "Data Analytics 2026"
    And the program list shows "data analytics 2026"
    And the program list does not show "Web Development 2026"

  @TC-017
  Scenario: Markup in Program Name is not executed on edit
    Given I am editing "Web Development 2026"
    When I change the Program Name to "<script>alert(\"xss\")</script>"
    And I click Save
    Then the Edit Program dialog closes
    And the program list shows the text "<script>alert(\"xss\")</script>"
    And no script runs

  @TC-018
  Scenario: Clearing Description does not change Program Name
    Given I am editing "Web Development 2026" with Description "Full-stack web development program"
    When I clear the Description
    And I click Save
    Then the Edit Program dialog closes
    And the program list shows "Web Development 2026"
    And the saved Description is empty
    And the Program Name remains "Web Development 2026"

  @TC-019
  Scenario: A long Description is preserved and Program Name is unchanged
    Given I am editing "Web Development 2026"
    When I only change the Description to a 1000-character value that starts with "Full-stack web development program"
    And I click Save
    Then the Edit Program dialog closes
    And the program list shows "Web Development 2026"
    And the Program column shows the start of that Description
    And the saved Description is the full 1000-character value

  @TC-020
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

  @TC-021
  Scenario: A Description edit does not change the hour fields
    Given I am editing a program whose Default Session Hours is "4" and Default Exam Hours is "3"
    When I only change the Description
    And I click Save
    Then the Program Name is unchanged
    And the new Description is saved
    And Default Session Hours is still "4"
    And Default Exam Hours is still "3"
    And Total Program Hours is still empty

  # Ambiguities and gaps
  # - Field label. The ticket says "Name". The dialog label is Program Name, and the textbox accessible name is "Program Name". The asterisk is visual; it is not part of the accessible name.
  # - Other fields. The criteria say "other fields" without naming them. The dialog also has Total Program Hours, Default Session Hours, Default Exam Hours, Target Audience, Focus Areas, and Sync/Async Ratio. TC-020 and TC-021 cover those.
  # - Empty Program Name. Confirmed on the page: Save is disabled, and no validation message is shown.
  # - Whitespace-only Program Name. Confirmed on the page: three spaces also disable Save.
  # - Empty Description. Description is not required. TC-018 treats a cleared Description as allowed.
  # - Uniqueness. The app saves a rename onto an existing Program Name, including a name that differs only by case. TC-007 and TC-016 record that behavior. The original row with the target name is not overwritten.
  # - Length limits. Program Name has no `maxlength`. A 256-character value stays in the field and Save stays enabled. TC-014 and TC-015 record that both lengths are saved. No product maximum was found on the control.
  # - Discard path. Cancel closes the dialog. A header close control is also present and has no accessible name, so TC-008 uses Cancel.
  # - Who can edit. Explored while signed in as admin. TC-009 still assumes a non-admin does not get the Edit button. That account was not available in this session.
  # - List layout. The new name must show immediately. The description is in the same Program cell, clamped to one line. Sort order and a success message are not specified.
  # - Edit versus create. TC-010 checks that a unique rename updates the row in place. A duplicate rename (TC-007) removes the old name and adds the new name beside the program that already had it.
  # - Page size. The Programs table currently renders thousands of rows with no search or pagination. Tests need unique names and must scroll the row into view before clicking Edit.

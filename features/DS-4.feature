Feature: Delete program with confirmation
  DS-4 — As an admin, delete a program with a confirmation step to prevent accidental deletion.

  # Happy paths

  @TC-001
  Scenario: Delete icon opens a confirmation dialog and does not remove the program yet
    Given a program "Test Program" exists
    And a program "Web Development 2026" exists
    When I click the delete icon for "Test Program"
    Then I see a confirmation dialog
    And the program list still shows "Test Program"
    And the program list still shows "Web Development 2026"

  @TC-002 @AC-DeleteConfirm
  Scenario: Delete program with confirmation
    Given a program "Test Program" exists
    When I click the delete icon for "Test Program"
    Then I see a confirmation dialog
    When I confirm deletion
    Then "Test Program" is removed from the program list

  @TC-003 @AC-CancelDelete
  Scenario: Cancel program deletion
    Given I click the delete icon for "Test Program"
    When I see the confirmation dialog
    And I click Cancel
    Then the confirmation dialog closes
    And "Test Program" still exists in the list
    And the Description of "Test Program" is still "Temporary program used for deletion checks"

  @TC-004
  Scenario: Only the confirmed program is removed
    Given a program "Test Program" exists
    And a program "Web Development 2026" exists with Description "Full-stack web development program"
    When I click the delete icon for "Test Program"
    And I confirm deletion
    Then "Test Program" is removed from the program list
    And the program list still shows "Web Development 2026"
    And the Description of "Web Development 2026" is still "Full-stack web development program"

  # Negative

  @TC-005
  Scenario: Deletion waits for confirmation
    Given a program "Test Program" exists
    When I click the delete icon for "Test Program"
    And I do not confirm deletion
    Then I see a confirmation dialog
    And "Test Program" still exists in the list

  @TC-006
  Scenario: Dismissing the dialog does not delete the program
    Given I click the delete icon for "Test Program"
    When I see the confirmation dialog
    And I press Escape
    Then "Test Program" still exists in the list
    When I click the delete icon for "Test Program"
    And I click outside the confirmation dialog
    Then "Test Program" still exists in the list

  @TC-007
  Scenario: Non-admin cannot delete a program
    Given I am logged in as a non-admin user
    And a program "Test Program" exists
    When I am on the Programs page
    Then I do not see the delete icon for "Test Program"
    And "Test Program" still exists in the list

  @TC-008
  Scenario: Cancel leaves every program in the list
    Given a program "Test Program" exists
    And a program "Web Development 2026" exists
    When I click the delete icon for "Web Development 2026"
    And I see the confirmation dialog
    And I click Cancel
    Then "Web Development 2026" still exists in the list
    And "Test Program" still exists in the list

  @TC-009
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

  # Edge cases

  @TC-010
  Scenario: A program name with special characters is deleted exactly
    Given a program "Informatique & IA - Niveau 2" exists
    And a program "Test Program" exists
    When I click the delete icon for "Informatique & IA - Niveau 2"
    Then I see a confirmation dialog that shows "Informatique & IA - Niveau 2"
    When I confirm deletion
    Then "Informatique & IA - Niveau 2" is removed from the program list
    And "Test Program" still exists in the list

  @TC-011
  Scenario: Cancel preserves a program name with special characters
    Given a program "Informatique & IA - Niveau 2" exists
    When I click the delete icon for "Informatique & IA - Niveau 2"
    And I see the confirmation dialog
    And I click Cancel
    Then the program list shows "Informatique & IA - Niveau 2"

  @TC-012
  Scenario: A one-character program name is removed after confirmation
    Given a program "A" exists
    And a program "Test Program" exists
    When I click the delete icon for "A"
    Then I see a confirmation dialog that shows "A"
    When I confirm deletion
    Then "A" is removed from the program list
    And "Test Program" still exists in the list

  @TC-013
  Scenario: A max-length program name is deleted after confirmation
    Given a program exists whose Name is 255 characters and starts with "Test Program"
    And a program "Web Development 2026" exists
    When I click the delete icon for that 255-character program
    Then I see a confirmation dialog that shows the full 255-character Name
    When I confirm deletion
    Then that 255-character Name is removed from the program list
    And "Web Development 2026" still exists in the list

  @TC-014
  Scenario: The last program can be deleted
    Given the program list contains only "Test Program"
    When I click the delete icon for "Test Program"
    And I confirm deletion
    Then "Test Program" is removed from the program list
    And the program list shows no programs

  @TC-015
  Scenario: Confirmation deletes only the selected duplicate
    Given two programs named "Test Program" exist
    And one has Description "Morning cohort"
    And the other has Description "Evening cohort"
    When I click the delete icon for the "Test Program" with Description "Evening cohort"
    And I confirm deletion
    Then one "Test Program" remains in the list
    And the remaining program has Description "Morning cohort"
    And no program with Description "Evening cohort" remains

  @TC-016
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

  @TC-017
  Scenario: A cancelled deletion can be confirmed later
    Given a program "Test Program" exists
    When I click the delete icon for "Test Program"
    And I click Cancel
    Then "Test Program" still exists in the list
    When I click the delete icon for "Test Program"
    And I confirm deletion
    Then "Test Program" is removed from the program list

  @TC-018
  Scenario: The dialog deletes the padded name that was selected
    Given a program named "  Test Program  " exists
    And a program named "Test Program" exists
    When I click the delete icon for "  Test Program  "
    Then I see a confirmation dialog that shows "  Test Program  "
    When I confirm deletion
    Then "  Test Program  " is removed from the program list
    And "Test Program" still exists in the list

  # Ambiguities and gaps
  # - Confirm control. The scenario says "I confirm deletion" and does not name the button. It is not stated whether the label is Delete, Confirm, or Yes.
  # - Dialog content. A dialog must appear. It is not stated whether the dialog includes "Test Program", the Description, or a warning about related records.
  # - Dismiss paths. Cancel is specified. Escape, the close icon, and clicking outside the dialog are not. TC-006 assumes those paths keep the program.
  # - Who can delete. The criteria do not say whether a non-admin sees the delete icon. TC-007 assumes non-admins cannot delete.
  # - Scope of deletion. The list must drop "Test Program". Cascade behavior for cohorts, students, or other records linked to that program is not specified.
  # - Failure. There is no acceptance criterion for a delete that fails. It is unclear whether the program stays in the list and what error is shown.
  # - Empty list. Deleting the last program is not described. TC-014 expects an empty list and no blank row.
  # - Duplicate names. The criteria assume one "Test Program". They do not say which row is removed if two share that name. TC-015 expects only the selected row to be removed.
  # - Special characters and markup. The sample name is "Test Program". Names such as "Informatique & IA - Niveau 2" and script text are not covered. TC-010 and TC-016 expect the exact stored text in the dialog and no script execution.
  # - Length. No maximum is given for the name shown in the dialog. TC-012 uses a 255-character name, matching the candidate limit from the other program tickets.
  # - Refresh. Removal is required in the list. It is not stated whether that update is immediate or whether a success message appears. TC-009 checks that the result is still true after refresh.
  # - Undo. The criteria do not offer an undo after confirm. These cases treat a confirmed delete as final.

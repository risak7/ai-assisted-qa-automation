Feature: Julia CLONE - Delete program with confirmation
  DS-268 — As an admin, delete a program that is no longer needed, with a confirmation step so the delete is not accidental.

  # Live UI recon was skipped. DIDAXIS_EMAIL and DIDAXIS_PASSWORD are unset and there is no .env file.
  # Control names below are the ticket's words, plus names already recorded in pages/ProgramsPage.ts
  # and tests/helpers/didaxis-programs.ts. They were not re-checked on https://test.didaxis.studio this run.
  # Recorded, not re-verified: Programs heading "Programs"; row button "Delete <name>";
  # native confirmation "Delete program "<name>"? All its semesters and courses will be removed. This cannot be undone.";
  # dismissing that dialog is Cancel; accepting it confirms deletion.

  # Happy paths

  @TC-001 @AC-DeleteConfirm
  Scenario: Delete program with confirmation
    Given I am logged in as admin
    And a program "Test Program" exists
    When I click the delete icon for "Test Program"
    Then I see a confirmation dialog
    And the dialog names "Test Program"
    When I confirm deletion
    Then "Test Program" is removed from the program list

  @TC-002 @AC-CancelDelete
  Scenario: Cancel program deletion
    Given I am logged in as admin
    And a program "Test Program" exists
    When I click the delete icon for "Test Program"
    And I see the confirmation dialog
    And I click Cancel
    Then the confirmation dialog closes
    And "Test Program" still exists in the list

  @TC-003
  Scenario: Only the confirmed program is removed
    Given I am logged in as admin
    And a program "Test Program" exists
    And a program "Web Development 2026" exists with Description "Full-stack web development program"
    When I click the delete icon for "Test Program"
    And I confirm deletion
    Then "Test Program" is removed from the program list
    And the program list still shows "Web Development 2026"
    And the Description of "Web Development 2026" is still "Full-stack web development program"

  # Negative

  @TC-004
  Scenario: Opening the confirmation does not delete the program
    Given I am logged in as admin
    And a program "Test Program" exists
    When I click the delete icon for "Test Program"
    And I do not confirm deletion
    Then I see a confirmation dialog
    And "Test Program" still exists in the list

  @TC-005
  Scenario: Cancelling does not remove a second program
    Given I am logged in as admin
    And a program "Test Program" exists
    And a program "Web Development 2026" exists
    When I click the delete icon for "Web Development 2026"
    And I click Cancel
    Then "Web Development 2026" still exists in the list
    And "Test Program" still exists in the list

  @TC-006
  Scenario: A confirmed delete does not remove a different program
    Given I am logged in as admin
    And a program "Test Program" exists
    And a program "Web Development 2026" exists
    When I click the delete icon for "Test Program"
    And I confirm deletion
    Then "Test Program" is removed from the program list
    And the program list still shows "Web Development 2026"
    When I refresh the Programs page
    Then the program list does not show "Test Program"
    And the program list still shows "Web Development 2026"

  # Edge cases

  @TC-007
  Scenario: A program name with special characters is deleted exactly
    Given I am logged in as admin
    And a program "Informatique & IA - Niveau 2" exists
    And a program "Test Program" exists
    When I click the delete icon for "Informatique & IA - Niveau 2"
    Then I see a confirmation dialog that shows "Informatique & IA - Niveau 2"
    When I confirm deletion
    Then "Informatique & IA - Niveau 2" is removed from the program list
    And "Test Program" still exists in the list

  @TC-008
  Scenario: Cancel preserves a program name with special characters
    Given I am logged in as admin
    And a program "Informatique & IA - Niveau 2" exists
    When I click the delete icon for "Informatique & IA - Niveau 2"
    And I click Cancel
    Then the program list shows "Informatique & IA - Niveau 2"

  @TC-009
  Scenario: A one-character program name is removed after confirmation
    Given I am logged in as admin
    And a program "A" exists
    And a program "Test Program" exists
    When I click the delete icon for "A"
    Then I see a confirmation dialog that shows "A"
    When I confirm deletion
    Then "A" is removed from the program list
    And "Test Program" still exists in the list

  @TC-010
  Scenario: The last remaining program can be deleted
    Given I am logged in as admin
    And the program list contains only "Test Program"
    When I click the delete icon for "Test Program"
    And I confirm deletion
    Then "Test Program" is removed from the program list
    And the program list shows no program rows

  @TC-011
  Scenario: Markup in the program name is shown as text in the confirmation
    Given I am logged in as admin
    And a program named "<script>alert(\"xss\")</script>" exists
    And a program "Test Program" exists
    When I click the delete icon for "<script>alert(\"xss\")</script>"
    Then I see a confirmation dialog that shows the text "<script>alert(\"xss\")</script>"
    And no script runs
    When I confirm deletion
    Then "<script>alert(\"xss\")</script>" is removed from the program list
    And "Test Program" still exists in the list

  @TC-012
  Scenario: A cancelled deletion can be confirmed later
    Given I am logged in as admin
    And a program "Test Program" exists
    When I click the delete icon for "Test Program"
    And I click Cancel
    Then "Test Program" still exists in the list
    When I click the delete icon for "Test Program"
    And I confirm deletion
    Then "Test Program" is removed from the program list

  # Programs API reactions
  # Exact error sentences were not read on the live page. Live recon was skipped.
  # Where the app has no recorded sentence for a status, the page must stay up and must not crash.

  @TC-013 @edge
  Scenario: Saving a program fails when the service is unavailable
    Given I am logged in as admin
    And a program "Test Program" exists
    And I am editing "Test Program"
    When saving that program fails because the service is unavailable
    Then the Programs page does not crash
    And the Programs heading is still shown
    And "Test Program" still exists in the list

  @TC-014 @edge
  Scenario: An empty program catalog shows the empty state
    Given I am logged in as admin
    And the program catalog returns no programs
    When I navigate to the Programs page
    Then I see the recorded empty-state text "No programs yet. Create your first program to get started."
    And I do not see a program row for "Test Program"

  @TC-015 @edge
  Scenario: A malformed program catalog does not crash the page
    Given I am logged in as admin
    And the program catalog returns a payload that is not a program list
    When I navigate to the Programs page
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-016 @edge
  Scenario: Saving a program fails when the program is not found
    Given I am logged in as admin
    And a program "Test Program" exists
    And I am editing "Test Program"
    When saving that program fails because the program is not found
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-017 @edge
  Scenario: The program list stays up when the catalog request is unauthorized
    Given I am logged in as admin
    When the program catalog request is unauthorized
    And I navigate to the Programs page
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-018 @edge
  Scenario: Saving a program fails when the save is forbidden
    Given I am logged in as admin
    And a program "Test Program" exists
    And I am editing "Test Program"
    When saving that program is forbidden
    Then the Programs page does not crash
    And the Programs heading is still shown
    And "Test Program" still exists in the list

  @TC-019 @edge
  Scenario: Saving a program fails when the save is rejected as a bad request
    Given I am logged in as admin
    And a program "Test Program" exists
    And I am editing "Test Program"
    When saving that program is rejected as a bad request
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-020 @edge
  Scenario: Saving a program fails when the server errors
    Given I am logged in as admin
    And a program "Test Program" exists
    And I am editing "Test Program"
    When saving that program fails with a server error
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-021 @edge
  Scenario: Saving a program fails when the save is not implemented
    Given I am logged in as admin
    And a program "Test Program" exists
    And I am editing "Test Program"
    When saving that program fails because it is not implemented
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-022 @edge
  Scenario: The program list stays up when the catalog gateway fails
    Given I am logged in as admin
    When the program catalog gateway fails
    And I navigate to the Programs page
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-023 @edge
  Scenario: The program list stays up when the catalog request times out at the gateway
    Given I am logged in as admin
    When the program catalog request times out at the gateway
    And I navigate to the Programs page
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-024 @edge
  Scenario: A multiple-choices catalog response does not crash the page
    Given I am logged in as admin
    When the program catalog responds with multiple choices
    And I navigate to the Programs page
    Then the Programs page does not crash
    And the Programs heading is still shown

  # Ambiguities and gaps
  # - Live recon skipped this run, so dialog copy, the delete control name, and empty-state copy were not re-read on the live app.
  # - Confirm control. The scenario says "I confirm deletion" and does not name the button. Recorded behavior is a native confirm dialog, not a labeled Delete button inside a page dialog.
  # - Cancel. The AC says click Cancel. Recorded behavior dismisses the native dialog. Escape and clicking outside a page dialog are not specified.
  # - Dialog content. The AC requires a confirmation dialog. It does not require the program name or a warning about semesters and courses. The recorded message includes both.
  # - Who can delete. The story says an admin. It does not say whether a non-admin sees the delete icon.
  # - Failure. There is no acceptance criterion for a delete that the server rejects.
  # - Empty list. Deleting the last program is not described. TC-010 expects no program rows. The exact empty-state sentence is the recorded Programs page string and was not re-verified.
  # - Duplicate names. The AC assumes one "Test Program". It does not say which row is removed if two share that name.
  # - Length, markup, and special characters are not in the AC. TC-007, TC-009, and TC-011 cover them as edges.
  # - API reactions (TC-013 through TC-024) describe the page staying up. Exact error copy was not on screen during this run because recon was skipped. Do not invent an error sentence.

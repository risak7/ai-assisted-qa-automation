Feature: [Raya + Create new academic program]
  DS-270 — As an admin, create a new academic program so curriculum design can start. Cloned from DS-1.

  # Live UI recon was skipped. DIDAXIS_EMAIL and DIDAXIS_PASSWORD are unset and there is no .env file.
  # Control names below are the ticket's words, plus names already recorded in pages/NewProgramModal.ts
  # and pages/ProgramsPage.ts. They were not re-checked on https://test.didaxis.studio this run.
  # Recorded, not re-verified: button "+ New Program" (also "Create Program"); dialog "New Program";
  # fields "Program Name" and "Description"; button "Create".

  # Happy paths

  @TC-001 @AC-NavigateToForm
  Scenario: Navigate to program creation form
    Given I am logged in as admin
    When I navigate to the Programs page
    And I click "+ New Program"
    Then I see the program creation form
    And the form contains the field "Program Name"
    And the form contains the field "Description"

  @TC-002 @AC-SuccessfulCreate
  Scenario: Successfully create a program
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026"

  @TC-003
  Scenario: Create a program without a description
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "Data Analytics 2026"
    And I leave Description empty
    And I click Create
    Then the modal closes
    And the program list shows "Data Analytics 2026"

  # Negative

  @TC-004 @AC-EmptyNameValidation
  Scenario: Validation prevents empty program name
    Given I am logged in as admin
    And I am on the program creation form
    When I leave the Program Name field empty
    And I leave Description empty
    Then the Create button is disabled
    And the program list does not show a new program

  @TC-005
  Scenario: Description alone does not allow program creation
    Given I am logged in as admin
    And I am on the program creation form
    When I leave the Program Name field empty
    And I fill in Description with "Full-stack web development program"
    Then the Create button is disabled
    And the program list does not show a new program

  @TC-006
  Scenario: Whitespace-only program name does not create a program
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "   "
    And I fill in Description with "Full-stack web development program"
    Then the form is not submitted
    And the program list does not show a blank program name

  # Edge cases

  @TC-007
  Scenario: Special characters in Program Name are preserved
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "C++ & .NET (Cohort #1)"
    And I fill in Description with "Systems programming with C++ and .NET"
    And I click Create
    Then the modal closes
    And the program list shows "C++ & .NET (Cohort #1)"

  @TC-008
  Scenario: A one-character Program Name can be created
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "A"
    And I fill in Description with "Single-letter program name"
    And I click Create
    Then the modal closes
    And the program list shows that program name

  @TC-009
  Scenario: Markup in Program Name is stored as text
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in Program Name with "<script>alert(\"xss\")</script>"
    And I fill in Description with "Markup should be plain text"
    And I click Create
    Then the modal closes
    And the program list shows the text "<script>alert(\"xss\")</script>"
    And no script runs

  # Programs API reactions
  # Exact error sentences were not read on the live page. Live recon was skipped.
  # Where the app has no recorded sentence for a status, the page must stay up and must not crash.
  # Creating a program is the behavior under test in the happy paths, so those cases are not mocked.
  # The reactions below are for a later save of a program that was created for real, or for loading the list.

  @TC-010 @edge
  Scenario: Saving a program fails when the service is unavailable
    Given I am logged in as admin
    And a program "Web Development 2026" exists
    And I am editing "Web Development 2026"
    When saving that program fails because the service is unavailable
    Then the Programs page does not crash
    And the Programs heading is still shown
    And "Web Development 2026" still exists in the list

  @TC-011 @edge
  Scenario: An empty program catalog shows the empty state
    Given I am logged in as admin
    And the program catalog returns no programs
    When I navigate to the Programs page
    Then I see the recorded empty-state text "No programs yet. Create your first program to get started."
    And I do not see a program row for "Web Development 2026"

  @TC-012 @edge
  Scenario: A malformed program catalog does not crash the page
    Given I am logged in as admin
    And the program catalog returns a payload that is not a program list
    When I navigate to the Programs page
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-013 @edge
  Scenario: Saving a program fails when the program is not found
    Given I am logged in as admin
    And a program "Web Development 2026" exists
    And I am editing "Web Development 2026"
    When saving that program fails because the program is not found
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-014 @edge
  Scenario: The program list stays up when the catalog request is unauthorized
    Given I am logged in as admin
    When the program catalog request is unauthorized
    And I navigate to the Programs page
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-015 @edge
  Scenario: Saving a program fails when the save is forbidden
    Given I am logged in as admin
    And a program "Web Development 2026" exists
    And I am editing "Web Development 2026"
    When saving that program is forbidden
    Then the Programs page does not crash
    And the Programs heading is still shown
    And "Web Development 2026" still exists in the list

  @TC-016 @edge
  Scenario: Saving a program fails when the save is rejected as a bad request
    Given I am logged in as admin
    And a program "Web Development 2026" exists
    And I am editing "Web Development 2026"
    When saving that program is rejected as a bad request
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-017 @edge
  Scenario: Saving a program fails when the server errors
    Given I am logged in as admin
    And a program "Web Development 2026" exists
    And I am editing "Web Development 2026"
    When saving that program fails with a server error
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-018 @edge
  Scenario: Saving a program fails when the save is not implemented
    Given I am logged in as admin
    And a program "Web Development 2026" exists
    And I am editing "Web Development 2026"
    When saving that program fails because it is not implemented
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-019 @edge
  Scenario: The program list stays up when the catalog gateway fails
    Given I am logged in as admin
    When the program catalog gateway fails
    And I navigate to the Programs page
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-020 @edge
  Scenario: The program list stays up when the catalog request times out at the gateway
    Given I am logged in as admin
    When the program catalog request times out at the gateway
    And I navigate to the Programs page
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-021 @edge
  Scenario: A multiple-choices catalog response does not crash the page
    Given I am logged in as admin
    When the program catalog responds with multiple choices
    And I navigate to the Programs page
    Then the Programs page does not crash
    And the Programs heading is still shown

  # Ambiguities and gaps
  # - Live recon skipped this run. The Create button's disabled state, the modal title, and empty-state copy were not re-read on the live app.
  # - Description required or optional. The AC only disables Create for an empty Program Name. TC-003 assumes Description is optional.
  # - Whitespace-only names. The AC does not say whether "   " disables Create or is trimmed. TC-006 only requires that no blank program is created.
  # - Duplicate names, case, length limits, and trimming are not in this ticket. DS-271 covers duplicate and whitespace rejection.
  # - Non-admin access is not specified.
  # - Cancel, Escape, and discard-on-close are not specified.
  # - API reactions (TC-010 through TC-021) describe the page staying up. Exact error copy was not read because recon was skipped. Do not invent an error sentence.
  # - The recorded empty-state sentence "No programs yet. Create your first program to get started." was not re-verified.

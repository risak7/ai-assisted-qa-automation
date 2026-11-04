Feature: [Raya + Program name validation and duplicate prevention]
  DS-271 — As an admin, prevent invalid or duplicate program names so data integrity is maintained. Cloned from DS-3.

  # Live UI recon was skipped. DIDAXIS_EMAIL and DIDAXIS_PASSWORD are unset and there is no .env file.
  # Control names below are the ticket's words, plus names already recorded in pages/NewProgramModal.ts
  # and pages/ProgramsPage.ts. They were not re-checked on https://test.didaxis.studio this run.
  # Recorded, not re-verified: dialog "New Program"; fields "Program Name" and "Description"; button "Create";
  # duplicate copy matched by /already exists/i on ProgramsPage.duplicateNameMessage.

  # Happy paths

  @TC-001 @AC-SpecialChars
  Scenario: Accept program name with special characters
    Given I am logged in as admin
    And I am on the program creation form
    When I enter "Informatique & IA - Niveau 2" as the program name
    And I fill in Description with "Programme d'informatique et d'intelligence artificielle, niveau 2"
    And I click Create
    Then the program is created successfully
    And the program list shows "Informatique & IA - Niveau 2"

  @TC-002
  Scenario: A different Program Name is accepted when the Description matches an existing program
    Given I am logged in as admin
    And a program "Web Development 2026" already exists with Description "Full-stack web development program"
    And I am on the program creation form
    When I enter "Data Analytics 2026" as the program name
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the program is created successfully
    And the program list shows "Data Analytics 2026"
    And the program list still shows "Web Development 2026"

  # Negative

  @TC-003 @AC-Whitespace
  Scenario: Reject program name with only whitespace
    Given I am logged in as admin
    And I am on the program creation form
    When I enter "   " as the program name
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the form is not submitted
    And the program list does not show a blank program name

  @TC-004
  Scenario: Empty program name is not submitted
    Given I am logged in as admin
    And I am on the program creation form
    When I leave the program name empty
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the form is not submitted
    And the program list is unchanged

  @TC-005 @AC-Duplicate
  Scenario: Reject duplicate program name
    Given I am logged in as admin
    And a program "Web Development 2026" already exists
    And I am on the program creation form
    When I enter "Web Development 2026" as the program name
    And I fill in Description with "Another full-stack cohort"
    And I click Create
    Then I see an error indicating the name already exists
    And the form is not submitted
    And the program list still shows only one "Web Development 2026"

  @TC-006
  Scenario: A rejected duplicate leaves the existing Description unchanged
    Given I am logged in as admin
    And a program "Web Development 2026" already exists with Description "Full-stack web development program"
    And I am on the program creation form
    When I enter "Web Development 2026" as the program name
    And I fill in Description with "This description must not replace the original"
    And I click Create
    Then I see an error indicating the name already exists
    And "Web Development 2026" still has Description "Full-stack web development program"

  # Edge cases

  @TC-007
  Scenario: A one-character program name is accepted
    Given I am logged in as admin
    And I am on the program creation form
    When I enter "A" as the program name
    And I fill in Description with "Single-letter program name"
    And I click Create
    Then the program is created successfully
    And the program list shows that program name

  @TC-008
  Scenario: A punctuation difference is not treated as the same name
    Given I am logged in as admin
    And a program "Web Development 2026" already exists
    And I am on the program creation form
    When I enter "Web Development 2026!" as the program name
    And I fill in Description with "Name differs by punctuation"
    And I click Create
    Then the program is created successfully
    And the program list shows "Web Development 2026"
    And the program list shows "Web Development 2026!"

  @TC-009
  Scenario: Markup in Program Name is stored as text
    Given I am logged in as admin
    And I am on the program creation form
    When I enter "<script>alert(\"xss\")</script>" as the program name
    And I fill in Description with "Markup should be plain text"
    And I click Create
    Then the program is created successfully
    And the program list shows the text "<script>alert(\"xss\")</script>"
    And no script runs

  # Programs API reactions
  # Exact error sentences were not read on the live page. Live recon was skipped.
  # Where the app has no recorded sentence for a status, the page must stay up and must not crash.
  # Duplicate rejection is asserted on the real create call. These reactions do not mock that call.

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
  # - Live recon skipped this run. The duplicate error sentence, whether Create stays enabled for a whitespace name, and empty-state copy were not re-read on the live app.
  # - Whitespace. The AC says the name is trimmed and treated as empty, and the form is not submitted. It does not say whether Create is disabled or what message is shown.
  # - Duplicate copy. The AC requires an error indicating the name already exists. The exact sentence is not given. The page object matches /already exists/i. That pattern was not re-verified.
  # - Case sensitivity and trim-before-duplicate are not specified. These scenarios do not assume "web development 2026" duplicates "Web Development 2026".
  # - Length limits are not specified.
  # - The edit path is not in the acceptance criteria. Duplicate checks here are on create.
  # - API reactions (TC-010 through TC-021) describe the page staying up. Exact error copy was not read because recon was skipped. Do not invent an error sentence.
  # - The recorded empty-state sentence "No programs yet. Create your first program to get started." was not re-verified.

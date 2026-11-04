Feature: Julia CLONE - Program list filtering and display
  DS-269 — As an admin, see all programs in a clear list so they can be found and managed.

  # Live UI recon was skipped. DIDAXIS_EMAIL and DIDAXIS_PASSWORD are unset and there is no .env file.
  # Control names below are the ticket's words, plus names already recorded in pages/ProgramsPage.ts.
  # They were not re-checked on https://test.didaxis.studio this run.
  # Recorded, not re-verified: heading "Programs"; empty-state text
  # "No programs yet. Create your first program to get started.";
  # each row shows the program name and description; a search box with role searchbox exists.
  # The acceptance criteria do not define filter text, a no-match result, or sort order.

  # Happy paths

  @TC-001 @AC-ListDisplay
  Scenario: Display program list with key details
    Given I am logged in as admin
    And a program "Web Development 2026" exists with Description "Full-stack web development program"
    And a program "Test Program" exists with Description "Temporary program used for deletion checks"
    When I navigate to the Programs page
    Then I see a list showing "Web Development 2026" and "Full-stack web development program"
    And I see a list showing "Test Program" and "Temporary program used for deletion checks"

  @TC-002 @AC-EmptyState
  Scenario: Empty state when no programs exist
    Given I am logged in as admin
    And no programs exist
    When I navigate to the Programs page
    Then I see the recorded empty-state text "No programs yet. Create your first program to get started."
    And I see a prompt to create the first program
    And I do not see a program row

  @TC-003
  Scenario: One program is listed with its name and description
    Given I am logged in as admin
    And a program "Web Development 2026" exists with Description "Full-stack web development program"
    When I navigate to the Programs page
    Then the "Web Development 2026" row shows "Web Development 2026"
    And the "Web Development 2026" row shows "Full-stack web development program"
    And I do not see the empty-state text "No programs yet. Create your first program to get started."

  # Negative

  @TC-004
  Scenario: The empty state is hidden when a program exists
    Given I am logged in as admin
    And a program "Web Development 2026" exists with Description "Full-stack web development program"
    When I navigate to the Programs page
    Then I see "Web Development 2026" and "Full-stack web development program"
    And I do not see the empty-state text "No programs yet. Create your first program to get started."

  @TC-005
  Scenario: The empty state does not invent sample programs
    Given I am logged in as admin
    And no programs exist
    When I navigate to the Programs page
    Then I see the recorded empty-state text "No programs yet. Create your first program to get started."
    And I do not see "Web Development 2026"
    And I do not see "Test Program"

  @TC-006
  Scenario: Each row keeps its own description
    Given I am logged in as admin
    And a program "Web Development 2026" exists with Description "Full-stack web development program"
    And a program "Test Program" exists with Description "Temporary program used for deletion checks"
    When I navigate to the Programs page
    Then the "Web Development 2026" row shows "Full-stack web development program"
    And the "Web Development 2026" row does not show "Temporary program used for deletion checks"
    And the "Test Program" row shows "Temporary program used for deletion checks"

  @TC-007
  Scenario: A removed program is not displayed
    Given I am logged in as admin
    And "Test Program" has been deleted
    And a program "Web Development 2026" exists with Description "Full-stack web development program"
    When I navigate to the Programs page
    Then I do not see "Test Program"
    And I see "Web Development 2026" and "Full-stack web development program"

  # Edge cases

  @TC-008
  Scenario: Special characters are preserved in the program list
    Given I am logged in as admin
    And a program "Informatique & IA - Niveau 2" exists with Description "Programme d'informatique et d'intelligence artificielle, niveau 2"
    When I navigate to the Programs page
    Then I see "Informatique & IA - Niveau 2"
    And I see "Programme d'informatique et d'intelligence artificielle, niveau 2"

  @TC-009
  Scenario: An empty Description does not hide the program name
    Given I am logged in as admin
    And a program "Data Analytics 2026" exists with an empty Description
    And a program "Web Development 2026" exists with Description "Full-stack web development program"
    When I navigate to the Programs page
    Then I see "Data Analytics 2026"
    And the Description shown for "Data Analytics 2026" is empty
    And I see "Web Development 2026" and "Full-stack web development program"

  @TC-010
  Scenario: Markup in the program list is shown as text
    Given I am logged in as admin
    And a program named "<script>alert(\"xss\")</script>" exists with Description "<img src=x onerror=alert(1)>"
    When I navigate to the Programs page
    Then I see the text "<script>alert(\"xss\")</script>"
    And I see the text "<img src=x onerror=alert(1)>"
    And no script runs

  @TC-011
  Scenario: A one-character program name is displayed
    Given I am logged in as admin
    And a program "A" exists with Description "Single-letter program name"
    When I navigate to the Programs page
    Then I see that program name
    And I see "Single-letter program name"

  # Programs API reactions
  # Exact error sentences were not read on the live page. Live recon was skipped.
  # Where the app has no recorded sentence for a status, the page must stay up and must not crash.

  @TC-012 @edge
  Scenario: Saving a program fails when the service is unavailable
    Given I am logged in as admin
    And a program "Test Program" exists
    And I am editing "Test Program"
    When saving that program fails because the service is unavailable
    Then the Programs page does not crash
    And the Programs heading is still shown
    And "Test Program" still exists in the list

  @TC-013 @edge
  Scenario: An empty program catalog shows the empty state
    Given I am logged in as admin
    And the program catalog returns no programs
    When I navigate to the Programs page
    Then I see the recorded empty-state text "No programs yet. Create your first program to get started."
    And I do not see a program row for "Test Program"

  @TC-014 @edge
  Scenario: A malformed program catalog does not crash the page
    Given I am logged in as admin
    And the program catalog returns a payload that is not a program list
    When I navigate to the Programs page
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-015 @edge
  Scenario: Saving a program fails when the program is not found
    Given I am logged in as admin
    And a program "Test Program" exists
    And I am editing "Test Program"
    When saving that program fails because the program is not found
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-016 @edge
  Scenario: The program list stays up when the catalog request is unauthorized
    Given I am logged in as admin
    When the program catalog request is unauthorized
    And I navigate to the Programs page
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-017 @edge
  Scenario: Saving a program fails when the save is forbidden
    Given I am logged in as admin
    And a program "Test Program" exists
    And I am editing "Test Program"
    When saving that program is forbidden
    Then the Programs page does not crash
    And the Programs heading is still shown
    And "Test Program" still exists in the list

  @TC-018 @edge
  Scenario: Saving a program fails when the save is rejected as a bad request
    Given I am logged in as admin
    And a program "Test Program" exists
    And I am editing "Test Program"
    When saving that program is rejected as a bad request
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-019 @edge
  Scenario: Saving a program fails when the server errors
    Given I am logged in as admin
    And a program "Test Program" exists
    And I am editing "Test Program"
    When saving that program fails with a server error
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-020 @edge
  Scenario: Saving a program fails when the save is not implemented
    Given I am logged in as admin
    And a program "Test Program" exists
    And I am editing "Test Program"
    When saving that program fails because it is not implemented
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-021 @edge
  Scenario: The program list stays up when the catalog gateway fails
    Given I am logged in as admin
    When the program catalog gateway fails
    And I navigate to the Programs page
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-022 @edge
  Scenario: The program list stays up when the catalog request times out at the gateway
    Given I am logged in as admin
    When the program catalog request times out at the gateway
    And I navigate to the Programs page
    Then the Programs page does not crash
    And the Programs heading is still shown

  @TC-023 @edge
  Scenario: A multiple-choices catalog response does not crash the page
    Given I am logged in as admin
    When the program catalog responds with multiple choices
    And I navigate to the Programs page
    Then the Programs page does not crash
    And the Programs heading is still shown

  # Ambiguities and gaps
  # - Live recon skipped this run. Empty-state copy, the create prompt label, and any filter control were not re-read on the live app.
  # - Filtering. The summary says "filtering and display". The acceptance criteria only cover name, description, and the empty state. No filter field, query, or no-match message is specified. These scenarios do not invent a filter.
  # - Empty-state copy. The AC requires a message that no programs have been created and a prompt to create the first program. The recorded sentence is "No programs yet. Create your first program to get started." It was not re-verified.
  # - Who sees the list. The story says an admin. Non-admin behavior is not specified.
  # - Empty Description, special characters, markup, and a one-character name are not in the AC.
  # - Sort order and paging are not specified. Scenarios check presence, not position.
  # - A deleted program leaving the list is not an acceptance criterion. TC-007 expects the deleted name to be absent.
  # - API reactions (TC-012 through TC-023) describe the page staying up. Exact error copy was not read because recon was skipped. Do not invent an error sentence.
  # - "No programs exist" on a shared catalog cannot be produced by deleting other people's programs. The empty catalog scenario is the catalog response with no program rows.

Feature: Create new academic program
  DS-270 — As an admin user, create a new academic program so that I can begin designing its curriculum structure.

  # Observed on live app (https://test.didaxis.studio/programs):
  # - Programs heading (h2), button "+ New Program"
  # - Dialog "New Program" with labels: Program Name *, Description, Total Program Hours,
  #   Default Session Hours, Default Exam Hours, Target Audience, Focus Areas
  # - Create button disabled when Program Name is empty or whitespace-only ("   ")

  # Happy paths

  @TC-001 @AC-NavigateToForm
  Scenario: Navigate to program creation form
    Given I am logged in as admin
    When I navigate to the Programs page
    And I click "+ New Program"
    # Observed: Programs page, button name "+ New Program"; dialog name "New Program"
    Then I see the program creation form with fields: Program Name, Description

  @TC-002 @AC-SuccessfulCreate
  Scenario: Successfully create a program
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    # Observed: Create button in New Program dialog
    Then the modal closes
    And the program list shows "Web Development 2026"

  @TC-003
  Scenario: Create a program without a description
    Given I am on the program creation form
    When I fill in Program Name with "Data Analytics 2026"
    And I leave Description empty
    And I click Create
    Then the modal closes
    And the program list shows "Data Analytics 2026"

  # Negative

  @TC-004 @AC-EmptyNameValidation
  Scenario: Validation prevents empty program name
    Given I am on the program creation form
    When I leave the Program Name field empty
    Then the Create button is disabled
    # Observed: Create disabled when Program Name is empty

  @TC-005
  Scenario: Description alone does not allow program creation
    Given I am on the program creation form
    When I leave the Program Name field empty
    And I fill in Description with "Full-stack web development program"
    Then the Create button is disabled

  @TC-006
  Scenario: Whitespace-only program name keeps Create disabled
    Given I am on the program creation form
    When I fill in Program Name with "   "
    And I fill in Description with "Full-stack web development program"
    Then the Create button is disabled
    # Observed: Create disabled for whitespace-only Program Name

  # Edge cases

  @TC-007
  Scenario: Special characters in Program Name are preserved
    Given I am on the program creation form
    When I fill in Program Name with "C++ & .NET (Cohort #1)"
    And I fill in Description with "Systems programming with C++ and .NET"
    And I click Create
    Then the modal closes
    And the program list shows "C++ & .NET (Cohort #1)"

  @TC-008
  Scenario: Leading and trailing spaces are trimmed from Program Name
    Given I am on the program creation form
    When I fill in Program Name with "  Cybersecurity 2026  "
    And I fill in Description with "Defensive security program"
    And I click Create
    Then the modal closes
    And the program list shows "Cybersecurity 2026"

  # Network edge cases (observable UI only; no page.route named here)

  @TC-009 @edge
  Scenario: Empty programs list shows the empty state
    Given the programs list API returns an empty list
    When I navigate to the Programs page
    Then I see "No programs yet. Create your first program to get started."
    # Observed: emptyProgramsMessage on ProgramsPage

  @TC-010 @edge
  Scenario: Malformed programs list payload does not crash the page
    Given the programs list API returns a malformed payload
    When I navigate to the Programs page
    Then the Programs heading remains visible
    And the page does not crash

  @TC-011 @edge
  Scenario: Save failure with 503 leaves the edit dialog usable
    Given an existing program is open in the Edit Program dialog
    And the save API returns 503
    When I click Save
    Then the Programs heading remains visible
    And the page does not crash
    # Observed during explore: no dedicated 503 error copy on screen for this case

  # Ambiguities and gaps
  # - Description optional vs required: AC disables Create only for empty Program Name; TC-003 assumes optional.
  # - Exact duplicate / uniqueness behavior belongs to DS-271, not this ticket's AC.
  # - Length limits for Program Name are not stated in DS-270 AC.
  # - Network error copy for 503/malformed is not rendered as a specific message on the live page.

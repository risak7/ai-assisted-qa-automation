Feature: Program name validation and duplicate prevention
  DS-271 — As an admin user, prevent invalid or duplicate program names so that data integrity is maintained.

  # Observed on live app (https://test.didaxis.studio/programs):
  # - Programs heading (h2), button "+ New Program"
  # - Dialog "New Program" with Program Name * and Description
  # - Create button disabled when Program Name is empty or whitespace-only ("   ")

  # Happy paths

  @TC-001 @AC-SpecialChars
  Scenario: Accept program name with special characters
    Given I am on the program creation form
    When I enter "Informatique & IA - Niveau 2" as the program name
    And I fill in Description with "Programme d'informatique et d'intelligence artificielle, niveau 2"
    And I click Create
    # Observed: Create button in New Program dialog
    Then the program is created successfully
    And the program list shows "Informatique & IA - Niveau 2"

  @TC-002
  Scenario: Leading and trailing spaces are trimmed from a valid program name
    Given I am on the program creation form
    When I enter "  Informatique & IA - Niveau 2  " as the program name
    And I fill in Description with "Programme d'informatique et d'intelligence artificielle, niveau 2"
    And I click Create
    Then the program is created successfully
    And the program list shows "Informatique & IA - Niveau 2"

  # Negative

  @TC-003 @AC-Whitespace
  Scenario: Reject program name with only whitespace
    Given I am on the program creation form
    When I enter "   " as the program name
    And I fill in Description with "Full-stack web development program"
    Then the Create button is disabled
    # Observed: Create disabled for whitespace-only Program Name; form is not submitted

  @TC-004 @AC-Duplicate
  Scenario: Reject duplicate program name
    Given a program "Web Development 2026" already exists
    And I am on the program creation form
    When I enter "Web Development 2026" as the program name
    And I fill in Description with "Another full-stack cohort"
    And I click Create
    Then I see an error indicating the name already exists
    And the program list still shows only one "Web Development 2026"

  @TC-005
  Scenario: Empty program name is not submitted
    Given I am on the program creation form
    When I leave the program name empty
    And I fill in Description with "Full-stack web development program"
    Then the Create button is disabled
    # Observed: Create disabled when Program Name is empty

  # Edge cases

  @TC-006
  Scenario: Program names are unique regardless of letter case
    Given a program "Web Development 2026" already exists
    And I am on the program creation form
    When I enter "web development 2026" as the program name
    And I fill in Description with "Case-variant duplicate"
    And I click Create
    Then the program list still shows only one "Web Development 2026"

  @TC-007
  Scenario: Accented characters are preserved in Program Name
    Given I am on the program creation form
    When I enter "Développement & IA - Niveau 2" as the program name
    And I fill in Description with "Programme avec caractères accentués"
    And I click Create
    Then the program is created successfully
    And the program list shows "Développement & IA - Niveau 2"

  # Network edge cases (observable UI only)

  @TC-008 @edge
  Scenario: Empty programs list shows the empty state
    Given the programs list API returns an empty list
    When I navigate to the Programs page
    Then I see "No programs yet. Create your first program to get started."

  @TC-009 @edge
  Scenario: Malformed programs list payload does not crash the page
    Given the programs list API returns a malformed payload
    When I navigate to the Programs page
    Then the Programs heading remains visible
    # Observed product defect: page may emit TypeError pageerror (t.map is not a function)

  @TC-010 @edge
  Scenario: Save failure with 503 leaves the shell standing
    Given an existing program is open in the Edit Program dialog
    And the save API returns 503
    When I click Save
    Then the Programs heading remains visible
    # Observed product defect: page may emit AxiosError pageerror for 503

  # Ambiguities and gaps
  # - AC says "click Create" for whitespace; live UI disables Create instead — TC-003 follows observed UI.
  # - Exact duplicate error copy is not specified; assert via duplicateNameMessage /already exists/i.
  # - Case-sensitivity of uniqueness is not stated in AC; TC-006 assumes case-insensitive.

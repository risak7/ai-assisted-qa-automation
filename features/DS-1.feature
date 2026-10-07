Feature: Create new academic program
  DS-1 — As an admin, create a new academic program to begin designing its curriculum structure.

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
    Given I am on the program creation form
    And no program named "Web Development 2026" already exists
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026"
    And the program list does not show a second "Web Development 2026"

  @TC-003
  Scenario: Create a program without a description
    Given I am on the program creation form
    And no program named "Data Analytics 2026" already exists
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
    And I leave Description empty
    Then the Create button is disabled
    And the program list does not show a new program

  @TC-005
  Scenario: Description alone does not allow program creation
    Given I am on the program creation form
    When I leave the Program Name field empty
    And I fill in Description with "Full-stack web development program"
    Then the Create button is disabled
    And the program list does not show a new program

  @TC-006
  Scenario: Whitespace-only program name is rejected
    Given I am on the program creation form
    When I fill in Program Name with "   "
    And I fill in Description with "Full-stack web development program"
    Then the Create button is disabled
    And the program list does not show a blank program name

  @TC-007
  Scenario: Duplicate program name is rejected
    Given a program named "Web Development 2026" already exists
    And I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Another full-stack cohort"
    And I click Create
    Then the modal stays open
    And I see a validation message that "Web Development 2026" already exists
    And the program list still shows only one "Web Development 2026"

  @TC-008
  Scenario: Non-admin cannot create a program
    Given I am logged in as a non-admin user
    When I navigate to the Programs page
    Then I do not see "+ New Program"
    And I cannot open the program creation form

  # Edge cases

  @TC-009
  Scenario: Minimum-length program name is accepted
    Given I am on the program creation form
    And no program named "A" already exists
    When I fill in Program Name with "A"
    And I fill in Description with "Single-letter program name"
    And I click Create
    Then the modal closes
    And the program list shows "A"

  @TC-010
  Scenario: Special characters in Program Name are preserved
    Given I am on the program creation form
    And no program named "C++ & .NET (Cohort #1)" already exists
    When I fill in Program Name with "C++ & .NET (Cohort #1)"
    And I fill in Description with "Systems programming with C++ and .NET"
    And I click Create
    Then the modal closes
    And the program list shows "C++ & .NET (Cohort #1)"

  @TC-011
  Scenario: Surrounding spaces are trimmed from Program Name
    Given I am on the program creation form
    And no program named "Cybersecurity 2026" already exists
    When I fill in Program Name with "  Cybersecurity 2026  "
    And I fill in Description with "Defensive security program"
    And I click Create
    Then the modal closes
    And the program list shows "Cybersecurity 2026"
    And the program list does not show "  Cybersecurity 2026  "

  @TC-012
  Scenario: Program Name at 255 characters is accepted
    Given I am on the program creation form
    When I fill in Program Name with a 255-character value that starts with "Web Development 2026"
    And I fill in Description with "Boundary length name"
    And I click Create
    Then the modal closes
    And the program list shows the full 255-character Program Name

  @TC-013
  Scenario: Program Name over 255 characters is rejected
    Given I am on the program creation form
    When I fill in Program Name with a 256-character value that starts with "Web Development 2026"
    And I fill in Description with "Over max length name"
    Then the Create button is disabled or I see a validation message that Program Name exceeds the maximum length
    And the program list does not show that 256-character name

  @TC-014
  Scenario: Program names are unique regardless of letter case
    Given a program named "Web Development 2026" already exists
    And I am on the program creation form
    When I fill in Program Name with "web development 2026"
    And I fill in Description with "Case-variant duplicate"
    And I click Create
    Then the modal stays open
    And the program list still shows only one program named "Web Development 2026"

  @TC-015
  Scenario: Markup in Program Name is not executed
    Given I am on the program creation form
    When I fill in Program Name with "<script>alert(\"xss\")</script>"
    And I fill in Description with "Markup should be plain text"
    And I click Create
    Then the modal closes
    And the program list shows the text "<script>alert(\"xss\")</script>"
    And no script runs

  @TC-016
  Scenario: A long Description is preserved
    Given I am on the program creation form
    And no program named "Cloud Engineering 2026" already exists
    When I fill in Program Name with "Cloud Engineering 2026"
    And I fill in Description with a 1000-character value that starts with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Cloud Engineering 2026"
    And the saved Description is the full 1000-character value

  # Ambiguities and gaps
  # - Description required or optional: AC only disables Create for empty Program Name; TC-003 assumes Description is optional.
  # - Whitespace: trim vs reject for spaces-only names (TC-006, TC-011) not stated in AC.
  # - Length limits: no min/max in AC; TC-009, TC-012, TC-013 use inferred boundaries.
  # - Uniqueness and case sensitivity (TC-007, TC-014) not defined in AC.
  # - Non-admin and logged-out access (TC-008) not defined in AC.
  # - Cancel, Escape, click-outside, and discard-on-close behavior not in AC.
  # - No inline validation message specified when Create is disabled for empty name.
  # - List sort order, success toast, and Description visibility in list not in AC.
  # - Special characters and HTML rendering (TC-010, TC-015) not specified in AC.

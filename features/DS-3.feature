Feature: Program name validation and duplicate prevention
  DS-3 — As an admin, prevent invalid or duplicate program names so data integrity is maintained.

  # Happy paths

  @TC-001 @AC-SpecialChars
  Scenario: Accept program name with special characters
    Given I am on the program creation form
    When I enter "Informatique & IA - Niveau 2" as the program name
    And I fill in Description with "Programme d'informatique et d'intelligence artificielle, niveau 2"
    And I click Create
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
    And the program list does not show "  Informatique & IA - Niveau 2  "

  @TC-003
  Scenario: Duplicate Description does not block a unique Program Name
    Given a program "Web Development 2026" already exists with Description "Full-stack web development program"
    And I am on the program creation form
    When I enter "Data Analytics 2026" as the program name
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the program is created successfully
    And the program list shows "Data Analytics 2026"
    And the program list still shows "Web Development 2026"

  # Negative

  @TC-004 @AC-Whitespace
  Scenario: Reject program name with only whitespace
    Given I am on the program creation form
    When I enter "   " as the program name
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the form is not submitted
    And the program list does not show a blank program name

  @TC-005
  Scenario: Empty program name is not submitted
    Given I am on the program creation form
    When I leave the program name empty
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the form is not submitted
    And the program list is unchanged

  @TC-006 @AC-Duplicate
  Scenario: Reject duplicate program name
    Given a program "Web Development 2026" already exists
    And I am on the program creation form
    When I enter "Web Development 2026" as the program name
    And I fill in Description with "Another full-stack cohort"
    And I click Create
    Then I see an error indicating the name already exists
    And the form is not submitted
    And the program list still shows only one "Web Development 2026"

  @TC-007
  Scenario: Trimmed program name is checked for duplicates
    Given a program "Web Development 2026" already exists
    And I am on the program creation form
    When I enter "  Web Development 2026  " as the program name
    And I fill in Description with "Another full-stack cohort"
    And I click Create
    Then I see an error indicating the name already exists
    And the program list still shows only one "Web Development 2026"

  @TC-008
  Scenario: Program names are unique regardless of letter case
    Given a program "Web Development 2026" already exists
    And I am on the program creation form
    When I enter "web development 2026" as the program name
    And I fill in Description with "Case-variant duplicate"
    And I click Create
    Then I see an error indicating the name already exists
    And the program list still shows only one "Web Development 2026"

  @TC-009
  Scenario: A tab-only program name is treated as empty
    Given I am on the program creation form
    When I enter a tab character as the program name
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the form is not submitted
    And the program list does not show a blank program name

  @TC-010
  Scenario: A rejected duplicate leaves the existing program unchanged
    Given a program "Web Development 2026" already exists with Description "Full-stack web development program"
    And I am on the program creation form
    When I enter "Web Development 2026" as the program name
    And I fill in Description with "This description must not replace the original"
    And I click Create
    Then I see an error indicating the name already exists
    And "Web Development 2026" still has Description "Full-stack web development program"

  # Edge cases

  @TC-011
  Scenario: Minimum-length program name is accepted
    Given I am on the program creation form
    When I enter "A" as the program name
    And I fill in Description with "Single-letter program name"
    And I click Create
    Then the program is created successfully
    And the program list shows "A"

  @TC-012
  Scenario: Spaces around a real character are trimmed
    Given I am on the program creation form
    When I enter "   A   " as the program name
    And I fill in Description with "Trimmed single character"
    And I click Create
    Then the program is created successfully
    And the program list shows "A"

  @TC-013
  Scenario: Program Name at 255 characters is accepted
    Given I am on the program creation form
    When I enter a 255-character program name that starts with "Informatique & IA - Niveau 2"
    And I fill in Description with "Boundary length name"
    And I click Create
    Then the program is created successfully
    And the program list shows the full 255-character name

  @TC-014
  Scenario: Program Name over 255 characters is rejected
    Given I am on the program creation form
    When I enter a 256-character program name that starts with "Informatique & IA - Niveau 2"
    And I fill in Description with "Over max length name"
    And I click Create
    Then the form is not submitted
    And I see a validation message that Program Name exceeds the maximum length
    And the program list does not show that 256-character name

  @TC-015
  Scenario: Punctuation beyond ampersand and hyphen is accepted
    Given I am on the program creation form
    When I enter "C++ / .NET (Cohort #1)" as the program name
    And I fill in Description with "Systems programming with C++ and .NET"
    And I click Create
    Then the program is created successfully
    And the program list shows "C++ / .NET (Cohort #1)"

  @TC-016
  Scenario: A punctuation difference is not a duplicate
    Given a program "Web Development 2026" already exists
    And I am on the program creation form
    When I enter "Web Development 2026!" as the program name
    And I fill in Description with "Name differs by punctuation"
    And I click Create
    Then the program is created successfully
    And the program list shows "Web Development 2026"
    And the program list shows "Web Development 2026!"

  @TC-017
  Scenario: Markup in Program Name is not executed
    Given I am on the program creation form
    When I enter "<script>alert(\"xss\")</script>" as the program name
    And I fill in Description with "Markup should be plain text"
    And I click Create
    Then the program is created successfully
    And the program list shows the text "<script>alert(\"xss\")</script>"
    And no script runs

  @TC-018
  Scenario: Accented characters are preserved in Program Name
    Given I am on the program creation form
    When I enter "Développement & IA - Niveau 2" as the program name
    And I fill in Description with "Programme avec caractères accentués"
    And I click Create
    Then the program is created successfully
    And the program list shows "Développement & IA - Niveau 2"

  # Ambiguities and gaps
  # - Whitespace rejection versus a disabled button. The user clicks Create, and the form is not submitted. It is not stated whether Create stays enabled, or what message is shown for a trimmed-empty name.
  # - Which characters count as whitespace. The example is three spaces. Tabs, newlines, and non-breaking spaces are not mentioned. TC-009 assumes a tab is trimmed to empty.
  # - Trim on a valid name. The note says the name is trimmed. It does not say the saved value drops leading and trailing spaces. TC-002 and TC-012 assume the stored name is the trimmed value.
  # - Other required fields. The special-character scenario says to fill them, but it does not name them. These cases use Description. It is unclear whether Description is required.
  # - Error copy. The duplicate scenario requires an error that the name already exists. The exact text, and whether it is inline on Program Name, is not given.
  # - Case sensitivity. "The same name" is not defined. TC-008 assumes "web development 2026" duplicates "Web Development 2026".
  # - Comparison after trim. It is not stated that "  Web Development 2026  " is a duplicate. TC-007 assumes the check uses the trimmed name.
  # - Length limits. No minimum or maximum is given. TC-011 uses 1 character. TC-013 and TC-014 use 255 and 256 as a candidate boundary that still needs a product decision.
  # - Internal spaces. Collapsing repeated spaces inside a name, such as "Web  Development  2026", is not specified.
  # - Edit path. The scenarios are on the creation form. Renaming a program onto an existing name is not covered.
  # - Failed submit state. It is not stated that the modal stays open, that entered values remain, or that the existing program is left unchanged. TC-006 and TC-010 assume that.
  # - Allowed characters. Only "Informatique & IA - Niveau 2" is required to succeed. Other punctuation, accents, and markup are not specified. TC-015, TC-017, and TC-018 assume they are stored as plain text.
  # - What is unique. Only Program Name is mentioned. These cases assume Description may be shared and that a punctuation difference is a different name.

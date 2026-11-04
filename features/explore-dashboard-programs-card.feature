Feature: Navigate to Programs from the Dashboard Programs card
  Coverage gap — Dashboard is untested; every Programs spec deep-links to /programs and skips the hub. The Programs card is the primary entry from the landing page and shows a live program count.

  # Happy path

  Scenario: Programs card opens the Programs page
    Given I am signed in as an admin
    And I am on the Dashboard at "/"
    # Observed: heading "Dashboard", paragraph "Welcome to Didaxis Studio", status "Connected"
    When I click the Programs shortcut card
    # Observed: clickable card with label "Programs", subtitle "Manage academic programs", and a numeric count
    Then the URL is "/programs"
    And the Programs page is visible
    # Observed: sidebar button "Programs" becomes the active nav target after navigation

  # Edge case

  Scenario: Programs card shows a numeric program count
    Given I am signed in as an admin
    And I am on the Dashboard at "/"
    When I view the Programs shortcut card
    # Observed: count text e.g. "2135" above "Programs" / "Manage academic programs"
    Then the Programs card displays a whole-number count
    And the card label "Programs" and subtitle "Manage academic programs" are visible

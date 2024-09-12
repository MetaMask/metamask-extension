# Manual test scenario for the 'Show ENS domains in address bar' toggle

Below is a summary of the validations included:

* Validate that the 'Show ENS domains in address bar' toggle is present in the Security & Privacy settings and is ON by default.
* Validate that the toggle can be turned on and off.
* Validate that when the toggle is turned on, ENS domain name is displayed alongside the public address

```markdown

# Security & Privacy Settings: Verify "Show ENS domains in address bar" Toggle Functionality

# Feature: Toggle "Show ENS domains in address bar" in Security & Privacy Settings

In order to enhance user experience
As a user of the wallet extension
I want to toggle the "Show ENS domains in address bar" option in the Security & Privacy Settings

# Scenario: Default state of "Show ENS domains in address bar" toggle is ON

Given I am in Settings
When I click on the "Security & Privacy" tab
Then the "Show ENS domains in address bar" toggle is set to ON by default

# Scenario: "Show ENS domains in address bar" toggle functionality

Given I am on the Security & Privacy settings page
And the "Show ENS domains in address bar" toggle is initially set to ON
When I click on the "Show ENS domains in address bar" toggle icon
Then the toggle switch should visually indicate to OFF
When I click on the "Show ENS domains in address bar" toggle icon again
Then the toggle switch should visually indicate to ON

# Scenario: Verification of ENS domains display functionality

Given I am on the Security & Privacy settings page
And the "Show ENS domains in address bar" toggle is set to ON
When I enter an ENS address in my browser's address bar
Then I should see the content associated with it


```


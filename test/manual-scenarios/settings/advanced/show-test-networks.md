
# Manual test scenario for the 'Show test networks' toggle

Below is a summary of the validations included:-

* Validate that the 'Show test networks' toggle is present in the Advanced settings and is off by default.
* Validate that the toggle can be turned on and off.
* Validate that when the toggle is turned on, the Networks dropdown also shows the 'Show test networks' as on, and the test networks are visible.


```markdown

# Advanced Settings: Verify "Show test networks" Toggle Functionality

# Feature: Toggle "Show test networks" in Advanced Settings

In order to enhance user experience
As a user of the wallet extension
I want to toggle the "Show test networks" option in the Advanced Settings

# Scenario: Default state of "Show test networks" toggle is OFF

Given I am in settings
When I click on the "Advanced" tab
Then the "Show test networks" toggle is set to off by default
And I click on the Network selection drop down on the left top
Then the "Select a network" dialog box appears
And the "Show test networks" toggle is selected OFF
And the test networks are not visible in the dropdown

# Scenario: "Show test networks" toggle icon functionality

Given I am on the Advanced settings page
And the "Show test networks" toggle is initially set to OFF
When I click on the "Show test networks" toggle icon
Then the toggle switch should visually indicate to ON
When I click on the "Show test networks" toggle icon again
Then the toggle switch should visually indicate to OFF

# Scenario: Turning ON "Show test networks" and validate the 'Show test networks' in network selection dialog is turned ON and the test networks are visible

Given I am on the Advanced settings page
When I toggle the "Show test networks" switch ON
Then the toggle switch should visually indicate to ON
When I click on the Network selection drop down on the left top
Then the "Select a network" dialog box appears
And the "Show test networks" toggle is selected ON automatically
And the test networks are shown as expected


```

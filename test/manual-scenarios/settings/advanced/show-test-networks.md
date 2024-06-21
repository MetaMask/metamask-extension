
Manual test scenario for the 'Show test networks' toggle. Below is a summary of the validations included:-

* Validate that the 'Show test networks' toggle is present in the Advanced settings and is off by default.
* Validate that the toggle can be turned on and off.
* Validate that when the toggle is turned on, the Networks dropdown also shows the 'Show test networks' as on, and the test networks are visible.
* Validate that when the toggle is turned off, the Networks dropdown reflects the 'Show test networks' as off.

['Show test networks' toggle](<../../../../../../Desktop/Screen Recording 2024-03-20 at 5.57.06 PM.mov>)

```markdown

# Advanced Settings: Verify "Show test networks" Toggle Functionality

## Feature: Toggle "Show test networks" in Advanced Settings

In order to enhance user experience
As a user of the wallet extension
I want to toggle the "Show test networks" option in the Advanced Settings

## Scenario: Default state of "Show test networks" toggle is OFF

Given I have opened the extension
And I proceed to unlock the wallet with a password of minimum 8 characters
And I click on the right corner settings (three dots)
And drop down menu appears
When I click on the "Settings" from the menu
And I click on the "Advanced" tab
Then the "Show test networks" toggle is set to off by default

## Scenario: "Show test networks" toggle icon functionality

Given I am on the Advanced settings page
And the "Show test networks" toggle is initially set to OFF
When I click on the "Show test networks" toggle icon
Then the toggle should switch to ON
And the icon should visually indicate that it is in the ON position
When I click on the "Show test networks" toggle icon again
Then the toggle should switch back to OFF
And the icon should visually indicate that it is in the OFF position

## Scenario: Turning ON "Show test networks" and validate the 'Show test networks' in network selection dialog is turned ON and the test networks are visible

Given I am on the Advanced settings page
When I toggle the "Show test networks" switch ON
Then the switch is turned on as expected
And when I click on the Network selection drop down on the left top
Then the "Select a network" dialog box appears
And the "Show test networks" toggle is selected ON automatically
And the test networks are shown as expected

## Scenario: Turning OFF "Show test networks" and validate the 'Show test networks' in network selection dialog is turned OFF

Given I am on the Advanced settings page
When I toggle the "Show test networks" switch OFF
And when I click on the Network selection drop down on the left top
Then the "Select a network" dialog box appears
And the "Show test networks" toggle is selected OFF
And the test networks are not visible in the dropdown

```
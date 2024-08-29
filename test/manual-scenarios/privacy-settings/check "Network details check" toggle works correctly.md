
# Manual test scenario for the 'Network details check' toggle

Below is a summary of the validations included:

* Validate that the 'Network details check' toggle is present in the Security & Privacy settings and is ON by default.
* Validate that the toggle can be turned on and off.
* Validate that when the toggle is turned on, MetaMask checks the network details against the information provided by chainid.network when attempting to connect to a blockchain network.

```markdown

# Security & Privacy Settings: Verify "Network details check" Toggle Functionality

# Feature: Toggle "Network details check" in Security & Privacy Settings

In order to enhance user experience
As a user of the wallet extension
I want to toggle the "Network details check" option in the Security & Privacy Settings

# Scenario: Default state of "Network details check" toggle is ON

Given I am in Settings
When I click on the "Security & Privacy" tab
Then the "Network details check" toggle is set to ON by default

# Scenario: "Network details check" toggle functionality

Given I am on the Security & Privacy settings page
And the "Network details check" toggle is initially set to ON
When I click on the "Network details check" toggle icon
Then the toggle switch should visually indicate to OFF
When I click on the "Network details check" toggle icon again
Then the toggle switch should visually indicate to ON

# Scenario: Verification of network details check functionality

Given I am on the Security & Privacy settings page
And the "Network details check" toggle is set to ON
When I attempt to connect to a blockchain network
Then MetaMask should check the network details against the information provided by chainid.network


```

# Manual test scenario for the 'IPFS gateway' toggle

Below is a summary of the validations included:

* Validate that the 'IPFS gateway' toggle is present in the Security & Privacy settings and is ON by default.
* Validate that the toggle can be turned on and off.
* Validate that when the toggle is turned on, MetaMask shows images of NFTs, displays information related to ENS addresses, and fetches icons for different tokens.

```markdown

# Security & Privacy Settings: Verify "IPFS gateway" Toggle Functionality

# Feature: Toggle "IPFS gateway" in Security & Privacy Settings

In order to enhance user experience
As a user of the wallet extension
I want to toggle the "IPFS gateway" option in the Security & Privacy Settings

# Scenario: Default state of "IPFS gateway" toggle is ON

Given I am in Settings
When I click on the "Security & Privacy" tab
Then the "IPFS gateway" toggle is set to ON by default

# Scenario: "IPFS gateway" toggle functionality

Given I am on the Security & Privacy settings page
And the "IPFS gateway" toggle is initially set to ON
When I click on the "IPFS gateway" toggle icon
Then the toggle switch should visually indicate to OFF
When I click on the "IPFS gateway" toggle icon again
Then the toggle switch should visually indicate to ON

# Scenario: Verification of IPFS gateway functionality

Given I am on the Security & Privacy settings page
And the "IPFS gateway" toggle is set to ON
When I view images of my NFTs
Or I enter ENS addresses in my browser's address bar
Or I view icons for different tokens
Then MetaMask should fetch this information


```

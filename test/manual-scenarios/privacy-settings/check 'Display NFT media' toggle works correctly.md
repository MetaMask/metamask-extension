# Manual test scenario for the 'Display NFT media' toggle

Below is a summary of the validations included:

* Validate that the 'Display NFT media' toggle is present in the Security & Privacy settings and is ON by default.
* Validate that the toggle can be turned on and off.
* Validate that when the toggle is turned on, MetaMask displays NFT media and data.
* Validate that NFT autodetection relies on this setting and won't be available when this is turned off.

```markdown

# Security & Privacy Settings: Verify "Display NFT media" Toggle Functionality

# Feature: Toggle "Display NFT media" in Security & Privacy Settings

In order to enhance user experience
As a user of the wallet extension
I want to toggle the "Display NFT media" option in the Security & Privacy Settings

# Scenario: Default state of "Display NFT media" toggle is ON

Given I am in Settings
When I click on the "Security & Privacy" tab
Then the "Display NFT media" toggle is set to ON by default

# Scenario: "Display NFT media" toggle functionality

Given I am on the Security & Privacy settings page
And the "Display NFT media" toggle is initially set to ON
When I click on the "Display NFT media" toggle icon
Then the toggle switch should visually indicate to OFF
When I click on the "Display NFT media" toggle icon again
Then the toggle switch should visually indicate to ON

# Scenario: Verification of NFT media display functionality

Given I am on the Security & Privacy settings page
And the "Display NFT media" toggle is set to ON
When I view my NFTs in MetaMask
Then MetaMask should display NFT media and data


```


# Manual test scenario for the 'IPFS gateway' toggle

Below is a summary of the validations included:

* Validate that the 'IPFS gateway' toggle is present in the Security & Privacy settings and is ON by default.
* Validate that the toggle can be turned on and off.
* Validate that when the toggle is turned on, MetaMask shows images of NFTs
* Validate that when the toggle is turned off, NFT images are replaced by placeholders and I am prompted to turn on IPFS resolution

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

# Scenario: Verification of IPFS gateway functionality with toggle ON

Given I am on the Security & Privacy settings page
And the "IPFS gateway" toggle is set to ON
When I attempt to view images of my NFTs (e.g. ERC1155) stored on IPFS
Then MetaMask should successfully fetch and display this information

# Scenario: Verification of IPFS gateway functionality with toggle OFF

Given I am on the Security & Privacy settings page
And the "IPFS gateway" toggle is set to OFF
When I attempt to view images of my NFTs (e.g. ERC1155) stored on IPFS
Then MetaMask should display a placeholder image instead of the NFT media
And I should see a "Show" button
And clicking "Show" should prompt me to confirm turning ON IPFS resolution


```

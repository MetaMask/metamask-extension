# Manual test scenario for the 'Import account with private key' feature

Below is a summary of the validations included:-

* Validate that the account selector is present at the top of the wallet.
* Validate that the 'Add account or hardware wallet' option is available at the bottom of the account selector list.
* Validate that the 'Import account' option is available in the next menu.
* Validate that the user is directed to the Import page upon selecting 'Import account'.
* Validate that the user can paste their private key and click 'Import'.
* Validate that the newly imported account appears in the account selector dropdown with an 'Imported' tag next to it.

```markdown

# Feature: Import Account with Private Key

In order to manage multiple accounts
As a user of the wallet extension
I want to import an account using a private key

# Scenario: Accessing the 'Add account or hardware wallet' option

Given I am on the wallet interface
When I click the account selector at the top of my wallet
Then I should see a list of accounts
And I should see the 'Add account or hardware wallet' option at the bottom of the list

# Scenario: Selecting the 'Import account' option

Given I have clicked the account selector at the top of my wallet
And I see the 'Add account or hardware wallet' option at the bottom of the list
When I select 'Add account or hardware wallet'
Then I should be directed to the next menu
And I should see the 'Import account' option

# Scenario: Importing an account with a private key

Given I am on the import dialog modal
When I see a field to paste my private key
And I paste my private key (e.g.: 669456835741782c2ceca4e6ded60420ede38db2fb28742a1c9ae5ddf6680fa9) and click 'Import'
Then I should see the newly imported account in the account selector dropdown
And the newly imported account should have an 'Imported' tag next to it


```

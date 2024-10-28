# MetaMask Extension Upgrade Testing from Master to Release Branch

## Feature: Validate Functionality Post-Upgrade

To ensure MetaMask extension's upgrade process is seamless and retains user data and functionality, we need to validate the transition from the previously shipped version (master branch) to the upcoming release (release branch).

## Scenario: Validate Upgrade Retains Data and Functionality

### Pre-Upgrade Actions on Master Branch

- **Given** the user checks out the master branch, runs `yarn` and `yarn start` to build locally, and has loaded the MetaMask extension. For instructions on how to load extension on Chrome and Firefox, check the guidelines [here for Chrome](https://github.com/MetaMask/metamask-extension/blob/develop/docs/add-to-chrome.md) and [here for Firefox](https://github.com/MetaMask/metamask-extension/blob/develop/docs/add-to-firefox.md).
- **And** the user has successfully onboarded.
- **And** the user creates two accounts.
- **And** the user sends a transaction between these accounts.
- **And** the user uses TestDapp to create an ERC20 token and imports it into MetaMask.

### Upgrade Actions

1. **When** the user stops the previous `yarn start` in the console from the master branch.
2. **And** uses `git checkout` to switch to the release branch.
3. **And** updates dependencies and restarts extension using `yarn` and `yarn start`.
4. **Then** the user should see a reload button on extension management page.
5. **When** the user clicks the reload button to complete the upgrade.
6. **Then** the user should verify that the displayed extension version number is updated.

### Post-Upgrade Validation on Release Branch

7. **Then** the user should verify that both accounts created pre-upgrade are present and correctly displayed.
8. **And** the previously sent transaction is visible in the transaction history.
9. **And** the ERC20 token created and imported pre-upgrade is still available.
10. **And** the user can successfully send another transaction.
11. **And** any popup modals related to the new version are appropriately displayed and functional.

### Expected Outcome

After upgrading from the master branch to the release branch, the MetaMask extension should:
- Retain all user data including accounts, transactions, and imported tokens.
- Maintain full functionality, enabling the user to continue using extension without any issues.
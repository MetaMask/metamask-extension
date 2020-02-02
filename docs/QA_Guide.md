
---
### MetaMask Browser help pages
* **QA Guide**
* [USER AGREEMENT](https://github.com/restarian/metamask-extension/blob/develop/docs/USER_AGREEMENT.md)
* [Add-to-chrome](https://github.com/restarian/metamask-extension/blob/develop/docs/add-to-chrome.md)
* [Add-to-firefox](https://github.com/restarian/metamask-extension/blob/develop/docs/add-to-firefox.md)
* [Adding-new-networks](https://github.com/restarian/metamask-extension/blob/develop/docs/adding-new-networks.md)
* [Bumping version](https://github.com/restarian/metamask-extension/blob/develop/docs/bumping_version.md)
* [Creating-metrics-events](https://github.com/restarian/metamask-extension/blob/develop/docs/creating-metrics-events.md)
* [Design-system](https://github.com/restarian/metamask-extension/blob/develop/docs/design-system.md)
* [Developing-on-deps](https://github.com/restarian/metamask-extension/blob/develop/docs/developing-on-deps.md)
* [Limited site access](https://github.com/restarian/metamask-extension/blob/develop/docs/limited_site_access.md)
* [Multi vault planning](https://github.com/restarian/metamask-extension/blob/develop/docs/multi_vault_planning.md)
* [Porting to new environment](https://github.com/restarian/metamask-extension/blob/develop/docs/porting_to_new_environment.md)
* [Publishing](https://github.com/restarian/metamask-extension/blob/develop/docs/publishing.md)
* [Secret-preferences](https://github.com/restarian/metamask-extension/blob/develop/docs/secret-preferences.md)
* [Send-screen-QA-checklist](https://github.com/restarian/metamask-extension/blob/develop/docs/send-screen-QA-checklist.md)
* [Sensitive-release](https://github.com/restarian/metamask-extension/blob/develop/docs/sensitive-release.md)
* [State dump](https://github.com/restarian/metamask-extension/blob/develop/docs/state_dump.md)
* [Synopsis](https://github.com/restarian/metamask-extension/blob/develop/docs/synopsis.md)
* [Translating-guide](https://github.com/restarian/metamask-extension/blob/develop/docs/translating-guide.md)
* [Trezor-emulator](https://github.com/restarian/metamask-extension/blob/develop/docs/trezor-emulator.md)
* Components
  * [Account-menu](https://github.com/restarian/metamask-extension/blob/develop/docs/components/account-menu.md)
* Contributing
  * [MISSION](https://github.com/restarian/metamask-extension/blob/develop/docs/contributing/MISSION.md)
* Specification
  * [CHANGELOG](https://github.com/restarian/metamask-extension/blob/develop/docs/specification/CHANGELOG.md)
  * [Package information](https://github.com/restarian/metamask-extension/blob/develop/docs/specification/package_information.md)
# QA Guide

Steps to mark a full pass of QA complete.
* Browsers: Opera, Chrome, Firefox, Edge.
* OS: Ubuntu, Mac OSX, Windows
* Load older version of MetaMask and attempt to simulate updating the extension.
* Open Developer Console in background and popup, inspect errors.
* Watch the state logs 
  * Transactions (unapproved txs -> rejected/submitted -> confirmed)
  * Nonces/LocalNonces
* Vault integrity
    * create vault
    * Log out
    * Log in again
    * Log out
    * Restore from seed
    * Create a second account
    * Import a loose account (not related to HD Wallet)
    * Import old existing vault seed phrase (pref with test Ether)
    * Download State Logs, Priv key file, seed phrase file.
* Send Ether
    * by address
    * by ens name
* Web3 API Stability
    * Create a contract from a Ðapp (remix)
    * Load a Ðapp that reads using events/logs (ENS)
    * Connect to MEW/MyCypto
    * Send a transaction from any Ðapp
        - MEW
        - EtherDelta
        - Leeroy
        - Aragon
        - (https://tmashuang.github.io/demo-dapp)
    * Check account balances
* Token Management
    * create a token with tokenfactory (http://tokenfactory.surge.sh/#/factory)
    * Add that token to the token view
    * Send that token to another metamask address.
    * confirm the token arrived.
* Send a transaction and sign a message (https://danfinlay.github.io/js-eth-personal-sign-examples/) for each keyring type
    * hd keyring
    * imported keyring
* Change network from mainnet → ropsten → rinkeby → localhost (ganache)
* Ganache set blocktime to simulate retryTx in MetaMask
* Copy public key to clipboard
* Export private key

* Explore changes in master, target features that have been changed and break.

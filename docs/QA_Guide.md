# QA Guide

Steps to mark a full pass of QA complete.
* Browsers: Opera, Chrome, Firefox, Edge.
* OS: Ubuntu, Mac OSX, Windows
* Load older version of ConfluxPortal and attempt to simulate updating the extension.
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
    * Import old existing vault seed phrase (pref with test CFX)
    * Download State Logs, Priv key file, seed phrase file.
* Send CFX
    * by address
    <!-- * by ens name -->
* js-conflux-sdk API Stability
    * Create a contract from a Ðapp (remix)
    * Load a Ðapp that reads using events/logs <!-- (ENS) -->
    * Connect to [e2e test demo](https://conflux-chain.github.io/conflux-portal-docs/docs/portal/e2e_test_demo/)
    * Send a transaction from any Ðapp
        - [e2e test demo](https://conflux-chain.github.io/conflux-portal-docs/docs/portal/e2e_test_demo/)
        <!-- - (https://tmashuang.github.io/demo-dapp) -->
    * Check account balances
* Token Management
    * create a token with [e2e test demo](https://conflux-chain.github.io/conflux-portal-docs/docs/portal/e2e_test_demo/) <!-- tokenfactory (http://tokenfactory.surge.sh/#/factory) -->
    * Add that token to the token view
    * Send that token to another ConfluxPortal address.
    * confirm the token arrived.
* Send a transaction and sign a message (https://danfinlay.github.io/js-eth-personal-sign-examples/) for each keyring type
    * hd keyring
    * imported keyring
* Change network from mainnet → testnet → localhost
  ([conflux-local-network-lite](https://github.com/yqrashawn/conflux-local-network-lite#readme))
* [conflux-local-network-lite](https://github.com/yqrashawn/conflux-local-network-lite#readme)
  set blocktime to simulate retryTx in MetaMask
* Copy public key to clipboard
* Export private key

* Explore changes in master, target features that have been changed and break.

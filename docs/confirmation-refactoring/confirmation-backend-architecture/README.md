# Confirmation Background Architecture and Code Cleanup

## Current Implementation:

Current confirmation implementation in the background consists of following pieces:

1. `TransactionController` and utility, helper classes used by it:
   `TransactionController` is very important piece in transaction processing. It is described [here](https://github.com/MetaMask/metamask-extension/tree/develop/app/scripts/controllers/transactions#transaction-controller). It consists of 4 important parts:
   - `txStateManager`: responsible for the state of a transaction and storing the transaction
   - `pendingTxTracker`: watching blocks for transactions to be include and emitting confirmed events
   - `txGasUtil`: gas calculations and safety buffering
   - `nonceTracker`: calculating nonces
2. `MessageManagers`:
   There are 3 different message managers responsible for processing signature requests. These are detailed [here](https://github.com/MetaMask/metamask-extension/tree/develop/docs/refactoring/signature-request#proposed-refactoring).
3. `MetamaskController `:
   `MetamaskController ` is responsible for gluing together the different pieces in transaction processing. It is responsible to inject dependencies in `TransactionController`, `MessageManagers`, handling different events, responses to DAPP requests, etc.

## Areas of Code Cleanup:

1. Migrating to `@metamask/transaction-controller`. `TransactionController` in extension repo should eventually get replaced by core repo [TransactionController](https://github.com/MetaMask/core/tree/main/packages/transaction-controller). This controller is maintained by core team and also used in Metamask Mobile App.
2. Migrating to `@metamask/message-manager`. Message Managers in extension repo should be deprecated in favor of core repo [MessageManagers](https://github.com/MetaMask/core/tree/main/packages/message-manager).
3. Cleanup Code in `MetamaskController`. [Metamaskcontroller](https://github.com/MetaMask/metamask-extension/blob/develop/app/scripts/metamask-controller.js) is where `TransactionController` and different `MessageManagers` are initialized. It is responsible for injecting required dependencies. Also, it is responsible for handling incoming DAPP requests and invoking appropriate methods in these background classes. Over the period of time lot of code that should have been part of `TransactionController` and `MessageManagers` has ended up in `MetamaskController`. We need to cleanup this code and move to the appropriate classes.
   - Code [here](https://github.com/MetaMask/metamask-extension/blob/bc19856d5d9ad1831e1722c84fe6161bed7a0a5a/app/scripts/metamask-controller.js#L3097) to check if `eth_sign` is enabled in preferences and perform other validation on the incoming request should be part of [MessageManager](https://github.com/MetaMask/metamask-extension/blob/develop/app/scripts/lib/message-manager.js)
   - Method to sign messages [signMessage](https://github.com/MetaMask/metamask-extension/blob/bc19856d5d9ad1831e1722c84fe6161bed7a0a5a/app/scripts/metamask-controller.js#L3158), [signPersonalMessage](https://github.com/MetaMask/metamask-extension/blob/bc19856d5d9ad1831e1722c84fe6161bed7a0a5a/app/scripts/metamask-controller.js#L3217), [signTypedMessage](https://github.com/MetaMask/metamask-extension/blob/bc19856d5d9ad1831e1722c84fe6161bed7a0a5a/app/scripts/metamask-controller.js#L3470) can be simplified by injecting `KeyringController` into `MessageManagers`.
   - There are about 11 different methods to `add`, `approve`, `reject` different types of signature requests. These can probably be moved to a helper class, thus reducing lines of code from `MetamaskController `.
   - This [code](https://github.com/MetaMask/metamask-extension/blob/bc19856d5d9ad1831e1722c84fe6161bed7a0a5a/app/scripts/metamask-controller.js#L959) can better be placed in `TransactionController`.
   - A lot of other methods in `MetamaskController` which are related to `TransactionController` and the state of `TransactionController` can be moved into `TransactionController` itself like [method1](https://github.com/MetaMask/metamask-extension/blob/bc19856d5d9ad1831e1722c84fe6161bed7a0a5a/app/scripts/metamask-controller.js#L1179), [method2](https://github.com/MetaMask/metamask-extension/blob/bc19856d5d9ad1831e1722c84fe6161bed7a0a5a/app/scripts/metamask-controller.js#L3570), [method3](https://github.com/MetaMask/metamask-extension/blob/bc19856d5d9ad1831e1722c84fe6161bed7a0a5a/app/scripts/metamask-controller.js#L4349), etc.

### Using ApprovalController for Confirmations

[ApprovalController](https://github.com/MetaMask/core/tree/main/packages/approval-controller) is written as a helper to `PermissionController`. Its role is to manage requests that require user approval. It can also be used in confirmation code to launch UI. Thus the use of `showUserConfirmation` function in `MetamaskController ` can be removed.
But `ApprovalController` will need some changes to be able to use it for confirmations, for example, it does not support multiple parallel requests from the same origin.

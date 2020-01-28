# Changelog

## Current Develop Branch
- [#7912](https://github.com/MetaMask/metamask-extension/pull/7912): Disable import button for empty string/file

## 0.0.4 Mon Jan 20 2020
- [#7823](https://github.com/Conflux-Chain/conflux-portal/pull/7823): Wait until element is clickable before clicking in e2e tests (#7823)
- [#7833](https://github.com/Conflux-Chain/conflux-portal/pull/7833): Fix prop types for SendGasRow component tests (#7833)
- [#7835](https://github.com/Conflux-Chain/conflux-portal/pull/7835): Clean up Migrator test cases (#7835)
- Add: release 0.0.3, add docs comparing with metamask
- Clean: logs
- Add: github pages, renaming
- Add: test:unit:global timeout
- Add: upgrade conflux-local-network-lite, less log
- Add: disable e2e test to test release
- Fix: token list
- Add: update announce script
- Add: build-announce depends or different repo
- [#7837](https://github.com/Conflux-Chain/conflux-portal/pull/7837): Fix prop types for NetworkDropdown tests (#7837)
- [#7836](https://github.com/Conflux-Chain/conflux-portal/pull/7836): Fix prop types for GasPriceChart tests (#7836)
- [#7834](https://github.com/Conflux-Chain/conflux-portal/pull/7834): Add required props for TransactionListItemDetails tests (#7834)
- [#7838](https://github.com/Conflux-Chain/conflux-portal/pull/7838): Remove extraneous console output from TransactionStateManager tests (#7838)
- [#7843](https://github.com/Conflux-Chain/conflux-portal/pull/7843): Remove unused current view related things (#7843)
- [#7840](https://github.com/Conflux-Chain/conflux-portal/pull/7840): Force background state update after removing an account (#7840)
- [#7817](https://github.com/Conflux-Chain/conflux-portal/pull/7817): Refactor Network dropdown component (#7817)
- [#7841](https://github.com/Conflux-Chain/conflux-portal/pull/7841): Refactor building of e2e web driver (#7841)
- [#7849](https://github.com/Conflux-Chain/conflux-portal/pull/7849): Fix propTypes and test props for SignatureRequest component (#7849)
- [#7851](https://github.com/Conflux-Chain/conflux-portal/pull/7851): Fix propTypes and test props for Dropdown components (#7851)
- [#7850](https://github.com/Conflux-Chain/conflux-portal/pull/7850): Fix props for BasicTabContent component tests (#7850)
- [#7848](https://github.com/Conflux-Chain/conflux-portal/pull/7848): Fix propTypes for TransactionBreakdown component (#7848)
- [#7856](https://github.com/Conflux-Chain/conflux-portal/pull/7856): deps - update nonce-tracker (#7856)
- [#7854](https://github.com/Conflux-Chain/conflux-portal/pull/7854): Inline networkStore to avoid having too many event listeners (#7854)
- [#7859](https://github.com/Conflux-Chain/conflux-portal/pull/7859): Switch signature-request e2e tests to using ganache (#7859)
- [#7860](https://github.com/Conflux-Chain/conflux-portal/pull/7860): Allow exporting state during e2e tests (#7860)
- [#7855](https://github.com/Conflux-Chain/conflux-portal/pull/7855): Clean up "JSON File" import strategy test output (#7855)

## 0.0.3 Thu Feb 16 2020
- remove preset default gas and default gas price in injected web3
- injected conflux version of web3 is now ~window.confluxJS~
- injected ~window.ethereum~ changed to ~window.conflux~
- ~window.ethereum.isMetaMask~ changed to ~window.conflux.isConfluxPortal~
- support skipped transaction

## 0.0.2 Fri Feb 10 2020
- Some "Etherscan" to "Confluxscan"
- Get default gas price from json rpc

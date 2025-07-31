# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [12.23.1]
### Fixed
- fix: ensure "Update extension to the latest version" button in the update prompt work in browser-action popup (#34372)

## [12.23.0]
### Added
- feat: gasIncluded swaps cp-12-23.0 (#33988)
- feat: unskipeed send flow Solana tests (#34036)
- feat: add e2e tests for Ledger personal sign functionality (#34002)
- feat: 2.5 password-change syncing across multiple devices (#33415)
- feat(wallet-details): adds option to add account from wallet details (#33959)
- feat: Add remove action to account details page (#34024)
- feat: add ledger e2e tests for ERC20 deployment (#33898)
- feat: 2.3 sync multiple SRPs using social login (#33386)
- feat: Show < 0.01 when gas cost is really small (#33966)
- feat: 2.8 login error modals (#33612)
- feat: reveal srp list improvements (#34004)
- feat: retrieve outgoing transaction history (#33782)
- feat: 2.2 change password and security settings (#33385)
- feat: account details pages w/o 7702 (#33964)
- feat: allow multiple provider connections (#33746)
- feat: 2.4 reset wallet for social login flow (#33397)
- feat: 2.1 social login with UI (#33379)
- feat: removes bridge button when unified is enabled (#33970)
- feat: update show all SRP to use p instead of input (#33950)
- feat: Network Manager (disabled) (#33941)
- feat: Add new warning modal for removing accounts (#33962)
- feat: import srp hide show all cp-12.22.0 (#33949)
- feat: reveal srp use div cp-12.22.0 (#33948)
- feat: Add tracing for the smart transactions controller (#33926)
- feat: add wallet details page and update routing (#33837)
- feat: add wallet property to base account details (#33906)
- feat: display EVM swap txs in unified tx components (#33858)
- feat: 2.0 added `OAuthService` for social logins (#33378)
- feat: poll incoming transactions only when viewing transaction list (#33783)
- feat: srp backup reminder (#33750)
- feat: Prompt the user to switch all accounts on all networks to SCA (#33744)
- feat: hide accounts (#33790)
- feat: Add account selection to upgrade account splash page (#33698)
- feat: add native token logo for Soneium mainnet (#33839)
- feat: change to handle batched nested transactions as regular transaction (#33804)
- feat: add ledger sign typed v4 e2e tests (#33832)
- feat: pin account inside wallet (#33761)
- feat: swap transaction scanning and alerts (#33786)
- feat: add search bar (#33752)
- feat: add 7702 toggles (#33530)
- feat: Improve how we display detailed of approve function in nested transaction (#33609)
- feat: add `SEI` mainnet network support (#32027)
- feat: enable Arbitrum for smart transactions (#33864)
- feat: add the network and token logos for Omni and XRPL networks (#34005)
- feat:add logos for Abstract network (#33838)
- feat: validate same origin domain for signIn for Solana (#33982)

### Changed
- Update: the button component to be monochromatic (#33847)
- Update: design tokens v8: font family change CentraNo1 to Geist and new background colors (#33764)
- Update: update message when there is no DeFi positions wording (#34229)
- Update welcome screen buttons to use Button DS component (#34230)
- Set confirm srp quiz word to readonly (#34225)

### Fixed
- fix: solve when private key import field to always be in error state (#34050)
- fix: solve `Error: Ledger: Unknown error while signing transaction` (#33581)
- fix: regression of lanchdarkly flag key (#34045)
- fix: private key import field to always be in error state (#34050)
- fix: solve `Error: Ledger: Unknown error while signing transaction` (#33581)
- fix: cp-12.22.0 regression of lanchdarkly flag key (#34045)
- fix: bitcoin account type (#34021)
- fix: hides bridge button on non-native asset page if unified is enabled (#34044)
- fix: adds label for unified swap token approvals (#34034)
- fix: prevent infinite render in `WalletDetails` (#34016)
- fix: update follow us on twitter to x (#33990)
- fix: srp words are glitching when toggling show/hide all (#33991)
- fix: tiny-secp256k1 audit (#33995)
- fix: first address interaction alert when trust signal is verified (#33961)
- fix: bridge token address gets copied when Max button is clicked (#33965)
- fix: clicking normal buttons auto submit form (#33979)
- fix: changes in send call validations when batch confirmation is treated as regular send transaction (#33887)
- fix: flaky test `Editing Confirm Transaction allows accessing advance gas fee popover from edit gas fee popover` (#33954)
- fix: srp backup navigation and quiz cp-12.22.0 (#33922)
- fix: Prevent cronjob state from getting out of sync (#33923)
- fix: bump @metamask/multichain-api-client to 0.6.4 to handle multichain api not responding on page load (#33904)
- fix: grammar on activity tab (#31287)
- fix: Prevent `DeFiPositionsController` from polling while UI is closed (#33921)
- fix: Created new migration to remove disabledUpgradeAccountByChain from preferences controller state as old migration had error (#33830)
- fix: flaky test `Vault Corruption` loading increase time (#33916)
- fix: hides fromtoken from the totokenpicker (#33857)
- fix: flaky test `Send ETH from inside MetaMask finds the transaction in the transactions list using advanced gas modal` (#33894)
- fix: scroll to bottom not being triggered on some devices (#33888)
- fix: Change tooltip position on network indicator (#33880)
- fix: Add logic to remove all account labels when needed (#33868)
- fix: fix how different approval types are displayed for batched confirmations (#33809)
- fix: fix pbkdf2 yarn audit (#33863)
- fix: Add missing hooks to `wallet_addEthereumChain` (#33821)
- fix: resubscribe notifications v2 on app startup. (#33805)
- fix: z-index of app header (#33133)
- fix: back srp reveal accessibility and refresh issue (#33807)
- fix: prioritize Contentful banners over hardcoded ones (#33816)
- fix: Using sorting by timestamp for EVM transactions also cp-12.21.0 (#33826)
- fix: Initialize NetworkController completely so it can report errors to Sentry (#33607)
- fix: flaky test `Simulation Details renders buy ERC20 transaction` (#33800)
- fix: replace "Remind" with "remind" in deep link locale messages (#33780)
- fix: flaky `Token List` and `Token Details` specs (#33772)
- fix: prevent swapping between native assets (#34257)
- fix: disconnect of EVM scopes when removing Solana permissions while being connected with Wallet Standard (#33821)
- fix: resume metametrics if not set yet when closing/opening app during onboarding (#34177)
- fix: handle if srp length pasted is not equal to defined srp lengths (#34183)
- fix: cp-12.22.0 flaky `Token List` and `Token Details` specs (#33772)
- fix: bridge tx detail layout fix (#33860)
- fix: Solana single-chain swap failure event not firing on src-chain (#33811)
- fix: max button was shown on native assets incorrectly causing invalid quotes (#34293)
- fix: migrate BSC network RPC from bsc-dataseed.binance.org to bsc infura (#33997)

## [12.22.3]
### Fixed
- fix: resolve infinite loading on spending cap when selected chain differs from dapp (#34355)
- fix: prevent frequent writes while the wallet UI is closed (#34413, #34465, #34506, #34473, #34474)

## [12.22.2]
### Fixed
- Fix crash on older browsers (#34255)

## [12.22.1]
### Fixed
- Display sent amounts from the active swap quote when showing approval warnings to prevent parsing non-numerical inputs (#34156)

## [12.22.0]
### Added
- New onboarding flow (#33704 and others)
- Added basic functionality banner in the carousel (#33095)
- New Multichain Accounts List Menu (#33657)
- Deep links feature (#33663 and others)
- Indicate enforced simulations are active through alternate copy and icon (#33699)
- Added trust signal indicators to the address petname component (#33670)
- Added Berachain, ApeChain and EDU Chain (#33587)
- Do not run trust signals middleware if the user has disabled security alert (#33747)
- Scan the dapp url for malicious behavior when eth_requestAccounts is called (#33627)
- Sync address book contacts (#32632)
- Hooks to enforce simulated balance changes in the future (#33531)
- Display amount of nested transaction in a batch confirmation (#33558)
- Onboard new users with Smart Account opted in by default (#33548)
- Enables Backup & Sync for all users through a migration (#33551)
- Return in wallet_getCapabilities of gasless is supported for an account (#33533)
- Added MultichainAccountTree component (#33647)
- Added support for unified UI (swapping and bridging on a singular page) (#33487)
- Added a base account details component (#33277)
- Added a selector for building new multichain accounts menu (#33606)
- Added provisional Ocap Kernel integration (#33545)
- Integrated the enabledNetworks state from the NetworkOrderController (#33478)
- Empowered the UI to display trust signals for the verifyingContract (#33573)
- Added multi-SRP EVM Account Syncing (#32951)
- Added option to hide SRP pill from account list item (#33544)
- Detect an updated Extension available and prompt for restart (#33381)
- Migration to remove permissions for deleted networks (#33484)
- Added Katana network logo (#33008)
- Bitcoin integration improvements (#33402)
- Added support for remote mode on activity list (#33157)
- Discover bitcoin accounts from SRP import (#33124)
- Prioritize Contentful slides to the start of the banner (#33271)
- Add the MultiTokenPeriod caveat to the send allowance delegation (#33155)
- Allow users to selectively enable specific networks while disabling others (#33114)
- Use the new afterAdd hook to update the transaction when remote mode is available (#33115)

### Changed
- Updated OP logo (#33399)
- Updated connection background and fixed design nits (#33100)
- Adapt the styles of the price chart loading and empty states (#33139)
- Removed snap confirmation page from Swap/Bridge page (#33778)
- Form text field margin and helptext (#33710)
- Updated the NetworkController to enable Base network by default (#33448)

### Fixed
- Update link to MetaMask CLA (#30940)
- Fixed a case where non-unique words in confirm seed phrase would break the SRP quiz (#33781)
- Display "Switch back" instead of "Switch" for smart accounts (#33724)
- Fixed `clipboardRead` permission request in Firefox (#33701)
- Set non-EVM networks to the bottom of the network list unless they are sorted by the user (#33644)
- Fixed migration 165 for the cronjob controller in the case where the previous state doesn't have an events property (#33652)
- Fixes a copy address issue (#33588)
- Fixed "Terms of Use"'s `Approve` button enablement on screens with sub-pixel scaling/scrolling (#33605)
- Remove bitcoin preferences migration (#33554)
- Allow all Bitcoin account types (#33516)
- Fixed performance and memory leak issues in the bridge amount input field and asset picker components (#33507)
- Fixed race condition in send flow validation for token balance check (#33172)
- Fixed max Solana bridge amount based on minimum balance for rent exemption v2 (#33353)
- Disabled non EVM networks on locked screen (#33481)
- Set Solana slippage to 'Auto' in the UI to match with the dynamic slippage that is set by default (#33254)
- Gracefully end sub-stream on port disconnect to prevent Premature close error (#33470)
- Fixed infinite loader in account modal due to not being able to load 7702 network information (#33472)
- Fixed migration for users who do not have tokenListController state (#33439)
- Fixed "max" option in send flow for L2 networks (#33171)
- Carousel slide improved validation for zero balance (#33243)
- Updated the UI to only display the $ symbol and amount after the token quantity has been entered (#33242)
- Fixed case of swapping from USDC on Solana via asset page (#33097)
- Open import SRP button in the existing popup instead of a new window (#33219)
- Provide fallback symbols for missing Solana images (#33206)
- Hide total fiat value when any approval simulation have "unlimited" approvals (#33168)
- Populate gas and gasPrice in requests to security alerts API and PPOMController (#33180)
- When displaying permit signature values as Unlimited, verify against the threshold after applying token decimals (#33194)
- Hide the backup srp reminders for first party snap accounts created from an imported SRP (#33047)
- Support upgrade on accounts imported from private key (#33170)
- Switch account option should not be available for hardware wallet account (#33569)
- Prompt for automated vault recovery from internal vault backup if corruption is detected (#32006)
- Improve useSnapAssetDisplay performance (#33138)

## [12.20.1]
### Changed
- This changelog was split off with 12.22.0
- All older changes can be found in [docs/CHANGELOG_older.md](https://github.com/MetaMask/metamask-extension/blob/main/docs/CHANGELOG_older.md)

[Unreleased]: https://github.com/MetaMask/metamask-extension/compare/v12.23.1...HEAD
[12.23.1]: https://github.com/MetaMask/metamask-extension/compare/v12.23.0...v12.23.1
[12.23.0]: https://github.com/MetaMask/metamask-extension/compare/v12.22.3...v12.23.0
[12.22.3]: https://github.com/MetaMask/metamask-extension/compare/v12.22.2...v12.22.3
[12.22.2]: https://github.com/MetaMask/metamask-extension/compare/v12.22.1...v12.22.2
[12.22.1]: https://github.com/MetaMask/metamask-extension/compare/v12.22.0...v12.22.1
[12.22.0]: https://github.com/MetaMask/metamask-extension/compare/v12.20.1...v12.22.0
[12.20.1]: https://github.com/MetaMask/metamask-extension/releases/tag/v12.20.1

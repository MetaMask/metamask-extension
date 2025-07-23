# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/MetaMask/metamask-extension/compare/v12.22.3...HEAD
[12.22.3]: https://github.com/MetaMask/metamask-extension/compare/v12.22.2...v12.22.3
[12.22.2]: https://github.com/MetaMask/metamask-extension/compare/v12.22.1...v12.22.2
[12.22.1]: https://github.com/MetaMask/metamask-extension/compare/v12.22.0...v12.22.1
[12.22.0]: https://github.com/MetaMask/metamask-extension/compare/v12.20.1...v12.22.0
[12.20.1]: https://github.com/MetaMask/metamask-extension/releases/tag/v12.20.1

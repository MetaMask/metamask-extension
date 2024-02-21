# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [11.10.0]
### Added
- Added preset network image avatars in the 'Select a network' pop-up ([#22643](https://github.com/MetaMask/metamask-extension/pull/22643))
- Expanded Blockaid banner support to include send requests from wallets ([#22321](https://github.com/MetaMask/metamask-extension/pull/22321))
- Expanded Blockaid banner support to include BNB chain, Polygon, Arbitrum, Optimism, Avalanche, and Linea networks ([#22633](https://github.com/MetaMask/metamask-extension/pull/22633))
- Added support for imToken Wallet using EIP-4527 ([#21804](https://github.com/MetaMask/metamask-extension/pull/21804))
- [FLASK] Introduced user operation support, enhancing transaction handling and alert display for user operations ([#22469](https://github.com/MetaMask/metamask-extension/pull/22469))
- [FLASK] Added support for the Lattice hardware wallet in MV3 ([#22528](https://github.com/MetaMask/metamask-extension/pull/22528))
- [FLASK] Added a 'You're sending to a contract' warning to the new send page ([#22551](https://github.com/MetaMask/metamask-extension/pull/22551))

### Changed
- Improved error messaging for Ledger connection issues ([#21038](https://github.com/MetaMask/metamask-extension/pull/21038))
- Updated 'What's New' and 'Settings' to communicate the extension's additional network coverage ([#22618](https://github.com/MetaMask/metamask-extension/pull/22618))
- Enhanced Token List layout for clearer token name and value display ([#22601](https://github.com/MetaMask/metamask-extension/pull/22601))
- Updated the date for the upcoming user survey displayed on the home screen ([#22581](https://github.com/MetaMask/metamask-extension/pull/22581))
- Improved QR code density for compatibility with the ZERO hardware wallet ([#22135](https://github.com/MetaMask/metamask-extension/pull/22135))
- Updated snaps packages to the latest versions ([#22595](https://github.com/MetaMask/metamask-extension/pull/22595))
- Updated the Gas API URL to ensure accurate gas fee calculations for Send and Swap transactions ([#22544](https://github.com/MetaMask/metamask-extension/pull/22544))

### Fixed
- Fixed an issue where clicking on the redirection link did not close the notification window ([#22583](https://github.com/MetaMask/metamask-extension/pull/22583))
- Improved Blockaid 'What's New' image display for users in OS dark mode ([#22649](https://github.com/MetaMask/metamask-extension/pull/22649))
- Added Blockaid dark mode support in the 'What's New' feature and introduced a new theme management utility ([#22613](https://github.com/MetaMask/metamask-extension/pull/22613))
- Ensured all security alert banners correctly trigger events ([#22553](https://github.com/MetaMask/metamask-extension/pull/22553))
- Updated 'What's New' Blockaid image to have a transparent background ([#22539](https://github.com/MetaMask/metamask-extension/pull/22539))
- Fixed unresponsiveness on the phishing warning page ([#22645](https://github.com/MetaMask/metamask-extension/pull/22645))
- Improved Trezor integration by updating to the correct version of the SDK ([#22591](https://github.com/MetaMask/metamask-extension/pull/22591))
- Improved account list links to display the correct explorer domain based on the selected network ([#22483](https://github.com/MetaMask/metamask-extension/pull/22483))
- Improved the reliability of snap installations by resolving an underlying technical issue ([#22602](https://github.com/MetaMask/metamask-extension/pull/22602))

## [11.9.5]
### Fixed
- Fixed sometimes failing confirmation screen security validation checks ([$22978](https://github.com/MetaMask/metamask-extension/pull/22978))

## [11.9.4]
### Fixed
- Fix security advisory https://github.com/advisories/GHSA-78xj-cgh5-2h22 ([#22910](https://github.com/MetaMask/metamask-extension/pull/22890))

## [11.9.3]
### Fixed
- Fix: don't prevent users from editing gas when "Show balance and token price checker" toggle is off ([#22890](https://github.com/MetaMask/metamask-extension/pull/22890))

## [11.9.2]
### Fixed
- [MMI] Patches `@metamask/accounts-controller` to fix an issue with MMI where custodial keyrings could nto be found ([#22730](https://github.com/MetaMask/metamask-extension/pull/22692))

## [11.9.1]
### Fixed
- [MMI] Patches `@metamask/transaction-controller` to fix an issue with MMI where due to a TransactionController refactor, custodial transactions stopped yielding a hash to dapps when they were submitted ([#22730](https://github.com/MetaMask/metamask-extension/pull/22730))

## [11.9.0]
### Added
- Enhanced Snap account identification by displaying the Snap name and icon in the accounts list and wallet overview ([#22342](https://github.com/MetaMask/metamask-extension/pull/22342))
- Added token detection support for Arbitrum, Optimism, Base, and zkSync networks ([#21841](https://github.com/MetaMask/metamask-extension/pull/21841))
- Added fiat balance display to the token import confirmation modal ([#22263](https://github.com/MetaMask/metamask-extension/pull/22263))
- Introduced support for sending and receiving ERC1155 tokens ([#22228](https://github.com/MetaMask/metamask-extension/pull/22228))
- Enhanced Blockaid by enabling direct reporting of false positives via a pre-filled form ([#22274](https://github.com/MetaMask/metamask-extension/pull/22274))
- Enabled Blockaid validations by default for all users ([#22246](https://github.com/MetaMask/metamask-extension/pull/22246))
    - - Announced the default enablement of Blockaid for enhanced security ([#22338](https://github.com/MetaMask/metamask-extension/pull/22338))
- Introduced a loading message for unresponsive deprecated networks ([#22323](https://github.com/MetaMask/metamask-extension/pull/22323))
- Added a deprecation warning for the Goerli testnet selection ([#22264](https://github.com/MetaMask/metamask-extension/pull/22264))
- Introduced a 'What's New' announcement for the Staking feature ([#22291](https://github.com/MetaMask/metamask-extension/pull/22291))
- Added a staking button for Ethereum Mainnet in the Token List ([#22347](https://github.com/MetaMask/metamask-extension/pull/22347))
- Introduced the ability to hide accounts in the Account List Menu ([#22259](https://github.com/MetaMask/metamask-extension/pull/22259))
- Enabled display of a series of asset icons in the Account List Menu ([#22272](https://github.com/MetaMask/metamask-extension/pull/22272))
- Introduced empty balance banners on asset and NFT screens for accounts with zero balance ([#22199](https://github.com/MetaMask/metamask-extension/pull/22199))
- Added account pinning and unpinning feature in the account list menu ([#21865](https://github.com/MetaMask/metamask-extension/pull/21865))
- Added a setting for default full size view of the extension ([#22383](https://github.com/MetaMask/metamask-extension/pull/22383))
- [Flask] Add Petnames functionality to transaction confirmation screens ([#22190](https://github.com/MetaMask/metamask-extension/pull/22190))

### Changed
- Enhanced account restoration to include accounts with ERC20 token balances, regardless of ETH balance ([#22071](https://github.com/MetaMask/metamask-extension/pull/22071))
- Re-enabled the 'Add account Snap' toggle in the experimental settings ([#22260](https://github.com/MetaMask/metamask-extension/pull/22260))
- Updated the Account Management Snaps listing to use the Snaps registry ([#22166](https://github.com/MetaMask/metamask-extension/pull/22166))
- Improved the import token flow with a new design and enhanced user experience ([#21704](https://github.com/MetaMask/metamask-extension/pull/21704))
- Improved Blockaid false positive reporting with an updated URL ([#22403](https://github.com/MetaMask/metamask-extension/pull/22403))
- Updated ConsenSys website URL from consensys.net to consensys.io ([#22412](https://github.com/MetaMask/metamask-extension/pull/22412))
- Enhanced the confirmation screens for managing account snaps ([#22298](https://github.com/MetaMask/metamask-extension/pull/22298))


### Fixed
- Resolved an issue causing the notification window to disappear during QR wallet usage ([#22460](https://github.com/MetaMask/metamask-extension/pull/22460))
- Fixed a redirection issue in the import tokens modal on non-mainnet networks ([#22470](https://github.com/MetaMask/metamask-extension/pull/22470))
- Fixed a redirection issue in the import tokens banner ([#22461](https://github.com/MetaMask/metamask-extension/pull/22461))
- Fixed a display issue during window resizing in the import tokens modal ([#22371](https://github.com/MetaMask/metamask-extension/pull/22371))
- Fixed issue causing contract deployment tx gas estimation to be too low in some cases ([#22374](https://github.com/MetaMask/metamask-extension/pull/22374))
- Fixed an issue to ensure the gas details section is displayed for legacy transactions ([#22404](https://github.com/MetaMask/metamask-extension/pull/22404))
- Ensured total gas fees are displayed for transactions that are set to fail ([#22441](https://github.com/MetaMask/metamask-extension/pull/22441))
- Fixed styling issues in the Snaps custom UI ([#22443](https://github.com/MetaMask/metamask-extension/pull/22443))
- Fixed an issue with Snap UI elements overflowing ([#22467](https://github.com/MetaMask/metamask-extension/pull/22467))
- Resolved an issue that caused an 'unlock request already pending' error when attempting multiple simultaneous actions ([#22241](https://github.com/MetaMask/metamask-extension/pull/22241))
- Removed the MetaMask fee line from the fee details component to avoid potential misunderstanding about its purpose ([#22230](https://github.com/MetaMask/metamask-extension/pull/22230))
- Updated the native token on the Optimism network to ETH ([#22510](https://github.com/MetaMask/metamask-extension/pull/22510))

## [11.8.0]
### Added
- Enhanced the Networks List with drag and drop functionality ([#21163] (https://github.com/MetaMask/metamask-extension/pull/21163))
- Added a deprecation warning for the Aurora network to inform users about its upcoming removal ([#21933] (https://github.com/MetaMask/metamask-extension/pull/21933))

### Changed
- Corrected a typo and improved the alignment of 'Terms of use' ([#22227] (https://github.com/MetaMask/metamask-extension/pull/22227))
- Changed the title of MetaMask pop-up window to 'MetaMask Dialog' ([#21680] (https://github.com/MetaMask/metamask-extension/pull/21680))
- Refined the Max fee calculation in Smart Swaps to ensure it does not exceed twice the estimated gas fee ([#22127] (https://github.com/MetaMask/metamask-extension/pull/22127))
- [MMI] Enabled the Cancel and Speed Up options for non-custodial accounts in MetaMask Institutional ([#22164] (https://github.com/MetaMask/metamask-extension/pull/22164))
- [MMI] Updated Consensys URLs from .net to .io ([#22107] (https://github.com/MetaMask/metamask-extension/pull/22107))
- [FLASK] Updated the background color of the Snap Avatar ([#22137] (https://github.com/MetaMask/metamask-extension/pull/22137))
- [FLASK] Updated the color of the tooltip icon in the transaction confirmation section ([#22144] (https://github.com/MetaMask/metamask-extension/pull/22144))
- [FLASK] Updated the weighting of permissions ([#22063] (https://github.com/MetaMask/metamask-extension/pull/22063))

### Fixed
- Improved the token autodetection feature to automatically trigger detection when the setting is enabled ([#21749] (https://github.com/MetaMask/metamask-extension/pull/21749))
- Fixed an issue causing duplicate entries for confirmed incoming transactions ([#21840] (https://github.com/MetaMask/metamask-extension/pull/21840))
- Fixed a rounding issue causing incorrect gas fee displays on the Optimism network ([#19960] (https://github.com/MetaMask/metamask-extension/pull/19960))
- Fixed an issue causing incorrect EIP-6963 provider names in MetaMask production builds ([#22090] (https://github.com/MetaMask/metamask-extension/pull/22090))
- Fixed a crash that occurred when the list of ordered networks was empty ([#22109] (https://github.com/MetaMask/metamask-extension/pull/22109))
- Fixed an issue where the settings search function only supported English and numbers ([#21013] (https://github.com/MetaMask/metamask-extension/pull/21013))

## [11.7.5]
### Fixed
- Fix compatability of MetaMask Extension and Chrome versions v122 and higher [#22590](https://github.com/MetaMask/metamask-extension/pull/22590)

## [11.7.4]

## [11.7.3]
### Fixed
- Ensure fiat token balances are displayed on the homescreen [#22295](https://github.com/MetaMask/metamask-extension/pull/22295)

## [11.7.2]
### Fixed
- Fixed the activity list occasionally incorrectly showing transaction statuses as failed, pending or dropped [#22319](https://github.com/MetaMask/metamask-extension/pull/22319)

## [11.7.1]
### Added
- Added mapping to hardcode a mapping of ChainIDs to currency symbols [#22292](https://github.com/MetaMask/metamask-extension/pull/22292)

### Changed
- Updated onboarding flow to ensure user is prompted for password during reminder based backup [#22307](https://github.com/MetaMask/metamask-extension/pull/22297)

### Fixed
- Fixed QR scan functionality when sending a transaction to another contact [#22297](https://github.com/MetaMask/metamask-extension/pull/22297)
- Fixed incorrect warnings when adding a chain from a dapp [#22309](https://github.com/MetaMask/metamask-extension/pull/22309)
- Stopped unnecessary Cryptocompare polling when initialize the UI ([#22326](https://github.com/MetaMask/metamask-extension/pull/22326))

## [11.7.0]
### Added
- Added auto-suggestion for ticker symbols in the network form ([#21843](https://github.com/MetaMask/metamask-extension/pull/21843))
- [MMI] Added a new button to "Continue to wallet" ([#21838](https://github.com/MetaMask/metamask-extension/pull/21838))
- [FLASK] Enabled the snaps home page feature ([#21581](https://github.com/MetaMask/metamask-extension/pull/21581))
- [FLASK] Enabled the use of markdown links in custom UI ([#21887](https://github.com/MetaMask/metamask-extension/pull/21887))
- [FLASK] Added a manual snap update feature from the snap view component in extension ([#21773](https://github.com/MetaMask/metamask-extension/pull/21773))
- [FLASK] Added support for snaps domain resolution ([#19131](https://github.com/MetaMask/metamask-extension/pull/19131))

### Changed
- Deprecated U2F and Ledger Live on Chrome ([#18794](https://github.com/MetaMask/metamask-extension/pull/18794))
- Updated the copy for NFT Media display ([#21713](https://github.com/MetaMask/metamask-extension/pull/21713))
- Updated the Popular Networks List ([#21902](https://github.com/MetaMask/metamask-extension/pull/21902))
- Removed unnecessary redirection for swap pages and updated smart swap copy ([#21935](https://github.com/MetaMask/metamask-extension/pull/21935))
- [MMI] Relocated the custodian logo ([#21819](https://github.com/MetaMask/metamask-extension/pull/21819))
- [MMI] Prevented the back button from appearing when the user is in the popup view ([#21851](https://github.com/MetaMask/metamask-extension/pull/21851))
- [MMI] Guarded logic for specific transaction metadata ([#21959](https://github.com/MetaMask/metamask-extension/pull/21959))

### Fixed
- Fixed the copy for backup options in advanced settings ([#21715](https://github.com/MetaMask/metamask-extension/pull/21715))
- Hide loading spinner when the async transaction approval modal is present ([#21637](https://github.com/MetaMask/metamask-extension/pull/21637))
- Fixed the display of the currency preferences toggle ([#21985](https://github.com/MetaMask/metamask-extension/pull/21985))
- Fixed the warning about the missing strong random number source ([#21953](https://github.com/MetaMask/metamask-extension/pull/21953))
- Fixed the issue where the per dapp selected network state is enabled even when the request queue experimental toggle is disabled ([#21946](https://github.com/MetaMask/metamask-extension/pull/21946))
- Fixed the alignment of the NFT send button([#21829](https://github.com/MetaMask/metamask-extension/pull/21829))
- Fixed the warning copy when adding a custom network with an existing currency symbol ([#21500](https://github.com/MetaMask/metamask-extension/pull/21500))
- Stopped unnecessary CoinGecko polling with UI closed and auto token detection on ([#22123](https://github.com/MetaMask/metamask-extension/pull/22123))
- Reduce occurence of bug that can cause fiat balances of tokens to be hidden or excessively stale ([#22151](https://github.com/MetaMask/metamask-extension/pull/22151))

## [11.6.3]
### Fixed
- Fixed a problem related with passing the wrong method name to TransactionController ([#22102](https://github.com/MetaMask/metamask-extension/pull/22102))

## [11.6.2]
### Fixed
- Fixed a problem with including links in Snaps custom UI ([#22086](https://github.com/MetaMask/metamask-extension/pull/22086))

## [11.6.1]
### Fixed
- Updates MMI extension package to the latest version since it includes a fix for the Tx status from custodian transactions. ([#22065](https://github.com/MetaMask/metamask-extension/pull/22065))

## [11.6.0]
### Added
- Introduced the Swedish Krona (SEK) as an available currency option. ([21782](https://github.com/MetaMask/metamask-extension/pull/21782))
- Updated the content in the tooltip for 'Liquidity Source' within the Swaps feature. ([#21696](https://github.com/MetaMask/metamask-extension/pull/21696))
- Update smart transactions controller and add smart transactions to the activity list. Updated the content for Smart Swaps tooltip. ([#21775](https://github.com/MetaMask/metamask-extension/pull/21775))
- Add support for unencrypted snap state ([#21774](https://github.com/MetaMask/metamask-extension/pull/21774))
- [FLASK] Expose the Transaction Insights V2 API ([#20554](https://github.com/MetaMask/metamask-extension/pull/20554))

### Changed
- Improved UI by ensuring that signature content fully occupies the popup container. ([#21585](https://github.com/MetaMask/metamask-extension/pull/21585))
- Updated the network controller with the latest version of eth-json-rpc-middleware to resolve Blockaid validation issues. ([#21727](https://github.com/MetaMask/metamask-extension/pull/21727))
- Enhanced the 'Sign-in With Ethereum' (SIWE) popup by ensuring it spans the full width of the window. ([#21645](https://github.com/MetaMask/metamask-extension/pull/21645))
- Switched to a new blockies identicon renderer, 'blo,' for faster and more accurate rendering, removing the need for library access to the document object. ([#21010](https://github.com/MetaMask/metamask-extension/pull/21010))
- Improved the styling of the security provider section in the settings tab. ([#21629](https://github.com/MetaMask/metamask-extension/pull/21629))
- Enhanced the Bridge button functionality by adding support for BASE_MAINNET and LINEA_MAINNET networks, and making the button visible for any token on allowlisted chains in the TokenOverview page. ([#21691](https://github.com/MetaMask/metamask-extension/pull/21691))
- Remove legacy transaction insight tab ([#21027](https://github.com/MetaMask/metamask-extension/pull/21027))
- Resolve snap derivation path names using SLIP44 when applicable ([#21674](https://github.com/MetaMask/metamask-extension/pull/21674))
- Simplify Snap installation warning modal ([#21516](https://github.com/MetaMask/metamask-extension/pull/21516))
- [MMI] Show unsupported networks message in address tooltip ([#21745](https://github.com/MetaMask/metamask-extension/pull/21745))
- [MMI] Updates custodian onboarding url ([#21726](https://github.com/MetaMask/metamask-extension/pull/21726))

### Fixed
- Enhanced the process of removing a hardware wallet by ensuring that all associated identities are also removed from the UI when the device is forgotten. ([#21755)](https://github.com/MetaMask/metamask-extension/pull/21755))
- Fixed an issue to prevent duplicate NFT imports by ensuring address checksum validation during the import process. ([#21593](https://github.com/MetaMask/metamask-extension/pull/21593))
- Fixed a bug in the 'Add Network' form where warnings and error messages were disappearing prematurely. ([21660](https://github.com/MetaMask/metamask-extension/pull/21660))

## [11.5.2]
### Fixed
- Fix bug that could cause the fetching quotes step of Swaps to fail ([#21923](https://github.com/MetaMask/metamask-extension/pull/21923))

## [11.5.1]
### Fixed
- Fix bug that caused users to be stuck on the loading screen when opening MetaMask if their selected network had stopped working ([#21854](https://github.com/MetaMask/metamask-extension/pull/21854))

## [11.5.0]
### Added
- Updated logging so that signature requests are included in the MetaMask state logs, which can be downloaded from Settings. ([#21207)](https://github.com/MetaMask/metamask-extension/pull/21207))

### Changed
- Updated the token import button to display the number of tokens to be imported ([#21521)](https://github.com/MetaMask/metamask-extension/pull/21521))
- Improved the visibility of the 'Buy & Sell' button label in full-screen mode ([#21568)](https://github.com/MetaMask/metamask-extension/pull/21568))
- Updated the account picker to prevent its background from changing when it is disabled ([#21451)](https://github.com/MetaMask/metamask-extension/pull/21451)) and ([#21450)](https://github.com/MetaMask/metamask-extension/pull/21450))
- Updated 'Copy to Clipboard' functionality to ensure copied content is in plain text format ([#21387 ](https://github.com/MetaMask/metamask-extension/pull/21387))

### Fixed
- Fixed an issue where the correct icon was not displayed for some custom ERC20 tokens ([#21508)](https://github.com/MetaMask/metamask-extension/pull/21508))
- Prevent errors when accessing a token details page for a token not already imported by the user ([#21400)](https://github.com/MetaMask/metamask-extension/pull/21400))
- Ensure ERC20 Token shows correct name ([#21401)](https://github.com/MetaMask/metamask-extension/pull/21401))
- EFixed the send screen so that it clears Hex Data when changing the asset from an ERC20 token to ETH ([#21336)](https://github.com/MetaMask/metamask-extension/pull/21336))
- Fixed an issue where the conversion rate was incorrectly displayed as 'ETH' when sending tokens on Polygon and BNB chains ([#21185)](https://github.com/MetaMask/metamask-extension/pull/21185))
- Fixed the incorrect display of insufficient balance errors when the account issuing the transaction is different from the currently selected account ([#21174)](https://github.com/MetaMask/metamask-extension/pull/21174))
- Fixing truncation and alignment in the network toggle component ([#21370)](https://github.com/MetaMask/metamask-extension/pull/21370))
- Fixed an issue in the transaction history where token amounts sent without decimals were incorrectly displayed as 0([#21338)](https://github.com/MetaMask/metamask-extension/pull/21338))
- Fixed overflow issues in the Blockaid Security Alert ([#21317)](https://github.com/MetaMask/metamask-extension/pull/21317))
- Fix alignment of legacy connect text ([#21552)](https://github.com/MetaMask/metamask-extension/pull/21552))
- Remove network name from the network picker in the Popup view ([#21374)](https://github.com/MetaMask/metamask-extension/pull/21374))

## [11.4.1]
### Changed
- Fixes the snaps website link pointing to the wrong URL. ([#21619](https://github.com/MetaMask/metamask-extension/pull/21619))

### Fixed
- Fix bug that caused Blockaid integration to only display the fallback screen if the user had just switched network ([#21518](https://github.com/MetaMask/metamask-extension/pull/21518))

## [11.4.0]
### Added
- Adds Blockaid transaction security feature to the main build ([#21352](https://github.com/MetaMask/metamask-extension/pull/21352))
- Add ([EIP-6963](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-6963.md)) Provider ([#19908](https://github.com/MetaMask/metamask-extension/pull/19908))

### Changed
- Center text displayed under the loading spinner ([#21319](https://github.com/MetaMask/metamask-extension/pull/21319))
- Adds information on version updates to user state logs ([#21077](https://github.com/MetaMask/metamask-extension/pull/21077))
- Bump snaps packages ([#21165](https://github.com/MetaMask/metamask-extension/pull/21165))
- Change Optimism chain name to OP Mainnet ([#21181](https://github.com/MetaMask/metamask-extension/pull/21181))
- Add separator under 'View on Explorer' menu item ([#21223](https://github.com/MetaMask/metamask-extension/pull/21223))
- Adds a deprecation notice for the "Transaction Data" feature ([#21193](https://github.com/MetaMask/metamask-extension/pull/21193))
- Group Security Alerts and "Opensea + Blockaid" toggles together within Experimental settings  ([#21074](https://github.com/MetaMask/metamask-extension/pull/21074))
- Display network icon next to token amount on confirm screen ([#21205](https://github.com/MetaMask/metamask-extension/pull/21205))
- Allow sending tokens with decimals >20 and <= 32 ([#21147](https://github.com/MetaMask/metamask-extension/pull/21147))
- Remove unsupported currencies from the currency option list in settings ([#21153](https://github.com/MetaMask/metamask-extension/pull/21153))
- Update design of the transaction insights dropdown ([#21231](https://github.com/MetaMask/metamask-extension/pull/21231))
- Allow custom SVGs to be shown in Snaps UIs ([#21255](https://github.com/MetaMask/metamask-extension/pull/21255))
- Add Snap website field to Snap settings page ([#21095](https://github.com/MetaMask/metamask-extension/pull/21095))
- Add Snaps directory link to the banner when at least one Snap is installed ([#21167](https://github.com/MetaMask/metamask-extension/pull/21167))
- [Flask] Add privacy setting to disable external sources of address names ([#21045](https://github.com/MetaMask/metamask-extension/pull/21045))
- [MMI] Stop showing What's New messages in MMI ([#21283](https://github.com/MetaMask/metamask-extension/pull/21283))
- [MMI] Sort accounts in the MMI account list alphabetically ([#21262](https://github.com/MetaMask/metamask-extension/pull/21262))
- [MMI] Auto-switch to the first custodian wallet when importing accounts ([#21253](https://github.com/MetaMask/metamask-extension/pull/21253))
- Add line breaks in the account details modal if account names are too long ([#21204](https://github.com/MetaMask/metamask-extension/pull/21204))
- [MMI] Update some colouring of the MMI logo ([#21186](https://github.com/MetaMask/metamask-extension/pull/21186))
- [MMI] Reduce the number of screens in the MMI onboarding flow ([#20905](https://github.com/MetaMask/metamask-extension/pull/20905))

### Fixed
- Ensure that 3rd party network requests are not sent when "Network Details Check" is off ([#21260](https://github.com/MetaMask/metamask-extension/pull/21260))
- [MMI] fix custody confirm link missing locale and variable ([#21239](https://github.com/MetaMask/metamask-extension/pull/21239))
- Ensure trigger of next button on token approval page does not skip final approval ([#21214](https://github.com/MetaMask/metamask-extension/pull/21214))
- Ensure users can switch accounts during the send flow without resulting in ERC20 token sending errors ([#21264](https://github.com/MetaMask/metamask-extension/pull/21264))

## [11.3.0]
### Added
- Display total fiat balance on home screen ([#20941](https://github.com/MetaMask/metamask-extension/pull/20941))
- Give the user the ability to opt out of 3rd party network validation when adding a new network ([#20816](https://github.com/MetaMask/metamask-extension/pull/20816))
- Adds conversion buttons to buy, receive, and learn more about NFTs when an account is empty. ([#21049](https://github.com/MetaMask/metamask-extension/pull/21049))
- What's New modal for the latest Buy and Sell features ([#20965](https://github.com/MetaMask/metamask-extension/pull/20965))
- [Flask] Suggest names for Ethereum addresses in signature requests using installed snaps ([#20959](https://github.com/MetaMask/metamask-extension/pull/20959))

### Changed
- Move the token detection prompt to the top of the assets list ([#20932](https://github.com/MetaMask/metamask-extension/pull/20932))
- Adds address validation to the Import NFT modal ([#21028](https://github.com/MetaMask/metamask-extension/pull/21028))
- Add error message to the Import NFT modal if an NFT with that tokenId already exists ([#20940](https://github.com/MetaMask/metamask-extension/pull/20940))
- Show a warning when sending 0 tokens ([#21091](https://github.com/MetaMask/metamask-extension/pull/21091))
- Enable bridge button on the zkSync network, and for some tokens on other networks ([#21085](https://github.com/MetaMask/metamask-extension/pull/21085))
- Stop displaying a mismatched account warning on the Sign In With Ethereum page ([#21107](https://github.com/MetaMask/metamask-extension/pull/21107))
- Ensure "Enhanced Token Detection" is toggled off when opening "Advanced Configuration" during onboarding ([#20960](https://github.com/MetaMask/metamask-extension/pull/20960))
- Improve loading speed/performance upon opening MetaMask ([#20843](https://github.com/MetaMask/metamask-extension/pull/20843))
- Ensure logos are displayed on "Popular Networks" added from within MetaMask ([#20895](https://github.com/MetaMask/metamask-extension/pull/20895))
- Show more characters in the addresses in the Connected Sites account list ([#21048](https://github.com/MetaMask/metamask-extension/pull/21048))
- Replaces the "Add / Import / Hardware" links with a single button that takes the user to another quick modal to add, import, or connect a hardware wallet.([#21081](https://github.com/MetaMask/metamask-extension/pull/21081))
- Disable the "Buy" button on the Sepolia network ([#20839](https://github.com/MetaMask/metamask-extension/pull/20839))
- Update the "Buy" button to a "Buy & Sell" button ([#20891](https://github.com/MetaMask/metamask-extension/pull/20891))
- Only display the Notification item in the dropdown menu if the user has installed a snap using the notifications permission ([#20913](https://github.com/MetaMask/metamask-extension/pull/20913))
- Update Snaps Settings screen ([#21061](https://github.com/MetaMask/metamask-extension/pull/21061))
- Site connection icon now indicates a connection if a dapp is connected to a snap ([#20811](https://github.com/MetaMask/metamask-extension/pull/20811))
- Update copy on the remove snap modal ([#21065](https://github.com/MetaMask/metamask-extension/pull/21065))
- Update the padding of the transaction insight dropdown ([#21022](https://github.com/MetaMask/metamask-extension/pull/21022))
- [Flask] Suggest names for Ethereum addresses in signature requests using services such as ENS and Etherscan ([#20831](https://github.com/MetaMask/metamask-extension/pull/20831))

### Fixed
- Fix to ensure contract address is pre-populated, and NFT is removed from token list, when converting a token to an NFT  ([#20747](https://github.com/MetaMask/metamask-extension/pull/20747))
- Fix autodetect tokens link so that the user is correctly taken to the right scroll position in settings ([#20978](https://github.com/MetaMask/metamask-extension/pull/20978))
- Ensure safe batch NFT transfers show display recipient address correctly ([#21042](https://github.com/MetaMask/metamask-extension/pull/21042))
- Fix bug that can prevent MetaMask from loading, and be stuck on the loading screen, on Firefox ([#20992](https://github.com/MetaMask/metamask-extension/pull/20992))
- Ensure correct network icon is displayed in the "You have switched to" modal when switching to "Popular Networks" ([#21016](https://github.com/MetaMask/metamask-extension/pull/21016))
- Ensure disconnecting a single dapp from a snap only disconnects that dapp ([#20983](https://github.com/MetaMask/metamask-extension/pull/20983))
- Fix the Snap npm link so that it leads to the stated version of the npm package ([#20897](https://github.com/MetaMask/metamask-extension/pull/20897))
- Fix to prevent crashes when switching network during a snaps confirmation ([#21088](https://github.com/MetaMask/metamask-extension/pull/21088))
- Fix issue that could cause crashes when attempting to render certain NFTs ([#21418](https://github.com/MetaMask/metamask-extension/pull/21418))


## [11.2.0]
### Added
- Adds Swaps support for the zkSync Era network ([#20809](https://github.com/MetaMask/metamask-extension/pull/20809))

### Changed
- Increase account list height, so that it uses all available screen space and displays more accounts ([#20745](https://github.com/MetaMask/metamask-extension/pull/20745))
- Update Snaps What's New text translations in 14 languages ([#20734](https://github.com/MetaMask/metamask-extension/pull/20734))
- Remove hover background on Account Picker ([#20794](https://github.com/MetaMask/metamask-extension/pull/20794))
- Show the first letter or number in a Snap's name as the icon, and not a symbol character, if there is no icon ([#20851](https://github.com/MetaMask/metamask-extension/pull/20851))
- Set initial background color to system theme ([#20858](https://github.com/MetaMask/metamask-extension/pull/20858))
- Increase network list height, so that it uses all available screen space and displays more networks ([#20801](https://github.com/MetaMask/metamask-extension/pull/20801))
- Improve visual spacing and borders on connected sites in the snap details page ([#20854](https://github.com/MetaMask/metamask-extension/pull/20854))
- [FLASK] Bump snaps packages ([#20567](https://github.com/MetaMask/metamask-extension/pull/20567))
- [MMI] Added code fences to hide emojis just for MMI build ([#20754](https://github.com/MetaMask/metamask-extension/pull/20754))
- [MMI] Show the NFT tab content for mmi ([#20830](https://github.com/MetaMask/metamask-extension/pull/20830))
- [MMI] Changed the wrong privacy policy URL to the good one ([#20884](https://github.com/MetaMask/metamask-extension/pull/20884))
- [MMI] Shows Stake & Portfolio buttons and hides the Buy and Bridge buttons ([#20767](https://github.com/MetaMask/metamask-extension/pull/20767))

### Fixed
- Ensure all NFT lists are sorted by the NFT's id ([#20796](https://github.com/MetaMask/metamask-extension/pull/20796))
- Fix custom amount editing on token approval screens ([#20804](https://github.com/MetaMask/metamask-extension/pull/20804))

## [11.1.2]
### Fixed
- Prevent crashes for users that have NFTs without an image and/r limited image data ([#21176](https://github.com/MetaMask/metamask-extension/pull/21176))

## [11.1.1]
### Fixed
- Ensure NFT settings notice in the NFT import modal is shown and hidden correctly, and that the modal is hidden when clicking the link to settings ([#21100](https://github.com/MetaMask/metamask-extension/pull/21100))
- Modify settings toggle copy to more accurately describe behaviour ([#21109](https://github.com/MetaMask/metamask-extension/pull/21109))

## [11.1.0]
### Added
- What's New popup on dropping of support for Ledger support for firefox ([#19498](https://github.com/MetaMask/metamask-extension/pull/19498))
- Network Menu Search ([#19985](https://github.com/MetaMask/metamask-extension/pull/19985))
- Added Gnosis Chain to the popular custom network list ([#19324](https://github.com/MetaMask/metamask-extension/pull/19324))
- Added a toggle to allow users to turn off IPFS image resolution ([#20172](https://github.com/MetaMask/metamask-extension/pull/20172))
- Added toggles to allow users a per-network opt-out of incoming transactions functionality ([#20363](https://github.com/MetaMask/metamask-extension/pull/20363))
- Added a toggle to allow users to opt-out of 4byte contract method names resolution ([#20098](https://github.com/MetaMask/metamask-extension/pull/20098))
- MetaMask Institutional releases will now be available from the releases page ([#20788](https://github.com/MetaMask/metamask-extension/pull/20788))

### Changed
- Display a "Buy more" link in swaps if the user has insufficient funds for a proposed swap ([#20241](https://github.com/MetaMask/metamask-extension/pull/20241))
- Show the network name in Delete Network modal ([#20309](https://github.com/MetaMask/metamask-extension/pull/20309))
- Updated the description for NFT Media related settings toggles ([#20380](https://github.com/MetaMask/metamask-extension/pull/20380))
- Prevent users from adding and deleting networks when MetaMask is locked ([#20277](https://github.com/MetaMask/metamask-extension/pull/20277))
- Move "Enable Opensea API" and "NFT Autodetect" settings toggle into the Security & Privacy section ([#20278](https://github.com/MetaMask/metamask-extension/pull/20278))
Update styles and spacing on the critical error page  ([#20350](https://github.com/MetaMask/metamask-extension/pull/20350))
- Updated the description of the "Batch account balance requests" settings toggle ([#20269](https://github.com/MetaMask/metamask-extension/pull/20269))
- Update swaps price acknowledge behaviour, so that if the price difference percentage changes, the user has to re-confirm the acknowledgement message ([#19961](https://github.com/MetaMask/metamask-extension/pull/19961))
- Prevent flash of a screen change in the Swaps UI before redirects to the homepage ([#20236](https://github.com/MetaMask/metamask-extension/pull/20236))
- Autofocus the Address field in Import NFT modal ([#20225](https://github.com/MetaMask/metamask-extension/pull/20225))
- Added a toggle to allow users to disable ENS DNS resolution ([#20102](https://github.com/MetaMask/metamask-extension/pull/20102))
- Remove the portfolio button from global menu ([#20221](https://github.com/MetaMask/metamask-extension/pull/20221))
- Allow user to set Add Account name to default name by pressing enter ([#20168](https://github.com/MetaMask/metamask-extension/pull/20168))
- Remove the underline from network menu text when hovering cursor on text ([#20063](https://github.com/MetaMask/metamask-extension/pull/20063))
- Only show a tooltip on network menu network names if they are at least 20 characters long ([#20009](https://github.com/MetaMask/metamask-extension/pull/20009))
- Added background color to test network badges in the activity list ([#20068](https://github.com/MetaMask/metamask-extension/pull/20068))
- Add privacy relevant description to footer of hardware wallet connect screen ([#20121](https://github.com/MetaMask/metamask-extension/pull/20121))
- Updated translations in 14 languages ([#20563](https://github.com/MetaMask/metamask-extension/pull/20563)), ([#18017](https://github.com/MetaMask/metamask-extension/pull/18017))
- opBNB transaction UX is now the same as Optimism ([#20715](https://github.com/MetaMask/metamask-extension/pull/20715))
- Modify size of icons throughout the UI ([#20557](https://github.com/MetaMask/metamask-extension/pull/20557))
- Modify spacing around in the custom token form ([#20661](https://github.com/MetaMask/metamask-extension/pull/20661))
- Disabled the buy button on the Sepolia network ([#20617](https://github.com/MetaMask/metamask-extension/pull/20617))
- Disabled blocked (e.g. unsafe or untrusted) tokens in the Swaps token list ([#20625](https://github.com/MetaMask/metamask-extension/pull/20625))
- Modify the design of the watch NFT page header ([#20569](https://github.com/MetaMask/metamask-extension/pull/20569))
- Show a slippage modal, which a user has to confirm, if a swaps slippage is too high or too low ([#20364](https://github.com/MetaMask/metamask-extension/pull/20364))
- Allow trezor users to select the legacy MEW HD path when connecting their HW wallet ([#19552](https://github.com/MetaMask/metamask-extension/pull/19552))
- Remove some spacing in the home screen UI ([#20441](https://github.com/MetaMask/metamask-extension/pull/20441))
- Remove some spacing in the NFT collection UI ([#20442](https://github.com/MetaMask/metamask-extension/pull/20442))
- Modify the visual alignment of the "MetaMask Support" links ([#20354](https://github.com/MetaMask/metamask-extension/pull/20354))
- Remove the "Source" and "Link" URLs from NFT details ([#20248](https://github.com/MetaMask/metamask-extension/pull/20248))
- Modify full screen settings styles and spacing ([#20676](https://github.com/MetaMask/metamask-extension/pull/20676)) ([#20674](https://github.com/MetaMask/metamask-extension/pull/20674))
- Switch display order of fiat and eth values in Account List Menu ([#20334](https://github.com/MetaMask/metamask-extension/pull/20334))
- Update OpenSea alert placement on Token Allowance, Confirm Pages, SIWE, and Signature V3/V4 pages ([#20530](https://github.com/MetaMask/metamask-extension/pull/20530))
- Update scroll behaviour on Snaps install screens, so users can scroll with a button, and proceed to the next screen after scrolling to the bottom once ([#20889](https://github.com/MetaMask/metamask-extension/pull/20889))
- Allow easier viewing of all permissions in the dapp permission modal, by making the list of permissions scrollable ([#20409](https://github.com/MetaMask/metamask-extension/pull/20409))
- Improve spacing and border styling on Snaps details page ([#20854](https://github.com/MetaMask/metamask-extension/pull/20854))


### Fixed
- Fix display of fiat conversions on Linea network ([#20672](https://github.com/MetaMask/metamask-extension/pull/20672))
- Fixed the token import flow so that users can import multiple tokens simultaneously ([#20224](https://github.com/MetaMask/metamask-extension/pull/20224))
- Fix to ensure the "Network added successfully" popover closes when the user clicks outside the modal ([#20359](https://github.com/MetaMask/metamask-extension/pull/20359))
- Fix to allow users to remove custom networks, with chain ids that match our "Popular Networks", from the network menu ([#20220](https://github.com/MetaMask/metamask-extension/pull/20220))
- Fix to prevent unecessary splitting of text into multiple lines, in the settings menu. ([#19914](https://github.com/MetaMask/metamask-extension/pull/19914))
- Fix to ensure metrics events are not sent before user opt-in to MetaMetrics ([#20101](https://github.com/MetaMask/metamask-extension/pull/20101))
- Fix position of a warning triangle icon on Snap Install Warning ([#20712](https://github.com/MetaMask/metamask-extension/pull/20712))
- Fix to ensure small and trailing zeroed numbers on the Send screen are displayed correctly ([#20666](https://github.com/MetaMask/metamask-extension/pull/20666))
- Restore hold-to-reveal button for private key export ([#20109](https://github.com/MetaMask/metamask-extension/pull/20109))
- Fix eth-sign toggle alignment in settings ([#20587](https://github.com/MetaMask/metamask-extension/pull/20587))
- Fix to ensure proper validation and error handling of custom IPFS gateway input in settings ([#19700](https://github.com/MetaMask/metamask-extension/pull/19700))
- Properly display trailing elipses in long numbers in the swaps UI ([#20525](https://github.com/MetaMask/metamask-extension/pull/20525))
- Prevent disabled Snaps from appearing in the transaction insight Snap dropdown on the Confirmation screen ([#20850](https://github.com/MetaMask/metamask-extension/pull/20850))

## [11.0.0]
### Added
- [FLASK] Added snaps lifecycle hooks ([#20230](https://github.com/MetaMask/metamask-extension/pull/20230))

### Changed
- [FLASK] Unblock `personal_sign` for snaps ([#19998](https://github.com/MetaMask/metamask-extension/pull/19998))
- [FLASK] Allow disabling markdown in snaps UI ([#20069](https://github.com/MetaMask/metamask-extension/pull/20069))

### Fixed
- [FLASK] Fix regression in transaction confirmation tabs ([#20267](https://github.com/MetaMask/metamask-extension/pull/20267))

## [10.35.1]
### Changed
- Store default gas settings by network ([#20576](https://github.com/MetaMask/metamask-extension/pull/20576), [#20632](https://github.com/MetaMask/metamask-extension/pull/20632))
- Add more diagnostic information upon failure ([#20595](https://github.com/MetaMask/metamask-extension/pull/20595))

### Fixed
- Fix bug resulting in custom network configuration being lost upon restart ([#20586](https://github.com/MetaMask/metamask-extension/pull/20586))
- Fix UI crash when balances are missing ([#20385](https://github.com/MetaMask/metamask-extension/pull/20385))
- Fix infinite rerender on network change while signature request is pending ([#20473](https://github.com/MetaMask/metamask-extension/pull/20473))
- Fix Dapp link on NFT import screen ([#19799](https://github.com/MetaMask/metamask-extension/pull/19799))
- Fix 'View on Opensea' link for main and testnet NFTs ([#19797](https://github.com/MetaMask/metamask-extension/pull/19797))
- Ensure chainId comparison in switchEthereumChain handler is case insensitive ([#20149](https://github.com/MetaMask/metamask-extension/pull/20149))
- Enforce user preferences in incoming transactions controller ([#19982](https://github.com/MetaMask/metamask-extension/pull/19982))

## [10.35.0]
### Added
- Add the ability to customize tx nonce on ERC20 approval screens ([#17945](https://github.com/MetaMask/metamask-extension/pull/17945))
- Improved gas estimates on Base network ([#20097](https://github.com/MetaMask/metamask-extension/pull/20097))

### Changed
- Update the "Spending Cap Request" screen (also known as the "ERC 20 approval" or "token allowance" screen) ([#19666](https://github.com/MetaMask/metamask-extension/pull/19666))
    - Populate the "Custom Spending Cap" input with the dapp suggesed value
    - Show "Use Site Suggestion" button when user changes input
    - Update copy
    - Add a "Learn more" link
- Update icons and text of Activity Screen, and categorize transactions by dates ([#19557](https://github.com/MetaMask/metamask-extension/pull/19557))
- Change the "Import NFTs" UI from a full screen page to a modal ([#19806](https://github.com/MetaMask/metamask-extension/pull/19806))
- Add loading indicator when clicking Refresh list on tokens screen ([#19952](https://github.com/MetaMask/metamask-extension/pull/19952))
- Bolden "Done" text for priv key export button ([#20059](https://github.com/MetaMask/metamask-extension/pull/20059))
- Added background color of test network icons in the network menu ([#20032](https://github.com/MetaMask/metamask-extension/pull/20032))
- Ensure "Show test networks" is toggled on if current network is a test network ([#20048](https://github.com/MetaMask/metamask-extension/pull/20048))
- Disable the "Show test networks" toggle when the currently selected network is a test network ([#19951](https://github.com/MetaMask/metamask-extension/pull/19951))
- Increase size of nft detection text ([#20053](https://github.com/MetaMask/metamask-extension/pull/20053))
- Add underline to most link texts on hover ([#19992](https://github.com/MetaMask/metamask-extension/pull/19992))
- Move MetaMask fee and quote list to new line for swap review quote ([#20030](https://github.com/MetaMask/metamask-extension/pull/20030))
- Change the "Import NFTs" UI from a full screen page to a modal ([#19806](https://github.com/MetaMask/metamask-extension/pull/19806))
- Change "Hardware wallet" link text to "Add Hardware wallet" ([#20026](https://github.com/MetaMask/metamask-extension/pull/20026))
- Remove the portfolio icon from the screen (because it is now it the three dot menu) ([#19988](https://github.com/MetaMask/metamask-extension/pull/19988))
- Use System Theme colors for tooltip ([#19954](https://github.com/MetaMask/metamask-extension/pull/19954))
- Separate the test networks from other networks in the "Select a network" popup ([#19812](https://github.com/MetaMask/metamask-extension/pull/19812))
- Update "three dot" menu on token screen ([#19765](https://github.com/MetaMask/metamask-extension/pull/19765))
    - Make the token's three-dot menu smaller
    - Move it next to the breadcrumbs
    - Remove the "Account Details" option from the token detail menu
- Update BNB Chain name from "BNB Smart Chain" to "BNB Chain" ([#19836](https://github.com/MetaMask/metamask-extension/pull/19836))
- [FLASK] Allow Snaps to use `eth_accounts` as a revokable permission ([#19306](https://github.com/MetaMask/metamask-extension/pull/19306))


### Fixed
- Fix "Hold to reveal SRP" button on mobile browsers ([#19847](https://github.com/MetaMask/metamask-extension/pull/19847))
- Correctly show network name and selection when chainIds collide ([#19947](https://github.com/MetaMask/metamask-extension/pull/19947))
- Fix misaligned icons in 'Connected sites' modal ([#19944](https://github.com/MetaMask/metamask-extension/pull/19944))
- Show the icon of the correct network in the "badge" associated with token icon's in the assets list  ([#19964](https://github.com/MetaMask/metamask-extension/pull/19964))
- Stop showing "product tour" steps when on the Swaps screen ([#19938](https://github.com/MetaMask/metamask-extension/pull/19938))
- Fixing auto scrolling to settings when searching within Advanced and Security settings ([#19771](https://github.com/MetaMask/metamask-extension/pull/19771))
- Fixed connected sites icon's background color ([#19891](https://github.com/MetaMask/metamask-extension/pull/19891))
- Fix to ensure "Account Details" is displayed when that option is selected from each accounts three-dot menu within the Account Menu ([#19857](https://github.com/MetaMask/metamask-extension/pull/19857))
- Render correct image in the asset dropdown while sending an NFT ([#19787](https://github.com/MetaMask/metamask-extension/pull/19787))
- Removed grey line from connected sites modal if there are no connected sites ([#20036](https://github.com/MetaMask/metamask-extension/pull/20036))
- [FLASK] Fix overflow on snaps connect screen ([#19995](https://github.com/MetaMask/metamask-extension/pull/19995))
- [FLASK] Fix Snaps UI divider ([#19919](https://github.com/MetaMask/metamask-extension/pull/19919))
- [FLASK] Fix fetch for snap registry ([#19866](https://github.com/MetaMask/metamask-extension/pull/19866))
- [FLASK] Fix Snaps UI divider ([#19919](https://github.com/MetaMask/metamask-extension/pull/19919))

## [10.34.5]
### Changed
- Improve error diagnostic information
  - Add additional logging for state migrations ([#20424](https://github.com/MetaMask/metamask-extension/pull/20424), [#20517](https://github.com/MetaMask/metamask-extension/pull/20517), [#20521](https://github.com/MetaMask/metamask-extension/pull/20521))
  - Improve diagnostic state snapshot ([#20457](https://github.com/MetaMask/metamask-extension/pull/20457), [#20491](https://github.com/MetaMask/metamask-extension/pull/20491), [#20428](https://github.com/MetaMask/metamask-extension/pull/20428), [#20458](https://github.com/MetaMask/metamask-extension/pull/20458))
  - Capture additional errors when state migrations fail ([#20427](https://github.com/MetaMask/metamask-extension/pull/20427))

### Fixed
- Fix bug where state was temporarily incomplete upon initial load ([#20468](https://github.com/MetaMask/metamask-extension/pull/20468))
  - In rare circumstances, this bug may have resulted in data loss (of preferences, permissions, or tracked NFTs/tokens) or UI crashes.

## [10.34.4]
### Changed
- Updated snaps execution environment ([#20420](https://github.com/MetaMask/metamask-extension/pull/20420))

## [10.34.3]
### Fixed
- Ensure users phishing warning list is properly updated ([#20381](https://github.com/MetaMask/metamask-extension/pull/20381))
- Fix inaccurate info in swaps flow for zero-balance tokens ([#20388](https://github.com/MetaMask/metamask-extension/pull/20388))
- Fix 'Global Menu Explorer / Account Details' What's New notification display ([#20371](https://github.com/MetaMask/metamask-extension/pull/20371))

## [10.34.2]
### Added
- Add Address Details and View on Explorer to Global Menu ([#20013](https://github.com/MetaMask/metamask-extension/pull/20013))

## Changed
- Increase copy clipboard time ([#20008](https://github.com/MetaMask/metamask-extension/pull/20008))
- Show checksum addresses on account list menu ([#20217](https://github.com/MetaMask/metamask-extension/pull/20217/commits/41bab4a6e14682388f4021f2f51bc74bddcbe80e))
- Scroll to selected account when opening account list menu ([#20166](https://github.com/MetaMask/metamask-extension/pull/20166))
- Remove fallback phishing warning configuration ([#20327](https://github.com/MetaMask/metamask-extension/pull/20327))
  - The phishing warning feature will no longer function if the wallet is unable to receive configuration updates. Previously a fallback config was used in this case, but we found that it was too outdated to be helpful and it caused many problems for users.
- Improved UI for downloading state logs on Chromium-based browsers ([#19872](https://github.com/MetaMask/metamask-extension/pull/19872))
  - We now use a file picker to let you select the download location, rather than saving the state logs in your downloads folder.

### Fixed
- Fixed bug that could cause loss of network or token data for users upgrading from old versions ([#20276](https://github.com/MetaMask/metamask-extension/pull/20276))
- Fix crash on open of MetaMask for some users that have old network data in state ([#20345](https://github.com/MetaMask/metamask-extension/pull/20345))

## [10.34.1]
### Fixed
- Fix bug that could cause a failure in the persistence of network related data ([#20080](https://github.com/MetaMask/metamask-extension/pull/20080))
- Fix possible crash when opening the network menu ([#20181](https://github.com/MetaMask/metamask-extension/pull/20181))

## [10.34.0]
### Added
- Add a security quiz to the SRP reveal ([#19283](https://github.com/MetaMask/metamask-extension/pull/19283))
- [FLASK] Add Snaps keyring and new snap accounts related pages ([#19710](https://github.com/MetaMask/metamask-extension/pull/19710))


### Changed
- Decrease boldness of text in some labels ([#19731](https://github.com/MetaMask/metamask-extension/pull/19731))

### Fixed
- Fix design inconsistencies in the connect flow ([#19800](https://github.com/MetaMask/metamask-extension/pull/19800))
- Fix connection issues on some dapps, and ensure that `eth_requestAccount` returns accounts when opening multiple tabs for the same dapp ([#19727](https://github.com/MetaMask/metamask-extension/pull/19727))
- Fix UI bugs in contacts page ([#19646](https://github.com/MetaMask/metamask-extension/pull/19646))
- Ensure correct logo shown on Linea ([#19717](https://github.com/MetaMask/metamask-extension/pull/19717))
- Fix the autolock field in settings on firefox ([#19653](https://github.com/MetaMask/metamask-extension/pull/19653))
- Prevent duplicate account names that only differ by letter casing ([#19616](https://github.com/MetaMask/metamask-extension/pull/19616))
- Ensure token details stay within asset dropdown border ([#19626](https://github.com/MetaMask/metamask-extension/pull/19626))
- Prevent rounded corners in account menu ([#19615](https://github.com/MetaMask/metamask-extension/pull/19615))
- Ensure network changes before the user accepts a wallet_watchAsset request add the NFT to pre-change chain ID and address ([#19629](https://github.com/MetaMask/metamask-extension/pull/19629))
- Fix performance degradations noticable on Firefox builds ([#19993](https://github.com/MetaMask/metamask-extension/pull/19993))
- Fix copy to clipboard of public address, so that it is only cleared from the clipboard after 60 seconds ([#19948](https://github.com/MetaMask/metamask-extension/pull/19948))
- Fix overlapping text, in some language, in home screen buttons ([#19920](https://github.com/MetaMask/metamask-extension/pull/19920))


## [10.33.1]
### Fixed
- Fix to bug causing users to see an infinite spinner when signing typed messages. ([#19894](https://github.com/MetaMask/metamask-extension/pull/19894))

## [10.33.0]
### Added
- UI Upgrade ([#18903](https://github.com/MetaMask/metamask-extension/pull/18903))
    - A completely new application header, which contains:
        - A new network picker, which displays as only an avatar in the popup and as a full dropdown in full screen mode
        - A new account picker
        - A new connected icon which displays in popup mode
        - A new global menu which contains controls that were formally in the account menu as well as account options menu
    - A new token list
    - A new token details popover
- Added the ability to navigate multiple SIWE notifications ([#18103](https://github.com/MetaMask/metamask-extension/pull/18103))
- Add portfolio button in on home screen, under the balance([#19601](https://github.com/MetaMask/metamask-extension/pull/19601))
- Add support for ERC721 and ERC1155 tokens to `wallet_watchAsset` API ([#19454](https://github.com/MetaMask/metamask-extension/pull/19454))
- Add support for Cronos, Moonbeam, Moonriver, Aurora, Harmony and Palm to the 'Buy Crypto' feature ([#19268](https://github.com/MetaMask/metamask-extension/pull/19268))
- [FLASK] Add Snaps privacy warning on snap install ([#18835](https://github.com/MetaMask/metamask-extension/pull/18835))

### Changed
- Redesign swaps feature to be faster and easier to use ([#19169](https://github.com/MetaMask/metamask-extension/pull/19169))
- Update linea testnet rpc url ([#19294](https://github.com/MetaMask/metamask-extension/pull/19294))
- Make `eth_accounts` return all permitted accounts ([#18516](https://github.com/MetaMask/metamask-extension/pull/18516))
- When gas fees suggested by dapp is too high, show warning color and icon ([#19088](https://github.com/MetaMask/metamask-extension/pull/19088))
- Show balance and selected account in the header on the SIWE screen ([#19361](https://github.com/MetaMask/metamask-extension/pull/19361))
- Submit the account creation form when pressing enter ([#19620](https://github.com/MetaMask/metamask-extension/pull/19620))
- [FLASK] Rework Snaps headers and footers ([#19442](https://github.com/MetaMask/metamask-extension/pull/19442))
- Send flow UI update ([#19465](https://github.com/MetaMask/metamask-extension/pull/19465))
    - Remove Recents
    - Display a list of "Your accounts" if the user has more than one account
    - Display "Contacts" in alphabetical order after the final user's account
    - UI Updates in Contacts Page (AddressBook) in Settings Page
- [FLASK] Small UI improvements ([#19388](https://github.com/MetaMask/metamask-extension/pull/19388))
- [FLASK] Limit notification count display to 99+ ([#19449](https://github.com/MetaMask/metamask-extension/pull/19449))
- [FLASK] Update snap tweaks ([#19410](https://github.com/MetaMask/metamask-extension/pull/19410))
- [FLASK] Add snap icon SVG validation ([#19377](https://github.com/MetaMask/metamask-extension/pull/19377))
- [FLASK] Update rate limits for showInAppNotification and showNativeNotification ([#19621](https://github.com/MetaMask/metamask-extension/pull/19621))
- [FLASK] Align update error state with Figma ([#19547](https://github.com/MetaMask/metamask-extension/pull/19547))
- [FLASK] Update snap installation permission warning UI ([#19494](https://github.com/MetaMask/metamask-extension/pull/19494))
- [FLASK] Improve snaps connect flow ([#19461](https://github.com/MetaMask/metamask-extension/pull/19461))

### Fixed
- Fix centering and spacing of icons in the Add Network screen ([#19513](https://github.com/MetaMask/metamask-extension/pull/19513))
- Fix details when transferring NFT not added to wallet ([#19045](https://github.com/MetaMask/metamask-extension/pull/19045))
- Fix capitalization of MetaMask in some translations ([#19466](https://github.com/MetaMask/metamask-extension/pull/19466))
- Fix space occurring after footer on token approve screen ([#19276](https://github.com/MetaMask/metamask-extension/pull/19276))
- Fix unknown processing time not showing in warning color on confirmation screens ([#19527](https://github.com/MetaMask/metamask-extension/pull/19527))


## [10.32.0]
### Added
- Enable token detection for the Aurora network ([#19009](https://github.com/MetaMask/metamask-extension/pull/19009))
- Add reveal UI to export private key flow ([#18170](https://github.com/MetaMask/metamask-extension/pull/18170))

### Changed
- [FLASK] **BREAKING:** Block `wallet_requestPermissions` ([#18913](https://github.com/MetaMask/metamask-extension/pull/18913))
- [FLASK] Fix issues with installing specific versions of snaps ([#18913](https://github.com/MetaMask/metamask-extension/pull/18913))

### Fixed
- [FLASK] Fix an issue with submitting an empty Snaps UI prompt ([#19227](https://github.com/MetaMask/metamask-extension/pull/19227))
- Display contract address as recipient when value is included with standard token transactions (#18855)
- Fix the display of token count in SetApprovalForAll screen  (#18863)
- Disable Previous Button on First Page of hardware wallet account selection flow (#17610)
- [Flask] Prevent lavamoat errors in the console caused by attempting to inject the provider to snaps iframe (#19096)
- Fix to ensure popover scroll button is correctly shown and hidden in the WhatsNewPopup (#19017)
- Fix: Show network picker when locked (#19063)

## [10.31.1]
### Fixed
- Fix signature requests for Keystone Hardware Wallet users ([#19349](https://github.com/MetaMask/metamask-extension/pull/19349))

## [10.31.0]
### Added
- Add extra friction to enable eth_sign in advanced settings ([#18848](https://github.com/MetaMask/metamask-extension/pull/18848))
- Fix for wrong type being assigned to the transaction ([#18818](https://github.com/MetaMask/metamask-extension/pull/18818))
- Update Snaps icon in settings search and fix missing icon ([#18803](https://github.com/MetaMask/metamask-extension/pull/18803))
- Update Korean transactions ([#18799](https://github.com/MetaMask/metamask-extension/pull/18799))
- Show Bridge button in TokenOverview component ([#18630](https://github.com/MetaMask/metamask-extension/pull/18630))
- Update trezor-connect to v9. Introduced trezor changes are documented at [trezor-suite](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/CHANGELOG.md). ([#18302](https://github.com/MetaMask/metamask-extension/pull/18302))

### Changed
- Adding new icons ([#18870](https://github.com/MetaMask/metamask-extension/pull/18870))
- Changed Chinese translation for "Average" password strength([#18897](https://github.com/MetaMask/metamask-extension/pull/18897))
- Update Ledger instruction banner for transactions ([#17937](https://github.com/MetaMask/metamask-extension/pull/17937))
- Enable editing L2 gas on optimism ([#18217](https://github.com/MetaMask/metamask-extension/pull/18217))
- Update keystone links ([#18792](https://github.com/MetaMask/metamask-extension/pull/18792))
- Remove Goerli buy link and disable button ([#18137](https://github.com/MetaMask/metamask-extension/pull/18137))
- No long show best quote, only present a list of quotes. ([#19284](https://github.com/MetaMask/metamask-extension/pull/19284))
- [FLASK] Don't show the title on Install/Update when it's loading ([#19012](https://github.com/MetaMask/metamask-extension/pull/19012))
- [FLASK] Add updated version of the Snaps settings UI ([#18438](https://github.com/MetaMask/metamask-extension/pull/18438), ([#18775](https://github.com/MetaMask/metamask-extension/pull/18775)))

### Fixed
- Fix terms of use popover scroll button hiding when scollbar is at the bottom. ([#18843](https://github.com/MetaMask/metamask-extension/pull/18843))
- Fix in approve header to show correct account name ([#18849](https://github.com/MetaMask/metamask-extension/pull/18849))
- Fix error when switching to Linea testnet using wallet_switchEthereumChain ([#18710](https://github.com/MetaMask/metamask-extension/pull/18710))
- Fix for persistant currency conversion on multi layer transactions when the show balance setting is off ([#18833](https://github.com/MetaMask/metamask-extension/pull/18833))
- Show the right "balance needed" value if we fallback from STX to regular Swaps ([#19230](https://github.com/MetaMask/metamask-extension/pull/19230))
- [FLASK] Fix overflowing notification content ([#18881](https://github.com/MetaMask/metamask-extension/pull/18881))
- [FLASK] Fix missing icon for webassembly endowment ([#18781](https://github.com/MetaMask/metamask-extension/pull/18781))
- [FLASK] Fix text selection bug in snap ui ([#18719](https://github.com/MetaMask/metamask-extension/pull/18719))

## [10.30.4]
### Fixed
- Fix error upon submitting multiple requests that require approval ([#19050](https://github.com/MetaMask/metamask-extension/pull/19050))
  - The affected requests were `eth_sendTransaction`, `wallet_watchAsset`, `eth_getEncryptionPublicKey`, and `eth_decrypt`

## [10.30.3]
### Fixed
- Restore support for chains that return hex or number responses to `net_version` ([#19156](https://github.com/MetaMask/metamask-extension/pull/19156))

## [10.30.2]
### Changed
- Improve `eth_signTypedData_v4` validation ([#19110](https://github.com/MetaMask/metamask-extension/pull/19110))

### Fixed
- Fix crash when confirming an approval where the `maxPriorityFeePerGas` is zero ([#19102](https://github.com/MetaMask/metamask-extension/pull/19102))

## [10.30.1]
### Fixed
- Disable Flask RPC test to fix failing build ([#19011](https://github.com/MetaMask/metamask-extension/pull/19011))

## [10.30.0]
### Added
- Updating Terms of Use, Adding popover and onboarding flow check ([#18221](https://github.com/MetaMask/metamask-extension/pull/18221))

### Changed
- Update ethereum logo icon ([#18528](https://github.com/MetaMask/metamask-extension/pull/18528))
- Update send icon ([#18411](https://github.com/MetaMask/metamask-extension/pull/18411))
- Disabling network and account changes after the send flow is initiated ([#18086](https://github.com/MetaMask/metamask-extension/pull/18086))
- [FLASK] Redesign `dropdown-tab` ([#18546](https://github.com/MetaMask/metamask-extension/pull/18546))
- New reusable gas-display component ([#17976](https://github.com/MetaMask/metamask-extension/pull/17976))
- "Insufficient balance for gas" error no longer prevents from continuing to confirm transaction screen ([#18554](https://github.com/MetaMask/metamask-extension/pull/18554))

### Removed
- Remove mobile sync feature ([#18692](https://github.com/MetaMask/metamask-extension/pull/18692))

### Fixed
- Fix ability to close "NFT successful import" modal ([#18504](https://github.com/MetaMask/metamask-extension/pull/18504))
- Fix "Unable to determine contract standard" error ([#18300](https://github.com/MetaMask/metamask-extension/pull/18300))

## [10.29.0]
### Added
- [FLASK] Redesign snaps permission screens ([#18372](https://github.com/MetaMask/metamask-extension/pull/18372))
- [FLASK] Add tooltips to show info about a permission ([#17685](https://github.com/MetaMask/metamask-extension/pull/17685))

### Changed
- Add Ledger instructions to the Sign In With Ethereum page ([#18589](https://github.com/MetaMask/metamask-extension/pull/18589))
- Removed advanced gas toggle from the settings ([#18138](https://github.com/MetaMask/metamask-extension/pull/18138))
- Improve security provider warning messaging, to give users more info about transactions security providers flag as potentially suspicious ([#18545](https://github.com/MetaMask/metamask-extension/pull/18545))
- Update wording on token allowance screen: replace "contract" with "third party" ([#18101](https://github.com/MetaMask/metamask-extension/pull/18101))
- Update wording on token allowance screen: change the review spending cap header text ([#18214](https://github.com/MetaMask/metamask-extension/pull/18214))
- Added fallback copy for when we're not able to retrieve a erc721 or erc1155 name in the setApprovalForAll screen ([#17992](https://github.com/MetaMask/metamask-extension/pull/17992))
- Bump contract-metadata version, so that tokens added ([v2.3.0](https://github.com/MetaMask/contract-metadata/pull/1169)) and ([v2.3.1](https://github.com/MetaMask/contract-metadata/pull/1173)) are included in the default MetaMask token lists ([#18589](https://github.com/MetaMask/metamask-extension/pull/18589))
- [FLASK] Redesign snap content delineator ([#18385](https://github.com/MetaMask/metamask-extension/pull/18385))
- [FLASK] Redesign key management modal ([#18263](https://github.com/MetaMask/metamask-extension/pull/18263))
- [FLASK] Redesign snap authorship component ([#18262](https://github.com/MetaMask/metamask-extension/pull/18262))
- [FLASK] Improve design of snaps settings page when no snaps are installed ([#18172](https://github.com/MetaMask/metamask-extension/pull/18172))
- [FLASK] Remove permission footer in snap install/update flow ([#18240](https://github.com/MetaMask/metamask-extension/pull/18240))
- [FLASK] **BREAKING:** Snaps are now required to request permission for at least one handler permission (e.g. `onRpcRequest`) ([#18371](https://github.com/MetaMask/metamask-extension/pull/18371))
- [FLASK] Fix issues with using `atob` and `btoa` in snaps ([#18371](https://github.com/MetaMask/metamask-extension/pull/18371))
- [FLASK] Combine the snap installation popups into a single popup ([#18142](https://github.com/MetaMask/metamask-extension/pull/18142))
- [FLASK] **BREAKING:** Disallow snaps requesting `eth_requestAccounts` and `wallet_requestSnaps` RPC methods ([#18142](https://github.com/MetaMask/metamask-extension/pull/18142))

### Fixed
- Add a title to the security provider "What's New" notification ([#18526](https://github.com/MetaMask/metamask-extension/pull/18526))
- Fix cursor styling on Sign Typed Data screen to use the 'pointer' cursor ([#18046](https://github.com/MetaMask/metamask-extension/pull/18046))
- Fix layout/styling of the "Hold to reveal" button in the SRP reveal flow([#18496](https://github.com/MetaMask/metamask-extension/pull/18496))
- Fixed hardware wallet info popup on token allowance screen ([#17881](https://github.com/MetaMask/metamask-extension/pull/17881))
- Fix send flow on Optimism Goerli network ([#18478](https://github.com/MetaMask/metamask-extension/pull/18478))
- Disabled button for Import Tokens Modal when no token is selected ([#18396](https://github.com/MetaMask/metamask-extension/pull/18396))
- [FLASK] Fix crash when requesting unknown snap permission ([#18447](https://github.com/MetaMask/metamask-extension/pull/18447))
- [FLASK] Fix overflow issues with text coming from snap UI ([#18169](https://github.com/MetaMask/metamask-extension/pull/18169))
- [FLASK] Snaps e2e test stability improvements ([#18090](https://github.com/MetaMask/metamask-extension/pull/18090))

## [10.28.3]
### Fixed
- Fix network switching prompted by dapps for users that added the network prior to v10.28.0. ([#18513](https://github.com/MetaMask/metamask-extension/pull/18513))

## [10.28.2]
### Fixed
- Fix network switching prompted by dapps by fixing the `wallet_switchEthereumChain` handler. ([#18483](https://github.com/MetaMask/metamask-extension/pull/18483))
- Fix to ensure all users see the NFT and transaction security notifications ([#18460](https://github.com/MetaMask/metamask-extension/pull/18460))
- Fix issue blocking Hindi, Japanese and Turkish language users from installing from the Chrome store ([#18487](https://github.com/MetaMask/metamask-extension/pull/18487))
- [FLASK] Fix window overflow issues with snap UI text ([#18169](https://github.com/MetaMask/metamask-extension/pull/18169))

## [10.28.1]
### Changed
- Fix release automation ([#18427](https://github.com/MetaMask/metamask-extension/pull/18427))

## [10.28.0]
### Added
- Adding NFT autodetection to "What's New" Announcements ([#17653](https://github.com/MetaMask/metamask-extension/pull/17653))
- [FLASK] Add WebAssembly endowment ([#17694](https://github.com/MetaMask/metamask-extension/pull/17694))
- Bridge tokens by redirecting to Portfolio from wallet overview page ([#17952](https://github.com/MetaMask/metamask-extension/pull/17952))
- [MMI] Adds the MMI support link and the mmi_website link as well ([#17853](https://github.com/MetaMask/metamask-extension/pull/17853))
- What's new - OpenSea security provider ([#16831](https://github.com/MetaMask/metamask-extension/pull/16831))
- Open sea security provider warning message ([#17662](https://github.com/MetaMask/metamask-extension/pull/17662))
- SRP hold to reveal ([#17232](https://github.com/MetaMask/metamask-extension/pull/17232))
- Additional incoming transactions support ([#14219](https://github.com/MetaMask/metamask-extension/pull/14219))

### Changed
- UX: Localize the avatar-favicon description text ([#18132](https://github.com/MetaMask/metamask-extension/pull/18132))
- 17921 Update TransactionAlerts with BannerAlert ([#17940](https://github.com/MetaMask/metamask-extension/pull/17940))
- Part of 17670: Replace Typography with Text confirm-approve-content.component.js and home.component.js ([#18049](https://github.com/MetaMask/metamask-extension/pull/18049))
- UX: Icon: Update buy icon ([#18123](https://github.com/MetaMask/metamask-extension/pull/18123))
- Display internet protocol on the domain in SIWE screen ([#18052](https://github.com/MetaMask/metamask-extension/pull/18052))
- Wrap balance and portfolio button ([#18109](https://github.com/MetaMask/metamask-extension/pull/18109))
- UX Icon: Updated Icon for Disclosure ([#17877](https://github.com/MetaMask/metamask-extension/pull/17877))
- Updating AvatarWithBage to BadgeWrapper ([#17851](https://github.com/MetaMask/metamask-extension/pull/17851))
- [FLASK] BREAKING - snaps-monorepo@0.30.0 ([#17718](https://github.com/MetaMask/metamask-extension/pull/17718))
- increment keyring controller version ([#18036](https://github.com/MetaMask/metamask-extension/pull/18036))
- Bump Snow 1.5.0 ([#17985](https://github.com/MetaMask/metamask-extension/pull/17985))
- Avoid blob url for files downloads ([#17986](https://github.com/MetaMask/metamask-extension/pull/17986))
- Upgrading the Import Account modal ([#17763](https://github.com/MetaMask/metamask-extension/pull/17763))
- identify desktop is paired in the metrics event ([#17892](https://github.com/MetaMask/metamask-extension/pull/17892))
- [MMI] Conditional change title in home if buildType is MMI ([#17898](https://github.com/MetaMask/metamask-extension/pull/17898))
- [MMI] Prevent multiple instances of MM at the same browser ([#17856](https://github.com/MetaMask/metamask-extension/pull/17856))
- Buy crypto by redirecting to onramp experience on pdapp instead of deposit popover ([#17689](https://github.com/MetaMask/metamask-extension/pull/17689))
- Update snaps locale messages for casing and content ([#17915](https://github.com/MetaMask/metamask-extension/pull/17915))
- Ux: Icon: Update fa-eye with ICON_NAMES.EYE ([#17800](https://github.com/MetaMask/metamask-extension/pull/17800))
- UX: Icon: Stop using fa-times ([#17811](https://github.com/MetaMask/metamask-extension/pull/17811))
- Selector performance improvements ([#17410](https://github.com/MetaMask/metamask-extension/pull/17410))
- UX: Update Settings Icon ([#17561](https://github.com/MetaMask/metamask-extension/pull/17561))
- UX Icon: updated fa-exclamation-circle ([#17879](https://github.com/MetaMask/metamask-extension/pull/17879))
- Update minimum browser versions ([#12847](https://github.com/MetaMask/metamask-extension/pull/12847))
- UX: Icon: Remove fa-exclamation-triangle usages ([#17691](https://github.com/MetaMask/metamask-extension/pull/17691))
- UX: Icons: Remove icon-import ([#17816](https://github.com/MetaMask/metamask-extension/pull/17816))
- UX: Icons: Remove IconCheck and fa-check ([#17787](https://github.com/MetaMask/metamask-extension/pull/17787))
- UX Icon: updated fas-question icon ([#17828](https://github.com/MetaMask/metamask-extension/pull/17828))
- UX: Icons: Stop using FA in TransactionActivityLog ([#17667](https://github.com/MetaMask/metamask-extension/pull/17667))
- Ux: Icon: Improve alignment of asset list chevron ([#17791](https://github.com/MetaMask/metamask-extension/pull/17791))
- UX: Icons: Remove IconWithLabel ([#17815](https://github.com/MetaMask/metamask-extension/pull/17815))
- UX: Move Portfolio link to its own button ([#17722](https://github.com/MetaMask/metamask-extension/pull/17722))
- UX Icon: Replace fa-user ([#17809](https://github.com/MetaMask/metamask-extension/pull/17809))
- UX: Icons: Fix alignment of settings icons in full screen ([#17783](https://github.com/MetaMask/metamask-extension/pull/17783))
- Cleanup: clearTimeout on useEffect for gas estimation and prevent state update on unmounted ConfirmTransactionBase ([#17804](https://github.com/MetaMask/metamask-extension/pull/17804))
- Part of 17670: Replace Typography with Text approve-content-card ([#17753](https://github.com/MetaMask/metamask-extension/pull/17753))
- UX: Icons: Remove lock icon ([#17739](https://github.com/MetaMask/metamask-extension/pull/17739))
- Update HelpText component ([#17705](https://github.com/MetaMask/metamask-extension/pull/17705))
- Change transaction type for send with approve transaction ([#17777](https://github.com/MetaMask/metamask-extension/pull/17777))
- UX: Icon: Remove Plus icon ([#17666](https://github.com/MetaMask/metamask-extension/pull/17666))
- Updating TextField component ([#17732](https://github.com/MetaMask/metamask-extension/pull/17732))
- UX:  Update three-dot icon for settings ([#17558](https://github.com/MetaMask/metamask-extension/pull/17558))
- Updating Label component ([#17731](https://github.com/MetaMask/metamask-extension/pull/17731))
- Pass `excludedPermissions` to `SnapController` ([#17321](https://github.com/MetaMask/metamask-extension/pull/17321))
- UX: Update fa-search icon ([#17527](https://github.com/MetaMask/metamask-extension/pull/17527))
- UX: Icons: Remove legacy connect icon ([#17673](https://github.com/MetaMask/metamask-extension/pull/17673))
- UX: Icons: Remove usage of pencil icon ([#17676](https://github.com/MetaMask/metamask-extension/pull/17676))
- Rename reset account settings ([#17457](https://github.com/MetaMask/metamask-extension/pull/17457))
- Make username mandatory in the edit contact screen ([#17425](https://github.com/MetaMask/metamask-extension/pull/17425))
- New Crowdin translations by Github Action ([#17082](https://github.com/MetaMask/metamask-extension/pull/17082))

### Removed
- NFTs: Remove feature flag for release ([#17401](https://github.com/MetaMask/metamask-extension/pull/17401))
- Removed a feature flag ([#17922](https://github.com/MetaMask/metamask-extension/pull/17922))
- UX: Remove legacy metametrics modal ([#17817](https://github.com/MetaMask/metamask-extension/pull/17817))
- UX: Icons: Remove unused overview icons ([#17671](https://github.com/MetaMask/metamask-extension/pull/17671))
- Remove CancelTransaction modal ([#17819](https://github.com/MetaMask/metamask-extension/pull/17819))

### Fixed
- Fix ThemeType casing issue ([#18039](https://github.com/MetaMask/metamask-extension/pull/18039))
- Fix #17948 - Allow editing of NFT sends ([#17970](https://github.com/MetaMask/metamask-extension/pull/17970))
- Fix #17848 - Ensure NFT collections toggle appropriately ([#17972](https://github.com/MetaMask/metamask-extension/pull/17972))
- Force update mock state and render nfts item test fix ([#18044](https://github.com/MetaMask/metamask-extension/pull/18044))
- fix network dropdown bug ([#18079](https://github.com/MetaMask/metamask-extension/pull/18079))
- Fix #17932 - Ensure NFT last sold price is formatted correctly ([#17983](https://github.com/MetaMask/metamask-extension/pull/17983))
- Use tokenList to get token details, when available, in getTokenStanda… ([#17891](https://github.com/MetaMask/metamask-extension/pull/17891))
- delay chain validation ([#17413](https://github.com/MetaMask/metamask-extension/pull/17413))
- fix(17542): fix fiat currency display in few txn actions ([#18011](https://github.com/MetaMask/metamask-extension/pull/18011))
- fix(17716): increase threshold to include all options for nonce search ([#17999](https://github.com/MetaMask/metamask-extension/pull/17999))
- fix issue with fragment messageIds ([#17949](https://github.com/MetaMask/metamask-extension/pull/17949))
- UX: Icons: Fix Chevrons in Settings Tabs ([#17971](https://github.com/MetaMask/metamask-extension/pull/17971))
- fix(17857): show correctly converted account balance in sign&encrypt windows ([#17973](https://github.com/MetaMask/metamask-extension/pull/17973))
- Edit Token Transfer displays mixed info with regular Send Tx (ETH) ([#17507](https://github.com/MetaMask/metamask-extension/pull/17507))
- fix(17855): persist popup when sw is restarted ([#17855](https://github.com/MetaMask/metamask-extension/pull/17855))
- Fix incorrect balance in signature request header ([#17829](https://github.com/MetaMask/metamask-extension/pull/17829))
- fix keeping the user login after the first login ([#17950](https://github.com/MetaMask/metamask-extension/pull/17950))
- Fixed accounts auto scrolling ([#17075](https://github.com/MetaMask/metamask-extension/pull/17075))
- Fix a bug where non-address types would be rendered as addresses in EIP-712 ([#17846](https://github.com/MetaMask/metamask-extension/pull/17846))
- Transaction-list-item-details pop up to display the correct token information on token approve item ([#17422](https://github.com/MetaMask/metamask-extension/pull/17422))
- ConfirmDecryptMessage: avoid mutation of state in decryptMsg/completedTx action ([#17895](https://github.com/MetaMask/metamask-extension/pull/17895))
- Fix GetEncryptionKey TypeError Cannot destructure property 'msgParams' of 'txData' ([#17808](https://github.com/MetaMask/metamask-extension/pull/17808))
- Fix state in confirm transaction ([#17838](https://github.com/MetaMask/metamask-extension/pull/17838))
- window open noopener ([#17882](https://github.com/MetaMask/metamask-extension/pull/17882))
- avoid mutation of state in signTransaction action ([#17772](https://github.com/MetaMask/metamask-extension/pull/17772))
- MenuItem: Fix layout of menu item with subtitle ([#17650](https://github.com/MetaMask/metamask-extension/pull/17650))
- fix: fix url for flask build ([#17784](https://github.com/MetaMask/metamask-extension/pull/17784))

## [10.27.0]
### Added
- feat: add the ConsenSys zkEVM (Linea) as a default network ([#17875](https://github.com/MetaMask/metamask-extension/pull/17875))

## [10.26.2]
### Changed
- Sign in with Ethereum: re-enable warning UI for mismatched domains / disable domain binding ([#18200](https://github.com/MetaMask/metamask-extension/pull/18200))

## [10.26.1]
### Fixed
- Fix main build by modifying desktop build steps ([#18112](https://github.com/MetaMask/metamask-extension/pull/18112))

## [10.26.0]
### Added
- Adding browser outdated notification ([#17027](https://github.com/MetaMask/metamask-extension/pull/17027))
- Add hardcoded list of human-readable snap names ([#17595](https://github.com/MetaMask/metamask-extension/pull/17595))
- Add hardcoded list of human-readable snap derivation paths ([#17627](https://github.com/MetaMask/metamask-extension/pull/17627))
- remove siwe feature flag ([#17690](https://github.com/MetaMask/metamask-extension/pull/17690))

### Changed
- TransactionDecoding: rm unwanted cursor: pointer ([#17318](https://github.com/MetaMask/metamask-extension/pull/17318))
- Fix #17138 - Allow ActionMessage to be autohidden after a given number of milliseconds ([#17269](https://github.com/MetaMask/metamask-extension/pull/17269))
- chore: copy update for metamask fee on swaps ([#17133](https://github.com/MetaMask/metamask-extension/pull/17133))
- Use PageContainerFooter to render footer on all confirmation pages ([#17316](https://github.com/MetaMask/metamask-extension/pull/17316))
- Enable the Token Allowance flow by default for all users ([#16740](https://github.com/MetaMask/metamask-extension/pull/16740))
- [FLASK] Update onboarding text to fit new panel ([#17345](https://github.com/MetaMask/metamask-extension/pull/17345))
- Copy update on Transaction breakdown for ApproveToken ([#17296](https://github.com/MetaMask/metamask-extension/pull/17296))
- [GridPlus] Bumps `gridplus-sdk` to v2.4.1 ([#16847](https://github.com/MetaMask/metamask-extension/pull/16847))
- Update home portfolio dapp icon to new icon ([#17471](https://github.com/MetaMask/metamask-extension/pull/17471))
- Update copy when revoking setApprovalForAll ([#17500](https://github.com/MetaMask/metamask-extension/pull/17500))
- Fix #17441 - Update all MenuItem instances to use new icons ([#17468](https://github.com/MetaMask/metamask-extension/pull/17468))
- New Icons: Replace instance of fa-qr-code icon ([#17474](https://github.com/MetaMask/metamask-extension/pull/17474))
- Update overview icons for buy, send, and swap ([#17492](https://github.com/MetaMask/metamask-extension/pull/17492))
- Adjust 'Confirm' button color on setApprovalForAll revocations ([#17506](https://github.com/MetaMask/metamask-extension/pull/17506))
- updated tag icon ([#17540](https://github.com/MetaMask/metamask-extension/pull/17540))
- UX: Update support icon ([#17560](https://github.com/MetaMask/metamask-extension/pull/17560))
- fix: update ledger logo ([#17616](https://github.com/MetaMask/metamask-extension/pull/17616))
- Sort permissions based on weight ([#17660](https://github.com/MetaMask/metamask-extension/pull/17660))
- Sanitising string on signature request pages ([#17571](https://github.com/MetaMask/metamask-extension/pull/17571))
- UX: Update block explorer icon ([#17562](https://github.com/MetaMask/metamask-extension/pull/17562))
- Fix recent recipient order ([#16346](https://github.com/MetaMask/metamask-extension/pull/16346))
- UX: Icons: Use proper send icon on wallet and token overview pages ([#17720](https://github.com/MetaMask/metamask-extension/pull/17720))
- Do not display experiment settings tab when there are no settings to show ([#17765](https://github.com/MetaMask/metamask-extension/pull/17765))
- UX: Icons: Stop using fa-address-book ([#17761](https://github.com/MetaMask/metamask-extension/pull/17761))
- UX: Replace all fa-bell instances with Notification icon ([#17524](https://github.com/MetaMask/metamask-extension/pull/17524))
- UX: Icons: Remove usage of chevron fa- icons ([#17668](https://github.com/MetaMask/metamask-extension/pull/17668))
- UX: Icon: Restore missing back chevron in settings ([#17916](https://github.com/MetaMask/metamask-extension/pull/17916))
- Update the PhishingController to v2 and update phishing warning page ([#17835](https://github.com/MetaMask/metamask-extension/pull/17835))

### Removed
- Remove a notification for falling back from STX to regular swaps ([#17374](https://github.com/MetaMask/metamask-extension/pull/17374))

### Fixed
- Fix transaction decoding data types `string` and `bool` ([#17299](https://github.com/MetaMask/metamask-extension/pull/17299))
- i18n: fix es privacy policy links ([#17315](https://github.com/MetaMask/metamask-extension/pull/17315))
- Added fix for overlaping text in mozzila in activity tab ([#17235](https://github.com/MetaMask/metamask-extension/pull/17235))
- Restore support for Chromium v78 ([#17251](https://github.com/MetaMask/metamask-extension/pull/17251))
- remove snap notifications when uninstalled ([#17487](https://github.com/MetaMask/metamask-extension/pull/17487))
- Fix #17439 - Prevent event error when user presses enter key during onboarding ([#17497](https://github.com/MetaMask/metamask-extension/pull/17497))
- Added navigation between multiple sign prompts and reject all sign prompts ([#17093](https://github.com/MetaMask/metamask-extension/pull/17093))
- Fix RPC Url editing issue of existing network ([#17451](https://github.com/MetaMask/metamask-extension/pull/17451))
- Fix http-cache-semantics dependency vulnerability GHSA-rc47-6667-2j5j ([#17563](https://github.com/MetaMask/metamask-extension/pull/17563))
- UX: Fix token image not displaying in asset listing ([#17575](https://github.com/MetaMask/metamask-extension/pull/17575))
- Fix for error during sending to multisig address ([#17651](https://github.com/MetaMask/metamask-extension/pull/17651))
- Ensure simulation failure warning is shown on all networks and accounts ([#17458](https://github.com/MetaMask/metamask-extension/pull/17458))
- Fix currency symbol in insufficient balance warning ([#17820](https://github.com/MetaMask/metamask-extension/pull/17820))

## [10.25.0]
### Added
- Add new app translations ([#15999](https://github.com/MetaMask/metamask-extension/pull/15999))
- Add Celo to the popular custom network list ([#16745](https://github.com/MetaMask/metamask-extension/pull/16745))
- [FLASK] Add markdown formatting capabilities for Snaps UI ([#16911](https://github.com/MetaMask/metamask-extension/pull/16911))
- [FLASK] Add basic renderer for Snaps UI ([#16605](https://github.com/MetaMask/metamask-extension/pull/16605))

### Changed
- No longer displaying warning upon switching networks when there are no pending confirmations ([#17179](https://github.com/MetaMask/metamask-extension/pull/17179))
- Remove 'Verify contract details' link on Signature Request screen when there is no verifying contract ([#17128](https://github.com/MetaMask/metamask-extension/pull/17128))
- Show portfolio tooltip when "Protect your funds" popover is not on screen ([#17084](https://github.com/MetaMask/metamask-extension/pull/17084))
- Set default theme to dark when system preferred theme is set to dark ([#15870](https://github.com/MetaMask/metamask-extension/pull/15870))
- Require a username when adding a new contact to the address book ([#17044](https://github.com/MetaMask/metamask-extension/pull/17044))
- Update styles for "Transaction security check" toggle in settings ([#16830](https://github.com/MetaMask/metamask-extension/pull/16830))
- Display set block explorer in copy on transaction completion popup ([#16300](https://github.com/MetaMask/metamask-extension/pull/16300))
- Updating text colors for Sepolia and Goerli networks ([#16928](https://github.com/MetaMask/metamask-extension/pull/16928))
- Include L1 fees for quotes on Optimism ([#16998](https://github.com/MetaMask/metamask-extension/pull/16998))
- Factor in Optimism's L1 fees in to fee total for approval transactions ([#16929](https://github.com/MetaMask/metamask-extension/pull/16929))
- Update "Share your feedback" link location for Beta versions ([#16853](https://github.com/MetaMask/metamask-extension/pull/16853))
- Remove New Address Alert in send transaction flow ([#14811](https://github.com/MetaMask/metamask-extension/pull/14811))
- Allow submissions of transactions with a gas or priority fee of 0 ([#16651](https://github.com/MetaMask/metamask-extension/pull/16651))
- Disable eth_sign by default, allow users to toggle it back on ([#17308](https://github.com/MetaMask/metamask-extension/pull/17308))
- [FLASK] Use custom UI for transaction insights ([#16912](https://github.com/MetaMask/metamask-extension/pull/16912))
- [FLASK] Use custom UI dialogs ([#16912](https://github.com/MetaMask/metamask-extension/pull/16912))

### Fixed
- Fix tab redirect issue when a non-English language is set ([#17155](https://github.com/MetaMask/metamask-extension/pull/17155))
- Fix duplicate gas fee estimate displayed on testnets ([#17207](https://github.com/MetaMask/metamask-extension/pull/17207))
- Fix app-breaking error when an alphabetical character is entered in the spending cap field for token allowance ([#17117](https://github.com/MetaMask/metamask-extension/pull/17117))
- Fix alignment issues in contacts tab ([#17171](https://github.com/MetaMask/metamask-extension/pull/17171))
- Fix gas fee currency symbol in transaction details activity log ([#16948](https://github.com/MetaMask/metamask-extension/pull/16948))
- Fix function type display in sign typed message confirmation screen ([#17077](https://github.com/MetaMask/metamask-extension/pull/17077))
- Fix duplicate button issue on Ledger connectivity screen ([#17130](https://github.com/MetaMask/metamask-extension/pull/17130))
- Fix issue in settings search input when spaces are entered in-between terms ([#17108](https://github.com/MetaMask/metamask-extension/pull/17108))
- Fix incorrect transaction type when transaction data is not prefixed with '0x' ([#17055](https://github.com/MetaMask/metamask-extension/pull/17055))
- Fix account name collision issue ([#16752](https://github.com/MetaMask/metamask-extension/pull/16752))
- Fix caching issue with detected token data ([#16866](https://github.com/MetaMask/metamask-extension/pull/16866))
- Fix warning display on confirmation screens when a transaction is expected to fail ([#17437](https://github.com/MetaMask/metamask-extension/pull/17437))
- [FLASK] Fix race condition with transaction insights ([#16956](https://github.com/MetaMask/metamask-extension/pull/16956))
- [FLASK] Fix crash after Snap confirmation approval ([#16864](https://github.com/MetaMask/metamask-extension/pull/16864))

## [10.24.2]
### Fixed
- Fix incorrect network information after switching networks when "Show balance and token price checker" is toggled off ([#17450](https://github.com/MetaMask/metamask-extension/pull/17450))
- Improve rendering time of signTypedData confirmation screens for large payloads ([#17432](https://github.com/MetaMask/metamask-extension/pull/17432))

## [10.24.1]
### Added
- Ensure app name appears for Taiwanese language speakers in the extension stores ([#17304](https://github.com/MetaMask/metamask-extension/pull/17304))

## [10.24.0]
### Added
- Add NFT setApprovalForAll warning popover when approving the NFT Colleciton ([#16195](https://github.com/MetaMask/metamask-extension/pull/16195))
- Add "What's New" notification for Security & Privacy ([#16783](https://github.com/MetaMask/metamask-extension/pull/16783))
- Add informational message on Signature request screen as a user guidance ([#16600](https://github.com/MetaMask/metamask-extension/pull/16600))
- Add ability to opt out from getting balances as a batch request for all loaded accounts ([#16746](https://github.com/MetaMask/metamask-extension/pull/16746))
- Add Signature request warning modal ([#16225](https://github.com/MetaMask/metamask-extension/pull/16225))
- Add Improved Token Allowance experience toggle under Experimental Settings ([#16291](https://github.com/MetaMask/metamask-extension/pull/16291))
- Add "What's New" Notification for Improved token Allowance Experience ([#16465](https://github.com/MetaMask/metamask-extension/pull/16465))
- Add new IT translations ([#15748](https://github.com/MetaMask/metamask-extension/pull/15748))
- Add new zh_TW translations and apply a variety of fixes ([#11212](https://github.com/MetaMask/metamask-extension/pull/11212))
- Add ES translations for getting Ethereum Accounts permission message ([#15660](https://github.com/MetaMask/metamask-extension/pull/15660))
- Add "Verify contract details" link to SetApprovalForAll confirmation screens ([#15756](https://github.com/MetaMask/metamask-extension/pull/15756))
- Add Reject Transactions modal to be present in the footer of the Approve screen ([#16832](https://github.com/MetaMask/metamask-extension/pull/16832))
- [FLASK] Add snap alerts and prompts via `snap_dialog` RPC method ([#16048](https://github.com/MetaMask/metamask-extension/pull/16048))
- [FLASK] Expose transaction origin to transaction insight snaps ([#16671](https://github.com/MetaMask/metamask-extension/pull/16671))
- Toggle option to enable/disable balance and Token rate checking for using third-party API ([#16772](https://github.com/MetaMask/metamask-extension/pull/16772))
- Onboarding v2: Implement requested metrics ([#17090](https://github.com/MetaMask/metamask-extension/pull/17090))

### Changed
- Update secondary copy and remove the Address component from SetApprovalForAll and NFT Approve screens ([#16292](https://github.com/MetaMask/metamask-extension/pull/16292))
- Update background color for picker network ([#16466](https://github.com/MetaMask/metamask-extension/pull/16466))
- Update network colors with design tokens ([#16543](https://github.com/MetaMask/metamask-extension/pull/16543))
- Update all background-default hovers colors ([#16519](https://github.com/MetaMask/metamask-extension/pull/16519))
- Update signature request screens ([#15776](https://github.com/MetaMask/metamask-extension/pull/15776))
- Remove network name from analytics ([#16781](https://github.com/MetaMask/metamask-extension/pull/16781))
- Remove RPC urls from metrics ([#16710](https://github.com/MetaMask/metamask-extension/pull/16710))
- Allow adding networks with the same chainId as a preloaded/default network via `wallet_AddEthereumChain` API ([#16733](https://github.com/MetaMask/metamask-extension/pull/16733))
- Network request in background should not start until onboarding is completed ([#16773](https://github.com/MetaMask/metamask-extension/pull/16773))
- Replace the address in SignTypedData_v4 signatures with a 'Verify contract details' link ([#16191](https://github.com/MetaMask/metamask-extension/pull/16191))
- Bump `@metamask/design-tokens` from `1.11.0` to `1.11.1` ([#16764](https://github.com/MetaMask/metamask-extension/pull/16764))
  - Update Primary, Error and Info colors to meet AA accessibility standards for light mode [#255](https://github.com/MetaMask/design-tokens/pull/255)
- Bump `@metamask/design-tokens` from `1.9.0` to `1.11.0` ([#16515](https://github.com/MetaMask/metamask-extension/pull/16515))
  - Add new background color for `hover` and `pressed` tokens [#233](https://github.com/MetaMask/design-tokens/pull/233)
- Migrate from deprecated `@metamask/controllers`to the new controller packages ([#16547](https://github.com/MetaMask/metamask-extension/pull/16547))
- Sanitize data ensuring we don't send any privacy sensitive information to Sentry errors ([#16780](https://github.com/MetaMask/metamask-extension/pull/16780))
- Track when token balance is changed to update the balance value on the Approval screen ([#16964](https://github.com/MetaMask/metamask-extension/pull/16964))
- Swaps: ensure 0% slippage on Arbitrum for wrapping/unwrapping ETH (ETH -> WETH or WETH -> ETH) ([#16778](https://github.com/MetaMask/metamask-extension/pull/16778))
- [Beta] Update `BETA` to sentence case ([#16590](https://github.com/MetaMask/metamask-extension/pull/16590))
- [Beta] Update text on the Welcome screen ([#16489](https://github.com/MetaMask/metamask-extension/pull/16489))
- [FLASK] **BREAKING:** Snaps are now required to request the `endowment:rpc` permission to receive RPC requests on `onRpcRequest` ([#16673](https://github.com/MetaMask/metamask-extension/pull/16673))
  - Snaps must specify if they want to receive RPC requests from dapps or snaps using the following permission `endowment:rpc: { dapps: true, snaps: true }`
- [FLASK] **BREAKING:** Removed `wallet_enable` and `wallet_installSnaps` in favor of `wallet_requestSnaps` ([#16525](https://github.com/MetaMask/metamask-extension/pull/16525))
- [FLASK] **BREAKING:** The `wallet` global exposed to Snaps has been replaced with two new globals: `snap` and `ethereum` ([#16525](https://github.com/MetaMask/metamask-extension/pull/16525))
  - `ethereum` is an EIP-1193 provider and can be accessed by requesting the `endowment:ethereum-provider` permission
  - `snap` is always exposed and can be used to access snap specific functions using `snap.request()`
- [FLASK] **BREAKING:** Named parameters are now required in all Snaps RPC methods ([#16525](https://github.com/MetaMask/metamask-extension/pull/16525))
- Security and Privacy Settings Re-org ([#16756](https://github.com/MetaMask/metamask-extension/pull/16756))

### Removed
- [FLASK] **BREAKING:** Removed `snap_getAppKey` ([#16525](https://github.com/MetaMask/metamask-extension/pull/16525))
  - Snaps that need snap-specific entropy can use `snap_getEntropy` instead
- Remove ONBOARDING_V2 flag for release ([#16865](https://github.com/MetaMask/metamask-extension/pull/16865))

### Fixed
- Fix resolving to the Account nickname or contact name when scanning the QR code in the Send screen ([#16204](https://github.com/MetaMask/metamask-extension/pull/16204))
- Fix not being able to reject multiple Signature requests ([#16199](https://github.com/MetaMask/metamask-extension/pull/16199))
- Fix issue that prevents switching to localhost using the API ([#16707](https://github.com/MetaMask/metamask-extension/pull/16707))
- Fix unable to proceed with tx when there is "Insufficient funds for gas", by adding the estimated gas fee section on the Send screen ([#14634](https://github.com/MetaMask/metamask-extension/pull/14634))
- Fix Add Contact by disabling the Save button if the input fields are empty ([#16233](https://github.com/MetaMask/metamask-extension/pull/16233))
- Fix Token Detection displaying a token without balance, by updating the user state `tokensChainsCache` from array to object ([#16535](https://github.com/MetaMask/metamask-extension/pull/16535))
- Fix message not rendering properly on Sign Typed Data v4 screen, by supporting nested arrays and arrays with defined length ([#16552](https://github.com/MetaMask/metamask-extension/pull/16552))
- Fix German translation for `lightTheme` ([#16517](https://github.com/MetaMask/metamask-extension/pull/16517))
- Fix displaying Collectibles Approval screen instead of ERC20 Approval screen when the token standard property is undefined ([#16765](https://github.com/MetaMask/metamask-extension/pull/16765))
- Fix token balance precision on Confirm Token Approval page from Token Allowance flow ([#16934](https://github.com/MetaMask/metamask-extension/pull/16934))
- [FLASK] Clear notification state on restore ([#16503](https://github.com/MetaMask/metamask-extension/pull/16503))
- [FLASK] Fix a crash that happens after snap install ([#16526](https://github.com/MetaMask/metamask-extension/pull/16526))
- [FLASK] Fix usage of wrong `ethereum` global for `ethereum` endowment ([#16932](https://github.com/MetaMask/metamask-extension/pull/16932))
- Validating or restricting the number of digits on token allowance flow ([#17234](https://github.com/MetaMask/metamask-extension/pull/17234))
- Fixed navigation through multiple unapproved transactions for ERC20 tokens ([#16822](https://github.com/MetaMask/metamask-extension/pull/16822))
- Display large and small numbers as decimals instead of scientific notation on token allowance confirmation screens ([#16676](https://github.com/MetaMask/metamask-extension/pull/16676))
- Fix #16959 - Don't allow user to see welcome or password creation screen after a keyring has been created ([#17024](https://github.com/MetaMask/metamask-extension/pull/17024))
- Fix 'Back' navigation from Restore Vault page when accessed from popup window ([#17095](https://github.com/MetaMask/metamask-extension/pull/17095))
- Align custom spending cap Max button in approve screen for multiple languages ([#16927](https://github.com/MetaMask/metamask-extension/pull/16927))

## [10.23.3]
### Removed
- Remove onramp provider Wyre ([#17102](https://github.com/MetaMask/metamask-extension/pull/17102))

## [10.23.2]
### Fixed
- Improve performance on signature request screens ([#17052](https://github.com/MetaMask/metamask-extension/pull/17052))

## [10.23.1]
### Fixed
- Fix incorrectly displaying "New Contract" instead of the recipient address, on the header from the Confirmation page ([#16961](https://github.com/MetaMask/metamask-extension/pull/16961))

## [10.23.0]
### Added
- Add Picker Network Component ([#16340](https://github.com/MetaMask/metamask-extension/pull/16340))
- Add Button component, unifying primary, secondary and link buttons([#16305](https://github.com/MetaMask/metamask-extension/pull/16305))
- Add Button Icon component ([#16277](https://github.com/MetaMask/metamask-extension/pull/16277))
- Swaps: enable Swaps functionality on Arbitrum and Optimism networks ([#16396](https://github.com/MetaMask/metamask-extension/pull/16396))
- [FLASK] Add snap cronjobs ([#16239](https://github.com/MetaMask/metamask-extension/pull/16239))

### Changed
- Replace every Address value by the Address component on SignTypedData v4 Signature screen ([#16018](https://github.com/MetaMask/metamask-extension/pull/16018))
- Update Address component on Transaction data screen by displaying Account name, Contact name, or Contract name when corresponds ([#15888](https://github.com/MetaMask/metamask-extension/pull/15888))
- Bump `@metamask/providers` from `10.0.0` to `10.2.0` ([#16361](https://github.com/MetaMask/metamask-extension/pull/16361))
- [FLASK] **BREAKING**: Snaps no longer automatically receive a `Buffer` polyfill ([#16394](https://github.com/MetaMask/metamask-extension/pull/16394))
  - To work around this you can either use typed arrays or include a polyfill yourself.
- [FLASK] **BREAKING**: Snap RPC methods now use `@metamask/key-tree@6.0.0` ([#16394](https://github.com/MetaMask/metamask-extension/pull/16394))
  - In the new version, all hexadecimal values are prefixed with `0x`
  - All fields containing the word `Buffer` has also been renamed to `Bytes`
  - Please update your snap to use the latest version

### Fixed
- Fix Settings Search pointing into the incorrect row for Token Detection entry ([#16407](https://github.com/MetaMask/metamask-extension/pull/16407))
- Fix Balance not updating when using a duplicated `chainId` network ([#14245](https://github.com/MetaMask/metamask-extension/pull/14245))
- [FLASK] Fix an issue with updating snaps that require certain permissions ([#16473](https://github.com/MetaMask/metamask-extension/pull/16473))
- [FLASK] Fix some issues with installing snaps that request `eth_accounts` ([#16365](https://github.com/MetaMask/metamask-extension/pull/16365))
- [FLASK] Catch and display errors in snaps insight ([#16416](https://github.com/MetaMask/metamask-extension/pull/16416))

## [10.22.3]
### Added
- [Beta]: Add Beta banner to all screens ([#16307](https://github.com/MetaMask/metamask-extension/pull/16307))

### Changed
- [Beta]: Update MetaMask logo imagery ([#16304](https://github.com/MetaMask/metamask-extension/pull/16304))
- [Beta]: Update MetaMask long logo to new imagery ([#16505](https://github.com/MetaMask/metamask-extension/pull/16505))

## [10.22.2]
### Changed
- Restore changes from v10.22.0
- Fix deadlock encountered while performing Swaps on unsupported testnets ([#16511](https://github.com/MetaMask/metamask-extension/pull/16511))

## [10.22.1]
### Changed
- Temporarily revert v10.22.0

### Fixed
- Prevent user from editing a contract interaction initiated by a dapp ([#16498](https://github.com/MetaMask/metamask-extension/pull/16498))

## [10.22.0]
### Added
- Add Aurora network to the Popular Custom Network list ([#16039](https://github.com/MetaMask/metamask-extension/pull/16039))
- Add array of valid sizes for Box `height` and `width` to support responsive layout ([#16111](https://github.com/MetaMask/metamask-extension/pull/16111))
- Add Warning on a Send transaction request when user doesn't have funds ([#16220](https://github.com/MetaMask/metamask-extension/pull/16220))
- [FLASK] Allow snaps insights to show on regular EOA transactions ([#16093](https://github.com/MetaMask/metamask-extension/pull/16093))

### Changed
- Update `eth-lattice-keyring` to `v0.12.3` ([#15997](https://github.com/MetaMask/metamask-extension/pull/15997))
  - Updates `@ethereumjs/util` to `v8.0.0` to reduce bundle size
  - Removes `secp256k1` and `@ethereumjs/common` to reduce bundle size
  - Updates `gridplus-sdk` to v2.2.9
    - Adds caching for calls to block explorers to improve UX ([PR](https://github.com/GridPlus/gridplus-sdk/pull/469))
- Remove unused `zh` locales directory in favor of `zh_CN` for Chinese translations ([#16322](https://github.com/MetaMask/metamask-extension/pull/16322))
- Remove 3box sync feature and delete the `ThreeBoxController` ([#14571](https://github.com/MetaMask/metamask-extension/pull/14571))

### Fixed
- Fix Secret Recovery Phrase video overlapping lateral box for smaller viewports ([#16345](https://github.com/MetaMask/metamask-extension/pull/16345))
- Fix "Learn more" link on Connected Account notification ([#16339](https://github.com/MetaMask/metamask-extension/pull/16339))
- Fix default users with browser language code `zh` to point the supported `zh_CN` language code ([#16329](https://github.com/MetaMask/metamask-extension/pull/16329))
- Fix Forgot Password flow after Wallet Creation ([#16156](https://github.com/MetaMask/metamask-extension/pull/16156))
- Fix fiat conversion for Popular Custom networks displaying it by default ([#16132](https://github.com/MetaMask/metamask-extension/pull/16132))
- Fix restricted injection, by removing docs.google.com from blocked domains list ([#16154](https://github.com/MetaMask/metamask-extension/pull/16154))
- Fix squeezing avatar, by adding a flex property to keep always the same ratio ([#16047](https://github.com/MetaMask/metamask-extension/pull/16047))
- Fix domain names not always being rendered correctly in the connected sites list ([#16074](https://github.com/MetaMask/metamask-extension/pull/16074))
- Fix transaction confirmation page performance ([#16205](https://github.com/MetaMask/metamask-extension/pull/16205))
- Fix Add Network form by blocking the submission when `chainId` does not match the one returned by the `rpcUrl` ([#16452](https://github.com/MetaMask/metamask-extension/pull/16452))
- Swaps: fix tokens being removed from the Asset lists, after canceling a Swap ([#16167](https://github.com/MetaMask/metamask-extension/pull/16167))
- Swaps: add debouncing for the `Swap from` and `Swap to` form fields ([#16326](https://github.com/MetaMask/metamask-extension/pull/16326))
- [FLASK] Fix crash on snaps settings page if snap has no permissions ([#16354](https://github.com/MetaMask/metamask-extension/pull/16354))
- [FLASK] Fix crash after restoring MetaMask if you had snaps installed ([#16228](https://github.com/MetaMask/metamask-extension/pull/16228))
- [FLASK] Fix a problem with displaying snaps transaction insight data ([#16023](https://github.com/MetaMask/metamask-extension/pull/16023))

## [10.21.2]
### Fixed
- Fix undefined txParams when calling approveTransaction, by adding the id on the txMeta argument ([#16382](https://github.com/MetaMask/metamask-extension/pull/16382))

## [10.21.1]
### Changed
- Improve rate limiting for metric events ([#16308](https://github.com/MetaMask/metamask-extension/pull/16308))

## [10.21.0]
### Added
- Add functionality for buying native currency and tokens on Optimism and Arbitrum, using Transak ([#16031](https://github.com/MetaMask/metamask-extension/pull/16031))
- Add functionality for buying tokens with Wyre ([#15992](https://github.com/MetaMask/metamask-extension/pull/15992))
- Add functionality for buying tokens with Moonpay ([#15924](https://github.com/MetaMask/metamask-extension/pull/15924))
- Add functionality for buying tokens with Coinbase Pay and Transak ([#15551](https://github.com/MetaMask/metamask-extension/pull/15551))
- Add new translations for DE, EL, ES, FR, HI, ID, JA, KO, PT, RU, TL TR, VI and ZH_CN ([#15411](https://github.com/MetaMask/metamask-extension/pull/15411))
- Add Hardware wallet Buy and Tutorial buttons and update copies ([#14738](https://github.com/MetaMask/metamask-extension/pull/14738))
- [FLASK] Add support for blocking Snaps by source shasum ([#15830](https://github.com/MetaMask/metamask-extension/pull/15830))
- [FLASK] Add transaction insights via Snaps ([#15814](https://github.com/MetaMask/metamask-extension/pull/15814))

### Changed
- Dark Mode: elevate the Theme functionality from Experimental to General Settings ([#15865](https://github.com/MetaMask/metamask-extension/pull/15865))
- Update Arbitrum symbol from `AETH` to `ETH` ([#15747](https://github.com/MetaMask/metamask-extension/pull/15747))
- Update warning dialog copy on SetApprovalForAll Confirmation page ([#15744](https://github.com/MetaMask/metamask-extension/pull/15744))
- Update header display on NFT Approval and SetApprovalForAll Confirmation pages ([#15727](https://github.com/MetaMask/metamask-extension/pull/15727))
- Bump `@metamask/contract-metadata` from `1.35.0` to `1.36.0` ([#15597](https://github.com/MetaMask/metamask-extension/pull/15597))
  - Add tokens: ZKP, GTON, PRVG, XCHF, XHT, OGV, veOFV, wOUSD and SUSHI
  - Fix SVG icons for sETH and sUSD tokens
  - Add the top NFT contracts on Opensea
- Enable Add Popular Networks by default for all users ([#16172](https://github.com/MetaMask/metamask-extension/pull/16172))
- Update `@metamask/controllers` to v31.2.0 ([#16033](https://github.com/MetaMask/metamask-extension/pull/16033))
- Swaps: replace Rinkeby with Goerli for performing swaps on a testnet ([#15781](https://github.com/MetaMask/metamask-extension/pull/15781))
- Swaps: only render tooltip component if swap network is disabled ([#15733](https://github.com/MetaMask/metamask-extension/pull/15733))
- Swaps: use `gasEstimateWithRefund` instead of `gasEstimate` for more precise estimations ([#15968](https://github.com/MetaMask/metamask-extension/pull/15968))
- Swaps: improve Build Quote page ([#15758](https://github.com/MetaMask/metamask-extension/pull/15758))
  - Preserve search query for the `Swap from` and `Swap to` form fields
  - Update placeholder text on `Swap to` and `Swap from` search fields
  - Update copy on slippage tolerance tooltip
- [FLASK] `Add snap_getBip32PublicKey` RPC method ([#15889](https://github.com/MetaMask/metamask-extension/pull/15889))
- **[FLASK] BREAKING:** Remove deprecated snap_getBip44Entropy_* method ([#15889](https://github.com/MetaMask/metamask-extension/pull/15889))
- [FLASK] Miscellaneous fixes to the Snaps platform ([#15889](https://github.com/MetaMask/metamask-extension/pull/15889))

### Fixed
- Fix double account creation when using keyboard controls on New Account page ([#15077](https://github.com/MetaMask/metamask-extension/pull/15077))
- Fix error message getting cut when introducing wrong private key format on Import Account page ([#15940](https://github.com/MetaMask/metamask-extension/pull/15940))
- Fix edit button not being displayed when sending tx with hex data to a contract on Confirm tx page ([#15812](https://github.com/MetaMask/metamask-extension/pull/15812))
- Fix incorrect balance asset on Encrypt and Decrypt Request pages ([#15885](https://github.com/MetaMask/metamask-extension/pull/15885))
- Fix spelling errors and improve grammar for German translation ([#15592](https://github.com/MetaMask/metamask-extension/pull/15592))
- Fix typos for French translation ([#15735](https://github.com/MetaMask/metamask-extension/pull/15735))
- Fix incorrect identicon type for Account, by ensuring Blockies is displayed everywhere when enabled instead of Jazzicon ([#15768](https://github.com/MetaMask/metamask-extension/pull/15768))
- Fix query verification for signatures, by ensuring we skip searching 4byte directory if we don't have a full 4 bytes of data ([#15473](https://github.com/MetaMask/metamask-extension/pull/15473))
- Fix address resolution to Account name, when editing a tx instead of displaying the hex address ([#15873](https://github.com/MetaMask/metamask-extension/pull/15873))
- Fix "Get ether from faucet" message, by including the end of the sentence and a full stop ([#15875](https://github.com/MetaMask/metamask-extension/pull/15875))
- Fix font weight of the `<b>` element, by restoring the `b` style ([#15784](https://github.com/MetaMask/metamask-extension/pull/15784))
- Fix ETH badge being displayed to networks where ETH is not the primary currency ([#16102](https://github.com/MetaMask/metamask-extension/pull/16102))
- Fix overlapping Portfolio tooltip with Network popup, when a custom network is added ([#16090](https://github.com/MetaMask/metamask-extension/pull/16090))
- Fix typo in French translation for "removeAccount" ([#16095](https://github.com/MetaMask/metamask-extension/pull/16095))
- Fix What's New notification not displayed to users who created a new wallet ([#16042](https://github.com/MetaMask/metamask-extension/pull/16042))
- [FLASK] Fix an issue with installing snaps that request the `eth_accounts` permission ([#16161](https://github.com/MetaMask/metamask-extension/pull/16161))

## [10.20.0]
### Changed
- Deprecate Rinkeby, Ropsten and Kovan test networks and define Goerli as the default network in test mode ([#15989](https://github.com/MetaMask/metamask-extension/pull/15989))

### Fixed
- [FLASK] Fix crash when uninstalling snap ([#15799](https://github.com/MetaMask/metamask-extension/pull/15799))
- [FLASK] Fix crash with certain permissions on the snap settings page ([#15797](https://github.com/MetaMask/metamask-extension/pull/15797))
- [FLASK] Fix an issue with installing and updating snaps with 0 permissions ([#15796](https://github.com/MetaMask/metamask-extension/pull/15796))

## [10.19.0]
### Added
- Add ENS wildcard and secure offchain resolution (ENSIP-10 & EIP3668) ([#14675](https://github.com/MetaMask/metamask-extension/pull/14675))
- Add "What's New" notification about the Merge ([#15846](https://github.com/MetaMask/metamask-extension/pull/15846))
- Add "What's New" notification about 3box deprecation ([#15763](https://github.com/MetaMask/metamask-extension/pull/15763))
- Add "What's New" notification for Add Popular Networks feature ([#15121](https://github.com/MetaMask/metamask-extension/pull/15121))
- Add "What's New" notification for Token Detection feature ([#15807](https://github.com/MetaMask/metamask-extension/pull/15807))
- Add Warning for Rinkeby, Ropsten and Kovan test networks deprecation ([#15725](https://github.com/MetaMask/metamask-extension/pull/15725))
- Add Network Info popup when changing selected Network ([#13319](https://github.com/MetaMask/metamask-extension/pull/13319))
- Add Goerli, BSC, Optimism, Polygon, Avalance, Fantom and Arbitrum networks to query balances using BalanceChecker ([#13846]
- Add Token detection V2 ([#15138](https://github.com/MetaMask/metamask-extension/pull/15138))
- Add Backup and Restore State functionalities for 3box replacement ([#15243](https://github.com/MetaMask/metamask-extension/pull/15243))(https://github.com/MetaMask/metamask-extension/pull/13846))
- Add a Warning on the Confirmation screen, when user is performing a SetApprovalForAll transaction ([#15512](https://github.com/MetaMask/metamask-extension/pull/15512))
- Add new translations for DE, EL, ES, FR, HI, ID, JA, KO, PT, RU, TL TR, VI and ZH ([#14975](https://github.com/MetaMask/metamask-extension/pull/14975))
- Add Italian translation for "Forgot password" message ([#15477](https://github.com/MetaMask/metamask-extension/pull/15477))
- Add link to Metalabs dapp into MetaMask home page ([#15407](https://github.com/MetaMask/metamask-extension/pull/15407))
- Add Sepolia as a default test network ([#15787](https://github.com/MetaMask/metamask-extension/pull/15787))
- Swaps: on the STX status page ([#14995](https://github.com/MetaMask/metamask-extension/pull/14995))
  - Add a link to the Swap tx
  - Add a link for "Create a new swap"
- Swaps: add a tx details view for cancelled Swaps on the Activity tab ([#15273](https://github.com/MetaMask/metamask-extension/pull/15273))
- [FLASK] Add snap update metrics ([#15206](https://github.com/MetaMask/metamask-extension/pull/15206))
- [FLASK] Add `snap_getBip44Entropy` RPC method and deprecate `snap_getBip44Entropy_*` ([#15706](https://github.com/MetaMask/metamask-extension/pull/15706))
- [FLASK] Add `snap_getBip32Entropy` JSON-RPC method ([#15619](https://github.com/MetaMask/metamask-extension/pull/15619))
- [FLASK] Add DApp triggered Snap updates ([#15143](https://github.com/MetaMask/metamask-extension/pull/15143))

### Changed
- Update Confirmation screen styling by adding a top margin and moving Site Icon next to the site URL ([#15136](https://github.com/MetaMask/metamask-extension/pull/15136))
- Remove 'ADD_POPULAR_NETWORKS' feature flag as the feature is enabled by default ([#15229](https://github.com/MetaMask/metamask-extension/pull/15229))
- Remove dark mode and transaction insights from the "What's New" announcements ([#15279](https://github.com/MetaMask/metamask-extension/pull/15279))
- Update design tokens package and consolidate shadow values with new tokens ([#15264](https://github.com/MetaMask/metamask-extension/pull/15264))
- Update Zendesk ticket request URLs for a facilitating the bug reporting process ([#15458](https://github.com/MetaMask/metamask-extension/pull/15458))
- Update Customize Nonce 'Learn More' link pointing to the correct Zendesk article ([#15658](https://github.com/MetaMask/metamask-extension/pull/15658))
- Update Avalanche RPC endpoint to point Infura, as it is now supported ([#15720](https://github.com/MetaMask/metamask-extension/pull/15720))
- Update the main text on SetApprovalForAll confirmation screen ([#15724](https://github.com/MetaMask/metamask-extension/pull/15724))
- Updated origin pill component to match the new design for Permissions and Switching Networks screens ([#15603](https://github.com/MetaMask/metamask-extension/pull/15603))
- Set "View full transaction details" as default option on SetApprovalForAll Confirmation screen ([#15726](https://github.com/MetaMask/metamask-extension/pull/15726))
- Update `gridplus-sdk` ([#15711](https://github.com/MetaMask/metamask-extension/pull/15711))
  - `eth-lattice-keyring` changes: [GridPlus/eth-lattice-keyring@v0.11.0...v0.12.0](https://github.com/GridPlus/eth-lattice-keyring/compare/v0.11.0...v0.12.0)
  - `gridplus-sdk` changes: [GridPlus/gridplus-sdk@v2.2.2...v2.2.7](https://github.com/GridPlus/gridplus-sdk/compare/v2.2.2...v2.2.7)
- Update title case to sentence case with some exceptions (names, companies, special terms and page navigation) ([#15285](https://github.com/MetaMask/metamask-extension/pull/15285))
- Swaps: show a block explorer URL and hide "Add token" prompt, if block explorer URL is not available on Build Quote screen ([#15198](https://github.com/MetaMask/metamask-extension/pull/15198))
- Swaps: Standardize the spelling of 'cancelled' ([#15266](https://github.com/MetaMask/metamask-extension/pull/15266))
- Swaps: Performance improvements for Swaps, especially on the Build Quote page (~7.2x faster) ([#15359](https://github.com/MetaMask/metamask-extension/pull/15359))
- Swaps: only check if a user has enough balance before calling STX. If "Not enough funds" error is thrown, show a notification, but keep STX active ([#15218](https://github.com/MetaMask/metamask-extension/pull/15218))
- [FLASK] Disable "Mark all as read button" when there are no notifications ([#15333](https://github.com/MetaMask/metamask-extension/pull/15333))

### Fixed
- Fix Amount set to 0 on Send page when editing an ERC20 tx by preserving its value ([#15275](https://github.com/MetaMask/metamask-extension/pull/15275))
- Fix limited scroll area in the Account Menu by adjusting the height of Account Menu nav items, expanding scroll area ([#15302](https://github.com/MetaMask/metamask-extension/pull/15302))
- Fix Actionable Message overlapping tabs on Confirm Transaction view ([#15272](https://github.com/MetaMask/metamask-extension/pull/15272))
- Fix Contacts breadcrumb when viewing Contact Details ([#15663](https://github.com/MetaMask/metamask-extension/pull/15663))
- Fix Blockies identicon alignment in General Settings ([#15652](https://github.com/MetaMask/metamask-extension/pull/15652))
- Fix extra space and period in Custom Token warning text ([#15650](https://github.com/MetaMask/metamask-extension/pull/15650))
- Fix Signature Request styles: overlapping text when using hardware wallet and icon shrinking with long URLs ([#15621](https://github.com/MetaMask/metamask-extension/pull/15621))
- Fix for randomly resets of updated values in network edit form ([#14370](https://github.com/MetaMask/metamask-extension/pull/14370))
- Fix Connected site popup styling, by aligning the rows, shrinking the site icon with long URLs and preventing size change on Disconnect button hover ([#15409](https://github.com/MetaMask/metamask-extension/pull/15409))
- Fix Blockies icon on Recipient Details, by ensuring it is used when the option is enabled ([#15662](https://github.com/MetaMask/metamask-extension/pull/15662))
- Fix casing in Import Token for Spanish locale ([#15687](https://github.com/MetaMask/metamask-extension/pull/15687))
- Fix approval warning condition for `setApprovalForAll` so it is not shown when revoking ([#15806](https://github.com/MetaMask/metamask-extension/pull/15806))
- Fix disabled Sign button on the Sign Message screen unless scrolled to the bottom ([#15788](https://github.com/MetaMask/metamask-extension/pull/15788))
- Swaps: fix displaying "No tokens available matching" when there are tokens available, by updating the `results` state if `initialResultsState` array length is different ([#15270](https://github.com/MetaMask/metamask-extension/pull/15270))
- Swaps: fix redirect button to the Activity tab, after performing a Swap and clicking "View in Activity" [(#15620)](https://github.com/MetaMask/metamask-extension/pull/15620))
- [FLASK] Fix missing snap hook for `getAppKey`, the `getUnlockPromise` hook was missing, breaking some snap examples ([#15354](https://github.com/MetaMask/metamask-extension/pull/15354))
- [FLASK] Fix snaps authorship pill truncation, previously the authorship label would not be truncated and offset the UI ([#15190](https://github.com/MetaMask/metamask-extension/pull/15190))
- [FLASK] Fix Snaps key management permission copy ([#14849](https://github.com/MetaMask/metamask-extension/pull/14849))

## [10.18.4]
### Changed
- Update `eth-lattice-keyring` to v0.10.0 which itself updates `gridplus-sdk` ([#15261](https://github.com/MetaMask/metamask-extension/pull/15261))
  - `eth-lattice-keyring` changes: ([GridPlus/eth-lattice-keyring@v0.7.3...v0.10.0])(https://github.com/GridPlus/eth-lattice-keyring/compare/v0.7.3...v0.10.0)
  - `gridplus-sdk` changes: ([GridPlus/gridplus-sdk@v1.2.3...v2.2.4])(https://github.com/GridPlus/gridplus-sdk/compare/v1.2.3...v2.2.4)
- Update `eth-lattice-keyring` to v0.11.0 ([#15490](https://github.com/MetaMask/metamask-extension/pull/15490)). See changes [GridPlus/eth-lattice-keyring@v0.10.0...v0.11.0](https://github.com/GridPlus/eth-lattice-keyring/compare/v0.10.0...v0.11.0)
- Improve ERC721 Send screen by parsing the `tokenId` and refactor `useAssetDetails` hook to avoid unnecessary network calls ([#15304](https://github.com/MetaMask/metamask-extension/pull/15304))

### Fixed
- Fix GDrive incompatibility with the Extension by stop injecting provider on docs.google.com ([#15459](https://github.com/MetaMask/metamask-extension/pull/15459))
- Fix default currency symbol for `wallet_addEthereumChain` + improve warnings for data that doesn't match our validation expectations ([#15201](https://github.com/MetaMask/metamask-extension/pull/15201))
- Fix block explorer link on custom networks for the cases when link is invalid or left empty ([#13870](https://github.com/MetaMask/metamask-extension/pull/13870))
- Fix signature parsing errors re-surfaced due to 4byte function signature directory being down, by removing the directory([#15300](https://github.com/MetaMask/metamask-extension/pull/15300))
- Fix intermitent failure when performing a Send tx in non-EIP-1559 networks (like Optimism) by setting the `gasPrice` ([#15628](https://github.com/MetaMask/metamask-extension/pull/15628))

## [10.18.3]
### Fixed
- Prevent confirm screen from showing method name from contract registry for transactions created within MetaMask ([#15472](https://github.com/MetaMask/metamask-extension/pull/15472))

## [10.18.2]
### Changed
- Enhance approval screen title logic ([#15406](https://github.com/MetaMask/metamask-extension/pull/15406))

### Fixed
- Ensure smart contract interactions are properly represented on the confirm screen ([#15446](https://github.com/MetaMask/metamask-extension/pull/15446))
- Fix update of max amount in send flow after network switch([#15444](https://github.com/MetaMask/metamask-extension/pull/15444))
- Fix to ensure user can access full screen editing of network forms from the popup ([#15442](https://github.com/MetaMask/metamask-extension/pull/15442))
- Possibly fix bug which crashes firefox on startup after upgrade to v10.18.1 ([#15425](https://github.com/MetaMask/metamask-extension/pull/15425))
- Fix blocking of editing transactions that had a contract address recipient but no tx data ([#15424](https://github.com/MetaMask/metamask-extension/pull/15424))
- Fix error that could leave the app in a stuck state when quickly moving between the send screen and other screens ([#15420](https://github.com/MetaMask/metamask-extension/pull/15420))
- Fix send screen for Optimism network ([#15419](https://github.com/MetaMask/metamask-extension/pull/15419))
- Fix to ensure the correct balance is used when validating send amounts ([#15449](https://github.com/MetaMask/metamask-extension/pull/15449))
- Fix error that makes app unusable after clicking activity list items for token approval transactions ([#15398](https://github.com/MetaMask/metamask-extension/pull/15398))

## [10.18.1]
### Changed
- Move the metrics opt-in screen to the second screen of the onboarding flow ([#15313](https://github.com/MetaMask/metamask-extension/pull/15313))

## [10.18.0]
### Added
- Add setApprovalForAll confirmation view so granted permissions are displayed in a digested manner, instead of a simple contract interaction([#15010](https://github.com/MetaMask/metamask-extension/pull/15010))
- Add warning when performing a Send directly to a token contract([#13588](https://github.com/MetaMask/metamask-extension/pull/13588))

### Changed
- Update Optimism ChainID from Kovan to Goerli ([#15119](https://github.com/MetaMask/metamask-extension/pull/15119))

### Fixed
- Fix one of the possible causes for "Sending to a random cached address", by removing the global transaction state from the Send flow ([#14777](https://github.com/MetaMask/metamask-extension/pull/14777))
- Fix Chinese translation for the message of Importing repeated tokens ([#14994](https://github.com/MetaMask/metamask-extension/pull/14994))
- Fix Japanese translation for the word Sign ([#15078](https://github.com/MetaMask/metamask-extension/pull/15078))
- Fix partially the error "Seedphrase is invalid" by disabling Seedphrase Import button after switching the Seedphrase length ([#15139](https://github.com/MetaMask/metamask-extension/pull/15139))
- Fix Edit Transaction flow by ensuring that changing a tx from a Transfer to a Send resets data and updates tx type ([#15248](https://github.com/MetaMask/metamask-extension/pull/15248))
- Fix UI on Import Seedphrase page by disabling Import button, if any of the characters of the Seedphrase is in uppercase ([#15186](https://github.com/MetaMask/metamask-extension/pull/15186))

## [10.17.0]
### Added
- Add cost estimation for canceling a Smart Transaction on Awaiting Swap page ([#15011](https://github.com/MetaMask/metamask-extension/pull/15011))
- Add missing subtitles for Secret Recovery Phrase video, including French, Greek, Turkish, Chinese
 ([#14943](https://github.com/MetaMask/metamask-extension/pull/14943))

### Changed
- Consolidate all Error Messages in one style component ([#14945](https://github.com/MetaMask/metamask-extension/pull/14945))
- Improve accessibility by allowing keyboard navigation on Accounts menu ([#14936](https://github.com/MetaMask/metamask-extension/pull/14936))
- Allow using locally hosted RPCs and Block Explorer Urls when adding an Ethereum Chain programmatically ([#14272](https://github.com/MetaMask/metamask-extension/pull/14272))
- **[FLASK] BREAKING:** Snaps [are now required](https://github.com/MetaMask/snaps-skunkworks/discussions/590) to export `onRpcRequest` to receive RPC requests ([#14952](https://github.com/MetaMask/metamask-extension/pull/14952))
  - All existing snaps will have to be updated to conform to this new standard.
- **[FLASK] BREAKING:** Snap state [is now encrypted](https://github.com/MetaMask/snaps-skunkworks/discussions/590) by default ([#14952](https://github.com/MetaMask/metamask-extension/pull/14952))
  - Breaks existing installed snaps that use `snap_manageState`. All such Snaps must be reinstalled.

### Fixed
- Fix German translation for `statusConnected` ([#14997](https://github.com/MetaMask/metamask-extension/pull/14997))
- Fix Account Search functionality returning inconsistent results ([#14914](https://github.com/MetaMask/metamask-extension/pull/14914))
- Fix Notifications icon color on the Account menu ([#14941](https://github.com/MetaMask/metamask-extension/pull/14941))
- Fix broken UI for Network Settings page on small browser sizes ([#14857](https://github.com/MetaMask/metamask-extension/pull/14857))
- Fix scanner for animated QR codes on dark mode, by removing bottom black line from the QR ([#14900](https://github.com/MetaMask/metamask-extension/pull/14900))
- Fix displaying wrong balance on the first seconds after switching network ([#14354](https://github.com/MetaMask/metamask-extension/pull/14354))
- Fix Contact name display on Edit tx page ([#14613](https://github.com/MetaMask/metamask-extension/pull/14613))
- Fix infinite loading when transferring non-standard ERC721 (without name and/or symbol) ([#14756](https://github.com/MetaMask/metamask-extension/pull/14756))
- **[FLASK]:** Fix multiple bugs related to snap installation ([#14952](https://github.com/MetaMask/metamask-extension/pull/14952))

## [10.16.2]
### Changed
- This release restores the changes from v10.16.0, which was temporarily reverted in v10.16.1.

## [10.16.1]
### Changed
- This release is a patch for v10.15.2, so all changes in v10.16.0 have been temporarily reverted. They will be restored in a future v16 release. ([#15063](https://github.com/MetaMask/metamask-extension/pull/15063))

### Fixed
- Fix bug that could cause an incorrect recipient address after pasting an address, without a 0x prefix, in the send flow while sending a token ([#15064](https://github.com/MetaMask/metamask-extension/pull/15064)

## [10.16.0]
### Added
- Add friendly error handling screen, when UI fails to connect to background ([#14461](https://github.com/MetaMask/metamask-extension/pull/14461))
- Add fiat onboarding for AVAX and MATIC through Wyre ([#14683](https://github.com/MetaMask/metamask-extension/pull/14683))
- Add Coinbase Pay as fiat onramp option ([#14648](https://github.com/MetaMask/metamask-extension/pull/14648))
- Add search information for Theme dropdown ([#14476](https://github.com/MetaMask/metamask-extension/pull/14476))
- **[FLASK]** Add in-app notifications for snaps ([#14605](https://github.com/MetaMask/metamask-extension/pull/14605))
- **[FLASK]** Add `long-running` snap permission ([#14700](https://github.com/MetaMask/metamask-extension/pull/14700))

### Changed
- Update caret icon color on Home Page for darkmode, from black to white ([#14835](https://github.com/MetaMask/metamask-extension/pull/14835))
- Update the color of the ledger alert text to adhere to design system guidelines ([#14674](https://github.com/MetaMask/metamask-extension/pull/14674))
- Standardize display of connected site's origin data on all confirmation screens ([#14720](https://github.com/MetaMask/metamask-extension/pull/14720))
- Improved app loading performance
  - Improve loading performance by patching the "secp256k1" package ([#14677](https://github.com/MetaMask/metamask-extension/pull/14677))
  - Patch gridplus-sdk module for improving performance ([#14582](https://github.com/MetaMask/metamask-extension/pull/14582))
- Swaps: ensure that native currency swap amounts are properly displayed on all networks, avoiding a bug where swap received amounts could equal gas costs ([#14821](https://github.com/MetaMask/metamask-extension/pull/14821))
- Swaps: reduce the default slippage from 3% to 2% ([#14863](https://github.com/MetaMask/metamask-extension/pull/14863))
- Swaps: update STX status content page ([#14805](https://github.com/MetaMask/metamask-extension/pull/14805))
  - Make STX status timer behaviour dependent on API values
  - Change "Swap complete in < X:XX" to "Swap will complete in < X:XX"
  - Change "Privately submitting the Swap..." to "Privately submitting your Swap..."
- Swaps: disable STX if a regular tx is in progress ([#14554](https://github.com/MetaMask/metamask-extension/pull/14554))
- Swaps: remove gas editing ([#14673](https://github.com/MetaMask/metamask-extension/pull/14673))
- **[FLASK]** Improve snap install screen ([#14803](https://github.com/MetaMask/metamask-extension/pull/14803), ([#14752](https://github.com/MetaMask/metamask-extension/pull/14752)))
- **[FLASK] BREAKING** Bump `@metamask/key-tree` used by snaps to `4.0.0` ([#14700](https://github.com/MetaMask/metamask-extension/pull/14700))
- **[FLASK]** Stopped showing confirmations for terminated snaps ([#14566](https://github.com/MetaMask/metamask-extension/pull/14566))

### Fixed
- Fix line-wrapping in Edit Nickname screen by decreasing the padding ([#14842](https://github.com/MetaMask/metamask-extension/pull/14842))
- Fix 'Currency Symbol' detection in network settings when using Firefox ([#14810](https://github.com/MetaMask/metamask-extension/pull/14810))
- Fix switching between ETH and USD in the amount field on the send screen ([#13827](https://github.com/MetaMask/metamask-extension/pull/13827))
- Fix addition of 'add recipient' events to the send flow change logs so that 'contact' and 'recent' recipient are correctly distinguished ([#14771](https://github.com/MetaMask/metamask-extension/pull/14771))
- Fix lock button sizing for text exceeding button boundaries ([#14335](https://github.com/MetaMask/metamask-extension/pull/14335))
- Fix all "MetaMask" instances wrongly written as "Metamask"
  - ([#14851](https://github.com/MetaMask/metamask-extension/pull/14851))
  - ([#14848](https://github.com/MetaMask/metamask-extension/pull/14848))
- Fix design break on the Settings navbar for certain locales ([#14012](https://github.com/MetaMask/metamask-extension/pull/14012))
- Fix missing white spacing for keystone transaction qrcode in darkmode ([#14798](https://github.com/MetaMask/metamask-extension/pull/14798))
- Fix rare bug that could cause unexpected accounts to be generated from Ledger and connected to MetaMask ([#14799](https://github.com/MetaMask/metamask-extension/pull/14799))
- Fix bug that could cause the incorrect token to be selected after editing the token via the send edit flow ([#14721](https://github.com/MetaMask/metamask-extension/pull/14721))
- Fix chain ID field to use the same color pattern as the currency symbol field warning message ([#14627](https://github.com/MetaMask/metamask-extension/pull/14627))
- Fix currency conversion rate on the Edit tx screen ([#14713](https://github.com/MetaMask/metamask-extension/pull/14713))
- Fix sign button so it is enabled after scrolling all the way to the bottom on the sign type data confirmation screen ([#14745](https://github.com/MetaMask/metamask-extension/pull/14745))
- Fix wrong tx type text for `Safe Transaction From` ([#14769](https://github.com/MetaMask/metamask-extension/pull/14769))
- Fix "Site Suggested" tooltip in `EditGasFeeBtn` to only display the origin of dapp suggested gas fee if the origin is provided ([#14734](https://github.com/MetaMask/metamask-extension/pull/14734))
- Fix incorrect line breaks on footer buttons from NetworksTab ([#14733](https://github.com/MetaMask/metamask-extension/pull/14733))
- Fix incorrect currency symbol in the send flow history state logs ([#14726](https://github.com/MetaMask/metamask-extension/pull/14726))
- Fix batch cancel/reject for signature requests ([#13786](https://github.com/MetaMask/metamask-extension/pull/13786))
- Fix "Learn more" dialog broken link from Eth Sign ([#14667](https://github.com/MetaMask/metamask-extension/pull/14667))
- Fix mixed text for Speed up/Cancel information ([#14551](https://github.com/MetaMask/metamask-extension/pull/14551))
- Fix SRP paste duplication ([#14625](https://github.com/MetaMask/metamask-extension/pull/14625))
- Fix onboarding functionality so that users of dapps using our onboarding library are redirected to the dapp after completing onboarding ([#14550](https://github.com/MetaMask/metamask-extension/pull/14550))
- Fix error handling for signature methods so that proper errors are returned to dapps when there is a permissions error ([#14126](https://github.com/MetaMask/metamask-extension/pull/14126))
- Fix `Speed Up` and `Cancel` button styles from `TransactionListItem` consolidating them with `TransactionListItemDetails` buttons ([#14659](https://github.com/MetaMask/metamask-extension/pull/14659))
- Fix to prevent display of misleading or malicious contract method names ([#14937](https://github.com/MetaMask/metamask-extension/pull/14937))
- Swaps: fix wrong colour for the high price impact notification ([#14697](https://github.com/MetaMask/metamask-extension/pull/14697))
- Swaps: fix edge case when missing top assets ([#14688](https://github.com/MetaMask/metamask-extension/pull/14688))
- **[FLASK]** Fix issues with the snap startup process and usage of `WebAssembly` ([#14772](https://github.com/MetaMask/metamask-extension/pull/14772))
- **[FLASK]** Fix issues with snap id encoding ([#14693](https://github.com/MetaMask/metamask-extension/pull/14693))
- **[FLASK]** Fix multiple smaller bugs with snaps ([#14670](https://github.com/MetaMask/metamask-extension/pull/14670))

## [10.15.1]
### Fixed
- Fix Ledger connection failures that can occur after remove all hardware wallet accounts and reconnecting  ([#14993](https://github.com/MetaMask/metamask-extension/pull/14993))
- Fix bug that could cause MetaMask to crash in some cases when interacting with tokens or NFTs ([#14962](https://github.com/MetaMask/metamask-extension/pull/14962))

## [10.15.0]
### Added
- Add warning when multiple instances of MetaMask are running ([#13836](https://github.com/MetaMask/metamask-extension/pull/13836))
- Add "What's New" announcement text for Dark Mode ([#14346](https://github.com/MetaMask/metamask-extension/pull/14346))
- Theme: Add OS option in theme selection dropdown ([#14379](https://github.com/MetaMask/metamask-extension/pull/14379))

### Changed
- Use testname as the base currency prefix for preloaded test networks ([#14454](https://github.com/MetaMask/metamask-extension/pull/14454))
- Update UI of "Add Network" page ([#13866](https://github.com/MetaMask/metamask-extension/pull/13866))
- Update UI of network switch permissions prompt ([#13450](https://github.com/MetaMask/metamask-extension/pull/13450))
- Show token approval details on approval screens by default ([#14523](https://github.com/MetaMask/metamask-extension/pull/14523))
- Ensure theme selection dropdown is discoverable via settings search([#14379](https://github.com/MetaMask/metamask-extension/pull/14379))
- Stop using the 4bytes registry to name contract deployment transactions in the activity list, preventing false method names from being shown for deployments ([#14598](https://github.com/MetaMask/metamask-extension/pull/14598))
- Save send flow user action history in transaction state logs ([#14510](https://github.com/MetaMask/metamask-extension/pull/14510))
- Update GridPlus to use https://github.com/GridPlus/gridplus-sdk/compare/v1.1.6...v1.2.4 ([#14467](https://github.com/MetaMask/metamask-extension/pull/14467))


### Fixed
- Fix `wallet_watchAsset method` ([#14545](https://github.com/MetaMask/metamask-extension/pull/14545))
- Do not show failed off-chain transactions details when grouped with another valid transaction of same nonce ([#14497](https://github.com/MetaMask/metamask-extension/pull/14497))
- Fix bug that could have caused some ledger transactions to fail after connecting Ledger then locking and unlocking ([#14563](https://github.com/MetaMask/metamask-extension/pull/14563))
- Fix bug that could cause MetaMask to crash in some cases when attempting to send a transaction ([#14608](https://github.com/MetaMask/metamask-extension/pull/14608))

## [10.14.7]
### Changed
- Make JavaScript bundles more reproducible between environments.
  - The bundles no longer include absolute paths to each module included.

## [10.14.6]
### Changed
- Move phishing warning page to external site.
  - The page shown when a site is blocked has been extracted from the extension and moved to an external site. This site is eagerly cached with a service worker upon extension startup, so it should continue to work even while offline.
- Make build .zip files reproducible (#14623)
  - The ordering of files within each .zip file was non-deterministic before this change. We fixed this to comply with Firefox store policies.

## [10.14.5]
### Fixed
- This release was deployed to fix a configuration issue.

## [10.14.4]
### Fixed
- This release was deployed to fix a configuration issue.

## [10.14.3]
### Fixed
- This release was deployed to fix a configuration issue.

## [10.14.2]
### Fixed
- Make build deterministic (#14610)
    - The ordering of modules within each bundle was non-deterministic before this change. We fixed this to comply with Firefox store policies.

## [10.14.1]
### Changed
- This version was used to rollback from v10.14.0 to v10.13.0.

## [10.14.0]
### Added
- **[FLASK]** Add snap version to details page ([#14110](https://github.com/MetaMask/metamask-extension/pull/14110))
- **[FLASK]** Add support for searching installed snaps in Settings ([#14419](https://github.com/MetaMask/metamask-extension/pull/14419))

### Changed
- Disable Swaps on Rinkeby ([#14372](https://github.com/MetaMask/metamask-extension/pull/14372))
- Swaps: Asset sorting improvements ([#14436](https://github.com/MetaMask/metamask-extension/pull/14436))
    - In 'Swap from' field: tokens are sorted by user ownership and fiat value
    - In 'Swap to' field: tokens are sorted by top assets
- Redesign Networks view in Settings ([#13560](https://github.com/MetaMask/metamask-extension/pull/13560))
    - Adding network search functionality
- Show Smart Transaction switch when wrapping/unwrapping ([#14225](https://github.com/MetaMask/metamask-extension/pull/14225))

### Fixed
- Improving identicon settings accessibility ([#13760](https://github.com/MetaMask/metamask-extension/pull/13760))
- Enhanced Gas Fee UI: Fix gas values overlapping with labels ([#14392](https://github.com/MetaMask/metamask-extension/pull/14392))
- Settings search improvements ([#14350](https://github.com/MetaMask/metamask-extension/pull/14350))
    - Allow ampersands in search input
    - Fix duplicate entry issue in results
- Fix text wrapping issue in Settings search tabs ([#14368](https://github.com/MetaMask/metamask-extension/pull/14368))
- Dark Mode: Fix button styles in dialog actions ([#14361](https://github.com/MetaMask/metamask-extension/pull/14361))

## [10.13.0]
### Added
- Add a new fiat onboarding option via MoonPay ([#13934](https://github.com/MetaMask/metamask-extension/pull/13934))
    - Available for the following networks: Ethereum, BNB Chain, Polygon, Avalanche, Celo
- Add support for a Dark Mode theme ([#14207](https://github.com/MetaMask/metamask-extension/pull/14207))
- **[FLASK]** Add native browser notifications for Snaps via `snap_notify` permission ([#13613](https://github.com/MetaMask/metamask-extension/pull/13613))
- **[FLASK]** Add Snaps settting to search index ([#14100](https://github.com/MetaMask/metamask-extension/pull/14100))
- **[FLASK]** Display the Snap version during Snap installation ([#13931](https://github.com/MetaMask/metamask-extension/pull/13931))

### Changed
- Improvements for multi-layer fee UX ([#13547](https://github.com/MetaMask/metamask-extension/pull/13547))
    - Fix 'Send max' button when on a multi-layer fee network
    - Show fiat currency estimates alongside ETH estimates on multi-layer fee networks
    - Display L1+L2 gas fees as a combined total on multi-layer fee networks
    - Don't allow users to set gas price on Optimism
- Move Token Detection toggle to Advanced tab. ([#13977](https://github.com/MetaMask/metamask-extension/pull/13977))
- Don’t show ‘What’s new’ pop up to new users ([#13886](https://github.com/MetaMask/metamask-extension/pull/13886))
- Improving settings toggle accessibility by allowing label interaction ([#13876](https://github.com/MetaMask/metamask-extension/pull/13876))
- Updating account and network icons ([#13947](https://github.com/MetaMask/metamask-extension/pull/13947))
- Add 'Enhanced Gas UI' setting to search index ([#14206](https://github.com/MetaMask/metamask-extension/pull/14206))
- Add buy modal link to insufficient currency warning of all networks that have a fiat onramp, and update spacing in the warning's copy ([#14019](https://github.com/MetaMask/metamask-extension/pull/14019))

### Fixed
- Fix issue where editing advanced gas while speeeding up a transaction exits speedup ([#14101](https://github.com/MetaMask/metamask-extension/pull/14101))
- Fix typo in cancel/speed up messaging ([#14067](https://github.com/MetaMask/metamask-extension/pull/14067))
- Fix token icon when going from token detail page to Swaps view ([#14062](https://github.com/MetaMask/metamask-extension/pull/14062))
- Fix issue where the contract address is shown as recipient when calling safe transfer method on erc721 or erc1155 contracts ([#13535](https://github.com/MetaMask/metamask-extension/pull/13535))
- Ensure accounts still line up in dropdown ([#13986](https://github.com/MetaMask/metamask-extension/pull/13986))

## [10.12.4]
### Fixed
- Fix MetaMask internal error reporting (#14344)

## [10.12.3]
### Changed
- This version was used to rollback from v10.12.0 to v10.11.3.

## [10.12.2]
### Fixed
- Fix error where unlock failed after update to v10.12.0

## [10.12.1]
### Changed
- This version was used to rollback from v10.12.0 to v10.11.4.

## [10.12.0]
### Added
- Add a search feature to the settings page ([#13214](https://github.com/MetaMask/metamask-extension/pull/13214))
- Add AirGap Vault detail links to the hardware wallet connection flow ([#13650](https://github.com/MetaMask/metamask-extension/pull/13650))

### Changed
- Prevent users from entering too long a number for slippage in swaps ([#13914](https://github.com/MetaMask/metamask-extension/pull/13914))
- Hide non-essential information in our EIP-1559 v2 gas modal when the gas api is down ([#13865](https://github.com/MetaMask/metamask-extension/pull/13865))
- Updating colors of the account list ([#13864](https://github.com/MetaMask/metamask-extension/pull/13864))
- Show a more useful warning is users don't have enough of their networks base currency to pay for gas ([#13182](https://github.com/MetaMask/metamask-extension/pull/13182))
- Update "Forgot Password?" copy  ([#13493](https://github.com/MetaMask/metamask-extension/pull/13493))
- Show the address of the contract that is being interacted with next to the method name in transaction confirmation headers ([#13683](https://github.com/MetaMask/metamask-extension/pull/13683))
- Show the address of the contract that is being interacted next to 'Transfer' and 'Transfer From' method names in transaction confirmation headers ([#13776](https://github.com/MetaMask/metamask-extension/pull/13776))
- Performance and UX improvements for Gridplus lattice users (([#14158]https://github.com/MetaMask/metamask-extension/pull/14158))

### Fixed
- Ensure long signature request text is visible ([#13828](https://github.com/MetaMask/metamask-extension/pull/13828))
- Fix spelling of 'Ethereum' in German translation ([#13915](https://github.com/MetaMask/metamask-extension/pull/13915))
- Fix cases where the action buttons in a switch network confirmation window wouldn't work  ([#13847](https://github.com/MetaMask/metamask-extension/pull/13847))
- Ensure the origin of a site requesting permissions is fully visible in the permission request UI ([#13868](https://github.com/MetaMask/metamask-extension/pull/13868))
- Fix visual overflow problems with the account list in the connect flow
    - ([#13859](https://github.com/MetaMask/metamask-extension/pull/13859))
    - ([#13592](https://github.com/MetaMask/metamask-extension/pull/13592))
- Show the users primary currency in the "Max Base Fee" and "Priority Fee" fields of the gas customization window ([#13830](https://github.com/MetaMask/metamask-extension/pull/13830))
- Ensure latest gas estimates are shown on the transaction screen for users of the EIP-1559 v2 gas UI ([#13809](https://github.com/MetaMask/metamask-extension/pull/13809))
- Fix to allow toggling of the currency in the send flow when the user has "fiat" selected as the primary currency ([#13813](https://github.com/MetaMask/metamask-extension/pull/13813))
- Shows the sign and cancel button fully in signature page ([#13686](https://github.com/MetaMask/metamask-extension/pull/13686))
- Harden keyring type check in EthOverview ([#13711](https://github.com/MetaMask/metamask-extension/pull/13711))
- Update "Forgot Password?" copy  ([#13493](https://github.com/MetaMask/metamask-extension/pull/13493))
- Confirm transaction page: use method name only for contract transactions ([#13643](https://github.com/MetaMask/metamask-extension/pull/13643))
- **[FLASK]** Fix Snap permission list item shrinkage with short permission names ([#13996](https://github.com/MetaMask/metamask-extension/pull/13996))

## [10.11.4]
### Added
- **[FLASK]** Snap removal confirmation ([#13619](https://github.com/MetaMask/metamask-extension/pull/13619))

### Changed
- **[FLASK]** Update MetaMask Flask
  - This is the first release of [MetaMask Flask](https://metamask.io/flask) since the initial release on January 18. This release includes a significant number of fixes and DevX improvements. Flask will henceforth be released at a more frequent cadence, usually in close proximity to releases of the regular MetaMask Extension.
  - For reference, [#13462](https://github.com/MetaMask/metamask-extension/pull/13462) used the feature branch that produced the original Flask release after some additional changes were made.
- **[FLASK]** Update Snaps packages to version `^0.10.6` ([#13901](https://github.com/MetaMask/metamask-extension/pull/13901), [#14041](https://github.com/MetaMask/metamask-extension/pull/14041), [#14070](https://github.com/MetaMask/metamask-extension/pull/14070))
  - Updates the following packages from `0.9.0` to `0.10.6`:
    - `@metamask/iframe-execution-environment-service`
    - `@metamask/rpc-methods`
    - `@metamask/snap-controllers`
  - Updates the targeted [`iframe-execution-environment`](https://github.com/MetaMask/iframe-execution-environment) version from `0.3.1` to `0.4.2`.
  - These changes encompass a variety of fixes and devX improvements. See the [releases](https://github.com/MetaMask/snaps-skunkworks/releases) of the Snaps monorepo for details.

### Fixed
- **[FLASK]** Various UI issues ([#13462](https://github.com/MetaMask/metamask-extension/pull/13462))
  - _Note:_ The original Flask release was cut from the feature branch of [#13462](https://github.com/MetaMask/metamask-extension/pull/13462) before it was merged.
  - Fix Snaps permission request confirmation page title ([#13342](https://github.com/MetaMask/metamask-extension/pull/13342))
  - Fix Snaps custom confirmation `textarea` height ([#13572](https://github.com/MetaMask/metamask-extension/pull/13572))
  - Fix various styling issues ([#13577](https://github.com/MetaMask/metamask-extension/pull/13577))
- **[FLASK]** Fix Snap key management install warning appearance ([#13844](https://github.com/MetaMask/metamask-extension/pull/13844))

## [10.11.3]
### Changed
- Split secret recovery phrase input into one-field-per-word ([#14016](https://github.com/MetaMask/metamask-extension/pull/14016))

## [10.11.2]
### Fixed
- Fix bug that users who are connected to another extension would hit when viewing connected sites ([#13974](https://github.com/MetaMask/metamask-extension/pull/13974))


## [10.11.1]
### Changed
- Fixes GridPlus Lattice bugs by upgrading to `gridplus-sdk` v1.0.0, `eth-lattice-keyring` v0.5.0 and to compatibility with v0.14.0 ([#13834](https://github.com/MetaMask/metamask-extension/pull/13834))
- Increases transaction data in state logs
    - Preserves fewer transactions with shared nonces across networks, decreasing number of old transactions that are not deleted ([#13669](https://github.com/MetaMask/metamask-extension/pull/13669))
    - Increase the number of transactions saved in state logs to 60 ([#13743](https://github.com/MetaMask/metamask-extension/pull/13743))

### Fixed
- Ensure that MetaMask popup is shown when a user attempts to connect to a dapp they are already connected to ([#13840](https://github.com/MetaMask/metamask-extension/pull/13840))
- Submit correct gas limit for Swaps Smart Transactions ([#13891](https://github.com/MetaMask/metamask-extension/pull/13891))

## [10.11.0]
### Added
- Swaps: Add support for Smart Transactions on Mainnet and Rinkeby ([#12676](https://github.com/MetaMask/metamask-extension/pull/12676))
- Add "Token details" page ([#13216](https://github.com/MetaMask/metamask-extension/pull/13216))
- Add icons to sections in settings ([#12920](https://github.com/MetaMask/metamask-extension/pull/12920))
- Add EIP-712 support for Trezor ([#13693](https://github.com/MetaMask/metamask-extension/pull/13693))

### Changed
- Swaps: Change language "Quote X of Y" to "Fetching quote X of Y" ([#13663](https://github.com/MetaMask/metamask-extension/pull/13663))
- Update preferred account identicon selection UI ([#13408](https://github.com/MetaMask/metamask-extension/pull/13408))
- Include transactions from all networks in state logs ([#13599](https://github.com/MetaMask/metamask-extension/pull/13599))
- Update accounts connection language ([#13605](https://github.com/MetaMask/metamask-extension/pull/13605))
- Style updates for setting page in full screen mode ([#13569](https://github.com/MetaMask/metamask-extension/pull/13569))
- Add currency symbol validation in the add network form ([#12431](https://github.com/MetaMask/metamask-extension/pull/12431))

### Fixed
- Ensure pre-selected account on connect screen is visible in list ([#13621](https://github.com/MetaMask/metamask-extension/pull/13621))
- Do not allow transaction creation with gas limit below minimum ([#13574](https://github.com/MetaMask/metamask-extension/pull/13574))
- Fix network editing error when no block explorer is provided ([#13527](https://github.com/MetaMask/metamask-extension/pull/13527))
- Swaps: Fix BigNumber error when submitting quote ([#13555](https://github.com/MetaMask/metamask-extension/pull/13555))

## [10.10.2]
### Added
- Add EIP-712 support for Trezor ([#13693](https://github.com/MetaMask/metamask-extension/pull/13693))

## [10.10.1]
### Added
- Swaps: Enable Avalanche ([#13653](https://github.com/MetaMask/metamask-extension/pull/13653))

### Fixed
- Ensure Lattice hardware wallet can correctly sign all EIP-712 messages ([#13691](https://github.com/MetaMask/metamask-extension/pull/13691))
- Fix occasional errors when fetching swaps quotes ([#13732](https://github.com/MetaMask/metamask-extension/pull/13732))

## [10.10.0]
### Added
- Enable toggle to turn on the new gas fee customization UI ([#13481](https://github.com/MetaMask/metamask-extension/pull/13481))
    - Select between new 'Low', 'Market', and 'Aggressive' gas options
    - Improved advanced gas fee editing
    - Adds the ability to save custom gas values as defaults
    - More informative tooltips about suggested gas options
    - More information about the status of the network
- Enable buying MATIC on Polygon, BNB on BSC, AVAX on Avalanche, FTM on Fantom, CELO on Celo, and respective stablecoins  on Transak ([#13398](https://github.com/MetaMask/metamask-extension/pull/13398))
- Add German subtitles for SRP Video ([#13368](https://github.com/MetaMask/metamask-extension/pull/13368))
- Adding Brazilian Portuguese translation for some copy in Settings ([#13470](https://github.com/MetaMask/metamask-extension/pull/13470))

### Changed
- Hide 0 balance tokens in send screen dropdown if the "Hide Tokens Without Balance" toggle is on ([#13306](https://github.com/MetaMask/metamask-extension/pull/13306))
- Change the 'Connected Sites' removal icon to a button ([#13476](https://github.com/MetaMask/metamask-extension/pull/13476))
- Add specific hardware wallet names next to HW accounts in the account dropdown ([#13339](https://github.com/MetaMask/metamask-extension/pull/13339))
- Update title of phishing.html ([#13323](https://github.com/MetaMask/metamask-extension/pull/13323))
- Update language while importing an SRP to limit encouragement of copy-pasting seed phrases ([#12012](https://github.com/MetaMask/metamask-extension/pull/12012))
- Maintain leading whitespace in for data to be signed in the signature request popup ([#13340](https://github.com/MetaMask/metamask-extension/pull/13340))
- Update global link hover color from orange to blue ([#13344](https://github.com/MetaMask/metamask-extension/pull/13344))
- Adjust ordering of tokens in the Swaps token dropdown ([#13270](https://github.com/MetaMask/metamask-extension/pull/13270))

### Fixed
- Ensure a correct update of the gas limit upon editing of a transaction recipient ([#12784](https://github.com/MetaMask/metamask-extension/pull/12784))
- Ensure that the toggled display of currency in the send flow persists when editing a transaction ([#12813](https://github.com/MetaMask/metamask-extension/pull/12813))
- Ensure settings can be opened if browser zoom level > 100% ([#13460](https://github.com/MetaMask/metamask-extension/pull/13460))
- Ensure displayed balances of tokens are not incorrectly rounded down ([#13337](https://github.com/MetaMask/metamask-extension/pull/13337))
- Improve visual spacing on the wallet selection flow of onboarding ([#12799](https://github.com/MetaMask/metamask-extension/pull/12799))

## [10.9.3]
### Fixed
- Allow for scrolling when sign type data message is too long ([#13642](https://github.com/MetaMask/metamask-extension/pull/13642))
  - Require a scroll through of message before allowing user signature

## [10.9.2]
### Fixed
- Prevent errors on the swaps "View Quote" screen that can occur if the swaps API returns incorrect refund and max gas fees on some test networks ([#13511](https://github.com/MetaMask/metamask-extension/pull/13511))
- Prevent errors on startup in Chrome Versions earlier than 69, caused by use of unsupported browser `Array.prototype.flat` method ([#13520](https://github.com/MetaMask/metamask-extension/pull/13520))


## [10.9.1]
### Fixed
- Fixed application error when adding certain tokens ([#13484](https://github.com/MetaMask/metamask-extension/pull/13484))

## [10.9.0]
### Added
- Alert users when the network is busy ([#12268](https://github.com/MetaMask/metamask-extension/pull/12268))

### Changed
- Clear the clipboard after seed phrase is pasted into restore vault form ([#12987](https://github.com/MetaMask/metamask-extension/pull/12987))
- Remove bottom space when hiding testnet ([#12821](https://github.com/MetaMask/metamask-extension/pull/12821))
- Prevent automatic rejection of confirmations ([#13194](https://github.com/MetaMask/metamask-extension/pull/13194))
- Capitalize "learn more" link in permissions connect screen ([#13092](https://github.com/MetaMask/metamask-extension/pull/13092))
- Allow keyboard accessiblity on restore vault form ([#12989](https://github.com/MetaMask/metamask-extension/pull/12989))
- Permission System 2.0 ([#12243](https://github.com/MetaMask/metamask-extension/pull/12243))
  - Changed site origin and added permission list view ([#12832](https://github.com/MetaMask/metamask-extension/pull/12832))
  - Changed accounts selection permissions screen ([#13039](https://github.com/MetaMask/metamask-extension/pull/13039))
- Optimize Swaps flow ([#12939](https://github.com/MetaMask/metamask-extension/pull/12939))
- Remove legacy node parent detection ([#12814](https://github.com/MetaMask/metamask-extension/pull/12814))

### Fixed
- Fixed Mainnet Tokens autopopulating in custom token fields on other networks ([#12800](https://github.com/MetaMask/metamask-extension/pull/12800))
- Adjust the padding of lock button for certain locales ([#13017](https://github.com/MetaMask/metamask-extension/pull/13017))
- Lock button active state fix when holding mouse click ([#13100](https://github.com/MetaMask/metamask-extension/pull/13100))
- Fix order of account list on the "Send To" screen ([#12999](https://github.com/MetaMask/metamask-extension/pull/12999))
- Display hex data from previous send tx screen to edit tx screen ([#12709](https://github.com/MetaMask/metamask-extension/pull/12709))
- Sanitize eth_signTypedData message when corresponding field in 'types' is missing ([#12905](https://github.com/MetaMask/metamask-extension/pull/12905))
- Identicon size fix ([#13014](https://github.com/MetaMask/metamask-extension/pull/13014))
- Fixed latest conversion date on currency conversion in general settings  ([#12422](https://github.com/MetaMask/metamask-extension/pull/12422))
- Prevent account name duplicates ([#12867](https://github.com/MetaMask/metamask-extension/pull/12867))

## [10.8.2]
### Fixed
- Add missing `appName` localized messages for Flask and Beta ([#13138](https://github.com/MetaMask/metamask-extension/pull/13138))

## [10.8.1]
### Fixed
- [#13107](https://github.com/MetaMask/metamask-extension/pull/13107): Fix the Use Custom Nonce toggle

## [10.8.0]
### Added
- [#12881](https://github.com/MetaMask/metamask-extension/pull/12881): Feature: Transaction Insights
  - Users can now see much greater details on contract interaction transactions
  - These transaction details are integrated with new popups for viewing and editing address book information
  - These details are also viewable within the transaction details popup
- [#12627](https://github.com/MetaMask/metamask-extension/pull/12627): Add support for eip-1559 on Trezor Model T and Trezor Model One
- [#12065](https://github.com/MetaMask/metamask-extension/pull/12065): Support QR code based hardware wallet signing
  - Includes specific support for the Keystone hardware wallet

### Changed
- [#12842](https://github.com/MetaMask/metamask-extension/pull/12842): Improve performance of the swaps feature
- [#12776](https://github.com/MetaMask/metamask-extension/pull/12776): Hide the token detection announcement when the token detection is ON
- [#12828](https://github.com/MetaMask/metamask-extension/pull/12828): Clear the clipboard after the seed phrase is pasted into the import flow
- [#12576](https://github.com/MetaMask/metamask-extension/pull/12576): Show warning message when gas estimation estimates fail

### Fixed
- [#12802](https://github.com/MetaMask/metamask-extension/pull/12802): Fix bug causing occasional swaps failures for token pairs with highly precise exchange rates
- [#12679](https://github.com/MetaMask/metamask-extension/pull/12679): Ensure eth_sign callback fires even when data submitted is invalid

## [10.7.1]
### Fixed
- [#13005](https://github.com/MetaMask/metamask-extension/pull/13005): Fix connection to RPC urls with query strings.

## [10.7.0]
### Changed
- [#12566](https://github.com/MetaMask/metamask-extension/pull/12566): Enable LavaMoat for the webapp background
- [#12399](https://github.com/MetaMask/metamask-extension/pull/12399): Update the "Account Details" view
  - Change "Close" icon color from gray -> black
  - Display the entire account address
  - Use rounded style for "View on Etherscan" and "Export Private Key" buttons
- [#12824](https://github.com/MetaMask/metamask-extension/pull/12824): Add multilayer fee to token approval screen

### Fixed
- [#12696](https://github.com/MetaMask/metamask-extension/pull/12696): Show correct base asset for current network in the Signature Request view
- [#12727](https://github.com/MetaMask/metamask-extension/pull/12727): Make toggle buttons keyboard accessible
- [#12729](https://github.com/MetaMask/metamask-extension/pull/12729): Swaps: Fix issue with wrapping and unwrapping when an address contains uppercase characters
- [#12631](https://github.com/MetaMask/metamask-extension/pull/12631): Fix bug preventing sending high precision decimal amounts of tokens in the send flow

## [10.6.4]
### Changed
- [#12752](https://github.com/MetaMask/metamask-extension/pull/12752): Update link, in the add network flow, to the article with information about network security risks

## [10.6.3]
### Fixed
- [##12822](https://github.com/MetaMask/metamask-extension/pull/#12822): Fix `replaceChildren` and `function.prototype.apply` errors that could make the app unusable on older browsers due to a bug in our logo component.
- [#61e0526d5](https://github.com/MetaMask/metamask-extension/pull/61e0526d5): Fix requesting of swaps quotes for token pairs that have highly precise exchange rates.
- [##12773](https://github.com/MetaMask/metamask-extension/pull/#12773): Prevent token input in send flow from adding arbitary trailing decimal values to input

## [10.6.2]
### Fixed
- [#12770](https://github.com/MetaMask/metamask-extension/pull/12770): Fixed display of best quote in swaps quotes modal
- [#12786](https://github.com/MetaMask/metamask-extension/pull/12786): Ensure there is a single localhost option in network selector and that it is clickable

## [10.6.1]
### Fixed
- [#12573](https://github.com/MetaMask/metamask-extension/pull/12573): Ensure metrics api errors do not impact user experience

## [10.6.0]
### Added
- [#12053](https://github.com/MetaMask/metamask-extension/pull/12053): Add support for GridPlus Lattice1 hardware wallet
- [#12496](https://github.com/MetaMask/metamask-extension/pull/12496): Add warning for insufficient funds when approving a token
- [#12564](https://github.com/MetaMask/metamask-extension/pull/12564): Add dismissable link to advanced settings to the top of the networks dropdown

### Changed
- [#12435](https://github.com/MetaMask/metamask-extension/pull/12435): Hide ETH amount on confirm screen for contract interactions where no ETH is being sent
- [#12626](https://github.com/MetaMask/metamask-extension/pull/12626): Replace instances of 'testnets' with 'test networks' throughout the extension
- [#12380](https://github.com/MetaMask/metamask-extension/pull/12380): Update heading on contact details in popup view to say "Details" instead of the contact name
- [#12437](https://github.com/MetaMask/metamask-extension/pull/12437): Change decimal precision for ETH send amounts from 6 -> 8
- [#12415](https://github.com/MetaMask/metamask-extension/pull/12415): Show account name when entering a user's own account address in the recipient field
- [#12498](https://github.com/MetaMask/metamask-extension/pull/12498): Change token detection option wording from "Turn on Token Detection" -> "Turn on enhanced token detection"
- [#12359](https://github.com/MetaMask/metamask-extension/pull/12359): Update settings page icon colors with different gray values
- [#12531](https://github.com/MetaMask/metamask-extension/pull/12531): Show error if user has insufficient gas during send flow
- [#12553](https://github.com/MetaMask/metamask-extension/pull/12553): Update the "Permission Request" section on the approve screen
  - Update header from "Permission" -> "Permission Request"
  - Update "Amount" label -> "Approved Amount"
  - Update "To" label -> "Granted to"
  - Specify in the "Granted to" field whether amount is designated to a contract address
- [#12401](https://github.com/MetaMask/metamask-extension/pull/12401): Update transaction details view
  - Left align all content and adjust padding
  - Truncate "To" and "From" addresses, show icons for addresses
- [#12360](https://github.com/MetaMask/metamask-extension/pull/12360): Update approval screen
  - Update header copy: -> "Give permission to access your [token]?”
  - Update subheader copy -> "By granting permission, you are allowing the following [contract/account] to access your funds”
  - Include contract address and accompanying icon
- [#12302](https://github.com/MetaMask/metamask-extension/pull/12302): Open new full browser window for new network form upon clicking "Add Network"
- [#12260](https://github.com/MetaMask/metamask-extension/pull/12260): Update networks dropdown
  - Change "Custom RPC" to "Add a network" button
  - Hide test networks by default, and show them for users who have recently used them
  - Add option to display test networks in dropdown in advanced settings

### Removed
- [#12565](https://github.com/MetaMask/metamask-extension/pull/12565): Remove "hex data" field from the send flow for ERC-20 transactions

### Fixed
- [#12513](https://github.com/MetaMask/metamask-extension/pull/12513): Fix "Unavailable on this network" tooltip showing on Swaps button when Swaps is enabled for the current network.
- [#12511](https://github.com/MetaMask/metamask-extension/pull/12511): Fix issue where approval confirmation says "Unlimited" though limited funds were specified

## [10.5.2]
### Fixed
- [#12685](https://github.com/MetaMask/metamask-extension/pull/12685): Fix Ledger WebHID issue preventing confirmation of token approvals

## [10.5.1]
### Changed
- [#12658](https://github.com/MetaMask/metamask-extension/pull/12658): Properly display transaction fees on layer two networks like Optimism which have fees on both layers

## [10.5.0]
### Added
- [#12411](https://github.com/MetaMask/metamask-extension/pull/12411): Add support for connecting Ledger devices to MetaMask via WebHID
- [#12501](https://github.com/MetaMask/metamask-extension/pull/12501): Add "What's New" notification regarding Ledger WebHID support

### Removed
- [#12500](https://github.com/MetaMask/metamask-extension/pull/12500): Remove all notifications prior to Ledger WebHID announcement

## [10.4.1]
### Changed
- [#12515](https://github.com/MetaMask/metamask-extension/pull/12515): Updating 'Learn more' link location in dapp connection flow

## [10.4.0]
### Added
- [#12400](https://github.com/MetaMask/metamask-extension/pull/12400): Add text to Restore Account screen noting current wallet replacement

### Fixed
- [#12420](https://github.com/MetaMask/metamask-extension/pull/12420): Fix missing conversion rates in Swaps token dropdown
- [#12403](https://github.com/MetaMask/metamask-extension/pull/12403): Fix incorrect default locale used during onboarding
- [#12484](https://github.com/MetaMask/metamask-extension/pull/12484): Prevent occasional incorrect "No Quotes Found" result in Swaps
- [#12550](https://github.com/MetaMask/metamask-extension/pull/12550): Prevent occasional 'BigNumber' error on the confirm screen when sending tokens

## [10.3.0]
### Added
- [#12252](https://github.com/MetaMask/metamask-extension/pull/12252): Support type "0" transactions on EIP-1559 networks

### Changed
- [#12100](https://github.com/MetaMask/metamask-extension/pull/12100): Use more descriptive language for "View on Etherscan" links
- [#12279](https://github.com/MetaMask/metamask-extension/pull/12279): Remove autofocus from gas limit input in the advanced gas popup
- [#12096](https://github.com/MetaMask/metamask-extension/pull/12096): Standardize appearance of buttons across the extension
- [#12304](https://github.com/MetaMask/metamask-extension/pull/12304): Remove duplicate Cancel button on the Send screen
- [#12331](https://github.com/MetaMask/metamask-extension/pull/12331): Update "off" color for toggle buttons
- [#12330](https://github.com/MetaMask/metamask-extension/pull/12330): Standardize truncation for address display throughout the extension
- [#12384](https://github.com/MetaMask/metamask-extension/pull/12384): Move "View on Etherscan" link to the top of the account menu

### Fixed
- [#12229](https://github.com/MetaMask/metamask-extension/pull/12229): Fix whitespace validation issue for seed phrase entry (Restore Your Account)
- [#12230](https://github.com/MetaMask/metamask-extension/pull/12230): Fix gas control flicker on send screen when switching between EIP-1559 networks
- [#12186](https://github.com/MetaMask/metamask-extension/pull/12186): Fix grammatical issue with "Not connected to this site" message
- [#12381](https://github.com/MetaMask/metamask-extension/pull/12381): Fix width and padding of the hide token modal while in the popup view
- [#11996](https://github.com/MetaMask/metamask-extension/pull/11996): Fix 'BigNumber' app error when '0x' is supplied as the transaction value
- [#12339](https://github.com/MetaMask/metamask-extension/pull/12339): Correctly notify the inpage provider of current selected account on "unlock" events
- [#12405](https://github.com/MetaMask/metamask-extension/pull/12405): Fix allowance issue with WETH -> ETH Swaps

## [10.2.2]
### Changed
- [#12256](https://github.com/MetaMask/metamask-extension/pull/12256): Updating instruction step when Ledger app has contract data or blind signing setting disabled

## [10.2.1]
### Fixed
- [#12315](https://github.com/MetaMask/metamask-extension/pull/12315): Fix ERC-20 token swaps
- [#12284](https://github.com/MetaMask/metamask-extension/pull/12284): Restoring notice regarding mobile sync status to sync page

## [10.2.0]
### Added
- [#12066](https://github.com/MetaMask/metamask-extension/pull/12066): Enable token conversion rates for primary currencies on some non-Mainnet networks
- [#12110](https://github.com/MetaMask/metamask-extension/pull/12110): Enable search tab on "Import Tokens" page on supported custom networks
  - Tab will be hidden when the `Use Token Detection` setting is disabled
- [#11798](https://github.com/MetaMask/metamask-extension/pull/11798): Add warning about fake tokens, and rename `Add Token` page to `Import Tokens`
- [#11755](https://github.com/MetaMask/metamask-extension/pull/11755): Add `Refresh list` button to the main page
  - This button is shown only when the `Use Token Detection` setting is disabled
- [#11851](https://github.com/MetaMask/metamask-extension/pull/11851): Add Token Detection toggle to experimental settings
  - This feature is experimental and is off by default, when enabled, it will add auto-detected tokens to a user's asset list
- [#12042](https://github.com/MetaMask/metamask-extension/pull/12042): Add Max Fee Per Gas to transaction breakdown
- [#11999](https://github.com/MetaMask/metamask-extension/pull/11999): Add eth_feeHistory to API callable by dapps
- [#11849](https://github.com/MetaMask/metamask-extension/pull/11849): Add subtitles for additional languages (Secret Recovery Phrase Video)
- [#11772](https://github.com/MetaMask/metamask-extension/pull/11772): Add tooltip to better explain possible effects of setting gas fees below MetaMask's estimates
- [#11796](https://github.com/MetaMask/metamask-extension/pull/11796): Add "Max fee" label to maximum fee amount in edit gas display

### Changed
- [#12019](https://github.com/MetaMask/metamask-extension/pull/12019): Show the user's address book name for a contract, instead of the contract address, when on the confirmation screen
- [#11915](https://github.com/MetaMask/metamask-extension/pull/11915): Improved time to see Swaps quotes
- [#11802](https://github.com/MetaMask/metamask-extension/pull/11802): Display the correct currency symbol in function type label for simple send transactions on custom networks
- [#11982](https://github.com/MetaMask/metamask-extension/pull/11982): Sort contacts alphabetically within each letter group in the contact list.
- [#12000](https://github.com/MetaMask/metamask-extension/pull/12000): Include the blocked URL in the link to report an incorrectly blocked page.
- [#11964](https://github.com/MetaMask/metamask-extension/pull/11964): Disable spell-check in the address input
- [#12013](https://github.com/MetaMask/metamask-extension/pull/12013): Improving warning text for eth_sign transactions
- [#11945](https://github.com/MetaMask/metamask-extension/pull/11945): Send user to account page upon adding a custom network
- [#11895](https://github.com/MetaMask/metamask-extension/pull/11895): Update header on Send page from `Add Recipient` -> `Send to`
- [#11850](https://github.com/MetaMask/metamask-extension/pull/11850): Use "Secret Recovery Phrase" text throughout the onboarding flow
- [#11795](https://github.com/MetaMask/metamask-extension/pull/11795): Autofocus the Amount field on the Send screen
- [#11889](https://github.com/MetaMask/metamask-extension/pull/11889): Improve gas controls descriptions
- [#11805](https://github.com/MetaMask/metamask-extension/pull/11805): Update tooltip text for gas fees to avoid referring to custom networks as "Ethereum".
- [#11845](https://github.com/MetaMask/metamask-extension/pull/11845): Wrapping and unwrapping native currencies (e.g. ETH -> WETH) through Swaps now uses the wrapping contracts directly
- [#12056](https://github.com/MetaMask/metamask-extension/pull/12056): Improve the text for the "Cancel Edit" button, and allow rejecting the transaction from the Edit screen.
- [#12098](https://github.com/MetaMask/metamask-extension/pull/12098): Scroll down to show all fields when "Advanced options" is toggled in the advanced gas options
- [#11944](https://github.com/MetaMask/metamask-extension/pull/11944): Improve the "Import account" page layout

### Fixed
- [#12140](https://github.com/MetaMask/metamask-extension/pull/12140): Prevent the user from entering more than 15 significant digits in numeric fields, such as Max Priority Fee
  - Previously, entering more than 15 significant digits would result in an error.
- [#12169](https://github.com/MetaMask/metamask-extension/pull/12169): Fix handling of erroneous ERC-20 Token amount on the confirmation screen
  - Previously, if you entered a token amount with too many decimal places, it would corrupt the token amount in the transaction. Now we truncate any decimals beyond what the token allows instead.
- [#12074](https://github.com/MetaMask/metamask-extension/pull/12074): Prevent the addition of a duplicate, zero-balance account after importing a wallet with seed phrase
- [#11967](https://github.com/MetaMask/metamask-extension/pull/11967): Fix the display of long contact names on the contact settings pages.
- [#12122](https://github.com/MetaMask/metamask-extension/pull/12122): Ensure failed speedups don't prevent further speedup attempts, and hide the Base Fee and Priority Fee fields when we don't have that information
- [#11963](https://github.com/MetaMask/metamask-extension/pull/11963): Show scrollbar in the accounts menu
  - This makes the accounts list scrollable for users with no mouse scroll wheel.
- [#12058](https://github.com/MetaMask/metamask-extension/pull/12058): Fix clipping issue with long network names in the network dropdown
- [#12039](https://github.com/MetaMask/metamask-extension/pull/12039): Add missing padding at the bottom of the custom network form in the popup view
- [#11890](https://github.com/MetaMask/metamask-extension/pull/11890): Fix alignment of horizontal line shown under gas recommendations
- [#12244](https://github.com/MetaMask/metamask-extension/pull/12244): Fix form prefilling with values on the Build Quote page [Swaps]

## [10.1.1]
### Added
- [#12020](https://github.com/MetaMask/metamask-extension/pull/12020): Adds instructions for ledger live users on transaction confirm screen
- [#12144](https://github.com/MetaMask/metamask-extension/pull/12144): Add What's New notification about ledger EIP-1559 support and firmware updates

### Fixed
- [#12069](https://github.com/MetaMask/metamask-extension/pull/12069): Fixes bug where suggestedGasFee api is called excessively.

## [10.1.0]
### Added
- [#11951](https://github.com/MetaMask/metamask-extension/pull/11951): Adding EIP-1559 support for Ledger hardware

### Fixed
- [#11951](https://github.com/MetaMask/metamask-extension/pull/11951): Fixed contract deployments using Ledger hardware
- [#11972](https://github.com/MetaMask/metamask-extension/pull/11972): Fixed "continue at your own risk" button (Phishing alert page)
- [#11951](https://github.com/MetaMask/metamask-extension/pull/11951): Fixed ledger transactions on networks with large chainIds

## [10.0.3]
### Changed
- [#11931](https://github.com/MetaMask/metamask-extension/pull/11931): Temporarily Disabling Mobile Sync
- [#11936](https://github.com/MetaMask/metamask-extension/pull/11936): Use higher gas fees when attempting to speedup or cancel a transaction

### Fixed
- [#11900](https://github.com/MetaMask/metamask-extension/pull/11900): Fixing chainId comparison issue (sign typed message param validation)
- [#11930](https://github.com/MetaMask/metamask-extension/pull/11930): Using 9 decimal places of precision in gas price

## [10.0.2]
### Added
- [#11818](https://github.com/MetaMask/metamask-extension/pull/11818): Add gas recommendation options to cancel and speed up popovers

### Changed
- [#11853](https://github.com/MetaMask/metamask-extension/pull/11853): Allow editing custom gas while estimate is loading
- [#11862](https://github.com/MetaMask/metamask-extension/pull/11862): Increase saliency of mobile sync warning text
- [#11872](https://github.com/MetaMask/metamask-extension/pull/11872): Default gas limit in edit gas popover to 0 when estimates are unavailable
- [#11873](https://github.com/MetaMask/metamask-extension/pull/11873): Update copy on tooltip shown when dapp suggests gas fees

### Fixed
- [#11852](https://github.com/MetaMask/metamask-extension/pull/11852): Improve flashing behavior for loading gas estimates (Confirmation Screen)
- [#11874](https://github.com/MetaMask/metamask-extension/pull/11874): Fixes Trezor pairing integration

## [10.0.1]
### Fixed
- [#11813](https://github.com/MetaMask/metamask-extension/pull/11813): Fix error reporting version configuration

## [10.0.0]
### Added
- [#11694](https://github.com/MetaMask/metamask-extension/pull/11694): Add support for EIP-1559 transactions
- [#11625](https://github.com/MetaMask/metamask-extension/pull/11625): Added new tokens to MetaMask's default list
- [#11401](https://github.com/MetaMask/metamask-extension/pull/11401): Add Skylink support to ENS resolver
- [#11387](https://github.com/MetaMask/metamask-extension/pull/11387): Call Wyre’s API via our backend to generate Wyre’s Checkout URL
- [#11376](https://github.com/MetaMask/metamask-extension/pull/11376): Add support for fiat on-ramp via Transak
- [#11460](https://github.com/MetaMask/metamask-extension/pull/11460): Adding copy icon to home screen account address

### Changed
- [#11631](https://github.com/MetaMask/metamask-extension/pull/11631): Trimming leading spaces entered into the recipient field of send flow
- [#11608](https://github.com/MetaMask/metamask-extension/pull/11608): Ensure correct warning is shown when entering invalid addresses in the send flow
- [#11587](https://github.com/MetaMask/metamask-extension/pull/11587): Render error if user attempts to enter more decimals than a token supports in swaps build-quote fields
- [#11521](https://github.com/MetaMask/metamask-extension/pull/11521): Stylistic update to error messages shown on the confirm screen
- [#11537](https://github.com/MetaMask/metamask-extension/pull/11537): Ensure error is shown when user enters non-numeric input in network form chainId field
- [#11526](https://github.com/MetaMask/metamask-extension/pull/11526): Create different label for Gas Price with GWEI included
- [#11495](https://github.com/MetaMask/metamask-extension/pull/11495): Ensure prevention of sending any/all ERC721 tokens
- [#11459](https://github.com/MetaMask/metamask-extension/pull/11459): Remove leading zero when clicking amount input on send screen
- [#11379](https://github.com/MetaMask/metamask-extension/pull/11379): Stop displaying cursor as pointer on boarded network name in add network confirmation
- [#11386](https://github.com/MetaMask/metamask-extension/pull/11386): Take user to top of the screen/transaction-list after clicking assets with many transactions
- [#11356](https://github.com/MetaMask/metamask-extension/pull/11356): Fix position of home notifications to bottom of the screen
- [#11338](https://github.com/MetaMask/metamask-extension/pull/11338): Updating "Secret Recovery code" text to "Secret Recovery Phrase" in backup notification
- [#11322](https://github.com/MetaMask/metamask-extension/pull/11322): Make send screen MAX button accessible via keyboard
- [#11285](https://github.com/MetaMask/metamask-extension/pull/11285): Updating "MetaMask designed and built" message 🌎

### Fixed
- [#11586](https://github.com/MetaMask/metamask-extension/pull/11586): Fix display of warning when entering an invalid seed phrase on the import screen
- [#11294](https://github.com/MetaMask/metamask-extension/pull/11294): Ensure tokens symbols in asset list can be seen even when token amount is very long
- [#11335](https://github.com/MetaMask/metamask-extension/pull/11335): Add missing "Back" button back to send token flow
- [#11331](https://github.com/MetaMask/metamask-extension/pull/11331): Fix layout but in approval confirmation screen
- [#11512](https://github.com/MetaMask/metamask-extension/pull/11512): Stylistic fixes on account, token and address book components
- [#11606](https://github.com/MetaMask/metamask-extension/pull/11606): Prevent error upon clicking "Back" from the view quote screen of the swaps flow


## [9.8.4]
### Changed
- [#11652](https://github.com/MetaMask/metamask-extension/pull/11652): Allow higher precision gas prices in send flow

### Fixed
- [#11658](https://github.com/MetaMask/metamask-extension/pull/11658): Fixed incorrect gas limit estimates for send transactions

## [9.8.3]
### Fixed
- [#11594](https://github.com/MetaMask/metamask-extension/pull/11594): Fixed ERC20 token maximum send
- [#11610](https://github.com/MetaMask/metamask-extension/pull/11610): Fixed nickname display upon pasting saved address in send flow

## [9.8.2]
### Changed
- [#11545](https://github.com/MetaMask/metamask-extension/pull/11545): Allow MetaMask Swaps to support Polygon network

### Fixed
- [#11565](https://github.com/MetaMask/metamask-extension/pull/11565): Fix gas limit estimation for some tokens on custom networks
- [#11581](https://github.com/MetaMask/metamask-extension/pull/11581): Fixed bug that resulted in sends to some contracts being disabled.

## [9.8.1]
### Changed
- Adjusting transaction metrics values

### Fixed
- [#11538](https://github.com/MetaMask/metamask-extension/pull/11538): Fixed bug that prevented users from continuing to swap after going 'back' from the View Quote page of the swaps flow.

## [9.8.0]
### Added
- [#11435](https://github.com/MetaMask/metamask-extension/pull/11435): Add gas limit buffers for optimism network

### Changed
- [#11210](https://github.com/MetaMask/metamask-extension/pull/11210): Disable sending ERC-721 assets (NFTs)
- [#11418](https://github.com/MetaMask/metamask-extension/pull/11418): Use network gas estimate for gas limits of simple sends on custom networks

### Fixed
- [#11361](https://github.com/MetaMask/metamask-extension/pull/11361): Ensures custom network balance displays correctly when no ticker symbol is provided, and ensure ticker symbol displays correctly after all network switches.
- [#10965](https://github.com/MetaMask/metamask-extension/pull/10965): Fixed bug that resulted in sends to some contracts being disabled on custom networks.

## [9.7.1]
### Fixed
- [#11426](https://github.com/MetaMask/metamask-extension/pull/11426): Fixed bug that broke transaction speed up and cancel, when attempting those actions immediately after opening MetaMask

## [9.7.0]
### Added
- [#11021](https://github.com/MetaMask/metamask-extension/pull/11021): Add periodic reminder modal for backing up recovery phrase
- [#11179](https://github.com/MetaMask/metamask-extension/pull/11179): Add warning to the custom network form when attempting to add a custom network that already exists

### Changed
- [#11200](https://github.com/MetaMask/metamask-extension/pull/11200): Swaps: Shows custom tokens added from main assets tab
- [#11111](https://github.com/MetaMask/metamask-extension/pull/11111): Removing low gas price warning in advanced tab on test networks
- [#11145](https://github.com/MetaMask/metamask-extension/pull/11145): Swaps: Improving price difference notifications and warnings
- [#11124](https://github.com/MetaMask/metamask-extension/pull/11124): Swaps: Allowing for continual new swap submissions without flow reset
- [#11278](https://github.com/MetaMask/metamask-extension/pull/11278): Updated contract-metadata version to 1.26.0

### Fixed
- [#11017](https://github.com/MetaMask/metamask-extension/pull/11017): Fixes custom RPC block explorer links
- [#11257](https://github.com/MetaMask/metamask-extension/pull/11257): Fixes incorrect network currency label in encryption public key requests

## [9.6.1]
### Fixed
- [#11309](https://github.com/MetaMask/metamask-extension/pull/11309): Fixed signTypeData parameter validation issue

## [9.6.0]
### Added
- [#10905](https://github.com/MetaMask/metamask-extension/pull/10905): Implemented basic switchEthereumChain feature
- [#10967](https://github.com/MetaMask/metamask-extension/pull/10967): Add setting to dismiss seed phrase backup reminder
- [#11131](https://github.com/MetaMask/metamask-extension/pull/11131): What's New: Adding notification for updated seed phrase wording
- [#11083](https://github.com/MetaMask/metamask-extension/pull/11083): Adding BSC Swaps notification when a user is on BSC Mainnet
- [#11088](https://github.com/MetaMask/metamask-extension/pull/11088): Swaps: Add specific error content if Contract data are not enabled on Ledger
- [#11064](https://github.com/MetaMask/metamask-extension/pull/11064): Supporting EIP-712 signing for Ledger accounts
- [#10717](https://github.com/MetaMask/metamask-extension/pull/10717): Adding recovery phrase video to onboarding process

### Changed
- [#11007](https://github.com/MetaMask/metamask-extension/pull/11007): Hide basic tab in advanced gas modal when on testnets.
- [#10994](https://github.com/MetaMask/metamask-extension/pull/10994): Replacing the text "Seed Phrase" with "Secret Recovery Phrase" throughout the application.
- [#10987](https://github.com/MetaMask/metamask-extension/pull/10987): Swaps: Improve hardware wallet UX
- [#10936](https://github.com/MetaMask/metamask-extension/pull/10936): Swaps: Allow 0% slippage, show a warning for 0 < slippage <= 1, disallows Reviews when negative slippage occurs.
- [#10946](https://github.com/MetaMask/metamask-extension/pull/10946): Send user to activity view after transaction is complete
- [#10767](https://github.com/MetaMask/metamask-extension/pull/10767): Improving error handling when gas prices are unavailable.
- [#11118](https://github.com/MetaMask/metamask-extension/pull/11118): Removing support survey notification from What's New
- [#11115](https://github.com/MetaMask/metamask-extension/pull/11115): Hide basic tab in advanced gas modal for speedup and cancel when on testnets
- [#11030](https://github.com/MetaMask/metamask-extension/pull/11030): Return a specific error (code 4902) for switchEthereumChain requests for chains that aren't already in the user's wallet.
- [#11093](https://github.com/MetaMask/metamask-extension/pull/11093): Update all uses of "Seed Phrase" to "Secret Recovery Phrase"

### Fixed
- [#11025](https://github.com/MetaMask/metamask-extension/pull/11025): Fixed redirection to the build quotes page from the swaps page when failure has occurred
- [#11015](https://github.com/MetaMask/metamask-extension/pull/11015): Prevent an undefined gas price from breaking the transaction list
- [#11013](https://github.com/MetaMask/metamask-extension/pull/11013): Prevent signature request component from canceling hardware wallet signing
- [#10982](https://github.com/MetaMask/metamask-extension/pull/10982): Re-validating chain id when rpc url changes [custom network form]
- [#10988](https://github.com/MetaMask/metamask-extension/pull/10988): Allowing for scroll overflow when swaps content is too tall
- [#10971](https://github.com/MetaMask/metamask-extension/pull/10971): Removing gray background from contact address input
- [#10952](https://github.com/MetaMask/metamask-extension/pull/10952): Prevent lag in external monitors when using Mac + Chrome
- [#11127](https://github.com/MetaMask/metamask-extension/pull/11127): Fixes token removal when cancelling a swaps quote
- [#10956](https://github.com/MetaMask/metamask-extension/pull/10956): Fixes intermittent token display rounding error, better handling network errors for token fetches.
- [#11097](https://github.com/MetaMask/metamask-extension/pull/11097): Fixes account search results ordering
- [#11031](https://github.com/MetaMask/metamask-extension/pull/11031): Fixes error behavior of addEthereumChain

## [9.5.9]
### Added
- Re-added "Add Ledger Live Support" ([#10293](https://github.com/MetaMask/metamask-extension/pull/10293)), which was reverted in the previous version

### Fixed
- [#11225](https://github.com/MetaMask/metamask-extension/pull/11225) - Fix persistent display of chrome ledger What's New popup message

## [9.5.8]
### Added
- Re-added "Add Ledger Live Support" ([#10293](https://github.com/MetaMask/metamask-extension/pull/10293)), which was reverted in the previous version

### Fixed
- [#11207](https://github.com/MetaMask/metamask-extension/pull/11207) - Fix error causing crashes on some locales on v9.5.6

## [9.5.7]
### Fixed
- Revert "Add Ledger Live Support" ([#10293](https://github.com/MetaMask/metamask-extension/pull/10293)), which introduced a UI crash for some locales

## [9.5.6]
### Added
- [#10293](https://github.com/MetaMask/metamask-extension/pull/10293): Add Ledger Live Support

## [9.5.5]
### Fixed
- [#11159](https://github.com/MetaMask/metamask-extension/pull/11159): Fixes crash after entering invalid data in to the Hex Data field when sending a transaction

## [9.5.4]
### Fixed
- [#11153](https://github.com/MetaMask/metamask-extension/pull/11153): Prevent UI crash when the transaction being retried or canceled is missing.

## [9.5.3]
### Fixed
- Fixes bug that made MetaMask unusable and displayed 'Minified React error #130' on certain networks and accounts ([#11103](https://github.com/MetaMask/metamask-extension/pull/11103))
- Prevent big number error when attempting to view transaction list ([#11015](https://github.com/MetaMask/metamask-extension/pull/11015))

## [9.5.2]
### Fixed
- Fixing address entry error when sending a transaction on a custom network ([#11071](https://github.com/MetaMask/metamask-extension/pull/11071))

## [9.5.1]
### Fixed
- Fixed icon on approval screen ([#11048](https://github.com/MetaMask/metamask-extension/pull/11048))
- Fixed broken app state for some users with Chinese, Portuguese or Spanish browser language settings. ([#11036](https://github.com/MetaMask/metamask-extension/pull/11036))

## [9.5.0] - 2021-04-28
### Added
- Adding popup display to show new MetaMask notifications ([#10583](https://github.com/MetaMask/metamask-extension/pull/10583))
- Add menu with "View on Etherscan" and "Account details" links to ETH asset page ([#10938](https://github.com/MetaMask/metamask-extension/pull/10938))
- Add view account details menu item to token page menu ([#10932](https://github.com/MetaMask/metamask-extension/pull/10932))
- Adding new links to contact MetaMask support ([#10895](https://github.com/MetaMask/metamask-extension/pull/10895))
- Adding option to set Custom Nonce to Confirm Approve Page ([#10595](https://github.com/MetaMask/metamask-extension/pull/10595))
- Adding recovery phrase video to onboarding process ([#10717](https://github.com/MetaMask/metamask-extension/pull/10717))
- add trezor HD path for ledger wallets ([#10616](https://github.com/MetaMask/metamask-extension/pull/10616))

### Changed
- Use custom token icons in the send flow token dropdown ([#10939](https://github.com/MetaMask/metamask-extension/pull/10939))
- Remove "My Wallet Account" section in Settings > Contact ([#10680](https://github.com/MetaMask/metamask-extension/pull/10680))
- Harden contract address validation for token swaps ([#10912](https://github.com/MetaMask/metamask-extension/pull/10912))
- Show the custom network name in swaps network fee tooltip ([#10882](https://github.com/MetaMask/metamask-extension/pull/10882))
- Only check whether the swaps feature is live after entering the feature ([#10859](https://github.com/MetaMask/metamask-extension/pull/10859))
- Update swaps metadata every 5 minutes as opposed to an hour ([#10871](https://github.com/MetaMask/metamask-extension/pull/10871))
- Increase default slippage from 2% to 3% in swaps and show Advanced Options by default ([#10842](https://github.com/MetaMask/metamask-extension/pull/10842))
- Prevent tokens without addresses from being added to token list ([#10593](https://github.com/MetaMask/metamask-extension/pull/10593))
- Add New Zealand Dollar to currency options ([#10746](https://github.com/MetaMask/metamask-extension/pull/10746))
- Allow 11 characters in symbol for custom RPCs ([#10670](https://github.com/MetaMask/metamask-extension/pull/10670))
- Hide the suggested token pane when not on Mainnet or test network ([#10702](https://github.com/MetaMask/metamask-extension/pull/10702))
- Prevents autocomplete text from displaying in the Add Token input ([#10700](https://github.com/MetaMask/metamask-extension/pull/10700))
- Removing hard references to 12 word seed phrases in copy ([#10704](https://github.com/MetaMask/metamask-extension/pull/10704))
- Add MetaMask to list of BIP44 HD path examples ([#10703](https://github.com/MetaMask/metamask-extension/pull/10703))
- Change 'Send ETH' title to 'Send' in the send flow ([#10651](https://github.com/MetaMask/metamask-extension/pull/10651))
- Don't render faucet row in deposit modal for custom chains ([#10674](https://github.com/MetaMask/metamask-extension/pull/10674))

### Fixed
- Prevent overflow of hostname on confirmation page ([#10935](https://github.com/MetaMask/metamask-extension/pull/10935))
- Fixing ENS input entry in send flow ([#10923](https://github.com/MetaMask/metamask-extension/pull/10923))
- Fix mismatchedChain typo in custom network approval screen ([#10723](https://github.com/MetaMask/metamask-extension/pull/10723))
- Excluding sourcemaps comment in production builds ([#10695](https://github.com/MetaMask/metamask-extension/pull/10695))
- Prevent network dropdown label highlighting ([#10643](https://github.com/MetaMask/metamask-extension/pull/10643))
- Ensure swaps detail height doesn't create jump in vertical height ([#10644](https://github.com/MetaMask/metamask-extension/pull/10644))
- Position the 3dot menu in the same spot on asset screen and home screen ([#10642](https://github.com/MetaMask/metamask-extension/pull/10642))
- Ensure MetaMask works correctly when on a custom network that shares a chain id with a default Infura network ([#10594](https://github.com/MetaMask/metamask-extension/pull/10594))
- Fixed bug that prevented speeding up cancelled transactions ([#10579](https://github.com/MetaMask/metamask-extension/pull/10579))
- Fixes hidden token bug when zero balance preference is on ([#10630](https://github.com/MetaMask/metamask-extension/pull/10630))
- Removing double click bug from delete custom network modal ([#10628](https://github.com/MetaMask/metamask-extension/pull/10628))

## [9.4.0] - 2021-04-15
### Added
- Notify users when MetaMask is unable to connect to the blockchain host ([#10883](https://github.com/MetaMask/metamask-extension/pull/10883))

## [9.3.0] - 2021-04-02
### Added
- Swaps support for the Binance network ([#10721](https://github.com/MetaMask/metamask-extension/pull/10721))
- Swaps support for forked Mainnet on localhost ([#10658](https://github.com/MetaMask/metamask-extension/pull/10658))

### Fixed
- Display BNB token image for default currency on BSC network home screen ([#10777](https://github.com/MetaMask/metamask-extension/pull/10777))
- Fix: ETH now only appears once in the swaps "to" and "from" dropdowns. ([#10650](https://github.com/MetaMask/metamask-extension/pull/10650))

## [9.2.1] - 2021-03-26
### Fixed
- Prevent UI crash when a 'wallet_requestPermissions" confirmation is queued behind a "wallet_addEthereumChain" confirmation ([#10692](https://github.com/MetaMask/metamask-extension/pull/10692))
- Fix infinite spinner when request for token symbol fails while attempting an approve transaction ([#10712](https://github.com/MetaMask/metamask-extension/pull/10712))

## [9.2.0] - 2021-03-15
### Added
- Add a warning when sending a token to its own contract address ([#10546](https://github.com/MetaMask/metamask-extension/pull/10546))
- Adding warnings for excessive custom gas input ([#10582](https://github.com/MetaMask/metamask-extension/pull/10582))
- Add support for multiple Ledger & Trezor hardware accounts ([#10505](https://github.com/MetaMask/metamask-extension/pull/10505))
- Add setting to hide zero balance tokens ([#10486](https://github.com/MetaMask/metamask-extension/pull/10486))

### Changed
- Update references to MetaMask support ([#10563](https://github.com/MetaMask/metamask-extension/pull/10563))
- Update Italian translation ([#10126](https://github.com/MetaMask/metamask-extension/pull/10126))

### Fixed
- Fix mobile sync of ERC20 tokens ([#10591](https://github.com/MetaMask/metamask-extension/pull/10591))
- Fix activity title text truncation ([#10601](https://github.com/MetaMask/metamask-extension/pull/10601))
- Remove 'Ethereum' from custom RPC endpoint warning ([#10598](https://github.com/MetaMask/metamask-extension/pull/10598))
- Show loading screen while fetching token data for approve screen ([#10606](https://github.com/MetaMask/metamask-extension/pull/10606))
- Show correct block explorer for custom RPC endpoints for built-in networks ([#10587](https://github.com/MetaMask/metamask-extension/pull/10587))

## [9.1.1] - 2021-03-03
### Fixed
- Fix ENS resolution related crashes when switching networks on send screen ([#10560](https://github.com/MetaMask/metamask-extension/pull/10560))
- Fix crash when speeding up an attempt to cancel a transaction on custom networks ([#10561](https://github.com/MetaMask/metamask-extension/pull/10561))

## [9.1.0] - 2021-02-01
### Uncategorized
- Update Japanese translations. ([#10265](https://github.com/MetaMask/metamask-extension/pull/10265))
- Update Chinese(Simplified) translations. ([#9388](https://github.com/MetaMask/metamask-extension/pull/9388))
- Update Vietnamese translations. ([#10270](https://github.com/MetaMask/metamask-extension/pull/10270))
- Update Spanish and Spanish(Latin American and Caribbean) translations. ([#10258](https://github.com/MetaMask/metamask-extension/pull/10258))
- Update Russian translations. ([#10268](https://github.com/MetaMask/metamask-extension/pull/10268))
- Update Tagalog localized messages. ([#10269](https://github.com/MetaMask/metamask-extension/pull/10269))
- Fix 'imported' translation use case for Dutch. ([#10448](https://github.com/MetaMask/metamask-extension/pull/10448))
- Use translated transaction category for confirmations. ([#10391](https://github.com/MetaMask/metamask-extension/pull/10391))
- Cancel unapproved confirmations on network change ([#10357](https://github.com/MetaMask/metamask-extension/pull/10357))
- Use native currency in asset row. ([#10413](https://github.com/MetaMask/metamask-extension/pull/10413))
- Fix color indicator size on connected site indicator. ([#10421](https://github.com/MetaMask/metamask-extension/pull/10421))
- Fix multiple notification window prompts. ([#10423](https://github.com/MetaMask/metamask-extension/pull/10423))
- Fix icons on token options menu. ([#10424](https://github.com/MetaMask/metamask-extension/pull/10424))
- Fix token fiat conversion rates when switching from certain custom networks. ([#10414](https://github.com/MetaMask/metamask-extension/pull/10414))
- Disable BUY button from home screen when not on Ethereum Mainnet. ([#10453](https://github.com/MetaMask/metamask-extension/pull/10453))
- Fixes gas selection check mark on the notification view. ([#10465](https://github.com/MetaMask/metamask-extension/pull/10465))
- Fix confirm page header with from/to addresses in fullscreen for tx confirmations. ([#10467](https://github.com/MetaMask/metamask-extension/pull/10467))
- Hide links to etherscan when no block explorer is specified for a custom network for notifications. ([#10455](https://github.com/MetaMask/metamask-extension/pull/10455))
- Fix swap insufficient balance error message. ([#10456](https://github.com/MetaMask/metamask-extension/pull/10456))
- Fix encypt/decrypt tx queueing. ([#10350](https://github.com/MetaMask/metamask-extension/pull/10350))
- Improve autofocus in the add network form. ([#10473](https://github.com/MetaMask/metamask-extension/pull/10473))
- Use eth_gasprice for tx gas price estimation on non-Mainnet networks. ([#10444](https://github.com/MetaMask/metamask-extension/pull/10444))
- Fix accountsChanged event not triggering when manually connecting. ([#10477](https://github.com/MetaMask/metamask-extension/pull/10477))
- Fix navigation from jumping vertically when clicking into token. ([#10471](https://github.com/MetaMask/metamask-extension/pull/10471))
- Add custom network RPC method. ([#9724](https://github.com/MetaMask/metamask-extension/pull/9724))
- Eliminate artificial delay in swaps loading screen after request loading is complete. ([#10496](https://github.com/MetaMask/metamask-extension/pull/10496))
- Ensure that swap approve tx and swap tx always have the same gas price. ([#10501](https://github.com/MetaMask/metamask-extension/pull/10501))
- Fixes signTypedData message overflow. ([#10485](https://github.com/MetaMask/metamask-extension/pull/10485))
- Update swaps failure message to include a support link. ([#10525](https://github.com/MetaMask/metamask-extension/pull/10525))
- Accommodate for 0 sources verifying swap token ([#10521](https://github.com/MetaMask/metamask-extension/pull/10521))
- Show warnings on Add Recipient page of Send flow ([#10530](https://github.com/MetaMask/metamask-extension/pull/10530))
- Warn users when an ENS name contains 'confusable' characters ([#9187](https://github.com/MetaMask/metamask-extension/pull/9187))
- Fixes ENS IPFS resolution on custom networks with the chainID of 1. ([#10507](https://github.com/MetaMask/metamask-extension/pull/10507))

## [9.0.5] - 2021-02-09
### Uncategorized
- Allow editing transaction amount after clicking max ([#10278](https://github.com/MetaMask/metamask-extension/pull/10278))
- Standardize size, shape and color of network color indicators ([#10214](https://github.com/MetaMask/metamask-extension/pull/10214))
- Use network primary currency instead of always defaulting to ETH in the confirm approve screen ([#10298](https://github.com/MetaMask/metamask-extension/pull/10298))
- Add origin to signature request confirmation page ([#10300](https://github.com/MetaMask/metamask-extension/pull/10300))
- Add origin to transaction confirmation ([#10296](https://github.com/MetaMask/metamask-extension/pull/10296))
- Update `ko` localized messages ([#10266](https://github.com/MetaMask/metamask-extension/pull/10266))
- Update `id` localized messages ([#10263](https://github.com/MetaMask/metamask-extension/pull/10263))
- Require click of "Continue" button to interact with swap screen if there is a price impact warning for present swap ([#10347](https://github.com/MetaMask/metamask-extension/pull/10347))
- Change copy of submit button on swaps screen ([#10373](https://github.com/MetaMask/metamask-extension/pull/10373))
- Swaps token sources/verification messaging update ([#10346](https://github.com/MetaMask/metamask-extension/pull/10346))
- Stop showing the window.web3 in-app popup if the dapp is just using web3.currentProvider ([#10378](https://github.com/MetaMask/metamask-extension/pull/10378))
- Throw error when attempting to get an encryption key via eth_getEncryptionPublicKey when connected to Ledger HW ([#10326](https://github.com/MetaMask/metamask-extension/pull/10326))
- Make action buttons on message components in swaps flow accessible ([#10386](https://github.com/MetaMask/metamask-extension/pull/10386))

## [9.0.4] - 2021-01-27
### Uncategorized
- Update @metamask/contract-metadata from v1.21.0 to 1.22.0 ([#10285](https://github.com/MetaMask/metamask-extension/pull/10285))
- Update `hi` localized messages ([#10264](https://github.com/MetaMask/metamask-extension/pull/10264))
- Move fox to bottom of 'About' page ([#10174](https://github.com/MetaMask/metamask-extension/pull/10174))
- Fix hardware account selection ([#10198](https://github.com/MetaMask/metamask-extension/pull/10198))
- Add a timeout to all network requests ([#10101](https://github.com/MetaMask/metamask-extension/pull/10101))
- Fix displayed balance of tokens with 0 decimals in swaps flow ([#10212](https://github.com/MetaMask/metamask-extension/pull/10212))
- Prevent accidentally submitting a swap twice ([#10162](https://github.com/MetaMask/metamask-extension/pull/10162))
- Improve chain ID validation ([#10224](https://github.com/MetaMask/metamask-extension/pull/10224))
- Increase minimum Firefox version to v68 ([#10195](https://github.com/MetaMask/metamask-extension/pull/10195))
- Update TrezorConnect to v8 ([#10192](https://github.com/MetaMask/metamask-extension/pull/10192))
- Fix back button on swaps loading page ([#10166](https://github.com/MetaMask/metamask-extension/pull/10166))
- Do not publish swaps transaction if the estimateGas call made when adding the transaction fails. ([#9947](https://github.com/MetaMask/metamask-extension/pull/9947))

## [9.0.3] - 2021-01-22
### Uncategorized
- Fix site metadata handling ([#10243](https://github.com/MetaMask/metamask-extension/pull/10243))
- Fix decrypt message confirmation UI crash ([#10252](https://github.com/MetaMask/metamask-extension/pull/10252))

## [9.0.2] - 2021-01-20
### Uncategorized
- zh_TW: 乙太 -> 以太 ([#10191](https://github.com/MetaMask/metamask-extension/pull/10191))
- zh_TW: Translate buy, assets, activity ([#10207](https://github.com/MetaMask/metamask-extension/pull/10207))
- Restore provider 'data' event ([#10219](https://github.com/MetaMask/metamask-extension/pull/10219))

## [9.0.1] - 2021-01-13
### Uncategorized
- Improved detection of contract methods with array parameters ([#10169](https://github.com/MetaMask/metamask-extension/pull/10169))
- Only warn of injected web3 usage once per page ([#10178](https://github.com/MetaMask/metamask-extension/pull/10178))
- Restore support for @metamask/inpage provider@"< 8.0.0" ([#10179](https://github.com/MetaMask/metamask-extension/pull/10179))
- Fix UI crash when domain metadata is missing on public encryption key confirmation page ([#10180](https://github.com/MetaMask/metamask-extension/pull/10180))

## [9.0.0] - 2021-01-12
### Uncategorized
- Remove window.web3 injection ([#9156](https://github.com/MetaMask/metamask-extension/pull/9156))
- Add web3 shim usage notification ([#10039](https://github.com/MetaMask/metamask-extension/pull/10039))
- Implement breaking window.ethereum API changes ([#8640](https://github.com/MetaMask/metamask-extension/pull/8640))
- Fix `eth_chainId` return values for Infura networks ([#8629](https://github.com/MetaMask/metamask-extension/pull/8629))
- Increase Chrome minimum version to v63 ([#10019](https://github.com/MetaMask/metamask-extension/pull/10019))
- Fix error where a swap only completed the token approval transaction ([#10135](https://github.com/MetaMask/metamask-extension/pull/10135))
- Remove unnecessary swaps footer space when in dropdown mode ([#10100](https://github.com/MetaMask/metamask-extension/pull/10100))
- Redesign view quote screens ([#9905](https://github.com/MetaMask/metamask-extension/pull/9905))
- Prevent hidden tokens from reappearing ([#9320](https://github.com/MetaMask/metamask-extension/pull/9320))
- Use consistent font size for modal top right Close links ([#10000](https://github.com/MetaMask/metamask-extension/pull/10000))
- Improve home screen notification appearance ([#10046](https://github.com/MetaMask/metamask-extension/pull/10046))
- Always roll back to the previously selected network when unable to connect to a newly selected network ([#10093](https://github.com/MetaMask/metamask-extension/pull/10093))
- Fix network settings Kovan block explorer link ([#10117](https://github.com/MetaMask/metamask-extension/pull/10117))
- Prevent malformed next nonce warning ([#10143](https://github.com/MetaMask/metamask-extension/pull/10143))
- Update @metamask/contract-metadata from v1.20.0 to 1.21.0 ([#10142](https://github.com/MetaMask/metamask-extension/pull/10142))
- Fix French "Block Explorer URL" translations ([#10160](https://github.com/MetaMask/metamask-extension/pull/10160))
- Automatically detect tokens on custom Mainnet RPC endpoints ([#10157](https://github.com/MetaMask/metamask-extension/pull/10157))
- Improve zh_CN translation ([#9772](https://github.com/MetaMask/metamask-extension/pull/9772))
- Fix bug where swaps button was disabled on Mainnet if the user hadn't switched networks in a long time ([#10170](https://github.com/MetaMask/metamask-extension/pull/10170))

## [8.1.11] - 2021-01-07
### Uncategorized
- Disable swaps when the current network's chainId does not match the mainnet chain ID, instead of disabling based on network ID ([#10155](https://github.com/MetaMask/metamask-extension/pull/10155))

## [8.1.10] - 2021-01-04
### Uncategorized
- Set last provider when switching to a customRPC ([#10084](https://github.com/MetaMask/metamask-extension/pull/10084))
- Update `@metamask/controllers` to v5.1.0 ([#10096](https://github.com/MetaMask/metamask-extension/pull/10096))
- Prevent stuck loading screen in some situations ([#10103](https://github.com/MetaMask/metamask-extension/pull/10103))
- Bump @metamask/contract-metadata from 1.19.0 to 1.20.0 ([#10104](https://github.com/MetaMask/metamask-extension/pull/10104))
- Fix frozen loading screen on Firefox when strict Enhanced Tracking Protection is enabled ([#10110](https://github.com/MetaMask/metamask-extension/pull/10110))

## [8.1.9] - 2020-12-15
### Uncategorized
- Fix contentscript injection failure on Firefox 56 ([#10034](https://github.com/MetaMask/metamask-extension/pull/10034))
- Fix token validation in Send flow ([#10045](https://github.com/MetaMask/metamask-extension/pull/10045))
- Display boolean values when signing typed data ([#10048](https://github.com/MetaMask/metamask-extension/pull/10048))
- Add eth_getProof ([#10070](https://github.com/MetaMask/metamask-extension/pull/10070))
- Improve swaps maximum gas estimation ([#10043](https://github.com/MetaMask/metamask-extension/pull/10043))
- Fetch swap quote refresh time from API ([#10069](https://github.com/MetaMask/metamask-extension/pull/10069))
- Disable console in contentscript to reduce noise ([#10040](https://github.com/MetaMask/metamask-extension/pull/10040))

## [8.1.8] - 2020-12-09
### Uncategorized
- Improve transaction params validation ([#9992](https://github.com/MetaMask/metamask-extension/pull/9992))
- Don't allow more than 15% slippage ([#9991](https://github.com/MetaMask/metamask-extension/pull/9991))
- Prevent unwanted 'no quotes available' message when going back to build quote screen while having insufficient funds ([#9994](https://github.com/MetaMask/metamask-extension/pull/9994))
- Fix missing contacts upon restart ([#9999](https://github.com/MetaMask/metamask-extension/pull/9999))

## [8.1.7] - 2020-12-09
### Uncategorized
- Revert SES lockdown

## [8.1.6] - 2020-12-04
### Uncategorized
- Fix QR code scans interpretting payment requests as token addresses ([#9916](https://github.com/MetaMask/metamask-extension/pull/9916))
- Add alt text for images in list items ([#9847](https://github.com/MetaMask/metamask-extension/pull/9847))
- Ensure watchAsset returns errors for invalid token symbols ([#9960](https://github.com/MetaMask/metamask-extension/pull/9960))
- Adds tokens from v1.19.0 of metamask/contract-metadata to add token lists ([#9968](https://github.com/MetaMask/metamask-extension/pull/9968))
- Etherscan links support Goerli network ([#9970](https://github.com/MetaMask/metamask-extension/pull/9970))
- Show price impact warnings on swaps quote screen ([#9899](https://github.com/MetaMask/metamask-extension/pull/9899))
- Replace use of ethgasstation ([#9867](https://github.com/MetaMask/metamask-extension/pull/9867))
- Show correct gas estimates when users don't have sufficient balance for contract transaction ([#9984](https://github.com/MetaMask/metamask-extension/pull/9984))
- Add 48x48 MetaMask icon for use by browsers ([#9993](https://github.com/MetaMask/metamask-extension/pull/9993))

## [8.1.5] - 2020-11-19
### Uncategorized
- Show send text upon hover in main asset list ([#9871](https://github.com/MetaMask/metamask-extension/pull/9871))
- Make edit icon and account name in account details modal focusable ([#9855](https://github.com/MetaMask/metamask-extension/pull/9855))
- Provide alternative text for images where appropriate ([#9853](https://github.com/MetaMask/metamask-extension/pull/9853))
- Remove CoinSwitch from the Deposit modal ([#9869](https://github.com/MetaMask/metamask-extension/pull/9869))
- Move add contact button in fullscreen/expanded view of settings lower to expose the close button. ([#9883](https://github.com/MetaMask/metamask-extension/pull/9883))
- Add token verification message to swaps build quote screen ([#9891](https://github.com/MetaMask/metamask-extension/pull/9891))
- Show failed token balance updates ([#9896](https://github.com/MetaMask/metamask-extension/pull/9896))
- Update asset page etherscan link to the address-filtered token page on Etherscan ([#9909](https://github.com/MetaMask/metamask-extension/pull/9909))
- Revert "Show a 'send eth' button on home screen in full screen mode" ([#9910](https://github.com/MetaMask/metamask-extension/pull/9910))
- Ensure "Known contract address" warning is shown on send screen even when changing asset ([#9907](https://github.com/MetaMask/metamask-extension/pull/9907))
- Fix display of Ledger connection error ([#9911](https://github.com/MetaMask/metamask-extension/pull/9911))
- Fix missing icon in asset page dropdown and in advanced gas modal button group ([#9918](https://github.com/MetaMask/metamask-extension/pull/9918))

## [8.1.4] - 2020-11-16
### Uncategorized
- Allow speeding up of underpriced transactions ([#9687](https://github.com/MetaMask/metamask-extension/pull/9687))
- normalize UI component font styles ([#9694](https://github.com/MetaMask/metamask-extension/pull/9694))
- normalize app component font styles ([#9695](https://github.com/MetaMask/metamask-extension/pull/9695))
- normalize deprecated itcss font styles ([#9696](https://github.com/MetaMask/metamask-extension/pull/9696))
- normalize page font styles ([#9697](https://github.com/MetaMask/metamask-extension/pull/9697))
- Standardize network settings page ([#9740](https://github.com/MetaMask/metamask-extension/pull/9740))
- Make swap arrows accessible, make swaps advanced options accessible ([#9750](https://github.com/MetaMask/metamask-extension/pull/9750))
- Use 1px borders on inputs and buttons ([#9766](https://github.com/MetaMask/metamask-extension/pull/9766))
- Remove border radius from transfer button ([#9767](https://github.com/MetaMask/metamask-extension/pull/9767))
- Update custom RPC network dropdown icons ([#9764](https://github.com/MetaMask/metamask-extension/pull/9764))
- Add confirmation for network dropdown delete action ([#9763](https://github.com/MetaMask/metamask-extension/pull/9763))
- Use `chainId` for incoming transactions controller ([#9583](https://github.com/MetaMask/metamask-extension/pull/9583))
- Autofocus input, improve accessibility of restore page ([#9748](https://github.com/MetaMask/metamask-extension/pull/9748))
- Shorten unit input width and use ellipses for overflow ([#9778](https://github.com/MetaMask/metamask-extension/pull/9778))
- Make the login screen's Restore and Import links accessible ([#9746](https://github.com/MetaMask/metamask-extension/pull/9746))
- Display decimal chain ID in network form ([#9780](https://github.com/MetaMask/metamask-extension/pull/9780))
- Use MetaSwap API for gas price estimation in swaps ([#9599](https://github.com/MetaMask/metamask-extension/pull/9599))
- Make all UI tabs accessible via keyboard ([#9518](https://github.com/MetaMask/metamask-extension/pull/9518))
- Always allow overwriting invalid custom RPC chain ID ([#9808](https://github.com/MetaMask/metamask-extension/pull/9808))
- Fix send header cancel button alignment ([#9812](https://github.com/MetaMask/metamask-extension/pull/9812))
- Do not check popupIsOpen on Vivaldi ([#9271](https://github.com/MetaMask/metamask-extension/pull/9271))
- Fix UI crash when dapp submits negative gas price ([#9306](https://github.com/MetaMask/metamask-extension/pull/9306))
- Add sort and search to AddRecipient accounts list ([#9257](https://github.com/MetaMask/metamask-extension/pull/9257))
- Move `externally_connectable` from base to Chrome manifest ([#9824](https://github.com/MetaMask/metamask-extension/pull/9824))
- Add support for custom network RPC URL with basic auth ([#9815](https://github.com/MetaMask/metamask-extension/pull/9815))
- Make QR code button focusable ([#9822](https://github.com/MetaMask/metamask-extension/pull/9822))
- Warn instead of throw on duplicate web3 ([#9832](https://github.com/MetaMask/metamask-extension/pull/9832))
- @metamask/controllers@4.0.0 ([#9838](https://github.com/MetaMask/metamask-extension/pull/9838))
- Prevent user from getting stuck on opt in page ([#9856](https://github.com/MetaMask/metamask-extension/pull/9856))
- Show a 'send eth' button on home screen in full screen mode ([#9845](https://github.com/MetaMask/metamask-extension/pull/9845))
- Show send text upon hover in main asset list ([#9871](https://github.com/MetaMask/metamask-extension/pull/9871))
- Properly detect U2F errors in hardware wallet ([#9880](https://github.com/MetaMask/metamask-extension/pull/9880))

## [8.1.3] - 2020-10-29
### Uncategorized
- Prevent excessive overflow from swap dropdowns ([#9642](https://github.com/MetaMask/metamask-extension/pull/9642))
- Fix sorting Quote Source column of quote sort list ([#9658](https://github.com/MetaMask/metamask-extension/pull/9658))
- Fix adding contact with QR code ([#9667](https://github.com/MetaMask/metamask-extension/pull/9667))
- Fix ENS resolution of `.eth` URLs with query strings ([#9674](https://github.com/MetaMask/metamask-extension/pull/9674))
- Bump @metamask/inpage-provider from 6.1.0 to 6.3.0 ([#9691](https://github.com/MetaMask/metamask-extension/pull/9691))
- Provide image sizing so there's no jump when opening the swaps token search ([#9700](https://github.com/MetaMask/metamask-extension/pull/9700))
- Add ses lockdown to build system ([#9568](https://github.com/MetaMask/metamask-extension/pull/9568))
- Prevent memory leak from selected account copy tooltip ([#9705](https://github.com/MetaMask/metamask-extension/pull/9705))
- Prevent old fetches from polluting the swap state ([#9671](https://github.com/MetaMask/metamask-extension/pull/9671))
- Keyboard navigation for swaps dropdowns ([#9702](https://github.com/MetaMask/metamask-extension/pull/9702))
- Switch from Matomo to Segment ([#9646](https://github.com/MetaMask/metamask-extension/pull/9646))
- Fix fetching swaps when initial network not Mainnet ([#9745](https://github.com/MetaMask/metamask-extension/pull/9745))
- Include aggregator fee as part of displayed network fees ([#9621](https://github.com/MetaMask/metamask-extension/pull/9621))
- Bump eth-contract-metadata from 1.16.0 to 1.17.0 ([#9736](https://github.com/MetaMask/metamask-extension/pull/9736))
- Fix "+-" prefix on swap token amount ([#9743](https://github.com/MetaMask/metamask-extension/pull/9743))
- Focus on wallet address in buy workflow ([#9715](https://github.com/MetaMask/metamask-extension/pull/9715))

## [8.1.2] - 2020-10-20
### Uncategorized
- Ensure QR code scanner works ([#9608](https://github.com/MetaMask/metamask-extension/pull/9608))
- Help users avoid insufficient gas prices in swaps ([#9624](https://github.com/MetaMask/metamask-extension/pull/9624))
- Update swaps network fee tooltip ([#9614](https://github.com/MetaMask/metamask-extension/pull/9614))
- Prevent reducing the gas limit for swaps ([#9623](https://github.com/MetaMask/metamask-extension/pull/9623))
- Fix UI crash when trying to render estimated time remaining of non-submitted transaction ([#9630](https://github.com/MetaMask/metamask-extension/pull/9630))
- Update View Quote page to better represent the MetaMask fee ([#9633](https://github.com/MetaMask/metamask-extension/pull/9633))

## [8.1.1] - 2020-10-15
### Uncategorized
- Prevent build quote crash when swapping from non-tracked token with balance ([#9586](https://github.com/MetaMask/metamask-extension/pull/9586))
- Remove commitment to maintain a public metrics dashboard ([#9592](https://github.com/MetaMask/metamask-extension/pull/9592))
- Fix TypeError when `signTypedData` throws ([#9596](https://github.com/MetaMask/metamask-extension/pull/9596))
- Fix Firefox overflow on transaction items with long amounts ([#9591](https://github.com/MetaMask/metamask-extension/pull/9591))
- Update text content of invalid custom network alert ([#9601](https://github.com/MetaMask/metamask-extension/pull/9601))
- Ensure proper hover display for accounts in main menu ([#9575](https://github.com/MetaMask/metamask-extension/pull/9575))
- Autofocus the appropriate text fields in the Create/Import/Hardware screen ([#9576](https://github.com/MetaMask/metamask-extension/pull/9576))
- AutoFocus the from input on swaps screen ([#9581](https://github.com/MetaMask/metamask-extension/pull/9581))
- Prevent swap button from being focused when disabled ([#9602](https://github.com/MetaMask/metamask-extension/pull/9602))
- Ensure swaps customize gas modal values are set correctly ([#9609](https://github.com/MetaMask/metamask-extension/pull/9609))

## [8.1.0] - 2020-10-13
### Uncategorized
- Ensure address book entries are shared between networks with the same chain ID ([#9565](https://github.com/MetaMask/metamask-extension/pull/9565))
- Fix `eth_signTypedData_v4` chain ID validation for non-default networks ([#9552](https://github.com/MetaMask/metamask-extension/pull/9552))
- Allow the "Localhost 8545" network to be edited, and require a chain ID to be specified for it ([#9551](https://github.com/MetaMask/metamask-extension/pull/9551))
- Validate custom network chain IDs against endpoint `eth_chainId` return values ([#9491](https://github.com/MetaMask/metamask-extension/pull/9491))
- Require chain IDs to be specified for custom networks ([#9487](https://github.com/MetaMask/metamask-extension/pull/9487))
- Add MetaMask Swaps 🌻 ([#9482](https://github.com/MetaMask/metamask-extension/pull/9482))
- Fix data backup feature ([#9422](https://github.com/MetaMask/metamask-extension/pull/9422))
- Improve gas input UI by using tooltip instead of a modal to communicate gas data ([#9434](https://github.com/MetaMask/metamask-extension/pull/9434))
- Improve visual style and layout of the basic tab of the customize gas modal ([#9433](https://github.com/MetaMask/metamask-extension/pull/9433))
- Fix UI bug in token approval confirmation notifications ([#9415](https://github.com/MetaMask/metamask-extension/pull/9415))
- Update Wyre purchase URL ([#9414](https://github.com/MetaMask/metamask-extension/pull/9414))
- Rename 'Ethereum Main Network' in network selector to 'Etherum Mainnet' ([#9411](https://github.com/MetaMask/metamask-extension/pull/9411))
- Fix info tooltip on the alert settings screen when used in firefox ([#9409](https://github.com/MetaMask/metamask-extension/pull/9409))
- Fix UI bug in customize gas modal: shwo left border when the first button is selected ([#9406](https://github.com/MetaMask/metamask-extension/pull/9406))
- Correctly save new Contact Book addressed after editing them in 'Settings > Contact' ([#9395](https://github.com/MetaMask/metamask-extension/pull/9395))
- Improve Italian translations ([#9293](https://github.com/MetaMask/metamask-extension/pull/9293))
- Ensure the extension can be unlocked without network/internet access ([#9295](https://github.com/MetaMask/metamask-extension/pull/9295))
- Add messages to Ledger connection process ([#9344](https://github.com/MetaMask/metamask-extension/pull/9344))
- Hide seedphrase by default when restoring vault, and provide option for it to be shown ([#9329](https://github.com/MetaMask/metamask-extension/pull/9329))
- Ensure names of token symbols are shown when token amounts in the token list are long ([#9333](https://github.com/MetaMask/metamask-extension/pull/9333))
- Warn users when sending tokens to the token address ([#9321](https://github.com/MetaMask/metamask-extension/pull/9321))
- Fix bug that caused the accounts list to be empty after entering an incorrect password when attempting to export private key ([#9288](https://github.com/MetaMask/metamask-extension/pull/9288))
- Improve/fix error text for when ENS names are not found, on mainnet ([#9314](https://github.com/MetaMask/metamask-extension/pull/9314))
- Improve 'Contact Us' copy in settings ([#9307](https://github.com/MetaMask/metamask-extension/pull/9307))
- Fix capitalization of copy on MetaMetrics opt-in page ([#9283](https://github.com/MetaMask/metamask-extension/pull/9283))
- Add lock icon to default networks in the Settings network page, to indicate they are not editable ([#9269](https://github.com/MetaMask/metamask-extension/pull/9269))
- Hide gas price/speed estimate button, and link to advanced gas modal, in send flow on non-main network ([#9189](https://github.com/MetaMask/metamask-extension/pull/9189))
- Improve visual styling of back button in account modal ([#9184](https://github.com/MetaMask/metamask-extension/pull/9184))
- Fix vertical align of the network name in network dropdown button ([#9152](https://github.com/MetaMask/metamask-extension/pull/9152))
- Use new Euclid font throughout MetaMask ([#9073](https://github.com/MetaMask/metamask-extension/pull/9073))

## [8.0.10] - 2020-09-16
### Uncategorized
- Update default phishing list ([#9423](https://github.com/MetaMask/metamask-extension/pull/9423))
- Fix fetching a new phishing list on Firefox ([#9416](https://github.com/MetaMask/metamask-extension/pull/9416))

## [8.0.9] - 2020-08-19
### Uncategorized
- Move transaction confirmation footer buttons to scrollable area ([#9228](https://github.com/MetaMask/metamask-extension/pull/9228))
- Handle non-String web3 property access ([#9256](https://github.com/MetaMask/metamask-extension/pull/9256))
- Use @metamask/controllers@2.0.5 ([#9266](https://github.com/MetaMask/metamask-extension/pull/9266))
- Hide ETH Gas Station estimates on non-main network ([#9189](https://github.com/MetaMask/metamask-extension/pull/9189))

## [8.0.8] - 2020-08-14
### Uncategorized
- Fix Etherscan redirect on notification click ([#9211](https://github.com/MetaMask/metamask-extension/pull/9211))
- Reduce volume of web3 usage metrics ([#9237](https://github.com/MetaMask/metamask-extension/pull/9237))
- Permit all-caps addresses ([#9227](https://github.com/MetaMask/metamask-extension/pull/9227))

## [8.0.7] - 2020-08-10
### Uncategorized
- Change title of "Reveal Seed Words" page to "Reveal Seed Phrase" ([#9065](https://github.com/MetaMask/metamask-extension/pull/9065))
- Add tooltip to copy button for contacts and seed phrase ([#8974](https://github.com/MetaMask/metamask-extension/pull/8974))
- Fix broken UI upon failed password validation ([#9063](https://github.com/MetaMask/metamask-extension/pull/9063))
- Fix shifted popup notification when browser is in fullscreen on macOS ([#9075](https://github.com/MetaMask/metamask-extension/pull/9075))
- Support longer text in network dropdown ([#9085](https://github.com/MetaMask/metamask-extension/pull/9085))
- Fix onboarding bug where user can be asked to verify seed phrase twice ([#8873](https://github.com/MetaMask/metamask-extension/pull/8873))
- Replace "Email us" button with "Contact us" button ([#9104](https://github.com/MetaMask/metamask-extension/pull/9104))
- Fix bug where `accountsChanged` events stop after a dapp connection is closed. ([#9137](https://github.com/MetaMask/metamask-extension/pull/9137))
- Fix network name alignment ([#9152](https://github.com/MetaMask/metamask-extension/pull/9152))
- Add web3 usage metrics and prepare for web3 removal ([#9144](https://github.com/MetaMask/metamask-extension/pull/9144))

## [8.0.6] - 2020-07-23
### Uncategorized
- Hide "delete" button when editing contact of wallet account ([#9030](https://github.com/MetaMask/metamask-extension/pull/9030))
- Fix crash upon removing contact ([#9031](https://github.com/MetaMask/metamask-extension/pull/9031))
- Do not show spend limit for approvals ([#9032](https://github.com/MetaMask/metamask-extension/pull/9032))
- Update @metamask/inpage-provider@6.1.0 ([#9046](https://github.com/MetaMask/metamask-extension/pull/9046))
- Skip attempts to resolve 0x contract prefix ([#9048](https://github.com/MetaMask/metamask-extension/pull/9048))
- Use content-hash@2.5.2 ([#9051](https://github.com/MetaMask/metamask-extension/pull/9051))
- Display at least one significant digit of small non-zero token balances ([#9056](https://github.com/MetaMask/metamask-extension/pull/9056))

## [8.0.5] - 2020-07-17
### Uncategorized
- Fix display of incoming transactions ([#8942](https://github.com/MetaMask/metamask-extension/pull/8942))
- Fix `web3_clientVersion` method ([#8998](https://github.com/MetaMask/metamask-extension/pull/8998))
- @metamask/inpage-provider@6.0.1 ([#9003](https://github.com/MetaMask/metamask-extension/pull/9003))
- Hide loading indication after `personal_sign` ([#9006](https://github.com/MetaMask/metamask-extension/pull/9006))
- Display pending notifications after connect flow ([#9011](https://github.com/MetaMask/metamask-extension/pull/9011))
- Skip render when home page is closing or redirecting ([#9012](https://github.com/MetaMask/metamask-extension/pull/9012))
- Limit number of transactions passed outside of TransactionController ([#9010](https://github.com/MetaMask/metamask-extension/pull/9010))
- Clear AccountTracker accounts and CachedBalances on createNewVaultAndRestore ([#9023](https://github.com/MetaMask/metamask-extension/pull/9023))
- Catch gas estimate errors ([#9025](https://github.com/MetaMask/metamask-extension/pull/9025))
- Clear transactions on createNewVaultAndRestore ([#9026](https://github.com/MetaMask/metamask-extension/pull/9026))

## [8.0.4] - 2020-07-08
### Uncategorized
- Fix transaction activity on custom networks ([#8934](https://github.com/MetaMask/metamask-extension/pull/8934))
- Fix account tracker optimization ([#8936](https://github.com/MetaMask/metamask-extension/pull/8936))

## [8.0.3] - 2020-07-06
### Uncategorized
- Restore missing 'data' provider event, and fix 'notification' event ([#8921](https://github.com/MetaMask/metamask-extension/pull/8921))
- Normalize the 'from' parameter for `eth_sendTransaction` ([#8923](https://github.com/MetaMask/metamask-extension/pull/8923))
- Fix handling of multiple `eth_requestAccount` messages from the same domain ([#8924](https://github.com/MetaMask/metamask-extension/pull/8924))
- Update Italian translations ([#8917](https://github.com/MetaMask/metamask-extension/pull/8917))

## [8.0.2] - 2020-07-03
### Uncategorized
- Tolerate missing or falsey substitutions ([#8907](https://github.com/MetaMask/metamask-extension/pull/8907))
- Fix activity log inline buttons ([#8908](https://github.com/MetaMask/metamask-extension/pull/8908))
- Prevent confirming blank suggested token ([#8909](https://github.com/MetaMask/metamask-extension/pull/8909))
- Handle suggested token resolved elsewhere ([#8910](https://github.com/MetaMask/metamask-extension/pull/8910))
- Fix Kovan chain ID constant ([#8913](https://github.com/MetaMask/metamask-extension/pull/8913))

## [8.0.1] - 2020-07-02
### Uncategorized
- Fx overflow behaviour of add token list ([#8874](https://github.com/MetaMask/metamask-extension/pull/8874))
- Show `origin` in connect flow rather than site name ([#8885](https://github.com/MetaMask/metamask-extension/pull/8885))
- Allow setting a custom nonce of zero ([#8883](https://github.com/MetaMask/metamask-extension/pull/8883))
- Fix language code format mismatch ([#8889](https://github.com/MetaMask/metamask-extension/pull/8889))
- Prevent showing connected accounts without origin ([#8891](https://github.com/MetaMask/metamask-extension/pull/8891))
- Prevent manually connecting to extension UI ([#8893](https://github.com/MetaMask/metamask-extension/pull/8893))
- Allow localized messages to not use substitutions ([#8895](https://github.com/MetaMask/metamask-extension/pull/8895))
- Update eth-keyring-controller to fix erasure of imported/hardware account names ([#8897](https://github.com/MetaMask/metamask-extension/pull/8897))
- Include relative time polyfill locale data ([#8896](https://github.com/MetaMask/metamask-extension/pull/8896))
- Replace percentage opacity value ([#8898](https://github.com/MetaMask/metamask-extension/pull/8898))

## [8.0.0] - 2020-07-01
### Uncategorized
- Add permission system ([#7004](https://github.com/MetaMask/metamask-extension/pull/7004))
- Search accounts by name ([#7261](https://github.com/MetaMask/metamask-extension/pull/7261))
- Buffer 3 blocks before dropping a transaction ([#7483](https://github.com/MetaMask/metamask-extension/pull/7483))
- Handle one specific permissions request per tab ([#7620](https://github.com/MetaMask/metamask-extension/pull/7620))
- Add description to Reset Account in settings ([#7686](https://github.com/MetaMask/metamask-extension/pull/7686))
- Allow custom IPFS gateway and use more secure default gateway ([#7362](https://github.com/MetaMask/metamask-extension/pull/7362))
- Adjust colour of Reset Account button to reflect danger ([#7696](https://github.com/MetaMask/metamask-extension/pull/7696))
- Support new onboarding library ([#7602](https://github.com/MetaMask/metamask-extension/pull/7602))
- Update custom token symbol length restriction message ([#7672](https://github.com/MetaMask/metamask-extension/pull/7672))
- Handle 'Enter' keypress on restore from seed screen ([#7747](https://github.com/MetaMask/metamask-extension/pull/7747))
- Remove padding around advanced gas info icon ([#7810](https://github.com/MetaMask/metamask-extension/pull/7810))
- Force background state update after removing an account ([#7840](https://github.com/MetaMask/metamask-extension/pull/7840))
- Change "Log In/Out" terminology to "Unlock/Lock" ([#7853](https://github.com/MetaMask/metamask-extension/pull/7853))
- Add mechanism to randomize seed phrase filename ([#7863](https://github.com/MetaMask/metamask-extension/pull/7863))
- Sort seed phrase confirmation buttons alphabetically ([#7933](https://github.com/MetaMask/metamask-extension/pull/7933))
- Add support for 24 word seed phrases ([#7987](https://github.com/MetaMask/metamask-extension/pull/7987))
- Use contact name instead of address during send flow ([#7971](https://github.com/MetaMask/metamask-extension/pull/7971))
- Add title attribute to transaction title ([#8050](https://github.com/MetaMask/metamask-extension/pull/8050))
- Implement encrypt/decrypt feature ([#7831](https://github.com/MetaMask/metamask-extension/pull/7831))
- Add setting for disabling Eth Phishing Detection ([#8125](https://github.com/MetaMask/metamask-extension/pull/8125))
- Prevent external domains from submitting more than one perm request at a time ([#8148](https://github.com/MetaMask/metamask-extension/pull/8148))
- Wait for extension unlock before processing eth_requestAccounts ([#8149](https://github.com/MetaMask/metamask-extension/pull/8149))
- Add Idle Timeout for Sync with mobile ([#8201](https://github.com/MetaMask/metamask-extension/pull/8201))
- Update Italian translation ([#8247](https://github.com/MetaMask/metamask-extension/pull/8247))
- Make seed phrase import case-insensitive ([#8246](https://github.com/MetaMask/metamask-extension/pull/8246))
- Convert Connected Sites page to modal ([#8254](https://github.com/MetaMask/metamask-extension/pull/8254))
- Update token cell to show inline stale balance warning ([#8259](https://github.com/MetaMask/metamask-extension/pull/8259))
- Move asset list to home tab on small screens ([#8264](https://github.com/MetaMask/metamask-extension/pull/8264))
- Connected status indicator ([#8270](https://github.com/MetaMask/metamask-extension/pull/8270))
- Allow selecting multiple accounts during connect flow ([#8078](https://github.com/MetaMask/metamask-extension/pull/8078))
- Focus the notification popup if it's already open ([#8318](https://github.com/MetaMask/metamask-extension/pull/8318))
- Position notification relative to last focused window ([#8356](https://github.com/MetaMask/metamask-extension/pull/8356))
- Close notification UI if no unapproved confirmations ([#8358](https://github.com/MetaMask/metamask-extension/pull/8358))
- Add popup explaining connection indicator to existing users ([#8293](https://github.com/MetaMask/metamask-extension/pull/8293))
- Correctly detect changes to background state ([#8435](https://github.com/MetaMask/metamask-extension/pull/8435))
- Disable import button for empty string/file ([#7912](https://github.com/MetaMask/metamask-extension/pull/7912))
- Make seed phrase import case-insensitive ([#8246](https://github.com/MetaMask/metamask-extension/pull/8246))
- Alert user upon switching to unconnected account ([#8312](https://github.com/MetaMask/metamask-extension/pull/8312))
- Only updating pending transactions upon block update ([#8445](https://github.com/MetaMask/metamask-extension/pull/8445))
- Fix firefox popup location ([#8467](https://github.com/MetaMask/metamask-extension/pull/8467))
- Prevent race condition where transaction value set in UI is overwritten ([#8486](https://github.com/MetaMask/metamask-extension/pull/8486))
- Fix default gas race condition ([#8490](https://github.com/MetaMask/metamask-extension/pull/8490))
- Update tokens after importing account ([#8491](https://github.com/MetaMask/metamask-extension/pull/8491))
- Enable disconnecting a single account or all accounts ([#8496](https://github.com/MetaMask/metamask-extension/pull/8496))
- Add support for IPFS address resolution ([#8502](https://github.com/MetaMask/metamask-extension/pull/8502))
- Add version dimension to metrics event ([#8419](https://github.com/MetaMask/metamask-extension/pull/8419))
- Open notification UI when eth_requestAccounts waits for unlock ([#8508](https://github.com/MetaMask/metamask-extension/pull/8508))
- Prevent negative values on gas inputs ([#8533](https://github.com/MetaMask/metamask-extension/pull/8533))
- Allow disabling alerts ([#8550](https://github.com/MetaMask/metamask-extension/pull/8550))
- Synchronously update transaction status ([#8563](https://github.com/MetaMask/metamask-extension/pull/8563))
- Improve Spanish localized message ([#8567](https://github.com/MetaMask/metamask-extension/pull/8567))
- Add switch to connected account alert ([#8532](https://github.com/MetaMask/metamask-extension/pull/8532))
- Stop polling for recent blocks on custom networks when UI is closed ([#8575](https://github.com/MetaMask/metamask-extension/pull/8575))
- Fix Matomo dimension IDs ([#8579](https://github.com/MetaMask/metamask-extension/pull/8579))
- Handle trailing / in block explorer URLs ([#8592](https://github.com/MetaMask/metamask-extension/pull/8592))
- Add Connected Accounts modal ([#8313](https://github.com/MetaMask/metamask-extension/pull/8313))
- Sticky position the tabs at the top ([#8609](https://github.com/MetaMask/metamask-extension/pull/8609))
- Define global `web3` as non-enumerable ([#8634](https://github.com/MetaMask/metamask-extension/pull/8634))
- warn user when sending from different account ([#8601](https://github.com/MetaMask/metamask-extension/pull/8601))
- Persist home tab state ([#8612](https://github.com/MetaMask/metamask-extension/pull/8612))
- Implement new transaction list design ([#8564](https://github.com/MetaMask/metamask-extension/pull/8564))
- Restrict the size of the permissions metadata store ([#8596](https://github.com/MetaMask/metamask-extension/pull/8596))
- Update account options menu design ([#8654](https://github.com/MetaMask/metamask-extension/pull/8654))
- Implement new fullscreen design ([#8657](https://github.com/MetaMask/metamask-extension/pull/8657))
- Show hostname in the disconnect confirmation ([#8663](https://github.com/MetaMask/metamask-extension/pull/8663))
- Make address display wider in Account Details ([#8665](https://github.com/MetaMask/metamask-extension/pull/8665))
- Fix token `decimal` type ([#8670](https://github.com/MetaMask/metamask-extension/pull/8670))
- Limit Dapp permissions to primary account ([#8653](https://github.com/MetaMask/metamask-extension/pull/8653))
- Manually connect via the full connect flow ([#8666](https://github.com/MetaMask/metamask-extension/pull/8666))
- Add metrics events for Wyre and CoinSwitch ([#8677](https://github.com/MetaMask/metamask-extension/pull/8677))
- Fix connect hardware styling ([#8680](https://github.com/MetaMask/metamask-extension/pull/8680))
- Fix create account form styling ([#8689](https://github.com/MetaMask/metamask-extension/pull/8689))
- Fix tab content disappearing during scrolling on macOS Firefox ([#8702](https://github.com/MetaMask/metamask-extension/pull/8702))
- Implement asset page ([#8696](https://github.com/MetaMask/metamask-extension/pull/8696))
- Add nonce to transaction details ([#8716](https://github.com/MetaMask/metamask-extension/pull/8716))
- Use URL origin instead of hostname for permission domains ([#8717](https://github.com/MetaMask/metamask-extension/pull/8717))
- Fix account menu entry for imported accounts ([#8747](https://github.com/MetaMask/metamask-extension/pull/8747))
- Permissions: Do not display HTTP/HTTPS URL schemes for unique hosts ([#8768](https://github.com/MetaMask/metamask-extension/pull/8768))
- Hide seed phrase during Account Import ([#8730](https://github.com/MetaMask/metamask-extension/pull/8730))
- Rename 'History' tab to 'Activity' ([#8785](https://github.com/MetaMask/metamask-extension/pull/8785))
- use UI button for add token functionality ([#8781](https://github.com/MetaMask/metamask-extension/pull/8781))
- Show fiat amounts inline on token transfers ([#8786](https://github.com/MetaMask/metamask-extension/pull/8786))
- Warn users to only add custom networks that they trust ([#8789](https://github.com/MetaMask/metamask-extension/pull/8789))
- Consolidate connected account alerts ([#8802](https://github.com/MetaMask/metamask-extension/pull/8802))
- Remove all user- and translator-facing instances of 'dapp' ([#8810](https://github.com/MetaMask/metamask-extension/pull/8810))
- Update method data when cached method data is empty ([#8836](https://github.com/MetaMask/metamask-extension/pull/8836))
- Improve error handling when signature requested without a keyholder address ([#8833](https://github.com/MetaMask/metamask-extension/pull/8833))
- Stop upper-casing exported private key ([#8850](https://github.com/MetaMask/metamask-extension/pull/8850))
- Include imported accounts in mobile sync ([#8631](https://github.com/MetaMask/metamask-extension/pull/8631))

## [7.7.9] - 2020-05-04
### Uncategorized
- Fix popup not opening ([#8446](https://github.com/MetaMask/metamask-extension/pull/8446))
- Skip adding history entry for empty txMeta diffs ([#8449](https://github.com/MetaMask/metamask-extension/pull/8449))
- Delete Dai/Sai migration notification ([#8447](https://github.com/MetaMask/metamask-extension/pull/8447))
- Update deposit copy for Wyre ([#8460](https://github.com/MetaMask/metamask-extension/pull/8460))
- Snapshot txMeta without cloning history ([#8458](https://github.com/MetaMask/metamask-extension/pull/8458))
- Fix method registry initialization ([#8459](https://github.com/MetaMask/metamask-extension/pull/8459))
- Add Dai/Sai to currency display ([#8455](https://github.com/MetaMask/metamask-extension/pull/8455))
- Prevent network switch upon close of network timeout overlay ([#8461](https://github.com/MetaMask/metamask-extension/pull/8461))
- Add INR currency option ([#8457](https://github.com/MetaMask/metamask-extension/pull/8457))
- Fix display of Kovan and Rinkeby chain IDs ([#8462](https://github.com/MetaMask/metamask-extension/pull/8462))
- Use ethereum-ens-network-map for network support ([#8465](https://github.com/MetaMask/metamask-extension/pull/8465))
- Update deprecated Etherscam link ([#8463](https://github.com/MetaMask/metamask-extension/pull/8463))
- Only update pending transactions upon block update ([#8474](https://github.com/MetaMask/metamask-extension/pull/8474))
- Update eth-contract-metadata ([#8476](https://github.com/MetaMask/metamask-extension/pull/8476))
- Fix Tohen Typo ([#8509](https://github.com/MetaMask/metamask-extension/pull/8509))

## [7.7.8] - 2020-03-13
### Uncategorized
- Handle and set gas estimation when max mode is clicked ([#8176](https://github.com/MetaMask/metamask-extension/pull/8176))
- Use specified gas limit when speeding up a transaction ([#8178](https://github.com/MetaMask/metamask-extension/pull/8178))

## [7.7.7] - 2020-03-04
### Uncategorized
- Remove invalid Ledger accounts ([#8162](https://github.com/MetaMask/metamask-extension/pull/8162))
- Fix account index check ([#8163](https://github.com/MetaMask/metamask-extension/pull/8163))

## [7.7.6] - 2020-03-03
### Uncategorized
- Prevent signing from incorrect Ledger account ([#8154](https://github.com/MetaMask/metamask-extension/pull/8154))

## [7.7.5] - 2020-02-18
### Uncategorized
- Inline the source text not the binary encoding for inpage script ([#8053](https://github.com/MetaMask/metamask-extension/pull/8053))
- Add warning to watchAsset API when editing a known token ([#8049](https://github.com/MetaMask/metamask-extension/pull/8049))
- Update Wyre ETH purchase url ([#8051](https://github.com/MetaMask/metamask-extension/pull/8051))
- Attempt ENS resolution on any valid domain name ([#8059](https://github.com/MetaMask/metamask-extension/pull/8059))

## [7.7.4] - 2020-01-31
### Uncategorized
- Update data on Approve screen after updating custom spend limit ([#7918](https://github.com/MetaMask/metamask-extension/pull/7918))
- Allow editing max spend limit ([#7919](https://github.com/MetaMask/metamask-extension/pull/7919))
- Validate custom spend limit ([#7920](https://github.com/MetaMask/metamask-extension/pull/7920))
- Only resolve ENS on mainnet ([#7944](https://github.com/MetaMask/metamask-extension/pull/7944))
- Update ENS registry addresses ([#7954](https://github.com/MetaMask/metamask-extension/pull/7954))

## [7.7.3] - 2020-01-27
### Uncategorized
- Update GABA dependency version ([#7894](https://github.com/MetaMask/metamask-extension/pull/7894))
- Use eth-contract-metadata@1.12.1 ([#7901](https://github.com/MetaMask/metamask-extension/pull/7901))
- Fixing broken JSON import help link ([#7910](https://github.com/MetaMask/metamask-extension/pull/7910))

## [7.7.2] - 2020-01-13
### Uncategorized
- Fix gas estimate for tokens ([#7753](https://github.com/MetaMask/metamask-extension/pull/7753))
- Fix transaction order on transaction confirmation screen ([#7473](https://github.com/MetaMask/metamask-extension/pull/7473))

## [7.7.1] - 2019-12-09
### Uncategorized
- Fix text overlap when expanding transaction ([#7488](https://github.com/MetaMask/metamask-extension/pull/7488))
- Update gas when asset is changed on send screen ([#7491](https://github.com/MetaMask/metamask-extension/pull/7491))
- Remove unused onClick prop from Dropdown component ([#7500](https://github.com/MetaMask/metamask-extension/pull/7500))
- Fix chainId for non standard networks ([#7502](https://github.com/MetaMask/metamask-extension/pull/7502))
- Fixing hardware connect error display ([#7519](https://github.com/MetaMask/metamask-extension/pull/7519))
- Fix accessibility of first-time-flow terms checkboxes ([#7501](https://github.com/MetaMask/metamask-extension/pull/7501))
- Prevent Maker migration dismissal timeout state from being overwritten ([#7579](https://github.com/MetaMask/metamask-extension/pull/7579))
- Persist Maker migration dismissal timeout ([#7581](https://github.com/MetaMask/metamask-extension/pull/7581))
- Ensure transactions are shown in the order they are received ([#7484](https://github.com/MetaMask/metamask-extension/pull/7484))
- Process URL fragment for ens-ipfs redirects ([#7604](https://github.com/MetaMask/metamask-extension/pull/7604))
- Fix typo that resulted in degrated account menu performance ([#7628](https://github.com/MetaMask/metamask-extension/pull/7628))
- Use localized messages for NotificationModal buttons ([#7558](https://github.com/MetaMask/metamask-extension/pull/7558))

## [7.7.0] - 2019-12-03 [WITHDRAWN]
### Uncategorized
- Connect distinct accounts per site ([#7004](https://github.com/MetaMask/metamask-extension/pull/7004))
- Fixed link on root README.md ([#7480](https://github.com/MetaMask/metamask-extension/pull/7480))
- Update Wyre ETH purchase url ([#7482](https://github.com/MetaMask/metamask-extension/pull/7482))
- Ensure transactions are shown in the order they are received ([#7484](https://github.com/MetaMask/metamask-extension/pull/7484))
- Update gas when token is changed on the send screen ([#7491](https://github.com/MetaMask/metamask-extension/pull/7491))
- Fix accessibility of first-time-flow terms checkboxes ([#7501](https://github.com/MetaMask/metamask-extension/pull/7501))
- Fix chainId for non standard networks ([#7502](https://github.com/MetaMask/metamask-extension/pull/7502))
- Fix timing of DAI migration notifications after dismissal ([#7579](https://github.com/MetaMask/metamask-extension/pull/7579))
- Fixing hardware connect error display ([#7519](https://github.com/MetaMask/metamask-extension/pull/7519))
- Use localized messages for NotificationModal buttons ([#7558](https://github.com/MetaMask/metamask-extension/pull/7558))
- Fix text overlap when expanding transaction ([#7488](https://github.com/MetaMask/metamask-extension/pull/7488))

## [7.6.1] - 2019-11-19
### Uncategorized
- Add 'Remind Me Later' to the Maker notification ([#7475](https://github.com/MetaMask/metamask-extension/pull/7475))
- Add additional rpcUrl verification ([#7436](https://github.com/MetaMask/metamask-extension/pull/7436))
- Show transaction fee units on approve screen ([#7468](https://github.com/MetaMask/metamask-extension/pull/7468))

## [7.6.0] - 2019-11-18
### Uncategorized
- Add migration notification for users with non-zero Sai ([#7450](https://github.com/MetaMask/metamask-extension/pull/7450))
- Import styles for showing multiple notifications ([#7461](https://github.com/MetaMask/metamask-extension/pull/7461))
- Add button disabled when password is empty ([#7451](https://github.com/MetaMask/metamask-extension/pull/7451))

## [7.5.3] - 2019-11-15
### Uncategorized
- lock eth-contract-metadata ([#7412](https://github.com/MetaMask/metamask-extension/pull/7412))
- Add eslint import plugin to help detect unresolved paths ([#7416](https://github.com/MetaMask/metamask-extension/pull/7416))
- Ensure SignatureRequestOriginal 'beforeunload' handler is bound ([#7414](https://github.com/MetaMask/metamask-extension/pull/7414))
- Update badge colour ([#7430](https://github.com/MetaMask/metamask-extension/pull/7430))
- Utilize the full size of icon space ([#7408](https://github.com/MetaMask/metamask-extension/pull/7408))
- Add all icons to manifest ([#7431](https://github.com/MetaMask/metamask-extension/pull/7431))
- Ensure Etherscan result is valid before reading it ([#7426](https://github.com/MetaMask/metamask-extension/pull/7426))
- Update 512px icon ([#7434](https://github.com/MetaMask/metamask-extension/pull/7434))
- Fix sourcemaps for Sentry ([#7410](https://github.com/MetaMask/metamask-extension/pull/7410))
- Adds and end to end test for typed signature requests ([#7420](https://github.com/MetaMask/metamask-extension/pull/7420))
- Add metricsEvent to contextTypes ([#7439](https://github.com/MetaMask/metamask-extension/pull/7439))
- Added webRequest.RequestFilter to filter main_frame .eth requests ([#7419](https://github.com/MetaMask/metamask-extension/pull/7419))

## [7.5.2] - 2019-11-14
### Uncategorized
- Ensure SignatureRequestOriginal 'beforeunload' handler is bound ([#7414](https://github.com/MetaMask/metamask-extension/pull/7414))

## [7.5.1] - 2019-11-13
### Uncategorized
- Fix regression for signed types data screens ([#7402](https://github.com/MetaMask/metamask-extension/pull/7402))
- Update json-rpc-engine ([#7390](https://github.com/MetaMask/metamask-extension/pull/7390))
- Reject connection request on window close ([#7401](https://github.com/MetaMask/metamask-extension/pull/7401))

## [7.5.0] - 2019-11-12
### Uncategorized
- ignore known transactions on first broadcast and continue with normal flow ([#7328](https://github.com/MetaMask/metamask-extension/pull/7328))
- eth_getTransactionByHash will now check metamask's local history for pending transactions ([#7327](https://github.com/MetaMask/metamask-extension/pull/7327))
- Cleanup beforeunload handler after transaction is resolved ([#7333](https://github.com/MetaMask/metamask-extension/pull/7333))
- Add support for ZeroNet ([#7038](https://github.com/MetaMask/metamask-extension/pull/7038))
- Add web3 deprecation warning ([#7334](https://github.com/MetaMask/metamask-extension/pull/7334))
- Add Estimated time to pending tx ([#6924](https://github.com/MetaMask/metamask-extension/pull/6924))
- ENS Reverse Resolution support ([#7177](https://github.com/MetaMask/metamask-extension/pull/7177))
- New signature request v3 UI ([#6891](https://github.com/MetaMask/metamask-extension/pull/6891))
- fix width in first time flow button ([#7348](https://github.com/MetaMask/metamask-extension/pull/7348))
- Redesign approve screen ([#7271](https://github.com/MetaMask/metamask-extension/pull/7271))
- fix account menu width ([#7354](https://github.com/MetaMask/metamask-extension/pull/7354))
- Set default advanced tab gas limit ([#7379](https://github.com/MetaMask/metamask-extension/pull/7379))
- Fix advanced tab gas chart ([#7380](https://github.com/MetaMask/metamask-extension/pull/7380))
- Hide accounts dropdown scrollbars on Firefox ([#7374](https://github.com/MetaMask/metamask-extension/pull/7374))
- Update to gaba@1.8.0 ([#7357](https://github.com/MetaMask/metamask-extension/pull/7357))
- Add onbeforeunload and have it call onCancel ([#7335](https://github.com/MetaMask/metamask-extension/pull/7335))

## [7.4.0] - 2019-11-04
### Uncategorized
- Use `AdvancedGasInputs` in `AdvancedTabContent` ([#7186](https://github.com/MetaMask/metamask-extension/pull/7186))
- Move signTypedData signing out to keyrings ([#7304](https://github.com/MetaMask/metamask-extension/pull/7304))
- correct the zh-TW translation ([#7306](https://github.com/MetaMask/metamask-extension/pull/7306))
- Freeze Promise global on boot ([#7309](https://github.com/MetaMask/metamask-extension/pull/7309))
- Add "Retry" option for failed transactions ([#7296](https://github.com/MetaMask/metamask-extension/pull/7296))
- Fix transaction list item status spacing issue ([#7319](https://github.com/MetaMask/metamask-extension/pull/7319))
- Add hostname and extensionId to site metadata ([#7218](https://github.com/MetaMask/metamask-extension/pull/7218))
- Fix contact deletion ([#7324](https://github.com/MetaMask/metamask-extension/pull/7324))
- Fix edit contact details ([#7326](https://github.com/MetaMask/metamask-extension/pull/7326))
- Update eth-json-rpc-filters to fix memory leak ([#7325](https://github.com/MetaMask/metamask-extension/pull/7325))
- Add web3 deprecation warning ([#7334](https://github.com/MetaMask/metamask-extension/pull/7334))

## [7.3.1] - 2019-10-22
### Uncategorized
- Turn off full screen vs popup a/b test ([#7298](https://github.com/MetaMask/metamask-extension/pull/7298))

## [7.3.0] - 2019-10-21
### Uncategorized
- 3box integration ([#6972](https://github.com/MetaMask/metamask-extension/pull/6972))
- Add fixes for German translations ([#7168](https://github.com/MetaMask/metamask-extension/pull/7168))
- Remove the disk store ([#7170](https://github.com/MetaMask/metamask-extension/pull/7170))
- Performance: Delivery optimized images ([#7176](https://github.com/MetaMask/metamask-extension/pull/7176))
- add goerli to incoming tx ([#7189](https://github.com/MetaMask/metamask-extension/pull/7189))
- Remove unused locale messages ([#7190](https://github.com/MetaMask/metamask-extension/pull/7190))
- Fix RPC error messages ([#7173](https://github.com/MetaMask/metamask-extension/pull/7173))
- address book entries by chainId ([#7205](https://github.com/MetaMask/metamask-extension/pull/7205))
- obs-store/local-store should upgrade webextension error to real error ([#7207](https://github.com/MetaMask/metamask-extension/pull/7207))
- Add a/b test for full screen transaction confirmations ([#7162](https://github.com/MetaMask/metamask-extension/pull/7162))
- Add advanced setting to enable editing nonce on confirmation screens ([#7089](https://github.com/MetaMask/metamask-extension/pull/7089))
- Update ETH logo, update deposit Ether logo height and width ([#7239](https://github.com/MetaMask/metamask-extension/pull/7239))
- Use translated string for state log ([#7255](https://github.com/MetaMask/metamask-extension/pull/7255))
- fix issue of xyz ens not resolving ([#7266](https://github.com/MetaMask/metamask-extension/pull/7266))
- Prevent Logout Timer that's longer than a week. ([#7253](https://github.com/MetaMask/metamask-extension/pull/7253))
- Lessen the length of ENS validation to 3 ([#7285](https://github.com/MetaMask/metamask-extension/pull/7285))
- Fix phishing detect script ([#7287](https://github.com/MetaMask/metamask-extension/pull/7287))

## [7.2.3] - 2019-10-08
### Uncategorized
- Fix gas limit when sending tx without data to a contract ([#7252](https://github.com/MetaMask/metamask-extension/pull/7252))
- Do not transate on seed phrases ([#7260](https://github.com/MetaMask/metamask-extension/pull/7260))
- Ensure correct tx category when sending to contracts without tx data ([#7252](https://github.com/MetaMask/metamask-extension/pull/7252))

## [7.2.2] - 2019-09-25
### Uncategorized
- Update minimum Firefox verison to 56.0 ([#7213](https://github.com/MetaMask/metamask-extension/pull/7213))

## [7.2.1] - 2019-09-17
### Uncategorized
- Add `appName` message to each locale ([#7180](https://github.com/MetaMask/metamask-extension/pull/7180))

## [7.2.0] - 2019-09-17
### Uncategorized
- Update localization from Transifex Brave ([#7099](https://github.com/MetaMask/metamask-extension/pull/7099))
- Fix validation of empty block explorer url's in custom network form ([#7137](https://github.com/MetaMask/metamask-extension/pull/7137))
- Support for eth_signTypedData_v4 ([#7128](https://github.com/MetaMask/metamask-extension/pull/7128))
- Adds `chaindIdChanged` event to the ethereum provider ([#7110](https://github.com/MetaMask/metamask-extension/pull/7110))
- Improve browser performance issues caused by missing locale errors ([#7091](https://github.com/MetaMask/metamask-extension/pull/7091))
- Prevent ineffectual speed ups of pending transactions that don't have the lowest nonce ([#7085](https://github.com/MetaMask/metamask-extension/pull/7085))
- Set minimum Firefox version to v56.2 to support Waterfox ([#7156](https://github.com/MetaMask/metamask-extension/pull/7156))
- Add polyfill for AbortController ([#7157](https://github.com/MetaMask/metamask-extension/pull/7157))
- Replace `undefined` selectedAddress with `null` ([#7161](https://github.com/MetaMask/metamask-extension/pull/7161))
- Fix recipient field of approve screen ([#7171](https://github.com/MetaMask/metamask-extension/pull/7171))

## [7.1.1] - 2019-09-03
### Uncategorized
- Remove blockscale, replace with ethgasstation ([#7059](https://github.com/MetaMask/metamask-extension/pull/7059))
- Remove Babel 6 from internal dependencies ([#7037](https://github.com/MetaMask/metamask-extension/pull/7037))
- Allow dismissing privacy mode notification from popup ([#7093](https://github.com/MetaMask/metamask-extension/pull/7093))
- Add breadcrumb spacing on Contacts page ([#7087](https://github.com/MetaMask/metamask-extension/pull/7087))
- Fix confirm token transaction amount display ([#7081](https://github.com/MetaMask/metamask-extension/pull/7081))
- Fix BigNumber conversion error ([#7088](https://github.com/MetaMask/metamask-extension/pull/7088))
- Right-to-left CSS ([#7072](https://github.com/MetaMask/metamask-extension/pull/7072))
- Persian translation ([#6878](https://github.com/MetaMask/metamask-extension/pull/6878))
- Added missed phrases to RU locale ([#7012](https://github.com/MetaMask/metamask-extension/pull/7012))

## [7.1.0] - 2019-08-26
### Uncategorized
- Filter non-ERC-20 assets during mobile sync ([#7035](https://github.com/MetaMask/metamask-extension/pull/7035))
- Using translated string for end of flow messaging ([#7021](https://github.com/MetaMask/metamask-extension/pull/7021))
- Rename Contacts List settings tab to Contacts ([#7018](https://github.com/MetaMask/metamask-extension/pull/7018))
- Connections settings tab ([#7013](https://github.com/MetaMask/metamask-extension/pull/7013))
- Fetch & display received transactions ([#6996](https://github.com/MetaMask/metamask-extension/pull/6996))
- Remove reload from Share Address button ([#6991](https://github.com/MetaMask/metamask-extension/pull/6991))
- Address book fixes ([#6978](https://github.com/MetaMask/metamask-extension/pull/6978))
- Show recipient alias in confirm header if exists ([#6944](https://github.com/MetaMask/metamask-extension/pull/6944))
- Add support for eth_signTypedData_v4 ([#6930](https://github.com/MetaMask/metamask-extension/pull/6930))
- Update Italian translation ([#7046](https://github.com/MetaMask/metamask-extension/pull/7046))
- Add warning about reload on network change ([#7047](https://github.com/MetaMask/metamask-extension/pull/7047))

## [7.0.1] - 2019-08-08
### Uncategorized
- Ensure seed phrase backup notification only shows up for new users ([#6975](https://github.com/MetaMask/metamask-extension/pull/6975))

## [7.0.0] - 2019-08-07
### Uncategorized
- Capitalized speed up label to match rest of UI ([#6828](https://github.com/MetaMask/metamask-extension/pull/6828))
- Allows skipping of seed phrase challenge during onboarding, and completing it at a later time ([#6874](https://github.com/MetaMask/metamask-extension/pull/6874))
- Prevent opening of asset dropdown if no tokens in account ([#6900](https://github.com/MetaMask/metamask-extension/pull/6900))
- Set privacy mode as default ([#6904](https://github.com/MetaMask/metamask-extension/pull/6904))
- Adds Address Book feature ([#6914](https://github.com/MetaMask/metamask-extension/pull/6914))
- Disable Copy Tx ID and block explorer link for transactions without hash ([#6928](https://github.com/MetaMask/metamask-extension/pull/6928))
- Fix mobile sync ([#6967](https://github.com/MetaMask/metamask-extension/pull/6967))

## [6.7.3] - 2019-07-19
### Uncategorized
- Fix bug with resubmitting unsigned transactions. ([#6888](https://github.com/MetaMask/metamask-extension/pull/6888))

## [6.7.2] - 2019-07-03
### Uncategorized
- Normalize and Validate txParams in TransactionStateManager.addTx too ([#6713](https://github.com/MetaMask/metamask-extension/pull/6713))
- Update to Node.js v10 ([#6759](https://github.com/MetaMask/metamask-extension/pull/6759))
- Fixes #6694 ([#6694](https://github.com/MetaMask/metamask-extension/pull/6694))
- Add tests for ImportWithSeedPhrase#parseSeedPhrase ([#6743](https://github.com/MetaMask/metamask-extension/pull/6743))
- Fixes #6740 ([#6740](https://github.com/MetaMask/metamask-extension/pull/6740))
- Fixes #6741 ([#6741](https://github.com/MetaMask/metamask-extension/pull/6741))
- Fixes #6760, correct PropTypes for nextRoute ([#6761](https://github.com/MetaMask/metamask-extension/pull/6761))
- Use inline source maps in development ([#6754](https://github.com/MetaMask/metamask-extension/pull/6754))
- Document hotfix protocol ([#6589](https://github.com/MetaMask/metamask-extension/pull/6589))
- Add codeowner for package-lock-old.json package-lock.json package.json packagelock-old.json files ([#6738](https://github.com/MetaMask/metamask-extension/pull/6738))
- Add loading view to notification.html ([#6648](https://github.com/MetaMask/metamask-extension/pull/6648))
- Add brave as a platform type for MetaMask ([#6731](https://github.com/MetaMask/metamask-extension/pull/6731))

## [6.7.1] - 2019-07-28
### Uncategorized
- Fix display of token amount on confirm transaction screen ([#6764](https://github.com/MetaMask/metamask-extension/pull/6764))

## [6.7.0] - 2019-07-26
### Uncategorized
- Improve contract method data fetching ([#6623](https://github.com/MetaMask/metamask-extension/pull/6623))
- Adds 4byte registry fallback to getMethodData() ([#6551](https://github.com/MetaMask/metamask-extension/pull/6551))
- Add delete to custom RPC form ([#6718](https://github.com/MetaMask/metamask-extension/pull/6718))
- Fix styles on 'import account' page, update help link ([#6700](https://github.com/MetaMask/metamask-extension/pull/6700))
- Wrap smaller custom block explorer url text ([#6714](https://github.com/MetaMask/metamask-extension/pull/6714))
- Pin ethereumjs-tx ([#6706](https://github.com/MetaMask/metamask-extension/pull/6706))
- Fix styles on 'import account' page, update help link ([#6700](https://github.com/MetaMask/metamask-extension/pull/6700))
- Started adding visual documentation of MetaMask plugin components with the account menu component first ([#6775](https://github.com/MetaMask/metamask-extension/pull/6775))

## [6.6.2] - 2019-07-17
### Uncategorized
- Update dependencies, re-enable npm audit CI job ([#6690](https://github.com/MetaMask/metamask-extension/pull/6690))
- Fix styles on 'import account' page, update help link ([#6700](https://github.com/MetaMask/metamask-extension/pull/6700))

## [6.6.1] - 2019-06-06
### Uncategorized
- Revert "Improve ENS Address Input" to fix bugs on input field on non-main networks. ([#6691](https://github.com/MetaMask/metamask-extension/pull/6691))

## [6.6.0] - 2019-06-04
### Uncategorized
- Enable Ledger hardware wallet support on Firefox ([#6659](https://github.com/MetaMask/metamask-extension/pull/6659))
- bugfix: reject enable promise on user rejection ([#6671](https://github.com/MetaMask/metamask-extension/pull/6671))
- Ensures that transactions cannot be confirmed if gas limit is below 21000. ([#6625](https://github.com/MetaMask/metamask-extension/pull/6625))
- Fix grammatical error in i18n endOfFlowMessage6 ([#6633](https://github.com/MetaMask/metamask-extension/pull/6633))

## [6.5.3] - 2019-05-16
### Uncategorized
- bugfix: show extension window if locked regardless of approval ([#6619](https://github.com/MetaMask/metamask-extension/pull/6619))
- Transactions/pending - check nonce against the network and mark as dropped if not included in a block ([#6388](https://github.com/MetaMask/metamask-extension/pull/6388))
- Improve ENS Address Input ([#6606](https://github.com/MetaMask/metamask-extension/pull/6606))
- Adds e2e test for removing imported accounts. ([#6615](https://github.com/MetaMask/metamask-extension/pull/6615))

## [6.5.2] - 2019-05-15
### Uncategorized
- Hardware Wallet Fix ([#6613](https://github.com/MetaMask/metamask-extension/pull/6613))

## [6.5.1] - 2019-05-14
### Uncategorized
- Fix bug where approve method would show a warning. #6602
- Fix wording of autoLogoutTimeLimitDescription ([#6593](https://github.com/MetaMask/metamask-extension/pull/6593))

## [6.5.0] - 2019-05-13
### Uncategorized
- feature: integrate gaba/PhishingController ([#6568](https://github.com/MetaMask/metamask-extension/pull/6568))
- Redesign custom RPC form ([#6490](https://github.com/MetaMask/metamask-extension/pull/6490))
- Adds auto logout with customizable time frame ([#6558](https://github.com/MetaMask/metamask-extension/pull/6558))
- Fixes ability to send to token contract addresses ([#6578](https://github.com/MetaMask/metamask-extension/pull/6578))
- Adds drag and drop functionality to seed phrase entry. ([#6557](https://github.com/MetaMask/metamask-extension/pull/6557))
- Include token checksum address in prices lookup for token rates ([#6526](https://github.com/MetaMask/metamask-extension/pull/6526))
- Add subheader to all settings subviews ([#6502](https://github.com/MetaMask/metamask-extension/pull/6502))
- Improve confirm screen loading performance by fixing home screen rendering bug ([#6501](https://github.com/MetaMask/metamask-extension/pull/6501))

## [6.4.1] - 2019-04-26
### Uncategorized
- Revert "Adds 4byte registry fallback to getMethodData()" to fix stalling bug. ([#6521](https://github.com/MetaMask/metamask-extension/pull/6521))

## [6.4.0] - 2019-04-18
### Uncategorized
- Move send to pages/ ([#6445](https://github.com/MetaMask/metamask-extension/pull/6445))
- update publishing.md with dev diagram ([#6470](https://github.com/MetaMask/metamask-extension/pull/6470))
- Update to eth-method-registry@1.2.0 ([#6403](https://github.com/MetaMask/metamask-extension/pull/6403))
- Fix switcher height when Custom RPC is selected or loading ([#6468](https://github.com/MetaMask/metamask-extension/pull/6468))
- feature: add Goerli support ([#6459](https://github.com/MetaMask/metamask-extension/pull/6459))
- Fixes #6321 & #6421 - Add Localhost 8545 for network dropdown names ([#6444](https://github.com/MetaMask/metamask-extension/pull/6444))
- Bump eth-contract-metadata ([#6454](https://github.com/MetaMask/metamask-extension/pull/6454))
- Remove unneeded array cloning in getSendToAccounts selector ([#6448](https://github.com/MetaMask/metamask-extension/pull/6448))
- repeated getSelectedAddress() func send.selectors.js removed ([#6056](https://github.com/MetaMask/metamask-extension/pull/6056))
- Added Chrome limited site access solution doc ([#6422](https://github.com/MetaMask/metamask-extension/pull/6422))
- feature: switch token pricing to CoinGecko API ([#6424](https://github.com/MetaMask/metamask-extension/pull/6424))
- Don't inject web3 on sharefile.com ([#6428](https://github.com/MetaMask/metamask-extension/pull/6428))
- Metrics updates ([#6417](https://github.com/MetaMask/metamask-extension/pull/6417))
- Fix links to MetamaskInpageProvider in porting_to_new_environment.md ([#6420](https://github.com/MetaMask/metamask-extension/pull/6420))
- Remove broken image walkthrough from metamaskbot comment ([#6362](https://github.com/MetaMask/metamask-extension/pull/6362))
- metamask-controller - use improved provider-as-middleware utility ([#6401](https://github.com/MetaMask/metamask-extension/pull/6401))
- remove user actions controller ([#6406](https://github.com/MetaMask/metamask-extension/pull/6406))
- doc - publishing - typo fix ([#6399](https://github.com/MetaMask/metamask-extension/pull/6399))
- pin eth-contract-metadata to last commit hash ([#6396](https://github.com/MetaMask/metamask-extension/pull/6396))
- Change coinbase to wyre ([#6397](https://github.com/MetaMask/metamask-extension/pull/6397))
- bump ledger and trezor keyring ([#6395](https://github.com/MetaMask/metamask-extension/pull/6395))
- Fix display of gas chart on Ethereum networks ([#6389](https://github.com/MetaMask/metamask-extension/pull/6389))
- Remove NoticeController ([#6382](https://github.com/MetaMask/metamask-extension/pull/6382))

## [6.3.2] - 2019-04-08
### Uncategorized
- Fix display of gas chart on ethereum networks ([#6389](https://github.com/MetaMask/metamask-extension/pull/6389))
- Fixes for signing methods for ledger and trezor devices ([#6395](https://github.com/MetaMask/metamask-extension/pull/6395))
- Fix Wyre link ([#6397](https://github.com/MetaMask/metamask-extension/pull/6397))

## [6.3.1] - 2019-03-29
### Uncategorized
- Open restore vault in full screen when clicked from popup ([#6353](https://github.com/MetaMask/metamask-extension/pull/6353))
- Prevents duplicates of account addresses from showing in send screen "To" dropdown ([#6372](https://github.com/MetaMask/metamask-extension/pull/6372))
- Ensures users are placed on correct confirm screens even when registry service fails ([#6374](https://github.com/MetaMask/metamask-extension/pull/6374))

## [6.3.0] - 2019-03-26
### Uncategorized
- Gas chart hidden on custom networks ([#6300](https://github.com/MetaMask/metamask-extension/pull/6300))
- Fix gas fee in the submitted step of the transaction details activity log ([#6301](https://github.com/MetaMask/metamask-extension/pull/6301))
- Replaces the coinbase link in the deposit modal with one for wyre ([#6302](https://github.com/MetaMask/metamask-extension/pull/6302))
- Centre the notification in the current window ([#6307](https://github.com/MetaMask/metamask-extension/pull/6307))
- Fixes popups not showing when screen size is odd ([#6312](https://github.com/MetaMask/metamask-extension/pull/6312))
- Fix oversized loading overlay on gas customization modal. ([#6326](https://github.com/MetaMask/metamask-extension/pull/6326))
- Stop reloading dapps on network change allowing dapps to decide if it should refresh or not ([#6330](https://github.com/MetaMask/metamask-extension/pull/6330))
- Enable mobile sync ([#6332](https://github.com/MetaMask/metamask-extension/pull/6332))
- Redesign of the settings screen ([#6333](https://github.com/MetaMask/metamask-extension/pull/6333))
- Cancel transactions and signature requests on the closing of notification windows ([#6340](https://github.com/MetaMask/metamask-extension/pull/6340))
- Disable transaction "Cancel" button when balance is insufficient ([#6341](https://github.com/MetaMask/metamask-extension/pull/6341))
- Enable privacy mode by default for first time users ([#6347](https://github.com/MetaMask/metamask-extension/pull/6347))

## [6.2.2] - 2019-03-12
### Uncategorized
- Centre all notification popups ([#6271](https://github.com/MetaMask/metamask-extension/pull/6271))
- Improve Korean translations ([#6268](https://github.com/MetaMask/metamask-extension/pull/6268))
- Nonmultiple notifications for batch txs ([#6279](https://github.com/MetaMask/metamask-extension/pull/6279))
- No longer check network when validating checksum addresses ([#6280](https://github.com/MetaMask/metamask-extension/pull/6280))

## [6.2.1] - 2019-03-11

## [6.2.0] - 2019-03-05
### Uncategorized
- Improves design and UX of onboarding flow ([#6192](https://github.com/MetaMask/metamask-extension/pull/6192))
- Fixes gas estimation when sending to contracts ([#6195](https://github.com/MetaMask/metamask-extension/pull/6195))
- Fixes display of notification windows when metamask is active in a tab ([#6223](https://github.com/MetaMask/metamask-extension/pull/6223))
- Adds MetaMetrics usage analytics system ([#6171](https://github.com/MetaMask/metamask-extension/pull/6171))

## [6.1.0] - 2019-02-20
### Uncategorized
- Change "Token Address" to "Token Contract Address" ([#6182](https://github.com/MetaMask/metamask-extension/pull/6182))
- Fixes #6176 ([#6177](https://github.com/MetaMask/metamask-extension/pull/6177))
- Add Copy Tx ID button to transaction-list-item-details ([#6146](https://github.com/MetaMask/metamask-extension/pull/6146))
- Checksum address before slicing it for the confirm screen ([#6133](https://github.com/MetaMask/metamask-extension/pull/6133))
- Add button to force edit token symbol when adding custom token ([#6147](https://github.com/MetaMask/metamask-extension/pull/6147))
- Fix incorrectly showing checksums on non-ETH blockchains ([#6124](https://github.com/MetaMask/metamask-extension/pull/6124): recent-blocks - dont listen for block when on infura providers -[#5973] (https://github.com/MetaMask/metamask-extension/pull/5973))

## [6.0.1] - 2019-02-12
### Uncategorized
- Fix advanced gas controls on the confirm screen ([#6139](https://github.com/MetaMask/metamask-extension/pull/6139))
- Trim whitespace from seed phrase during import ([#6134](https://github.com/MetaMask/metamask-extension/pull/6134))
- Update Italian translation ([#6119](https://github.com/MetaMask/metamask-extension/pull/6119))
- Improved Traditional Chinese translation ([#6125](https://github.com/MetaMask/metamask-extension/pull/6125))

## [6.0.0] - 2019-02-11
### Uncategorized
- Migrate all users to the new UI ([#6082](https://github.com/MetaMask/metamask-extension/pull/6082))
- Add setting for inputting gas price with a text field for advanced users. ([#6114](https://github.com/MetaMask/metamask-extension/pull/6114))
- Add Swap feature to CurrencyInput ([#6091](https://github.com/MetaMask/metamask-extension/pull/6091))
- Change gas labels to Slow/Average/Fast ([#6090](https://github.com/MetaMask/metamask-extension/pull/6090))
- Extract advanced gas input controls to their own component ([#6112](https://github.com/MetaMask/metamask-extension/pull/6112))
- Update design of phishing warning screen ([#5929](https://github.com/MetaMask/metamask-extension/pull/5929))
- Add class to sign footer button ([#6120](https://github.com/MetaMask/metamask-extension/pull/6120))
- Fix locale codes contains underscore never being preferred ([#6116](https://github.com/MetaMask/metamask-extension/pull/6116))

## [5.3.5] - 2019-02-04
### Uncategorized
- Privacy mode fixes ([#6087](https://github.com/MetaMask/metamask-extension/pull/6087))

## [5.3.4] - 2019-01-31
### Uncategorized
- fix - migration 30 ([#6079](https://github.com/MetaMask/metamask-extension/pull/6079))

## [5.3.3] - 2019-01-30
### Uncategorized
- Update privacy notice ([#6006](https://github.com/MetaMask/metamask-extension/pull/6006))
- Improved Spanish translations ([#6072](https://github.com/MetaMask/metamask-extension/pull/6072))
- Add visual indicator when displaying a cached balance. ([#5854](https://github.com/MetaMask/metamask-extension/pull/5854))
- Fix bug that interferred with using multiple custom networks. ([#6044](https://github.com/MetaMask/metamask-extension/pull/6044))

## [5.3.2] - 2019-01-28
### Uncategorized
- Order shapeshift transactions by time within the transactions list ([#6021](https://github.com/MetaMask/metamask-extension/pull/6021))
- Add and use cached method signatures to reduce provider requests ([#6052](https://github.com/MetaMask/metamask-extension/pull/6052))
- Refactor BalanceComponent to jsx ([#6048](https://github.com/MetaMask/metamask-extension/pull/6048))
- Prevent invalid chainIds when adding custom rpcs ([#6026](https://github.com/MetaMask/metamask-extension/pull/6026))
- Fix grammar error in Current Conversion ([#6029](https://github.com/MetaMask/metamask-extension/pull/6029))
- Disable account dropdown on signing screens ([#6024](https://github.com/MetaMask/metamask-extension/pull/6024))

## [5.3.1] - 2019-01-16
### Uncategorized
- Update Slovenian translation ([#5966](https://github.com/MetaMask/metamask-extension/pull/5966))
- Set auto conversion off for token/eth conversion ([#6005](https://github.com/MetaMask/metamask-extension/pull/6005))
- Fix confirm screen for sending ether tx with hex data ([#6008](https://github.com/MetaMask/metamask-extension/pull/6008))
- Refine app description ([#5999](https://github.com/MetaMask/metamask-extension/pull/5999))
- Harden Drizzle test runner script ([#5997](https://github.com/MetaMask/metamask-extension/pull/5997))
- Fix bug where MetaMask user calls non-standard ERC20 methods such as `mint`, `tokenData` will be `undefined` and an uncaught error will break the UI ([#5995](https://github.com/MetaMask/metamask-extension/pull/5995))
- Fixed a word in french translation ([#5970](https://github.com/MetaMask/metamask-extension/pull/5970))
- Fix Component#componentDidUpdate usage ([#5977](https://github.com/MetaMask/metamask-extension/pull/5977))
- Add scrolling button to account list ([#5992](https://github.com/MetaMask/metamask-extension/pull/5992))
- fix typo in phishing.html title ([#5989](https://github.com/MetaMask/metamask-extension/pull/5989))

## [5.3.0] - 2019-01-02
### Uncategorized
- Fix etherscan links on notifications ([#5978](https://github.com/MetaMask/metamask-extension/pull/5978))
- Fix drizzle tests ([#5980](https://github.com/MetaMask/metamask-extension/pull/5980))
- Prevent users from changing the From field in the send screen ([#5922](https://github.com/MetaMask/metamask-extension/pull/5922))
- Fix displayed time and date in the activity log. Remove vreme library, add luxon library. ([#5932](https://github.com/MetaMask/metamask-extension/pull/5932))
- transactions - throw an error if a transaction is generated while the network is loading ([#5924](https://github.com/MetaMask/metamask-extension/pull/5924))
- Add loading network screen ([#5893](https://github.com/MetaMask/metamask-extension/pull/5893))

## [5.2.2] - 2018-12-13
### Uncategorized
- Fix speed up button not showing for transactions with the lowest nonce ([#5925](https://github.com/MetaMask/metamask-extension/pull/5925))
- Update the Phishing Warning notice text to not use inline URLs ([#5923](https://github.com/MetaMask/metamask-extension/pull/5923))
- Fix some styling and translations in the gas customization modal ([#5919](https://github.com/MetaMask/metamask-extension/pull/5919))

## [5.2.1] - 2018-12-12
### Uncategorized
- bugfix: Ensures that advanced tab gas limit reflects tx gas limit ([#5917](https://github.com/MetaMask/metamask-extension/pull/5917))

## [5.2.0] - 2018-12-11
### Uncategorized
- Implements new gas customization features for sending, confirming and speeding up transactions ([#5704](https://github.com/MetaMask/metamask-extension/pull/5704))
- Groups transactions - speed up, cancel and original - by nonce in the transaction history list ([#5886](https://github.com/MetaMask/metamask-extension/pull/5886))
- bugfix: eliminates infinite spinner issues caused by switching quickly from a loading network that ultimately fails to resolve ([#5892](https://github.com/MetaMask/metamask-extension/pull/5892))
- bugfix: provider crashes caused caching issues in `json-rpc-engine`. ([#5902](https://github.com/MetaMask/metamask-extension/pull/5902))
  - Fixed in (https://github.com/MetaMask/json-rpc-engine/commit/6de511afbd03ccef4550ea43ff4010b7d7a84039)

## [5.1.0] - 2018-12-03
### Uncategorized
- Fixed an infinite spinner bug. ([#5860](https://github.com/MetaMask/metamask-extension/pull/5860))
- Update phishing warning copy ([#5875](https://github.com/MetaMask/metamask-extension/pull/5875))
- bugfix: normalize contract addresss when fetching exchange rates ([#5863](https://github.com/MetaMask/metamask-extension/pull/5863))
- Use selector for state.metamask.accounts in all cases. ([#5843](https://github.com/MetaMask/metamask-extension/pull/5843))

## [5.0.4] - 2018-11-29
### Uncategorized
- Formats 32-length byte strings passed to personal_sign as hex, rather than UTF8. ([#5878](https://github.com/MetaMask/metamask-extension/pull/5878))
- transactions/tx-gas-utils - add the acctual response for eth_getCode for NO_CONTRACT_ERROR's && add a debug object to simulationFailed ([#5840](https://github.com/MetaMask/metamask-extension/pull/5840))
- Soften accusatory language on phishing warning ([#5848](https://github.com/MetaMask/metamask-extension/pull/5848))
- Open full-screen UI on install ([#5835](https://github.com/MetaMask/metamask-extension/pull/5835))
- Locked versions for some dependencies to avoid possible issues from event-stream hack.
- Hide app-header when provider request pending ([#5831](https://github.com/MetaMask/metamask-extension/pull/5831))
- transactions - autofill gasPrice for retry attempts with either the recomened gasprice or a %10 bump ([#5786](https://github.com/MetaMask/metamask-extension/pull/5786))
- transactions - ensure err is defined when setting tx failed ([#5801](https://github.com/MetaMask/metamask-extension/pull/5801))
- Consider HW Wallets for signTypedMessage ([#5792](https://github.com/MetaMask/metamask-extension/pull/5792))
- Show disabled cursor in .network-disabled state ([#5829](https://github.com/MetaMask/metamask-extension/pull/5829))
- Trim whitespace from seed phrase during import ([#5827](https://github.com/MetaMask/metamask-extension/pull/5827))
- Show Connect Requests count in extension badge ([#5832](https://github.com/MetaMask/metamask-extension/pull/5832))
- Increase Token Symbol length to twelve ([#5816](https://github.com/MetaMask/metamask-extension/pull/5816))
- With the EIP 1102 updates, MetaMask _does_ now open itself when visiting some websites. Changed the wording here to clarify that MetaMask will not open itself to ask you for your seed phrase. ([#5819](https://github.com/MetaMask/metamask-extension/pull/5819))
- Bump Node version to 8.13 ([#5810](https://github.com/MetaMask/metamask-extension/pull/5810))
- Add Firefox and Brave support for Trezor ([#5797](https://github.com/MetaMask/metamask-extension/pull/5797))
- Fix usage of setState in ConfirmTransactionBase#handleSubmit ([#5799](https://github.com/MetaMask/metamask-extension/pull/5799))
- Show byte count for hex data on confirm screen ([#5798](https://github.com/MetaMask/metamask-extension/pull/5798))
- Default to the new UI for first time users ([#5334](https://github.com/MetaMask/metamask-extension/pull/5334))
- Bump eth-ledger-bridge-keyring ([#5791](https://github.com/MetaMask/metamask-extension/pull/5791))

## [5.0.3] - 2018-11-20
### Uncategorized
- Bundle some ui dependencies separately to limit the build size of ui.js ([#5547](https://github.com/MetaMask/metamask-extension/pull/5547))
- Resubmit approved transactions on new block, to fix bug where an error can stick transactions in this state.
- Fixed a bug that could cause an error when sending the max number of tokens.

## [5.0.2] - 2018-11-10
### Uncategorized
- Fixed bug that caused accounts to update slowly to sites. #5717
- Fixed bug that could lead to some sites crashing. #5709

## [5.0.1] - 2018-11-07
### Uncategorized
- Fixed bug in privacy mode that made it not work correctly on Firefox.

## [5.0.0] - 2018-11-06
### Uncategorized
- Implements EIP 1102 as a user-activated "Privacy Mode".

## [4.17.1] - 2018-11-03
### Uncategorized
- Revert chain ID lookup change which introduced a bug which caused problems when connecting to mainnet via Infura's RESTful API.

## [4.17.0] - 2018-11-01
### Uncategorized
- Fix bug where data lookups like balances would get stale data (stopped block-tracker bug)
- Transaction Details now show entry for onchain failure
- Localize language names in translation select list ([#5559](https://github.com/MetaMask/metamask-extension/pull/5559))
- Fix bug when eth.getCode() called with no contract ([#5283](https://github.com/MetaMask/metamask-extension/pull/5283))
- Feature: improve Hatian Creole translations ([#5563](https://github.com/MetaMask/metamask-extension/pull/5563#pullrequestreview-166769174))
- Feature: improve Slovenian translations
- Add support for alternate `wallet_watchAsset` rpc method name
- Attempt chain ID lookup via `eth_chainId` before `net_version`
- Fix account display width for large currency values

## [4.16.0] - 2018-10-17
### Uncategorized
- Feature: Add toggle for primary currency (eth/fiat)
- Feature: add tooltip for view etherscan tx
- Feature: add Polish translations
- Feature: improve Korean translations
- Feature: improve Italian translations
- Bug Fix: Fix bug with "pending" block reference
- Bug Fix: Force AccountTracker to update balances on network change
- Bug Fix: Fix document extension check when injecting web3
- Bug Fix: Fix some support links

## [4.15.0] - 2018-10-11
### Uncategorized
- A rollback release, equivalent to `v4.11.1` to be deployed in the case that `v4.14.0` is found to have bugs.

## [4.14.0] - 2018-10-11
### Uncategorized
- Update transaction statuses when switching networks.
- 100% coverage in French locale, fixed the procedure to verify proposed locale. ([#5470](https://github.com/MetaMask/metamask-extension/pull/5470))
- Added rudimentary support for the subscription API to support web3 1.0 and Truffle's Drizzle.
- Update Italian translation. ([#5502](https://github.com/MetaMask/metamask-extension/pull/5502))

## [4.13.0] - 2018-10-04
### Uncategorized
- A rollback release, equivalent to `v4.11.1` to be deployed in the case that `v4.12.0` is found to have bugs.

## [4.12.0] - 2018-09-27
### Uncategorized
- Reintroduces changes from 4.10.0

## [4.11.1] - 2018-09-25
### Uncategorized
- Adds Ledger support.

## [4.11.0] - 2018-09-24
### Uncategorized
- Identical to 4.9.3. A rollback version to give time to fix bugs in the 4.10.x branch.

## [4.10.0] - 2018-09-18
### Uncategorized
- Implement EIP-712: Sign typed data, but continue to support v1. ([#4803](https://github.com/MetaMask/metamask-extension/pull/4803))
- Restore multiple consecutive accounts with balances. ([#4898](https://github.com/MetaMask/metamask-extension/pull/4898))
- New BlockTracker and Json-Rpc-Engine based Provider. ([#4279](https://github.com/MetaMask/metamask-extension/pull/4279))
- Add Ledger hardware wallet support. ([#5050](https://github.com/MetaMask/metamask-extension/pull/5050))
- Refactor and Redesign Transaction List. ([#4919](https://github.com/MetaMask/metamask-extension/pull/4919))
- Add Transaction Details to the Transaction List view. ([#5182](https://github.com/MetaMask/metamask-extension/pull/5182))
- Clear old seed words when importing new seed words. ([#5229](https://github.com/MetaMask/metamask-extension/pull/5229))
- Improve click area for adjustment arrows buttons. ([#5264](https://github.com/MetaMask/metamask-extension/pull/5264))
- Add new metamask_watchAsset method. ([#4606](https://github.com/MetaMask/metamask-extension/pull/4606))
- Fix bug where Ropsten loading message is shown when connecting to Kovan. ([#5189](https://github.com/MetaMask/metamask-extension/pull/5189))
- Add mock EIP-1102 support ([#5256](https://github.com/MetaMask/metamask-extension/pull/5256))

## [4.9.3] - 2018-08-16
### Uncategorized
- QR code scan for recipient addresses. ([#4897](https://github.com/MetaMask/metamask-extension/pull/4897))
- Add a download seed phrase link. ([#4961](https://github.com/MetaMask/metamask-extension/pull/4961))
- Fix bug where gas was not updating properly. ([#5060](https://github.com/MetaMask/metamask-extension/pull/5060))

## [4.9.2] - 2018-08-10
### Uncategorized
- Fix bug in migration #28 ([#5020](https://github.com/MetaMask/metamask-extension/pull/5020))

## [4.9.1] - 2018-08-09
### Uncategorized
- Allow to have tokens per account and network. ([#4884](https://github.com/MetaMask/metamask-extension/pull/4884))
- Continue to use original signedTypedData. ([#4989](https://github.com/MetaMask/metamask-extension/pull/4989))
- Fix ENS resolution issues. ([#5010](https://github.com/MetaMask/metamask-extension/pull/5010))
- Show error while allowing confirmation of tx where simulation fails. ([#5000](https://github.com/MetaMask/metamask-extension/pull/5000))
- Shows retry button on dApp initialized transactions. ([#4995](https://github.com/MetaMask/metamask-extension/pull/4995))

## [4.9.0] - 2018-08-07
### Uncategorized
- Show retry button on the latest tx of the earliest nonce. ([#4926](https://github.com/MetaMask/metamask-extension/pull/4926))
- Suggest using the new user interface. ([#4888](https://github.com/MetaMask/metamask-extension/pull/4888))
- Prevent sending multiple transasctions on multiple confirm clicks. ([#4947](https://github.com/MetaMask/metamask-extension/pull/4947))
- Add new tokens auto detection. ([#4844](https://github.com/MetaMask/metamask-extension/pull/4844))
- Remove rejected transactions from transaction history. ([#4667](https://github.com/MetaMask/metamask-extension/pull/4667))
- Add Trezor Support. ([#4625](https://github.com/MetaMask/metamask-extension/pull/4625))
- Allow to remove accounts ([#4625](https://github.com/MetaMask/metamask-extension/pull/4625/commits/523cf9ad33d88719520ae5e7293329d133b64d4d))
- Add hex data input to send screen. ([#4814](https://github.com/MetaMask/metamask-extension/pull/4814))
- Redesign of the Confirm Transaction Screen. ([#4691](https://github.com/MetaMask/metamask-extension/pull/4691))
- Now shows notifications when transactions are completed. ([#4840](https://github.com/MetaMask/metamask-extension/pull/4840))
- Allow the use of HTTP prefix for custom rpc urls. ([#4855](https://github.com/MetaMask/metamask-extension/pull/4855))
- network.js: convert rpc protocol to lower case. ([#4855](https://github.com/MetaMask/metamask-extension/pull/4855))
- Restore multiple consecutive accounts with balances. ([#4898](https://github.com/MetaMask/metamask-extension/pull/4898))

## [4.8.0] - 2018-06-18
### Uncategorized
- Attempting to import an empty private key will now show a clear error. ([#4513](https://github.com/MetaMask/metamask-extension/pull/4513))
- Fix bug where metamask data would stop being written to disk after prolonged use. ([#4570](https://github.com/MetaMask/metamask-extension/pull/4570))
- Fix bug where account reset did not work with custom RPC providers. ([#4523](https://github.com/MetaMask/metamask-extension/pull/4523))
- Fix for Brave i18n getAcceptLanguages. ([#4524](https://github.com/MetaMask/metamask-extension/pull/4524))
- Fix bug where nonce mutex was never released. ([#4557](https://github.com/MetaMask/metamask-extension/pull/4557))
- Add phishing notice. ([#4566](https://github.com/MetaMask/metamask-extension/pull/4566))
- Allow Copying Token Addresses and link to Token on Etherscan. ([#4591](https://github.com/MetaMask/metamask-extension/pull/4591))

## [4.7.4] - 2018-06-05
### Uncategorized
- Add diagnostic reporting for users with multiple HD keyrings
- Throw explicit error when selected account is unset

## [4.7.3] - 2018-06-04
### Uncategorized
- Hide token now uses new modal
- Indicate the current selected account on the popup account view
- Reduce height of notice container in onboarding
- Fixes issue where old nicknames were kept around causing errors

## [4.7.2] - 2018-06-03
### Uncategorized
- Fix bug preventing users from logging in. Internally accounts and identities were out of sync.
- Fix support links to point to new support system (Zendesk)
- Fix bug in migration #26 ( moving account nicknames to preferences )
- Clears account nicknames on restore from seedPhrase

## [4.7.1] - 2018-06-01
### Uncategorized
- Fix bug where errors were not returned to Dapps.

## [4.7.0] - 2018-05-30
### Uncategorized
- Fix Brave support
- Adds error messages when passwords don't match in onboarding flow.
- Adds modal notification if a retry in the process of being confirmed is dropped.
- New unlock screen design.
- Design improvements to the add token screen.
- Fix inconsistencies in confirm screen between extension and browser window modes.
- Fix scrolling in deposit ether modal.
- Fix styling of app spinner.
- Font weight changed from 300 to 400.
- New reveal screen design.
- Styling improvements to labels in first time flow and signature request headers.
- Allow other extensions to make access our ethereum provider API ([#3997](https://github.com/MetaMask/metamask-extension/pull/3997))

## [4.6.1] - 2018-04-30
### Uncategorized
- Fix bug where sending a transaction resulted in an infinite spinner
- Allow transactions with a 0 gwei gas price
- Handle encoding errors in ERC20 symbol + digits
- Fix ShapeShift forms (new + old ui)
- Fix sourcemaps

## [4.6.0] - 2018-04-26
### Uncategorized
- Correctly format currency conversion for locally selected preferred currency.
- Improved performance of 3D fox logo.
- Fetch token prices based on contract address, not symbol
- Fix bug that prevents setting language locale in settings.
- Show checksum addresses throughout the UI
- Allow transactions with a 0 gwei gas price
- Made provider RPC errors contain useful messages

## [4.5.5] - 2018-04-06
### Uncategorized
- Graceful handling of unknown keys in txParams
- Fixes buggy handling of historical transactions with unknown keys in txParams
- Fix link for 'Learn More' in the Add Token Screen to open to a new tab.
- Fix Download State Logs button [#3791](https://github.com/MetaMask/metamask-extension/issues/3791)
- Enhanced migration error handling + reporting

## [4.5.4] - 2018-04-05 [WITHDRAWN]
### Uncategorized
- Graceful handling of unknown keys in txParams
- Fix link for 'Learn More' in the Add Token Screen to open to a new tab.
- Fix Download State Logs button [#3791](https://github.com/MetaMask/metamask-extension/issues/3791)
- Fix migration error reporting

## [4.5.3] - 2018-04-04
### Uncategorized
- Fix bug where checksum address are messing with balance issue [#3843](https://github.com/MetaMask/metamask-extension/issues/3843)
- new ui: fix the confirm transaction screen

## [4.5.2] - 2018-04-04
### Uncategorized
- Fix overly strict validation where transactions were rejected with hex encoded "chainId"

## [4.5.1] - 2018-04-03
### Uncategorized
- Fix default network (should be mainnet not Rinkeby)
- Fix Sentry automated error reporting endpoint

## [4.5.0] - 2018-04-02
### Uncategorized
- (beta ui) Internationalization: Select your preferred language in the settings screen
- Internationalization: various locale improvements
- Fix bug where the "Reset account" feature would not clear the network cache.
- Increase maximum gas limit, to allow very gas heavy transactions, since block gas limits have been stable.

## [4.4.0] - 2018-03-27
### Uncategorized
- Internationalization: Taiwanese, Thai, Slovenian
- Fixes bug where MetaMask would not open once its storage grew too large.
- Updates design of new-ui Add Token screen
- New-ui can send to ens addresses
- Update new-ui button styles
- Signed-type-data notification handles long messages
- Popup extension in new-ui uses new on-boarding designs
- Buy ether step of new-ui on-boarding uses new buy ether modal designs

## [4.3.0] - 2018-03-21
### Uncategorized
- (beta) Add internationalization support! Includes translations for 13 (!!) new languages: French, Spanish, Italian, German, Dutch, Portuguese, Japanese, Korean, Vietnamese, Mandarin, Hindi, Tagalog, and Russian! Select "Try Beta" in the menu to take them for a spin. Read more about the community effort [here](https://medium.com/gitcoin/metamask-internationalizes-via-gitcoin-bf1390c0301c)
- No longer uses nonces specified by the dapp
- Will now throw an error if the `to` field in txParams is not valid.
- Will strip null values from the `to` field.
- (beta) No longer shows token confirmation screen when performing a non-send
- (beta) Fixes bug where tx data was nullified when repricing a tx
- Fix flashing Login screen after logging in or restoring from seed phrase.
- Increase tap areas for menu buttons on mobile
- Change all fonts in new-ui onboarding to Roboto, size 400
- Add a welcome screen to new-ui onboarding flow
- Make new-ui create password screen responsive
- Hide network dropdown before account is initialized
- Fix bug that could prevent MetaMask from saving the latest vault.

## [4.2.0] - 2018-03-06
### Uncategorized
- Replace "Loose" wording to "Imported".
- Replace "Unlock" wording with "Log In".
- Add Imported Account disclaimer.
- Allow adding custom tokens to classic ui when balance is 0
- Allow editing of symbol and decimal info when adding custom token in new-ui
- NewUI shapeshift form can select all coins (not just BTC)
- Add most of Microsoft Edge support.

## [4.1.3] - 2018-03-02
### Uncategorized
- Ensure MetaMask's inpage provider is named MetamaskInpageProvider to keep some sites from breaking.
- Add retry transaction button back into classic ui.
- Add network dropdown styles to support long custom RPC urls

## [4.1.2] - 2018-02-28
### Uncategorized
- Actually includes all the fixes mentioned in 4.1.1 (sorry)

## [4.1.1] - 2018-02-28
### Uncategorized
- Fix "Add Token" screen referencing missing token logo urls
- Prevent user from switching network during signature request
- Fix misleading language "Contract Published" -> "Contract Deployment"
- Fix cancel button on "Buy Eth" screen
- Improve new-ui onboarding flow style

## [4.1.0] - 2018-02-27
### Uncategorized
- Report failed txs to Sentry with more specific message
- Fix internal feature flags being sometimes undefined
- Standardized license to MIT

## [4.0.0] - 2018-02-22
### Uncategorized
- Introduce new MetaMask user interface.

## [3.14.2] - 2018-02-27
### Uncategorized
- Fix bug where log subscriptions would break when switching network.
- Fix bug where storage values were cached across blocks.
- Add MetaMask light client [testing container](https://github.com/MetaMask/mesh-testing)

## [3.14.1] - 2018-02-01
### Uncategorized
- Further fix scrolling for Firefox.

## [3.14.0] - 2018-02-01
### Uncategorized
- Removed unneeded data from storage
- Add a "reset account" feature to Settings
- Add warning for importing some kinds of files.
- Scrollable Setting view for Firefox.

## [3.13.8] - 2018-01-29
### Uncategorized
- Fix provider for Kovan network.
- Bump limit for EventEmitter listeners before warning.
- Display Error when empty string is entered as a token address.

## [3.13.7] - 2018-01-22
### Uncategorized
- Add ability to bypass gas estimation loading indicator.
- Forward failed transactions to Sentry error reporting service
- Re-add changes from 3.13.5

## [3.13.6] - 2017-01-18
### Uncategorized
- Roll back changes to 3.13.4 to fix some issues with the new Infura REST provider.

## [3.13.5] - 2018-01-16
### Uncategorized
- Estimating gas limit for simple ether sends now faster & cheaper, by avoiding VM usage on recipients with no code.
- Add an extra px to address for Firefox clipping.
- Fix Firefox scrollbar.
- Open metamask popup for transaction confirmation before gas estimation finishes and add a loading screen over transaction confirmation.
- Fix bug that prevented eth_signTypedData from signing bytes.
- Further improve gas price estimation.

## [3.13.4] - 2018-01-09
### Uncategorized
- Remove recipient field if application initializes a tx with an empty string, or 0x, and tx data. Throw an error with the same condition, but without tx data.
- Improve gas price suggestion to be closer to the lowest that will be accepted.
- Throw an error if a application tries to submit a tx whose value is a decimal, and inform that it should be in wei.
- Fix bug that prevented updating custom token details.
- No longer mark long-pending transactions as failed, since we now have button to retry with higher gas.
- Fix rounding error when specifying an ether amount that has too much precision.
- Fix bug where incorrectly inputting seed phrase would prevent any future attempts from succeeding.

## [3.13.3] - 2017-12-14
### Uncategorized
- Show tokens that are held that have no balance.
- Reduce load on Infura by using a new block polling endpoint.

## [3.13.2] - 2017-12-09
### Uncategorized
- Reduce new block polling interval to 8000 ms, to ease server load.

## [3.13.1] - 2017-12-07
### Uncategorized
- Allow Dapps to specify a transaction nonce, allowing dapps to propose resubmit and force-cancel transactions.

## [3.13.0] - 2017-12-07
### Uncategorized
- Allow resubmitting transactions that are taking long to complete.

## [3.12.1] - 2017-11-29
### Uncategorized
- Fix bug where a user could be shown two different seed phrases.
- Detect when multiple web3 extensions are active, and provide useful error.
- Adds notice about seed phrase backup.

## [3.12.0] - 2017-10-26
### Uncategorized
- Add support for alternative ENS TLDs (Ethereum Name Service Top-Level Domains).
- Lower minimum gas price to 0.1 GWEI.
- Remove web3 injection message from production (thanks to @ChainsawBaby)
- Add additional debugging info to our state logs, specifically OS version and browser version.

## [3.11.2] - 2017-10-21
### Uncategorized
- Fix bug where reject button would sometimes not work.
- Fixed bug where sometimes MetaMask's connection to a page would be unreliable.

## [3.11.1] - 2017-10-20
### Uncategorized
- Fix bug where log filters were not populated correctly
- Fix bug where web3 API was sometimes injected after the page loaded.
- Fix bug where first account was sometimes not selected correctly after creating or restoring a vault.
- Fix bug where imported accounts could not use new eth_signTypedData method.

## [3.11.0] - 2017-10-11
### Uncategorized
- Add support for new eth_signTypedData method per EIP 712.
- Fix bug where some transactions would be shown as pending forever, even after successfully mined.
- Fix bug where a transaction might be shown as pending forever if another tx with the same nonce was mined.
- Fix link to support article on token addresses.

## [3.10.9] - 2017-10-05
### Uncategorized
- Only rebrodcast transactions for a day not a days worth of blocks
- Remove Slack link from info page, since it is a big phishing target.
- Stop computing balance based on pending transactions, to avoid edge case where users are unable to send transactions.

## [3.10.8] - 2017-09-30
### Uncategorized
- Fixed usage of new currency fetching API.

## [3.10.7] - 2017-09-29
### Uncategorized
- Fixed bug where sometimes the current account was not correctly set and exposed to web apps.
- Added AUD, HKD, SGD, IDR, PHP to currency conversion list

## [3.10.6] - 2017-09-27
### Uncategorized
- Fix bug where newly created accounts were not selected.
- Fix bug where selected account was not persisted between lockings.

## [3.10.5] - 2017-09-27
### Uncategorized
- Fix block gas limit estimation.

## [3.10.4] - 2017-09-27
### Uncategorized
- Fix bug that could mis-render token balances when very small. (Not actually included in 3.9.9)
- Fix memory leak warning.
- Fix bug where new event filters would not include historical events.

## [3.10.3] - 2017-09-21
### Uncategorized
- Fix bug where metamask-dapp connections are lost on rpc error
- Fix bug that would sometimes display transactions as failed that could be successfully mined.

## [3.10.2] - 2017-09-19
### Uncategorized
- rollback to 3.10.0 due to bug

## [3.10.1] - 2017-09-18
### Uncategorized
- Add ability to export private keys as a file.
- Add ability to export seed words as a file.
- Changed state logs to a file download than a clipboard copy.
- Add specific error for failed recipient address checksum.
- Fixed a long standing memory leak associated with filters installed by dapps
- Fix link to support center.
- Fixed tooltip icon locations to avoid overflow.
- Warn users when a dapp proposes a high gas limit (90% of blockGasLimit or higher
- Sort currencies by currency name (thanks to strelok1: https://github.com/strelok1).

## [3.10.0] - 2017-09-11
### Uncategorized
- Readded loose keyring label back into the account list.
- Remove cryptonator from chrome permissions.
- Add info on token contract addresses.
- Add validation preventing users from inputting their own addresses as token tracking addresses.
- Added button to reject all transactions (thanks to davidp94! https://github.com/davidp94)

## [3.9.13] - 2017-09-08
### Uncategorized
- Changed the way we initialize the inpage provider to fix a bug affecting some developers.

## [3.9.12] - 2017-09-06
### Uncategorized
- Fix bug that prevented Web3 1.0 compatibility
- Make eth_sign deprecation warning less noisy
- Add useful link to eth_sign deprecation warning.
- Fix bug with network version serialization over synchronous RPC
- Add MetaMask version to state logs.
- Add the total amount of tokens when multiple tokens are added under the token list
- Use HTTPS links for Etherscan.
- Update Support center link to new one with HTTPS.
- Make web3 deprecation notice more useful by linking to a descriptive article.

## [3.9.11] - 2017-08-24
### Uncategorized
- Fix nonce calculation bug that would sometimes generate very wrong nonces.
- Give up resubmitting a transaction after 3500 blocks.

## [3.9.10] - 2017-08-23
### Uncategorized
- Improve nonce calculation, to prevent bug where people are unable to send transactions reliably.
- Remove link to eth-tx-viz from identicons in tx history.

## [3.9.9] - 2017-08-18
### Uncategorized
- Fix bug where some transaction submission errors would show an empty screen.
- Fix bug that could mis-render token balances when very small.
- Fix formatting of eth_sign "Sign Message" view.
- Add deprecation warning to eth_sign "Sign Message" view.

## [3.9.8] - 2017-08-16
### Uncategorized
- Reenable token list.
- Remove default tokens.

## [3.9.7] - 2017-08-15
### Uncategorized
- hotfix - disable token list
- Added a deprecation warning for web3 https://github.com/ethereum/mist/releases/tag/v0.9.0

## [3.9.6] - 2017-08-10
### Uncategorized
- Replace account screen with an account drop-down menu.
- Replace account buttons with a new account-specific drop-down menu.

## [3.9.5] - 2017-08-04
### Uncategorized
- Improved phishing detection configuration update rate

## [3.9.4] - 2017-08-04
### Uncategorized
- Fixed bug that prevented transactions from being rejected.

## [3.9.3] - 2017-08-03
### Uncategorized
- Add support for EGO ujo token
- Continuously update blacklist for known phishing sites in background.
- Automatically detect suspicious URLs too similar to common phishing targets, and blacklist them.

## [3.9.2] - 2017-07-26
### Uncategorized
- Fix bugs that could sometimes result in failed transactions after switching networks.
- Include stack traces in txMeta's to better understand the life cycle of transactions
- Enhance blacklister functionality to include levenshtein logic. (credit to @sogoiii and @409H for their help!)

## [3.9.1] - 2017-07-19
### Uncategorized
- No longer automatically request 1 ropsten ether for the first account in a new vault.
- Now redirects from known malicious sites faster.
- Added a link to our new support page to the help screen.
- Fixed bug where a new transaction would be shown over the current transaction, creating a possible timing attack against user confirmation.
- Fixed bug in nonce tracker where an incorrect nonce would be calculated.
- Lowered minimum gas price to 1 Gwei.

## [3.9.0] - 2017-07-12
### Uncategorized
- Now detects and blocks known phishing sites.

## [3.8.6] - 2017-07-11
### Uncategorized
- Make transaction resubmission more resilient.
- No longer validate nonce client-side in retry loop.
- Fix bug where insufficient balance error was sometimes shown on successful transactions.

## [3.8.5] - 2017-07-08
### Uncategorized
- Fix transaction resubmit logic to fail slightly less eagerly.

## [3.8.4] - 2017-07-07
### Uncategorized
- Improve transaction resubmit logic to fail more eagerly when a user would expect it to.

## [3.8.3] - 2017-07-06
### Uncategorized
- Re-enable default token list.
- Add origin header to dapp-bound requests to allow providers to throttle sites.
- Fix bug that could sometimes resubmit a transaction that had been stalled due to low balance after balance was restored.

## [3.8.2] - 2017-07-03
### Uncategorized
- No longer show network loading indication on config screen, to allow selecting custom RPCs.
- Visually indicate that network spinner is a menu.
- Indicate what network is being searched for when disconnected.

## [3.8.1] - 2017-06-30
### Uncategorized
- Temporarily disabled loading popular tokens by default to improve performance.
- Remove SEND token button until a better token sending form can be built, due to some precision issues.
- Fix precision bug in token balances.
- Cache token symbol and precisions to reduce network load.
- Transpile some newer JavaScript, restores compatibility with some older browsers.

## [3.8.0] - 2017-06-28
### Uncategorized
- No longer stop rebroadcasting transactions
- Add list of popular tokens held to the account detail view.
- Add ability to add Tokens to token list.
- Add a warning to JSON file import.
- Add "send" link to token list, which goes to TokenFactory.
- Fix bug where slowly mined txs would sometimes be incorrectly marked as failed.
- Fix bug where badge count did not reflect personal_sign pending messages.
- Seed word confirmation wording is now scarier.
- Fix error for invalid seed words.
- Prevent users from submitting two duplicate transactions by disabling submit.
- Allow Dapps to specify gas price as hex string.
- Add button for copying state logs to clipboard.

## [3.7.8] - 2017-06-12
### Uncategorized
- Add an `ethereum:` prefix to the QR code address
- The default network on installation is now MainNet
- Fix currency API URL from cryptonator.
- Update gasLimit params with every new block seen.
- Fix ENS resolver symbol UI.

## [3.7.7] - 2017-06-08
### Uncategorized
- Fix bug where metamask would show old data after computer being asleep or disconnected from the internet.

## [3.7.6] - 2017-06-05
### Uncategorized
- Fix bug that prevented publishing contracts.

## [3.7.5] - 2017-06-05
### Uncategorized
- Prevent users from sending to the `0x0` address.
- Provide useful errors when entering bad characters in ENS name.
- Add ability to copy addresses from transaction confirmation view.

## [3.7.4] - 2017-06-02
### Uncategorized
- Fix bug with inflight cache that caused some block lookups to return bad values (affected OasisDex).
- Fixed bug with gas limit calculation that would sometimes create unsubmittable gas limits.

## [3.7.3] - 2017-06-01
### Uncategorized
- Rebuilt to fix cache clearing bug.

## [3.7.2] - 2017-05-31
### Uncategorized
- Now when switching networks sites that use web3 will reload
- Now when switching networks the extension does not restart
- Cleanup decimal bugs in our gas inputs.
- Fix bug where submit button was enabled for invalid gas inputs.
- Now enforce 95% of block's gasLimit to protect users.
- Removing provider-engine from the inpage provider. This fixes some error handling inconsistencies introduced in 3.7.0.
- Added "inflight cache", which prevents identical requests from clogging up the network, dramatically improving ENS performance.
- Fixed bug where filter subscriptions would sometimes fail to unsubscribe.
- Some contracts will now display logos instead of jazzicons.
- Some contracts will now have names displayed in the confirmation view.

## [3.7.0] - 2017-05-23
### Uncategorized
- Add Transaction Number (nonce) to transaction list.
- Label the pending tx icon with a tooltip.
- Fix bug where website filters would pile up and not deallocate when leaving a site.
- Continually resubmit pending txs for a period of time to ensure successful broadcast.
- ENS names will no longer resolve to their owner if no resolver is set. Resolvers must be explicitly set and configured.

## [3.6.5] - 2017-05-17
### Uncategorized
- Fix bug where edited gas parameters would not take effect.
- Trim currency list.
- Enable decimals in our gas prices.
- Fix reset button.
- Fix event filter bug introduced by newer versions of Geth.
- Fix bug where decimals in gas inputs could result in strange values.

## [3.6.4] - 2017-05-09
### Uncategorized
- Fix main-net ENS resolution.

## [3.6.3] - 2017-05-09
### Uncategorized
- Fix bug that could stop newer versions of Geth from working with MetaMask.

## [3.6.2] - 2017-05-08
### Uncategorized
- Input gas price in Gwei.
- Enforce Safe Gas Minimum recommended by EthGasStation.
- Fix bug where block-tracker could stop polling for new blocks.
- Reduce UI size by removing internal web3.
- Fix bug where gas parameters would not properly update on adjustment.

## [3.6.1] - 2017-05-07
### Uncategorized
- Made fox less nosy.
- Fix bug where error was reported in debugger console when Chrome opened a new window.

## [3.6.0] - 2017-04-27
### Uncategorized
- Add Rinkeby Test Network to our network list.

## [3.5.4] - 2017-04-25
### Uncategorized
- Fix occasional nonce tracking issue.
- Fix bug where some events would not be emitted by web3.
- Fix bug where an error would be thrown when composing signatures for networks with large ID values.

## [3.5.3] - 2017-04-24
### Uncategorized
- Popup new transactions in Firefox.
- Fix transition issue from account detail screen.
- Revise buy screen for more modularity.
- Fixed some other small bugs.

## [3.5.2] - 2017-03-28
### Uncategorized
- Fix bug where gas estimate totals were sometimes wrong.
- Add link to Kovan Test Faucet instructions on buy view.
- Inject web3 into loaded iFrames.

## [3.5.1] - 2017-03-27
### Uncategorized
- Fix edge case where users were unable to enable the notice button if notices were short enough to not require a scrollbar.

## [3.5.0] - 2017-03-27
### Uncategorized
- Add better error messages for when a transaction fails on approval
- Allow sending to ENS names in send form on Ropsten.
- Added an address book functionality that remembers the last 15 unique addresses sent to.
- Can now change network to custom RPC URL from lock screen.
- Removed support for old, lightwallet based vault. Users who have not opened app in over a month will need to recover with their seed phrase. This will allow Firefox support sooner.
- Fixed bug where spinner wouldn't disappear on incorrect password submission on seed word reveal.
- Polish the private key UI.
- Enforce minimum values for gas price and gas limit.
- Fix bug where total gas was sometimes not live-updated.
- Fix bug where editing gas value could have some abrupt behaviors (#1233)
- Add Kovan as an option on our network list.
- Fixed bug where transactions on other networks would disappear when submitting a transaction on another network.

## [3.4.0] - 2017-03-08
### Uncategorized
- Add two most recently used custom RPCs to network dropdown menu.
- Add personal_sign method support.
- Add personal_ecRecover method support.
- Add ability to customize gas and gasPrice on the transaction approval screen.
- Increase default gas buffer to 1.5x estimated gas value.

## [3.3.0] - 2017-02-20
### Uncategorized
- net_version has been made synchronous.
- Test suite for migrations expanded.
- Network now changeable from lock screen.
- Improve test coverage of eth.sign behavior, including a code example of verifying a signature.

## [3.2.2] - 2017-02-09
### Uncategorized
- Revert eth.sign behavior to the previous one with a big warning. We will be gradually implementing the new behavior over the coming time. https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign
- Improve test coverage of eth.sign behavior, including a code example of verifying a signature.

## [3.2.1] - 2017-02-09
### Uncategorized
- Revert back to old style message signing.
- Fixed some build errors that were causing a variety of bugs.

## [3.2.0] - 2017-02-08
### Uncategorized
- Add ability to import accounts in JSON file format (used by Mist, Geth, MyEtherWallet, and more!)
- Fix unapproved messages not being included in extension badge.
- Fix rendering bug where the Confirm transaction view would let you approve transactions when the account has insufficient balance.

## [3.1.2] - 2017-01-24
### Uncategorized
- Fix "New Account" default keychain

## [3.1.1] - 2017-01-20
### Uncategorized
- Fix HD wallet seed export

## [3.1.0] - 2017-01-18
### Uncategorized
- Add ability to import accounts by private key.
- Fixed bug that returned the wrong transaction hashes on private networks that had not implemented EIP 155 replay protection (like TestRPC).

## [3.0.1] - 2017-01-17
### Uncategorized
- Fixed bug that prevented eth.sign from working.
- Fix the displaying of transactions that have been submitted to the network in Transaction History

## [3.0.0] - 2017-01-16
### Uncategorized
- Fix seed word account generation (https://medium.com/metamask/metamask-3-migration-guide-914b79533cdd#.t4i1qmmsz).
- Fix Bug where you see an empty transaction flash by on the confirm transaction view.
- Create visible difference in transaction history between an approved but not yet included in a block transaction and a transaction who has been confirmed.
- Fix memory leak in RPC Cache
- Override RPC commands eth_syncing and web3_clientVersion
- Remove certain non-essential permissions from certain builds.
- Add a check for when a tx is included in a block.
- Fix bug where browser-solidity would sometimes warn of a contract creation error when there was none.
- Minor modifications to network display.
- Network now displays properly for pending transactions.
- Implement replay attack protections allowed by EIP 155.
- Fix bug where sometimes loading account data would fail by querying a future block.

## [2.14.1] - 2016-12-20
### Uncategorized
- Update Coinbase info. and increase the buy amount to $15
- Fixed ropsten transaction links
- Temporarily disable extension reload detection causing infinite reload bug.
- Implemented basic checking for valid RPC URIs.

## [2.14.0] - 2016-12-16
### Uncategorized
- Removed Morden testnet provider from provider menu.
- Add support for notices.
- Fix broken reload detection.
- Fix transaction forever cached-as-pending bug.

## [2.13.11] - 2016-11-23
### Uncategorized
- Add support for synchronous RPC method "eth_uninstallFilter".
- Forgotten password prompts now send users directly to seed word restoration.

## [2.13.10] - 2016-11-22
### Uncategorized
- Improve gas calculation logic.
- Default to Dapp-specified gas limits for transactions.
- Ropsten networks now properly point to the faucet when attempting to buy ether.
- Ropsten transactions now link to etherscan correctly.

## [2.13.9] - 2016-11-21
### Uncategorized
- Add support for the new, default Ropsten Test Network.
- Fix bug that would cause MetaMask to occasionally lose its StreamProvider connection and drop requests.
- Fix bug that would cause the Custom RPC menu item to not appear when Localhost 8545 was selected.
- Point ropsten faucet button to actual faucet.
- Phase out ethereumjs-util from our encryptor module.

## [2.13.8] - 2016-11-16
### Uncategorized
- Show a warning when a transaction fails during simulation.
- Fix bug where 20% of gas estimate was not being added properly.
- Render error messages in confirmation screen more gracefully.

## [2.13.7] - 2016-11-08
### Uncategorized
- Fix bug where gas estimate would sometimes be very high.
- Increased our gas estimate from 100k gas to 20% of estimate.
- Fix GitHub link on info page to point at current repository.

## [2.13.6] - 2016-10-26
### Uncategorized
- Add a check for improper Transaction data.
- Inject up to date version of web3.js
- Now nicknaming new accounts "Account #" instead of "Wallet #" for clarity.
- Fix bug where custom provider selection could show duplicate items.
- Fix bug where connecting to a local morden node would make two providers appear selected.
- Fix bug that was sometimes preventing transactions from being sent.

## [2.13.5] - 2016-10-18
### Uncategorized
- Increase default max gas to `100000` over the RPC's `estimateGas` response.
- Fix bug where slow-loading dapps would sometimes trigger infinite reload loops.

## [2.13.4] - 2016-10-17
### Uncategorized
- Add custom transaction fee field to send form.
- Fix bug where web3 was being injected into XML files.
- Fix bug where changing network would not reload current Dapps.

## [2.13.3] - 2016-10-05
### Uncategorized
- Fix bug where log queries were filtered out.
- Decreased vault confirmation button font size to help some Linux users who could not see it.
- Made popup a little taller because it would sometimes cut off buttons.
- Fix bug where long account lists would get scrunched instead of scrolling.
- Add legal information to relevant pages.
- Rename UI elements to be more consistent with one another.
- Updated Terms of Service and Usage.
- Prompt users to re-agree to the Terms of Service when they are updated.

## [2.13.2] - 2016-10-04
### Uncategorized
- Fix bug where chosen FIAT exchange rate does no persist when switching networks
- Fix additional parameters that made MetaMask sometimes receive errors from Parity.
- Fix bug where invalid transactions would still open the MetaMask popup.
- Removed hex prefix from private key export, to increase compatibility with Geth, MyEtherWallet, and Jaxx.

## [2.13.1] - 2016-09-23
### Uncategorized
- Fix a bug with estimating gas on Parity
- Show loading indication when selecting ShapeShift as purchasing method.

## [2.13.0] - 2016-09-18
### Uncategorized
- Add Parity compatibility, fixing Geth dependency issues.
- Add a link to the transaction in history that goes to https://metamask.github.io/eth-tx-viz to help visualize transactions and to where they are going.
- Show "Buy Ether" button and warning on tx confirmation when sender balance is insufficient

## [2.12.1] - 2016-09-14
### Uncategorized
- Fixed bug where if you send a transaction from within MetaMask extension the popup notification opens up.
- Fixed bug where some tx errors would block subsequent txs until the plugin was refreshed.

## [2.12.0] - 2016-09-14
### Uncategorized
- Add a QR button to the Account detail screen
- Fixed bug where opening MetaMask could close a non-metamask popup.
- Fixed memory leak that caused occasional crashes.

## [2.11.1] - 2016-09-13
### Uncategorized
- Fix bug that prevented caches from being cleared in Opera.

## [2.11.0] - 2016-09-12
### Uncategorized
- Fix bug where pending transactions from Test net (or other networks) show up In Main net.
- Add fiat conversion values to more views.
- On fresh install, open a new tab with the MetaMask Introduction video. Does not open on update.
- Block negative values from transactions.
- Fixed a memory leak.
- MetaMask logo now renders as super lightweight SVG, improving compatibility and performance.
- Now showing loading indication during vault unlocking, to clarify behavior for users who are experiencing slow unlocks.
- Now only initially creates one wallet when restoring a vault, to reduce some users' confusion.

## [2.10.2] - 2016-09-02
### Uncategorized
- Fix bug where notification popup would not display.

## [2.10.1] - 2016-09-02
### Uncategorized
- Fix bug where provider menu did not allow switching to custom network from a custom network.
- Sending a transaction from within MetaMask no longer triggers a popup.
- The ability to build without livereload features (such as for production) can be enabled with the gulp --disableLiveReload flag.
- Fix Ethereum JSON RPC Filters bug.

## [2.10.0] - 2016-08-29
### Uncategorized
- Changed transaction approval from notifications system to popup system.
- Add a back button to locked screen to allow restoring vault from seed words when password is forgotten.
- Forms now retain their values even when closing the popup and reopening it.
- Fixed a spelling error in provider menu.

## [2.9.2] - 2016-08-24
### Uncategorized
- Fixed shortcut bug from preventing installation.

## [2.9.1] - 2016-08-24
### Uncategorized
- Added static image as fallback for when WebGL isn't supported.
- Transaction history now has a hard limit.
- Added info link on account screen that visits Etherscan.
- Fixed bug where a message signing request would be lost if the vault was locked.
- Added shortcut to open MetaMask (Ctrl+Alt+M or Cmd+Opt/Alt+M)
- Prevent API calls in tests.
- Fixed bug where sign message confirmation would sometimes render blank.

## [2.9.0] - 2016-08-22
### Uncategorized
- Added ShapeShift to the transaction history
- Added affiliate key to Shapeshift requests
- Added feature to reflect current conversion rates of current vault balance.
- Modify balance display logic.

## [2.8.0] - 2016-08-15
### Uncategorized
- Integrate ShapeShift
- Add a form for Coinbase to specify amount to buy
- Fix various typos.
- Make dapp-metamask connection more reliable
- Remove Ethereum Classic from provider menu.

## [2.7.3] - 2016-07-29
### Uncategorized
- Fix bug where changing an account would not update in a live Dapp.

## [2.7.2] - 2016-07-29
### Uncategorized
- Add Ethereum Classic to provider menu
- Fix bug where host store would fail to receive updates.

## [2.7.1] - 2016-07-27
### Uncategorized
- Fix bug where web3 would sometimes not be injected in time for the application.
- Fixed bug where sometimes when opening the plugin, it would not fully open until closing and re-opening.
- Got most functionality working within Firefox (still working on review process before it can be available).
- Fixed menu dropdown bug introduced in Chrome 52.

## [2.7.0] - 2016-07-21
### Uncategorized
- Added a Warning screen about storing ETH
- Add buy Button!
- MetaMask now throws descriptive errors when apps try to use synchronous web3 methods.
- Removed firefox-specific line in manifest.

## [2.6.2] - 2016-07-20
### Uncategorized
- Fixed bug that would prevent the plugin from reopening on the first try after receiving a new transaction while locked.
- Fixed bug that would render 0 ETH as a non-exact amount.

## [2.6.1] - 2016-07-13
### Uncategorized
- Fix tool tips on Eth balance to show the 6 decimals
- Fix rendering of recipient SVG in tx approval notification.
- New vaults now generate only one wallet instead of three.
- Bumped version of web3 provider engine.
- Fixed bug where some lowercase or uppercase addresses were not being recognized as valid.
- Fixed bug where gas cost was misestimated on the tx confirmation view.

## [2.6.0] - 2016-07-11
### Uncategorized
- Fix formatting of ETH balance
- Fix formatting of account details.
- Use web3 minified dist for faster inject times
- Fix issue where dropdowns were not in front of icons.
- Update transaction approval styles.
- Align failed and successful transaction history text.
- Fix issue where large domain names and large transaction values would misalign the transaction history.
- Abbreviate ether balances on transaction details to maintain formatting.
- General code cleanup.

## [2.5.0] - 2016-06-29
### Uncategorized
- Implement new account design.
- Added a network indicator mark in dropdown menu
- Added network name next to network indicator
- Add copy transaction hash button to completed transaction list items.
- Unify wording for transaction approve/reject options on notifications and the extension.
- Fix bug where confirmation view would be shown twice.

## [2.4.5] - 2016-06-29
### Uncategorized
- Fixed bug where MetaMask interfered with PDF loading.
- Moved switch account icon into menu bar.
- Changed status shapes to be a yellow warning sign for failure and ellipsis for pending transactions.
- Now enforce 20 character limit on wallet names.
- Wallet titles are now properly truncated in transaction confirmation.
- Fix formatting on terms & conditions page.
- Now enforce 30 character limit on wallet names.
- Fix out-of-place positioning of pending transaction badges on wallet list.
- Change network status icons to reflect current design.

## [2.4.4] - 2016-06-23
### Uncategorized
- Update web3-stream-provider for batch payload bug fix

## [2.4.3] - 2016-06-23
### Uncategorized
- Remove redundant network option buttons from settings page
- Switch out font family Transat for Montserrat

## [2.4.2] - 2016-06-22
### Uncategorized
- Change out export icon for key.
- Unify copy to clipboard icon
- Fixed eth.sign behavior.
- Fix behavior of batched outbound transactions.

## [2.4.0] - 2016-06-20
### Uncategorized
- Clean up UI.
- Remove nonfunctional QR code button.
- Make network loading indicator clickable to select accessible network.
- Show more characters of addresses when space permits.
- Fixed bug when signing messages under 64 hex characters long.
- Add disclaimer view with placeholder text for first time users.

## [2.3.1] - 2016-06-09
### Uncategorized
- Style up the info page
- Cache identicon images to optimize for long lists of transactions.
- Fix out of gas errors

## [2.3.0] - 2016-06-06
### Uncategorized
- Show network status in title bar
- Added seed word recovery to config screen.
- Clicking network status indicator now reveals a provider menu.

## [2.2.0] - 2016-06-02
### Uncategorized
- Redesigned init, vault create, vault restore and seed confirmation screens.
- Added pending transactions to transaction list on account screen.
- Clicking a pending transaction takes you back to the transaction approval screen.
- Update provider-engine to fix intermittent out of gas errors.

## [2.1.0] - 2016-05-26
### Uncategorized
- Added copy address button to account list.
- Fixed back button on confirm transaction screen.
- Add indication of pending transactions to account list screen.
- Fixed bug where error warning was sometimes not cleared on view transition.
- Updated eth-lightwallet to fix a critical security issue.

## [2.0.0] - 2016-05-23
### Uncategorized
- UI Overhaul per Vlad Todirut's designs.
- Replaced identicons with jazzicons.
- Fixed glitchy transitions.
- Added support for capitalization-based address checksums.
- Send value is no longer limited by javascript number precision, and is always in ETH.
- Added ability to generate new accounts.
- Added ability to locally nickname accounts.

## [1.8.4] - 2016-05-13
### Uncategorized
- Point rpc servers to https endpoints.

## [1.8.3] - 2016-05-12
### Uncategorized
- Bumped web3 to 0.6.0
- Really fixed `eth_syncing` method response.

## [1.8.2] - 2016-05-11
### Uncategorized
- Fixed bug where send view would not load correctly the first time it was visited per account.
- Migrated all users to new scalable backend.
- Fixed `eth_syncing` method response.

## [1.8.1] - 2016-05-10
### Uncategorized
- Initial usage of scalable blockchain backend.
- Made official providers more easily configurable for us internally.

## [1.8.0] - 2016-05-10
### Uncategorized
- Add support for calls to `eth.sign`.
- Moved account exporting within subview of the account detail view.
- Added buttons to the account export process.
- Improved visual appearance of account detail transition where button heights would change.
- Restored back button to account detail view.
- Show transaction list always, never collapsed.
- Changing provider now reloads current Dapps
- Improved appearance of transaction list in account detail view.

## [1.7.0] - 2016-04-29
### Uncategorized
- Account detail view is now the primary view.
- The account detail view now has a "Change acct" button which shows the account list.
- Clicking accounts in the account list now both selects that account and displays that account's detail view.
- Selected account is now persisted between sessions, so the current account stays selected.
- Account icons are now "identicons" (deterministically generated from the address).
- Fixed link to Slack channel.
- Added a context guard for "define" to avoid UMD's exporting themselves to the wrong module system, fixing interference with some websites.
- Transaction list now only shows transactions for the current account.
- Transaction list now only shows transactions for the current network (mainnet, testnet, testrpc).
- Fixed transaction links to etherscan blockchain explorer.
- Fixed some UI transitions that had weird behavior.

## [1.6.0] - 2016-04-22
### Uncategorized
- Pending transactions are now persisted to localStorage and resume even after browser is closed.
- Completed transactions are now persisted and can be displayed via UI.
- Added transaction list to account detail view.
- Fix bug on config screen where current RPC address was always displayed wrong.
- Fixed bug where entering a decimal value when sending a transaction would result in sending the wrong amount.
- Add save button to custom RPC input field.
- Add quick-select button for RPC on `localhost:8545`.
- Improve config view styling.
- Users have been migrated from old test-net RPC to a newer test-net RPC.

## [1.5.1] - 2016-04-15
### Uncategorized
- Corrected text above account list. Selected account is visible to all sites, not just the current domain.
- Merged the UI codebase into the main plugin codebase for simpler maintenance.
- Fix Ether display rounding error. Now rendering to four decimal points.
- Fix some inpage synchronous methods
- Change account rendering to show four decimals and a leading zero.

## [1.5.0] - 2016-04-13
### Uncategorized
- Added ability to send ether.
- Fixed bugs related to using Javascript numbers, which lacked appropriate precision.
- Replaced Etherscan main-net provider with our own production RPC.

## [1.4.0] - 2016-04-08
### Uncategorized
- Removed extra entropy text field for simplified vault creation.
- Now supports exporting an account's private key.
- Unified button and input styles across the app.
- Removed some non-working placeholder UI until it works.
- Fix popup's web3 stream provider
- Temporarily deactivated fauceting indication because it would activate when restoring an empty account.

## [1.3.2] - 2016-04-04
### Uncategorized
- When unlocking, first account is auto-selected.
- When creating a first vault on the test-net, the first account is auto-funded.
- Fixed some styling issues.

## [1.0.0] - 2016-03-25
### Uncategorized
- Made seed word restoring BIP44 compatible.

## [0.14.0] - 2016-03-16
### Uncategorized
- Added the ability to restore accounts from seed words.

[Unreleased]: https://github.com/MetaMask/metamask-extension/compare/v11.10.0...HEAD
[11.10.0]: https://github.com/MetaMask/metamask-extension/compare/v11.9.5...v11.10.0
[11.9.5]: https://github.com/MetaMask/metamask-extension/compare/v11.9.4...v11.9.5
[11.9.4]: https://github.com/MetaMask/metamask-extension/compare/v11.9.3...v11.9.4
[11.9.3]: https://github.com/MetaMask/metamask-extension/compare/v11.9.2...v11.9.3
[11.9.2]: https://github.com/MetaMask/metamask-extension/compare/v11.9.1...v11.9.2
[11.9.1]: https://github.com/MetaMask/metamask-extension/compare/v11.9.0...v11.9.1
[11.9.0]: https://github.com/MetaMask/metamask-extension/compare/v11.8.0...v11.9.0
[11.8.0]: https://github.com/MetaMask/metamask-extension/compare/v11.7.5...v11.8.0
[11.7.5]: https://github.com/MetaMask/metamask-extension/compare/v11.7.4...v11.7.5
[11.7.4]: https://github.com/MetaMask/metamask-extension/compare/v11.7.3...v11.7.4
[11.7.3]: https://github.com/MetaMask/metamask-extension/compare/v11.7.2...v11.7.3
[11.7.2]: https://github.com/MetaMask/metamask-extension/compare/v11.7.1...v11.7.2
[11.7.1]: https://github.com/MetaMask/metamask-extension/compare/v11.7.0...v11.7.1
[11.7.0]: https://github.com/MetaMask/metamask-extension/compare/v11.6.3...v11.7.0
[11.6.3]: https://github.com/MetaMask/metamask-extension/compare/v11.6.2...v11.6.3
[11.6.2]: https://github.com/MetaMask/metamask-extension/compare/v11.6.1...v11.6.2
[11.6.1]: https://github.com/MetaMask/metamask-extension/compare/v11.6.0...v11.6.1
[11.6.0]: https://github.com/MetaMask/metamask-extension/compare/v11.5.2...v11.6.0
[11.5.2]: https://github.com/MetaMask/metamask-extension/compare/v11.5.1...v11.5.2
[11.5.1]: https://github.com/MetaMask/metamask-extension/compare/v11.5.0...v11.5.1
[11.5.0]: https://github.com/MetaMask/metamask-extension/compare/v11.4.1...v11.5.0
[11.4.1]: https://github.com/MetaMask/metamask-extension/compare/v11.4.0...v11.4.1
[11.4.0]: https://github.com/MetaMask/metamask-extension/compare/v11.3.0...v11.4.0
[11.3.0]: https://github.com/MetaMask/metamask-extension/compare/v11.2.0...v11.3.0
[11.2.0]: https://github.com/MetaMask/metamask-extension/compare/v11.1.2...v11.2.0
[11.1.2]: https://github.com/MetaMask/metamask-extension/compare/v11.1.1...v11.1.2
[11.1.1]: https://github.com/MetaMask/metamask-extension/compare/v11.1.0...v11.1.1
[11.1.0]: https://github.com/MetaMask/metamask-extension/compare/v11.0.0...v11.1.0
[11.0.0]: https://github.com/MetaMask/metamask-extension/compare/v10.35.1...v11.0.0
[10.35.1]: https://github.com/MetaMask/metamask-extension/compare/v10.35.0...v10.35.1
[10.35.0]: https://github.com/MetaMask/metamask-extension/compare/v10.34.5...v10.35.0
[10.34.5]: https://github.com/MetaMask/metamask-extension/compare/v10.34.4...v10.34.5
[10.34.4]: https://github.com/MetaMask/metamask-extension/compare/v10.34.3...v10.34.4
[10.34.3]: https://github.com/MetaMask/metamask-extension/compare/v10.34.2...v10.34.3
[10.34.2]: https://github.com/MetaMask/metamask-extension/compare/v10.34.1...v10.34.2
[10.34.1]: https://github.com/MetaMask/metamask-extension/compare/v10.34.0...v10.34.1
[10.34.0]: https://github.com/MetaMask/metamask-extension/compare/v10.33.1...v10.34.0
[10.33.1]: https://github.com/MetaMask/metamask-extension/compare/v10.33.0...v10.33.1
[10.33.0]: https://github.com/MetaMask/metamask-extension/compare/v10.32.0...v10.33.0
[10.32.0]: https://github.com/MetaMask/metamask-extension/compare/v10.31.1...v10.32.0
[10.31.1]: https://github.com/MetaMask/metamask-extension/compare/v10.31.0...v10.31.1
[10.31.0]: https://github.com/MetaMask/metamask-extension/compare/v10.30.4...v10.31.0
[10.30.4]: https://github.com/MetaMask/metamask-extension/compare/v10.30.3...v10.30.4
[10.30.3]: https://github.com/MetaMask/metamask-extension/compare/v10.30.2...v10.30.3
[10.30.2]: https://github.com/MetaMask/metamask-extension/compare/v10.30.1...v10.30.2
[10.30.1]: https://github.com/MetaMask/metamask-extension/compare/v10.30.0...v10.30.1
[10.30.0]: https://github.com/MetaMask/metamask-extension/compare/v10.29.0...v10.30.0
[10.29.0]: https://github.com/MetaMask/metamask-extension/compare/v10.28.3...v10.29.0
[10.28.3]: https://github.com/MetaMask/metamask-extension/compare/v10.28.2...v10.28.3
[10.28.2]: https://github.com/MetaMask/metamask-extension/compare/v10.28.1...v10.28.2
[10.28.1]: https://github.com/MetaMask/metamask-extension/compare/v10.28.0...v10.28.1
[10.28.0]: https://github.com/MetaMask/metamask-extension/compare/v10.27.0...v10.28.0
[10.27.0]: https://github.com/MetaMask/metamask-extension/compare/v10.26.2...v10.27.0
[10.26.2]: https://github.com/MetaMask/metamask-extension/compare/v10.26.1...v10.26.2
[10.26.1]: https://github.com/MetaMask/metamask-extension/compare/v10.26.0...v10.26.1
[10.26.0]: https://github.com/MetaMask/metamask-extension/compare/v10.25.0...v10.26.0
[10.25.0]: https://github.com/MetaMask/metamask-extension/compare/v10.24.2...v10.25.0
[10.24.2]: https://github.com/MetaMask/metamask-extension/compare/v10.24.1...v10.24.2
[10.24.1]: https://github.com/MetaMask/metamask-extension/compare/v10.24.0...v10.24.1
[10.24.0]: https://github.com/MetaMask/metamask-extension/compare/v10.23.3...v10.24.0
[10.23.3]: https://github.com/MetaMask/metamask-extension/compare/v10.23.2...v10.23.3
[10.23.2]: https://github.com/MetaMask/metamask-extension/compare/v10.23.1...v10.23.2
[10.23.1]: https://github.com/MetaMask/metamask-extension/compare/v10.23.0...v10.23.1
[10.23.0]: https://github.com/MetaMask/metamask-extension/compare/v10.22.3...v10.23.0
[10.22.3]: https://github.com/MetaMask/metamask-extension/compare/v10.22.2...v10.22.3
[10.22.2]: https://github.com/MetaMask/metamask-extension/compare/v10.22.1...v10.22.2
[10.22.1]: https://github.com/MetaMask/metamask-extension/compare/v10.22.0...v10.22.1
[10.22.0]: https://github.com/MetaMask/metamask-extension/compare/v10.21.2...v10.22.0
[10.21.2]: https://github.com/MetaMask/metamask-extension/compare/v10.21.1...v10.21.2
[10.21.1]: https://github.com/MetaMask/metamask-extension/compare/v10.21.0...v10.21.1
[10.21.0]: https://github.com/MetaMask/metamask-extension/compare/v10.20.0...v10.21.0
[10.20.0]: https://github.com/MetaMask/metamask-extension/compare/v10.19.0...v10.20.0
[10.19.0]: https://github.com/MetaMask/metamask-extension/compare/v10.18.4...v10.19.0
[10.18.4]: https://github.com/MetaMask/metamask-extension/compare/v10.18.3...v10.18.4
[10.18.3]: https://github.com/MetaMask/metamask-extension/compare/v10.18.2...v10.18.3
[10.18.2]: https://github.com/MetaMask/metamask-extension/compare/v10.18.1...v10.18.2
[10.18.1]: https://github.com/MetaMask/metamask-extension/compare/v10.18.0...v10.18.1
[10.18.0]: https://github.com/MetaMask/metamask-extension/compare/v10.17.0...v10.18.0
[10.17.0]: https://github.com/MetaMask/metamask-extension/compare/v10.16.2...v10.17.0
[10.16.2]: https://github.com/MetaMask/metamask-extension/compare/v10.16.1...v10.16.2
[10.16.1]: https://github.com/MetaMask/metamask-extension/compare/v10.16.0...v10.16.1
[10.16.0]: https://github.com/MetaMask/metamask-extension/compare/v10.15.1...v10.16.0
[10.15.1]: https://github.com/MetaMask/metamask-extension/compare/v10.15.0...v10.15.1
[10.15.0]: https://github.com/MetaMask/metamask-extension/compare/v10.14.7...v10.15.0
[10.14.7]: https://github.com/MetaMask/metamask-extension/compare/v10.14.6...v10.14.7
[10.14.6]: https://github.com/MetaMask/metamask-extension/compare/v10.14.5...v10.14.6
[10.14.5]: https://github.com/MetaMask/metamask-extension/compare/v10.14.4...v10.14.5
[10.14.4]: https://github.com/MetaMask/metamask-extension/compare/v10.14.3...v10.14.4
[10.14.3]: https://github.com/MetaMask/metamask-extension/compare/v10.14.2...v10.14.3
[10.14.2]: https://github.com/MetaMask/metamask-extension/compare/v10.14.1...v10.14.2
[10.14.1]: https://github.com/MetaMask/metamask-extension/compare/v10.14.0...v10.14.1
[10.14.0]: https://github.com/MetaMask/metamask-extension/compare/v10.13.0...v10.14.0
[10.13.0]: https://github.com/MetaMask/metamask-extension/compare/v10.12.4...v10.13.0
[10.12.4]: https://github.com/MetaMask/metamask-extension/compare/v10.12.3...v10.12.4
[10.12.3]: https://github.com/MetaMask/metamask-extension/compare/v10.12.2...v10.12.3
[10.12.2]: https://github.com/MetaMask/metamask-extension/compare/v10.12.1...v10.12.2
[10.12.1]: https://github.com/MetaMask/metamask-extension/compare/v10.12.0...v10.12.1
[10.12.0]: https://github.com/MetaMask/metamask-extension/compare/v10.11.4...v10.12.0
[10.11.4]: https://github.com/MetaMask/metamask-extension/compare/v10.11.3...v10.11.4
[10.11.3]: https://github.com/MetaMask/metamask-extension/compare/v10.11.2...v10.11.3
[10.11.2]: https://github.com/MetaMask/metamask-extension/compare/v10.11.1...v10.11.2
[10.11.1]: https://github.com/MetaMask/metamask-extension/compare/v10.11.0...v10.11.1
[10.11.0]: https://github.com/MetaMask/metamask-extension/compare/v10.10.2...v10.11.0
[10.10.2]: https://github.com/MetaMask/metamask-extension/compare/v10.10.1...v10.10.2
[10.10.1]: https://github.com/MetaMask/metamask-extension/compare/v10.10.0...v10.10.1
[10.10.0]: https://github.com/MetaMask/metamask-extension/compare/v10.9.3...v10.10.0
[10.9.3]: https://github.com/MetaMask/metamask-extension/compare/v10.9.2...v10.9.3
[10.9.2]: https://github.com/MetaMask/metamask-extension/compare/v10.9.1...v10.9.2
[10.9.1]: https://github.com/MetaMask/metamask-extension/compare/v10.9.0...v10.9.1
[10.9.0]: https://github.com/MetaMask/metamask-extension/compare/v10.8.2...v10.9.0
[10.8.2]: https://github.com/MetaMask/metamask-extension/compare/v10.8.1...v10.8.2
[10.8.1]: https://github.com/MetaMask/metamask-extension/compare/v10.8.0...v10.8.1
[10.8.0]: https://github.com/MetaMask/metamask-extension/compare/v10.7.1...v10.8.0
[10.7.1]: https://github.com/MetaMask/metamask-extension/compare/v10.7.0...v10.7.1
[10.7.0]: https://github.com/MetaMask/metamask-extension/compare/v10.6.4...v10.7.0
[10.6.4]: https://github.com/MetaMask/metamask-extension/compare/v10.6.3...v10.6.4
[10.6.3]: https://github.com/MetaMask/metamask-extension/compare/v10.6.2...v10.6.3
[10.6.2]: https://github.com/MetaMask/metamask-extension/compare/v10.6.1...v10.6.2
[10.6.1]: https://github.com/MetaMask/metamask-extension/compare/v10.6.0...v10.6.1
[10.6.0]: https://github.com/MetaMask/metamask-extension/compare/v10.5.2...v10.6.0
[10.5.2]: https://github.com/MetaMask/metamask-extension/compare/v10.5.1...v10.5.2
[10.5.1]: https://github.com/MetaMask/metamask-extension/compare/v10.5.0...v10.5.1
[10.5.0]: https://github.com/MetaMask/metamask-extension/compare/v10.4.1...v10.5.0
[10.4.1]: https://github.com/MetaMask/metamask-extension/compare/v10.4.0...v10.4.1
[10.4.0]: https://github.com/MetaMask/metamask-extension/compare/v10.3.0...v10.4.0
[10.3.0]: https://github.com/MetaMask/metamask-extension/compare/v10.2.2...v10.3.0
[10.2.2]: https://github.com/MetaMask/metamask-extension/compare/v10.2.1...v10.2.2
[10.2.1]: https://github.com/MetaMask/metamask-extension/compare/v10.2.0...v10.2.1
[10.2.0]: https://github.com/MetaMask/metamask-extension/compare/v10.1.1...v10.2.0
[10.1.1]: https://github.com/MetaMask/metamask-extension/compare/v10.1.0...v10.1.1
[10.1.0]: https://github.com/MetaMask/metamask-extension/compare/v10.0.3...v10.1.0
[10.0.3]: https://github.com/MetaMask/metamask-extension/compare/v10.0.2...v10.0.3
[10.0.2]: https://github.com/MetaMask/metamask-extension/compare/v10.0.1...v10.0.2
[10.0.1]: https://github.com/MetaMask/metamask-extension/compare/v10.0.0...v10.0.1
[10.0.0]: https://github.com/MetaMask/metamask-extension/compare/v9.8.4...v10.0.0
[9.8.4]: https://github.com/MetaMask/metamask-extension/compare/v9.8.3...v9.8.4
[9.8.3]: https://github.com/MetaMask/metamask-extension/compare/v9.8.2...v9.8.3
[9.8.2]: https://github.com/MetaMask/metamask-extension/compare/v9.8.1...v9.8.2
[9.8.1]: https://github.com/MetaMask/metamask-extension/compare/v9.8.0...v9.8.1
[9.8.0]: https://github.com/MetaMask/metamask-extension/compare/v9.7.1...v9.8.0
[9.7.1]: https://github.com/MetaMask/metamask-extension/compare/v9.7.0...v9.7.1
[9.7.0]: https://github.com/MetaMask/metamask-extension/compare/v9.6.1...v9.7.0
[9.6.1]: https://github.com/MetaMask/metamask-extension/compare/v9.6.0...v9.6.1
[9.6.0]: https://github.com/MetaMask/metamask-extension/compare/v9.5.9...v9.6.0
[9.5.9]: https://github.com/MetaMask/metamask-extension/compare/v9.5.8...v9.5.9
[9.5.8]: https://github.com/MetaMask/metamask-extension/compare/v9.5.7...v9.5.8
[9.5.7]: https://github.com/MetaMask/metamask-extension/compare/v9.5.6...v9.5.7
[9.5.6]: https://github.com/MetaMask/metamask-extension/compare/v9.5.5...v9.5.6
[9.5.5]: https://github.com/MetaMask/metamask-extension/compare/v9.5.4...v9.5.5
[9.5.4]: https://github.com/MetaMask/metamask-extension/compare/v9.5.3...v9.5.4
[9.5.3]: https://github.com/MetaMask/metamask-extension/compare/v9.5.2...v9.5.3
[9.5.2]: https://github.com/MetaMask/metamask-extension/compare/v9.5.1...v9.5.2
[9.5.1]: https://github.com/MetaMask/metamask-extension/compare/v9.5.0...v9.5.1
[9.5.0]: https://github.com/MetaMask/metamask-extension/compare/v9.4.0...v9.5.0
[9.4.0]: https://github.com/MetaMask/metamask-extension/compare/v9.3.0...v9.4.0
[9.3.0]: https://github.com/MetaMask/metamask-extension/compare/v9.2.1...v9.3.0
[9.2.1]: https://github.com/MetaMask/metamask-extension/compare/v9.2.0...v9.2.1
[9.2.0]: https://github.com/MetaMask/metamask-extension/compare/v9.1.1...v9.2.0
[9.1.1]: https://github.com/MetaMask/metamask-extension/compare/v9.1.0...v9.1.1
[9.1.0]: https://github.com/MetaMask/metamask-extension/compare/v9.0.5...v9.1.0
[9.0.5]: https://github.com/MetaMask/metamask-extension/compare/v9.0.4...v9.0.5
[9.0.4]: https://github.com/MetaMask/metamask-extension/compare/v9.0.3...v9.0.4
[9.0.3]: https://github.com/MetaMask/metamask-extension/compare/v9.0.2...v9.0.3
[9.0.2]: https://github.com/MetaMask/metamask-extension/compare/v9.0.1...v9.0.2
[9.0.1]: https://github.com/MetaMask/metamask-extension/compare/v9.0.0...v9.0.1
[9.0.0]: https://github.com/MetaMask/metamask-extension/compare/v8.1.11...v9.0.0
[8.1.11]: https://github.com/MetaMask/metamask-extension/compare/v8.1.10...v8.1.11
[8.1.10]: https://github.com/MetaMask/metamask-extension/compare/v8.1.9...v8.1.10
[8.1.9]: https://github.com/MetaMask/metamask-extension/compare/v8.1.8...v8.1.9
[8.1.8]: https://github.com/MetaMask/metamask-extension/compare/v8.1.7...v8.1.8
[8.1.7]: https://github.com/MetaMask/metamask-extension/compare/v8.1.6...v8.1.7
[8.1.6]: https://github.com/MetaMask/metamask-extension/compare/v8.1.5...v8.1.6
[8.1.5]: https://github.com/MetaMask/metamask-extension/compare/v8.1.4...v8.1.5
[8.1.4]: https://github.com/MetaMask/metamask-extension/compare/v8.1.3...v8.1.4
[8.1.3]: https://github.com/MetaMask/metamask-extension/compare/v8.1.2...v8.1.3
[8.1.2]: https://github.com/MetaMask/metamask-extension/compare/v8.1.1...v8.1.2
[8.1.1]: https://github.com/MetaMask/metamask-extension/compare/v8.1.0...v8.1.1
[8.1.0]: https://github.com/MetaMask/metamask-extension/compare/v8.0.10...v8.1.0
[8.0.10]: https://github.com/MetaMask/metamask-extension/compare/v8.0.9...v8.0.10
[8.0.9]: https://github.com/MetaMask/metamask-extension/compare/v8.0.8...v8.0.9
[8.0.8]: https://github.com/MetaMask/metamask-extension/compare/v8.0.7...v8.0.8
[8.0.7]: https://github.com/MetaMask/metamask-extension/compare/v8.0.6...v8.0.7
[8.0.6]: https://github.com/MetaMask/metamask-extension/compare/v8.0.5...v8.0.6
[8.0.5]: https://github.com/MetaMask/metamask-extension/compare/v8.0.4...v8.0.5
[8.0.4]: https://github.com/MetaMask/metamask-extension/compare/v8.0.3...v8.0.4
[8.0.3]: https://github.com/MetaMask/metamask-extension/compare/v8.0.2...v8.0.3
[8.0.2]: https://github.com/MetaMask/metamask-extension/compare/v8.0.1...v8.0.2
[8.0.1]: https://github.com/MetaMask/metamask-extension/compare/v8.0.0...v8.0.1
[8.0.0]: https://github.com/MetaMask/metamask-extension/compare/v7.7.9...v8.0.0
[7.7.9]: https://github.com/MetaMask/metamask-extension/compare/v7.7.8...v7.7.9
[7.7.8]: https://github.com/MetaMask/metamask-extension/compare/v7.7.7...v7.7.8
[7.7.7]: https://github.com/MetaMask/metamask-extension/compare/v7.7.6...v7.7.7
[7.7.6]: https://github.com/MetaMask/metamask-extension/compare/v7.7.5...v7.7.6
[7.7.5]: https://github.com/MetaMask/metamask-extension/compare/v7.7.4...v7.7.5
[7.7.4]: https://github.com/MetaMask/metamask-extension/compare/v7.7.3...v7.7.4
[7.7.3]: https://github.com/MetaMask/metamask-extension/compare/v7.7.2...v7.7.3
[7.7.2]: https://github.com/MetaMask/metamask-extension/compare/v7.7.1...v7.7.2
[7.7.1]: https://github.com/MetaMask/metamask-extension/compare/v7.7.0...v7.7.1
[7.7.0]: https://github.com/MetaMask/metamask-extension/compare/v7.6.1...v7.7.0
[7.6.1]: https://github.com/MetaMask/metamask-extension/compare/v7.6.0...v7.6.1
[7.6.0]: https://github.com/MetaMask/metamask-extension/compare/v7.5.3...v7.6.0
[7.5.3]: https://github.com/MetaMask/metamask-extension/compare/v7.5.2...v7.5.3
[7.5.2]: https://github.com/MetaMask/metamask-extension/compare/v7.5.1...v7.5.2
[7.5.1]: https://github.com/MetaMask/metamask-extension/compare/v7.5.0...v7.5.1
[7.5.0]: https://github.com/MetaMask/metamask-extension/compare/v7.4.0...v7.5.0
[7.4.0]: https://github.com/MetaMask/metamask-extension/compare/v7.3.1...v7.4.0
[7.3.1]: https://github.com/MetaMask/metamask-extension/compare/v7.3.0...v7.3.1
[7.3.0]: https://github.com/MetaMask/metamask-extension/compare/v7.2.3...v7.3.0
[7.2.3]: https://github.com/MetaMask/metamask-extension/compare/v7.2.2...v7.2.3
[7.2.2]: https://github.com/MetaMask/metamask-extension/compare/v7.2.1...v7.2.2
[7.2.1]: https://github.com/MetaMask/metamask-extension/compare/v7.2.0...v7.2.1
[7.2.0]: https://github.com/MetaMask/metamask-extension/compare/v7.1.1...v7.2.0
[7.1.1]: https://github.com/MetaMask/metamask-extension/compare/v7.1.0...v7.1.1
[7.1.0]: https://github.com/MetaMask/metamask-extension/compare/v7.0.1...v7.1.0
[7.0.1]: https://github.com/MetaMask/metamask-extension/compare/v7.0.0...v7.0.1
[7.0.0]: https://github.com/MetaMask/metamask-extension/compare/v6.7.3...v7.0.0
[6.7.3]: https://github.com/MetaMask/metamask-extension/compare/v6.7.2...v6.7.3
[6.7.2]: https://github.com/MetaMask/metamask-extension/compare/v6.7.1...v6.7.2
[6.7.1]: https://github.com/MetaMask/metamask-extension/compare/v6.7.0...v6.7.1
[6.7.0]: https://github.com/MetaMask/metamask-extension/compare/v6.6.2...v6.7.0
[6.6.2]: https://github.com/MetaMask/metamask-extension/compare/v6.6.1...v6.6.2
[6.6.1]: https://github.com/MetaMask/metamask-extension/compare/v6.6.0...v6.6.1
[6.6.0]: https://github.com/MetaMask/metamask-extension/compare/v6.5.3...v6.6.0
[6.5.3]: https://github.com/MetaMask/metamask-extension/compare/v6.5.2...v6.5.3
[6.5.2]: https://github.com/MetaMask/metamask-extension/compare/v6.5.1...v6.5.2
[6.5.1]: https://github.com/MetaMask/metamask-extension/compare/v6.5.0...v6.5.1
[6.5.0]: https://github.com/MetaMask/metamask-extension/compare/v6.4.1...v6.5.0
[6.4.1]: https://github.com/MetaMask/metamask-extension/compare/v6.4.0...v6.4.1
[6.4.0]: https://github.com/MetaMask/metamask-extension/compare/v6.3.2...v6.4.0
[6.3.2]: https://github.com/MetaMask/metamask-extension/compare/v6.3.1...v6.3.2
[6.3.1]: https://github.com/MetaMask/metamask-extension/compare/v6.3.0...v6.3.1
[6.3.0]: https://github.com/MetaMask/metamask-extension/compare/v6.2.2...v6.3.0
[6.2.2]: https://github.com/MetaMask/metamask-extension/compare/v6.2.1...v6.2.2
[6.2.1]: https://github.com/MetaMask/metamask-extension/compare/v6.2.0...v6.2.1
[6.2.0]: https://github.com/MetaMask/metamask-extension/compare/v6.1.0...v6.2.0
[6.1.0]: https://github.com/MetaMask/metamask-extension/compare/v6.0.1...v6.1.0
[6.0.1]: https://github.com/MetaMask/metamask-extension/compare/v6.0.0...v6.0.1
[6.0.0]: https://github.com/MetaMask/metamask-extension/compare/v5.3.5...v6.0.0
[5.3.5]: https://github.com/MetaMask/metamask-extension/compare/v5.3.4...v5.3.5
[5.3.4]: https://github.com/MetaMask/metamask-extension/compare/v5.3.3...v5.3.4
[5.3.3]: https://github.com/MetaMask/metamask-extension/compare/v5.3.2...v5.3.3
[5.3.2]: https://github.com/MetaMask/metamask-extension/compare/v5.3.1...v5.3.2
[5.3.1]: https://github.com/MetaMask/metamask-extension/compare/v5.3.0...v5.3.1
[5.3.0]: https://github.com/MetaMask/metamask-extension/compare/v5.2.2...v5.3.0
[5.2.2]: https://github.com/MetaMask/metamask-extension/compare/v5.2.1...v5.2.2
[5.2.1]: https://github.com/MetaMask/metamask-extension/compare/v5.2.0...v5.2.1
[5.2.0]: https://github.com/MetaMask/metamask-extension/compare/v5.1.0...v5.2.0
[5.1.0]: https://github.com/MetaMask/metamask-extension/compare/v5.0.4...v5.1.0
[5.0.4]: https://github.com/MetaMask/metamask-extension/compare/v5.0.3...v5.0.4
[5.0.3]: https://github.com/MetaMask/metamask-extension/compare/v5.0.2...v5.0.3
[5.0.2]: https://github.com/MetaMask/metamask-extension/compare/v5.0.1...v5.0.2
[5.0.1]: https://github.com/MetaMask/metamask-extension/compare/v5.0.0...v5.0.1
[5.0.0]: https://github.com/MetaMask/metamask-extension/compare/v4.17.1...v5.0.0
[4.17.1]: https://github.com/MetaMask/metamask-extension/compare/v4.17.0...v4.17.1
[4.17.0]: https://github.com/MetaMask/metamask-extension/compare/v4.16.0...v4.17.0
[4.16.0]: https://github.com/MetaMask/metamask-extension/compare/v4.15.0...v4.16.0
[4.15.0]: https://github.com/MetaMask/metamask-extension/compare/v4.14.0...v4.15.0
[4.14.0]: https://github.com/MetaMask/metamask-extension/compare/v4.13.0...v4.14.0
[4.13.0]: https://github.com/MetaMask/metamask-extension/compare/v4.12.0...v4.13.0
[4.12.0]: https://github.com/MetaMask/metamask-extension/compare/v4.11.1...v4.12.0
[4.11.1]: https://github.com/MetaMask/metamask-extension/compare/v4.11.0...v4.11.1
[4.11.0]: https://github.com/MetaMask/metamask-extension/compare/v4.10.0...v4.11.0
[4.10.0]: https://github.com/MetaMask/metamask-extension/compare/v4.9.3...v4.10.0
[4.9.3]: https://github.com/MetaMask/metamask-extension/compare/v4.9.2...v4.9.3
[4.9.2]: https://github.com/MetaMask/metamask-extension/compare/v4.9.1...v4.9.2
[4.9.1]: https://github.com/MetaMask/metamask-extension/compare/v4.9.0...v4.9.1
[4.9.0]: https://github.com/MetaMask/metamask-extension/compare/v4.8.0...v4.9.0
[4.8.0]: https://github.com/MetaMask/metamask-extension/compare/v4.7.4...v4.8.0
[4.7.4]: https://github.com/MetaMask/metamask-extension/compare/v4.7.3...v4.7.4
[4.7.3]: https://github.com/MetaMask/metamask-extension/compare/v4.7.2...v4.7.3
[4.7.2]: https://github.com/MetaMask/metamask-extension/compare/v4.7.1...v4.7.2
[4.7.1]: https://github.com/MetaMask/metamask-extension/compare/v4.7.0...v4.7.1
[4.7.0]: https://github.com/MetaMask/metamask-extension/compare/v4.6.1...v4.7.0
[4.6.1]: https://github.com/MetaMask/metamask-extension/compare/v4.6.0...v4.6.1
[4.6.0]: https://github.com/MetaMask/metamask-extension/compare/v4.5.5...v4.6.0
[4.5.5]: https://github.com/MetaMask/metamask-extension/compare/v4.5.4...v4.5.5
[4.5.4]: https://github.com/MetaMask/metamask-extension/compare/v4.5.3...v4.5.4
[4.5.3]: https://github.com/MetaMask/metamask-extension/compare/v4.5.2...v4.5.3
[4.5.2]: https://github.com/MetaMask/metamask-extension/compare/v4.5.1...v4.5.2
[4.5.1]: https://github.com/MetaMask/metamask-extension/compare/v4.5.0...v4.5.1
[4.5.0]: https://github.com/MetaMask/metamask-extension/compare/v4.4.0...v4.5.0
[4.4.0]: https://github.com/MetaMask/metamask-extension/compare/v4.3.0...v4.4.0
[4.3.0]: https://github.com/MetaMask/metamask-extension/compare/v4.2.0...v4.3.0
[4.2.0]: https://github.com/MetaMask/metamask-extension/compare/v4.1.3...v4.2.0
[4.1.3]: https://github.com/MetaMask/metamask-extension/compare/v4.1.2...v4.1.3
[4.1.2]: https://github.com/MetaMask/metamask-extension/compare/v4.1.1...v4.1.2
[4.1.1]: https://github.com/MetaMask/metamask-extension/compare/v4.1.0...v4.1.1
[4.1.0]: https://github.com/MetaMask/metamask-extension/compare/v4.0.0...v4.1.0
[4.0.0]: https://github.com/MetaMask/metamask-extension/compare/v3.14.2...v4.0.0
[3.14.2]: https://github.com/MetaMask/metamask-extension/compare/v3.14.1...v3.14.2
[3.14.1]: https://github.com/MetaMask/metamask-extension/compare/v3.14.0...v3.14.1
[3.14.0]: https://github.com/MetaMask/metamask-extension/compare/v3.13.8...v3.14.0
[3.13.8]: https://github.com/MetaMask/metamask-extension/compare/v3.13.7...v3.13.8
[3.13.7]: https://github.com/MetaMask/metamask-extension/compare/v3.13.6...v3.13.7
[3.13.6]: https://github.com/MetaMask/metamask-extension/compare/v3.13.5...v3.13.6
[3.13.5]: https://github.com/MetaMask/metamask-extension/compare/v3.13.4...v3.13.5
[3.13.4]: https://github.com/MetaMask/metamask-extension/compare/v3.13.3...v3.13.4
[3.13.3]: https://github.com/MetaMask/metamask-extension/compare/v3.13.2...v3.13.3
[3.13.2]: https://github.com/MetaMask/metamask-extension/compare/v3.13.1...v3.13.2
[3.13.1]: https://github.com/MetaMask/metamask-extension/compare/v3.13.0...v3.13.1
[3.13.0]: https://github.com/MetaMask/metamask-extension/compare/v3.12.1...v3.13.0
[3.12.1]: https://github.com/MetaMask/metamask-extension/compare/v3.12.0...v3.12.1
[3.12.0]: https://github.com/MetaMask/metamask-extension/compare/v3.11.2...v3.12.0
[3.11.2]: https://github.com/MetaMask/metamask-extension/compare/v3.11.1...v3.11.2
[3.11.1]: https://github.com/MetaMask/metamask-extension/compare/v3.11.0...v3.11.1
[3.11.0]: https://github.com/MetaMask/metamask-extension/compare/v3.10.9...v3.11.0
[3.10.9]: https://github.com/MetaMask/metamask-extension/compare/v3.10.8...v3.10.9
[3.10.8]: https://github.com/MetaMask/metamask-extension/compare/v3.10.7...v3.10.8
[3.10.7]: https://github.com/MetaMask/metamask-extension/compare/v3.10.6...v3.10.7
[3.10.6]: https://github.com/MetaMask/metamask-extension/compare/v3.10.5...v3.10.6
[3.10.5]: https://github.com/MetaMask/metamask-extension/compare/v3.10.4...v3.10.5
[3.10.4]: https://github.com/MetaMask/metamask-extension/compare/v3.10.3...v3.10.4
[3.10.3]: https://github.com/MetaMask/metamask-extension/compare/v3.10.2...v3.10.3
[3.10.2]: https://github.com/MetaMask/metamask-extension/compare/v3.10.1...v3.10.2
[3.10.1]: https://github.com/MetaMask/metamask-extension/compare/v3.10.0...v3.10.1
[3.10.0]: https://github.com/MetaMask/metamask-extension/compare/v3.9.13...v3.10.0
[3.9.13]: https://github.com/MetaMask/metamask-extension/compare/v3.9.12...v3.9.13
[3.9.12]: https://github.com/MetaMask/metamask-extension/compare/v3.9.11...v3.9.12
[3.9.11]: https://github.com/MetaMask/metamask-extension/compare/v3.9.10...v3.9.11
[3.9.10]: https://github.com/MetaMask/metamask-extension/compare/v3.9.9...v3.9.10
[3.9.9]: https://github.com/MetaMask/metamask-extension/compare/v3.9.8...v3.9.9
[3.9.8]: https://github.com/MetaMask/metamask-extension/compare/v3.9.7...v3.9.8
[3.9.7]: https://github.com/MetaMask/metamask-extension/compare/v3.9.6...v3.9.7
[3.9.6]: https://github.com/MetaMask/metamask-extension/compare/v3.9.5...v3.9.6
[3.9.5]: https://github.com/MetaMask/metamask-extension/compare/v3.9.4...v3.9.5
[3.9.4]: https://github.com/MetaMask/metamask-extension/compare/v3.9.3...v3.9.4
[3.9.3]: https://github.com/MetaMask/metamask-extension/compare/v3.9.2...v3.9.3
[3.9.2]: https://github.com/MetaMask/metamask-extension/compare/v3.9.1...v3.9.2
[3.9.1]: https://github.com/MetaMask/metamask-extension/compare/v3.9.0...v3.9.1
[3.9.0]: https://github.com/MetaMask/metamask-extension/compare/v3.8.6...v3.9.0
[3.8.6]: https://github.com/MetaMask/metamask-extension/compare/v3.8.5...v3.8.6
[3.8.5]: https://github.com/MetaMask/metamask-extension/compare/v3.8.4...v3.8.5
[3.8.4]: https://github.com/MetaMask/metamask-extension/compare/v3.8.3...v3.8.4
[3.8.3]: https://github.com/MetaMask/metamask-extension/compare/v3.8.2...v3.8.3
[3.8.2]: https://github.com/MetaMask/metamask-extension/compare/v3.8.1...v3.8.2
[3.8.1]: https://github.com/MetaMask/metamask-extension/compare/v3.8.0...v3.8.1
[3.8.0]: https://github.com/MetaMask/metamask-extension/compare/v3.7.8...v3.8.0
[3.7.8]: https://github.com/MetaMask/metamask-extension/compare/v3.7.7...v3.7.8
[3.7.7]: https://github.com/MetaMask/metamask-extension/compare/v3.7.6...v3.7.7
[3.7.6]: https://github.com/MetaMask/metamask-extension/compare/v3.7.5...v3.7.6
[3.7.5]: https://github.com/MetaMask/metamask-extension/compare/v3.7.4...v3.7.5
[3.7.4]: https://github.com/MetaMask/metamask-extension/compare/v3.7.3...v3.7.4
[3.7.3]: https://github.com/MetaMask/metamask-extension/compare/v3.7.2...v3.7.3
[3.7.2]: https://github.com/MetaMask/metamask-extension/compare/v3.7.0...v3.7.2
[3.7.0]: https://github.com/MetaMask/metamask-extension/compare/v3.6.5...v3.7.0
[3.6.5]: https://github.com/MetaMask/metamask-extension/compare/v3.6.4...v3.6.5
[3.6.4]: https://github.com/MetaMask/metamask-extension/compare/v3.6.3...v3.6.4
[3.6.3]: https://github.com/MetaMask/metamask-extension/compare/v3.6.2...v3.6.3
[3.6.2]: https://github.com/MetaMask/metamask-extension/compare/v3.6.1...v3.6.2
[3.6.1]: https://github.com/MetaMask/metamask-extension/compare/v3.6.0...v3.6.1
[3.6.0]: https://github.com/MetaMask/metamask-extension/compare/v3.5.4...v3.6.0
[3.5.4]: https://github.com/MetaMask/metamask-extension/compare/v3.5.3...v3.5.4
[3.5.3]: https://github.com/MetaMask/metamask-extension/compare/v3.5.2...v3.5.3
[3.5.2]: https://github.com/MetaMask/metamask-extension/compare/v3.5.1...v3.5.2
[3.5.1]: https://github.com/MetaMask/metamask-extension/compare/v3.5.0...v3.5.1
[3.5.0]: https://github.com/MetaMask/metamask-extension/compare/v3.4.0...v3.5.0
[3.4.0]: https://github.com/MetaMask/metamask-extension/compare/v3.3.0...v3.4.0
[3.3.0]: https://github.com/MetaMask/metamask-extension/compare/v3.2.2...v3.3.0
[3.2.2]: https://github.com/MetaMask/metamask-extension/compare/v3.2.1...v3.2.2
[3.2.1]: https://github.com/MetaMask/metamask-extension/compare/v3.2.0...v3.2.1
[3.2.0]: https://github.com/MetaMask/metamask-extension/compare/v3.1.2...v3.2.0
[3.1.2]: https://github.com/MetaMask/metamask-extension/compare/v3.1.1...v3.1.2
[3.1.1]: https://github.com/MetaMask/metamask-extension/compare/v3.1.0...v3.1.1
[3.1.0]: https://github.com/MetaMask/metamask-extension/compare/v3.0.1...v3.1.0
[3.0.1]: https://github.com/MetaMask/metamask-extension/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/MetaMask/metamask-extension/compare/v2.14.1...v3.0.0
[2.14.1]: https://github.com/MetaMask/metamask-extension/compare/v2.14.0...v2.14.1
[2.14.0]: https://github.com/MetaMask/metamask-extension/compare/v2.13.11...v2.14.0
[2.13.11]: https://github.com/MetaMask/metamask-extension/compare/v2.13.10...v2.13.11
[2.13.10]: https://github.com/MetaMask/metamask-extension/compare/v2.13.9...v2.13.10
[2.13.9]: https://github.com/MetaMask/metamask-extension/compare/v2.13.8...v2.13.9
[2.13.8]: https://github.com/MetaMask/metamask-extension/compare/v2.13.7...v2.13.8
[2.13.7]: https://github.com/MetaMask/metamask-extension/compare/v2.13.6...v2.13.7
[2.13.6]: https://github.com/MetaMask/metamask-extension/compare/v2.13.5...v2.13.6
[2.13.5]: https://github.com/MetaMask/metamask-extension/compare/v2.13.4...v2.13.5
[2.13.4]: https://github.com/MetaMask/metamask-extension/compare/v2.13.3...v2.13.4
[2.13.3]: https://github.com/MetaMask/metamask-extension/compare/v2.13.2...v2.13.3
[2.13.2]: https://github.com/MetaMask/metamask-extension/compare/v2.13.1...v2.13.2
[2.13.1]: https://github.com/MetaMask/metamask-extension/compare/v2.13.0...v2.13.1
[2.13.0]: https://github.com/MetaMask/metamask-extension/compare/v2.12.1...v2.13.0
[2.12.1]: https://github.com/MetaMask/metamask-extension/compare/v2.12.0...v2.12.1
[2.12.0]: https://github.com/MetaMask/metamask-extension/compare/v2.11.1...v2.12.0
[2.11.1]: https://github.com/MetaMask/metamask-extension/compare/v2.11.0...v2.11.1
[2.11.0]: https://github.com/MetaMask/metamask-extension/compare/v2.10.2...v2.11.0
[2.10.2]: https://github.com/MetaMask/metamask-extension/compare/v2.10.1...v2.10.2
[2.10.1]: https://github.com/MetaMask/metamask-extension/compare/v2.10.0...v2.10.1
[2.10.0]: https://github.com/MetaMask/metamask-extension/compare/v2.9.2...v2.10.0
[2.9.2]: https://github.com/MetaMask/metamask-extension/compare/v2.9.1...v2.9.2
[2.9.1]: https://github.com/MetaMask/metamask-extension/compare/v2.9.0...v2.9.1
[2.9.0]: https://github.com/MetaMask/metamask-extension/compare/v2.8.0...v2.9.0
[2.8.0]: https://github.com/MetaMask/metamask-extension/compare/v2.7.3...v2.8.0
[2.7.3]: https://github.com/MetaMask/metamask-extension/compare/v2.7.2...v2.7.3
[2.7.2]: https://github.com/MetaMask/metamask-extension/compare/v2.7.1...v2.7.2
[2.7.1]: https://github.com/MetaMask/metamask-extension/compare/v2.7.0...v2.7.1
[2.7.0]: https://github.com/MetaMask/metamask-extension/compare/v2.6.2...v2.7.0
[2.6.2]: https://github.com/MetaMask/metamask-extension/compare/v2.6.1...v2.6.2
[2.6.1]: https://github.com/MetaMask/metamask-extension/compare/v2.6.0...v2.6.1
[2.6.0]: https://github.com/MetaMask/metamask-extension/compare/v2.5.0...v2.6.0
[2.5.0]: https://github.com/MetaMask/metamask-extension/compare/v2.4.5...v2.5.0
[2.4.5]: https://github.com/MetaMask/metamask-extension/compare/v2.4.4...v2.4.5
[2.4.4]: https://github.com/MetaMask/metamask-extension/compare/v2.4.3...v2.4.4
[2.4.3]: https://github.com/MetaMask/metamask-extension/compare/v2.4.2...v2.4.3
[2.4.2]: https://github.com/MetaMask/metamask-extension/compare/v2.4.0...v2.4.2
[2.4.0]: https://github.com/MetaMask/metamask-extension/compare/v2.3.1...v2.4.0
[2.3.1]: https://github.com/MetaMask/metamask-extension/compare/v2.3.0...v2.3.1
[2.3.0]: https://github.com/MetaMask/metamask-extension/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/MetaMask/metamask-extension/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/MetaMask/metamask-extension/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/MetaMask/metamask-extension/compare/v1.8.4...v2.0.0
[1.8.4]: https://github.com/MetaMask/metamask-extension/compare/v1.8.3...v1.8.4
[1.8.3]: https://github.com/MetaMask/metamask-extension/compare/v1.8.2...v1.8.3
[1.8.2]: https://github.com/MetaMask/metamask-extension/compare/v1.8.1...v1.8.2
[1.8.1]: https://github.com/MetaMask/metamask-extension/compare/v1.8.0...v1.8.1
[1.8.0]: https://github.com/MetaMask/metamask-extension/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/MetaMask/metamask-extension/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/MetaMask/metamask-extension/compare/v1.5.1...v1.6.0
[1.5.1]: https://github.com/MetaMask/metamask-extension/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/MetaMask/metamask-extension/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/MetaMask/metamask-extension/compare/v1.3.2...v1.4.0
[1.3.2]: https://github.com/MetaMask/metamask-extension/compare/v1.0.0...v1.3.2
[1.0.0]: https://github.com/MetaMask/metamask-extension/compare/v0.14.0...v1.0.0
[0.14.0]: https://github.com/MetaMask/metamask-extension/releases/tag/v0.14.0

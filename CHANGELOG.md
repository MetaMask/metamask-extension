# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [13.7.0]

### Added

- Fix Transaction Shield membership banner on light mode (#37162)
- Cached last used subscription payment method (& token), so that user won't need to re-select on navigations. (#37144)
- Return tx hashes asap from the submitBatch hook (#37113)
- Show wallet name in bridge quote recipient field (#37083)
- Adds Billing Start Date in shield-subscription confirmation screen. (#37103)
- Handle crypto approval in shield settings update payment method (#37057)
- Update shield-controller to `v0.4.0`. (#37071)
- Use SSE to stream swap quotes (#36481)
- Adds network and native token logos for Injective network. (#36923)
- Add `auxiliaryFunds` + `requiredAssets` support defined under [ERC-7682](https://eips.ethereum.org/EIPS/eip-7682) (#36061)
- Add bitcoin ff to main build (#36940)
- Improves user experience in permission confirmation dialogs. (#36490)
- Adapted the payload of request `signRewardsMessage` for improved performance (#36921)
  (https://github.com/MetaMask/snap-solana-wallet/pull/554)
  Improved speed when looking up the state for accounts
  by id (https://github.com/MetaMask/snap-solana-wallet/pull/550)
  Fixed a serialization issue causing the snap to try
  rendering bigints
  (https://github.com/MetaMask/snap-solana-wallet/pull/551)
  Fixed incorrect token icon URL building
  (https://github.com/MetaMask/snap-solana-wallet/pull/548)
  Fixed the send flow to support token account recipients
  (https://github.com/MetaMask/snap-solana-wallet/pull/547)
- Enables watch only accounts on experimental builds (#37051)

### Fixed

- Toast avatar icon (#37124)
- Shield subscription default payment method crypto if available (#37101)
- Fix a bug when multiple confirmation exist but navigation fails to when approving (#36990)
- Fix coverage status not showing (#37097)
- Fix recipient icon when recipient is ENS domain (#37043)
- Fixed a bug where the wallet would not prompt the user for unlock and would silently drop `personal_sign` requests when the (#36963)
  wallet was locked and the user was opted into MetaMetrics
- Prevent unresponsive UI in the case where the user has more than 64MB of state; the trade off is that we now allow state (#35308)
  size to increase until the memory the browser has allotted for the
  extension process runs out (and crashes).
- Fixed missing `Bearer` in the shield-gateway proxy Authorization Header. (#36985)
- Remove unneccesary callback and dependencies (#36974)
- Fixed a bug that was causing the token list to show "No conversion rate available" once the user connects to testnet from a (#36685)
  dapp.
- Improves gator permissions page loading performance with cache-first strategy. (#36833)
- Removes extra transactions call to improve performance (#36968)
- Prevents quick reconnection when websocket connection is misbehaving (#37118)
- Fixes the incorrect USDC address for SEI (#37221)
- Only triggers onActive and onInactive Snap lifecycle hooks when client is unlocked (#37222)
- Fixes a bug where the Authentication API was called infinitely in useCarouselManagement (#37334)

## [13.6.0]

### Added

- Integrated Backend WebSocket Service and Account Activity Service for real-time balance updates (feature-flagged) (#36819)
- Added Bitcoin provider feature flag support for runtime control via addBitcoinAccount flag (#36676)
- Adds network logo and native token logo for Plasma Mainnet network (#36456)
- Show skeleton loader when loading status for Shield Coverage (#36888)
- Added support for the Irish (Gaeilge) language (#36088)
- Added user's eligibility check for shield subscription Added an option to submit user subscription event from (#36835)
  the shield entry modal
- Added support for Hourly, Bi-Weekly (14 days), Monthly (30 days), and Yearly (365 days) duration periods. (#36706)
- Added shield subscription error toasts (#36718)
- Create add funds modal (#36592)
- Added new toast component (#36408)
- Add file upload component (#35779)
- Auto turn on some settings when shield is active (#36343)
- Bitcoin v1.3.0 release. (#36753)
- Integrated Shield Entry Modal with SubscriptionController (#36588)
  Upgraded SubscriptionController to `v1.0.0`.
  Added `ShieldSubscriptionContext` to watch subscription
  status
- Added snap accounts link and account watcher option to multichain account list (#36717)
- Added new label to BTC assets in the Tokens tab (#36574)
- Added Bitcoin network support for Bridge functionality (#35597)
- Enable BIP44 Bitcoin accounts (#36510)
- Make token detail chart % change when changing time frames and hovering (#36664)
- Add claims submission form (#35790)
- Show user account instead of payer address in transaction shield (#36610)
  fix translation date for crypto insufficient funding
- Adds hide and pin options to account item menu (#37012)

### Fixed

- Fixed a bug that was causing the same token to be added twice from search (#36727)
- Improve perceived performance after importing a new SRP (#36882)
- Empty select rpc modal (#36876)
- Replace eye icon with a hover interaction to hide balances (#36543)
- Fixed a bug causing users to still see tokens with zero balance when the setting "hideTokensWithZeroBalance" is enabled. (#36821)
- Add changes to enable Snap accounts link to stable (#36770)
- Fixed a bug that caused ENS content hashes not to resolve properly (#36812)
- Correct transaction shield coverage text style (#36810)
- Fixed `ShieldController.init` in `SubscriptionController:stateChange` event listener (#36779)
  fixed `SubscriptionController` polling
  refactor `useUserSubscription` hook usage.
- Use template for dollar amount on locale (#36741)
- Update notifications enabled by default feature flag to control rollout (#36724)
- Increase our security posture by locking down `cross_origin_opener_policy` to `same-origin-allow-popups` openers only. (#36500)
- Show correct available token amount in shield subscription plan (#36494)
- Design team’s review have been implemented (#36523)
- Helps with ongoing performance regressions when using Solana (#36613)
- Fixes a bug where first permitting accounts via the EVM provider would cause all requests to the Solana Wallet Standard provider (#36434)
  to fail with an `The requested account and/or method has not been
authorized by the user.` error until the user fully revoked dapp
  permissions and then permitted accounts using the Solana Wallet Standard
  provider first.
- Patched ShieldController to `v0.3.2`. (#36809)
- Fixes positioning issues for dropdowns, tooltips, and popovers (#36967)
- Fixes a bug where the wallet would not prompt the user (#36963)
  for unlock and would silently drop personal_sign requests when the
  wallet was locked and the user was opted into MetaMetrics
- Renders missing network row in transaction confirmations (#37048)
- Adds address pattern matching to accounts list search (#37005)
- Migrates user's existing pinned and hidden state to multichain account designs (#37017)
- Tweaks messaging for degraded and unavailable networks (#37082)
- When adding a network the selectedNetworkClientId was not being updated and many of our components still depend on it (#37062)
- Ensures same toast avatar icon is displayed for the same account when switching to a different account that isn't connected (#37124)

## [13.5.0]

### Added

- Added "Learn More" link to private key list warning banner (#36531)
- Added privacy mode feature for multichain accounts (#36524)
- Add updates to the multichain introduction modal (#36508)
- Add UI loading states for backup & sync (#36348)
- Notify users on home screen via banner when the selected RPC endpoint for an enabled network is degraded or unavailable, (#36259)
  allowing endpoint to be quickly substituted
- Added a new feature for saving multichain account name on Enter key press (#36454)
- Updated pin extension ui (#36159)
- Updated the headers for the Reveal SRP Password page, Review SRP, and Confirm SRP pages (#36420)
- While loading tokens and balances on home screen, remove initial UI-blocking "connecting" spinner and display skeleton (#36045)
  loaders instead
- Added alerts to warn users when incoming tokens in a transaction are flagged as malicious or suspicious (#36258)
- Updated the MetaMetrics UI (#36163)
- Added support for token scanning and cleared outdated URL scan cache (#35964)
- Added swap button to activity tab empty state (#36319)
- Updated the Import SRP UI (#36158)
- Updated Login Modal UI (#36303)
- Updated create-password form UI (#36154)
- Adds dynamic fee information to the swaps quote card (#36106)
- Changed selected multichain account cell UI from a checkmark to a bar (#36367)
- Updated alert system UI in Confirmations (#35761)
- Fixes for Metamask Transaction Shield (#36284)
- Presents a Permission confirmation view when a decoded permission exists on signTypedData metadata. Flask only. (#36054)
- Subscription check out URL open new tab (#36161)
- Changed the wallet details page title to include " / Accounts" suffix (#36307)
- Adds EIP-7715 Readable Permissions to MetaMask flask, allowing dapps to call `wallet_requestExecutionPermissions` (#36230)
- Pre-fill Swap tokens with default BIP-44 pairs from remote config (#36209)
- Added Hyperliquid referral approval confirmation (#34999)
- Add Priority tag to support in global menu if user subscribed (#35951)
- Updates the Defi tab empty state with improved design (#36101)
- Added a No MM Fee badge for relevant tokens in the bridge experience. (#36103)
- Used the extensionReturnTxHashAsap param from remoteFeatureFlags for Smart Transactions (#36240)
- Updated NFT tab empty state with improved design (#36134)
- Added megaeth mainnet support (#36116)
- Updated Activity tab empty state with improved design and theme-aware illustrations (#36138)
- Added educational modal for Multichain Accounts feature introduction (#35907)
- Adds MetaMask USD as a default toToken on Linea and Ethereum (#36100)
- Added HEMI network (#36143)
- Downgrade alert severity on account selected from warning to info (#35722)
- Show account group name for Snaps when multichain accounts feature flag is enabled (#35577)
- Add support for gasless 7702 swaps (#35300)
- Subscription payment options integration (#35929)
- Add xdc network (#35805)
- Added Shield plan page (#35350)
- Added UI for showing subscription error states (#35874)
- Encourage users to update to a new version of the extension if a deeplink can be verified, but is not found (#35714)
- Add account syncing support for multichain accounts (#35299)
- Removed metametrics consent screen for social logins in chromium browsers (#35583)
- Add multichain account networks subtitle (#35862)
- Added support for Monad discover button (#36389)
- Use loading indicator when approving an add network (#36403)
- Enables Solana Devnet support (#36024)

### Changed

- Removed `secure-your-wallet` page and updated `backup-seed-phrase` pages (#36152)
- Remove blockie-identicon and the 'blo' dependency (#36429)
- Remove extra add network modal (#36309)
- Changed account selector copy to read x network address(es) (#36293)
- Updated the native ticker for Hemi (#36218)
- Update: simplified network names for better readability - "Ethereum Mainnet" to "Ethereum", "Linea Mainnet" to "Linea", "Base (#35734)
  Mainnet" to "Base", "Arbitrum One" to "Arbitrum", "Avalanche Network
  C-Chain" to "Avalanche", "Binance Smart Chain" to "BNB Chain", "OP
  Mainnet" to "OP", "Polygon Mainnet" to "Polygon", "Sei Mainnet" to
  "Sei", and "zkSync Era Mainnet" to "zkSync Era" (#35734)
- Swap indicator in hardware wallet confirmation page (#35776)
- Updated IoTeX network and IoTeX token logos (SVG) to the latest branding. (#35720)
- Updated announcement banner's design. (#35858)

### Fixed

- Swap dest network should match src until user changes it (#36438)
- Fixes a bug where a confirmation was showing up during solana account creation (error) (#36540)
- Fixed the carousel flickering issue after all cards are closed. (#36533)
- Update alert messages for address and token trust signals (#36517)
- Only enables Solana Devnet when running on flask (#36520)
- Updated token quantity formatting (#36511)
- Update text in import srp success toast (#36458)
- Refactor send assets list fiat and token formatting (#36489)
- Fix requesting additional wallet namespace request when there is an existing permission (#36459)
- Added Account API support for fetching account balances with improved performance and reliability for multi-account users (#36493)
- Fixed an issue where adding a popular network via dapp/extension would incorrectly switch the network even when “All (#36497)
  popular networks” was selected
- Fix network dropdown from showing current network (#36422)
- Adjust styling on the Send Review screen (#36418)
- Fixed SRP Import (#36491)
- Fixed account balance display issue where only one account showed balance initially in account lists (#36451)
- Align avatar in the site cell with the account list in account connect (#36392)
- Use formatters for market cap (#36444)
- Fixed intermittent connection and signing errors with Lattice1 hardware wallets by improving message validation (#36306)
- Fixed DApp permissions page header to show "Edit Accounts" instead of "Connect with MetaMask" (#36421)
- Fix solana connection after connecting with an evm account (#36242)
- Fixed UI behavior for address copy action (#36424)
- Fix clearProductTour return type (#36428)
- Fixed unwanted Solana Snap accounts appearing when BIP-44 multichain accounts feature is disabled (#36234)
- Fixed headers UI inconsistencies for permission connect pages (#36412)
- Fixed bug that caused Solana assets to open the wrong block explorer (#36394)
- Updated hover state bugs in the header and popover styling (#36383)
- Fixed memoisation issue when switching network via a dapp (#35624)
- Fixed the `AddressQRModal` component from breaking due to incorrect usage of the translation function (#36396)
- Fix padding around the edit icon in the `MultichainAccountsConnectPage` (#36399)
- Include accountAddress in swap tx submission params and show bridge activity list items for all accounts in (#36321)
  accountGroup
- Refactored network manager to use the `NetworkEnablementController` from core instead of a local controller (#36150)
- Fixed a bug that was causing a stray 0 to render on quotes page (#36368)
- Update spacing but for account addresses (#36388)
- Remove top padding for multichain pages (#36235)
- Fixed account menu layout issues that caused multiple scroll bars and E2E test failures (#36260)
- Missing SOL balance in Swap page (#36316)
- Fixed a bug that was preventing Solana historical prices from showing (#36301)
- Fixes account switching for solana dapps. (#36168)
- Always show Swap as CTA button text (#36252)
- Implemented "Remove account" for relevant accounts in the account group details page (#36286)
- Fixed a bug that was showing reveal private key for non-entropy based accounts (#36300)
- Fixes existing EVM permissions removed when a Solana Wallet Standard connection is rejected (#36283)
- Fixed a bug that was preventing to show block explorer button for some networks (#36272)
- Fix site cell connected account / network text (#36280)
- Fix connection indicator for non-evm related dapps (#36065)
- Remove double loading indicator in the dapp connection flow (#36226)
- Display account group name in SIWE (#36225)
- Fixes the tab alignment in bip44 dapp connection (#36265)
- Removes extra scroll bar during account connect when there are multiple accounts (#36268)
- Update edit account button copy (#36269)
- Fixed text truncation for very long account group names (#36233)
- Remove double loading state in permission page button (#35887)
- Removed warnings when adding HyperEVM as a custom network (#35609)
- Fix connect now modal to support bip44 accounts (#36064)
- Clicking back arrow on confirmation header should cancel transaction (#36077)
- Align label margin on Snap UI form elements (#35794)
- Display of network and token icon in confirmation header for native tokens other than ETH (#36062)
- Fixed activity tab layout to show network selector above banner in empty state (#36136)
- Fix total supply displayed value (#35959)
- In send flow cancel button on confirmation page should go back to send page (#36053)
- Display correct avatar icons (#36020)
- Fixed retrieve `advancedGasFee` using the transaction’s `chainId` instead of the global network (#36110)
- Send broken for native assets when triggered from asset detail page (#36038)
- Issue with Snaps UI inputs of type number on Firefox (#36074)
- Amount component related fixes in new send implementation (#36030)
- Restore previous swap quote params when popup is reopened (#35958)
- Fix display bip 44 edit account flow when choosing accounts (#35865)
- Minor UI details fixes in import SRP and global menu (#36004)
- Fix the style of the account picker for pre-BIP44 wallet screen (#35932)
- Fix language selector z-index update (#35950)
- Fixed a bug where switching accounts could leave users on an unavailable network; the app now falls back to a popular network (#35841)
  available in the new account group
- Fix balance display in multichain dapp connection flow (#35866)
- Unset Solana txAlert when quote refreshes to prevent inaccurate user warnings (#35777)
- Updated petnames to use account group name (#35835)
- Show checkbox in edit account page. (#35868)
- Fixes issues where the old send flow is shown on fullscreen when the new send flow is launched in the popup (#36310)
- Adds `Manage Institutional Wallet` back to the new `Add wallet` modal (#36345)
- Fixes account API chain ID configuration to use dynamic feature flag values instead of stale initialization values, and display balances properly for flagged networks (#36587)
- Fixes issue where an error appeared when opening solana tokens (#36612)
- Fixes issue that was causing incorrect quotes for mUSD to be displayed (#36580)
- Fixes multi-srp account syncs on account list menu (#36582)
- Removes routes that open the legacy swaps UI (#36638)
- Adds new translations (#35249)
- Adds Infura Base network configuration to all users' network settings (#36675)
- Fixes issue in which any network selected showed Solana activity (#36773)
- Improves token tabs performance (#36642)
- Ensures all Solana tokens are listed on the swap page, when Solana is selected as the source chain for the swap (#36830)
- Hides recipient modal if there is a matching account in the selected bridge destination network (#36829)
- Fixes issue with non-evm network assets not showing on first install unless the user changed networks manually (#36755)
- Ensures smart transaction post confirmation page is displayed, whatever the network (#36843)
- Fixes unexpected naming of some accounts after upgrading to multichain accounts (#36826)
- Fixes issue where trust signal was no longer displayed on dapp connection page (#36895)
- Fixes issue where the block number returned by the EVM provider would get stuck and fail to update in certain scenarios (#36869)
- Improves performance by only fetching Solana balances of the selected account group (#36715)
- Fixes issue in which multichain transaction history was showing incorrect chain information (#36645)
- Fixes multiple small issues related to the new send implementation (#36831)
- Fixes issue where the account icon changes at different steps of the send flow while it shall remain the same (#36877)
- Fixes issue with the DaPP permissions icon showing wrong network for Solana only DaPP (#36881)

## [13.4.3]

### Fixed

- Adds path-based blocking for URLs (#36634)

## [13.4.2]

### Fixed

- Fixes ci pipeline issue preventing production build creation (#36624)

## [13.4.1]

### Fixed

- Fixes the issue where new Trezor hardware wallet users are unable to connect (#36425)
- Fixes issue with polycon not being set as default for existing users (#36553)
- Fixes intermittent connection and signing errors with Lattice1 hardware wallets by improving message validation (#36306)

## [13.4.0]

### Added

- feat: adds verified trust signal to dapp connection page (#35760)
- feat: hides bridge recipient picker until there is an active bridge quote (#35821)
- feat: implements bridge destination account picker modal (#35819)
- feat: unifies evm and non-evm activity lists for BIP-44 (#35740)
- feat: renders a new account icon feature tour (#35670)
- feat: adds mask icons option (#35502)
- feat: adds version segmentation for carousel and in-app announcement notifications (#35820)
- feat: optimizes image used for metamask shield settings (#35829)
- feat: redesigns unified swaps quote card (#35778)
- feat: adds rename account feature for multichain accounts (#35741)
- feat: adds view to reveal account group private keys (#35719)
- feat: adds support for the network selector in BIP-44 account groups (#35579)
- feat: implements recipient validation and resolutions for Solana and EVM accounts (#35744)
- feat: enables account groups in dapp connection flow (#35513)
- feat: removes `getting started` page, `terms of use` and adds footer for `terms of use` in login (#35555)
- feat: adds initial smart account page routing for multichain accounts (#35665)
- feat: shows connected network icon (#35657)
- feat: adds support to Solana tokens with multiplier (#35695)
- feat: adds search functionality to the multichain account list (#35616)
- feat: adds QR code modal for sharing account addresses (#35454)
- feat: adds Acala/Karura logo, updates bufferMultiplier (#33547)
- feat: improves how balance is fetched for various tokens in new send flow (#35640)
- feat: adds tooltip for url trust signal badges (#35459)
- feat: adds perp push notification translations (#35621)
- feat: runs alignment mechanism at the appropriate time so that user's multichain accounts contain all the necessary internal accounts when user wants to use them (#35190)
- feat: removes `network is busy` alert (#34827)
- feat: adds `Add Wallet` button to account list page that opens modal with import options (#35536)
- feat: adds `Settings > Transaction Shield` UI (#35352)
- feat: adds SRP backup process to multichain account details (#35518)
- feat: adds dedicated `Add Wallet` page for private key import with proper routing (#35543)
- feat: adds MetaMask shield entry point modal (#35347)
- feat: adds designs for amount input (#35510)
- feat: adds max button to amount page (#35474)
- feat: adds metametrics toggle and delete metametrics data button in default settings (#36275)

### Fixed

- fix: fixes a bug that was causing to show spam Solana transactions in the activity list (#35695)
- fix: fixes an issue that was causing to show an empty symbol instead of UNKNOWN in activity list for Solana tokens with no metadata (#35695)
- fix: adds UI adjustments for multichain accounts features (#35839)
- fix: fixes a bug with opening multiple block explorer URLs from multichain QR code modal (#35822)
- fix: adds token detail name to destination account picker (#35810)
- fix: updates the native currency for FRAX network to FRAX (#35784)
- fix: fixes error in Solana assets when toggling fiat mode (#35827)
- fix: fixes in amount input about min decimals supported by the asset (#35808)
- fix: fixes multichain account menu by hiding pin and hide features that are not implemented (#35812)
- fix: adds minor UI and functionality adjustments to the multichain account details (#35818)
- fix: ensures long dapp urls don't overflow on dapp connection flow (#35715)
- fix: only shows account list badge for accounts that are connected and active (#35803)
- fix: fixes account picker alignment under multichain accounts feature flag (#35807)
- fix: displays custom networks when bip 44 is enabled (#35798)
- fix: fixes multichain accounts UI for search bar, account details page and wallet details page (#35793)
- fix: prevents lengthy spinner on load when selected network is slow to respond (#35516)
- fix: notifies client when native SOL balance reaches zero (#35739)
- fix: fixes issues related to fiat mode toggling on amount page (#35725)
- fix: clears edit status after close edit network dialog (#35519)
- fix: fixes sending NFT tokens in new send implementation (#35702)
- fix: stops showing USDC instead of SOL when a bridge is created from SOL to ETH (#35668)
- fix: stops showing truncated origin on the dapp connection page (#35443)
- fix: uses new send implementation for native SOL token (#35644)
- Fix: displays Solana Bridge transactions with correct label and details (#35539)
- fix: adds fallback mechanism to better handle batch transactions (#34019)
- fix: improves max mode implementation on new send flow (#35611)
- fix: fixes minor bugs related to address list (#35592)
- fix: fixes a bug that was causing the current network for dapps without permitted accounts to change unnecessarily (#35559)
- fix: fixes source for multichain account names in account picker (#35478)
- fix: plans 966 enhance ledger not supported error (#35291)
- fix: fixes a bug causing ENS lookups to fail after certain network switches (#35430)
- fix: removes metametrics consent page for social logins in chromium browsers (#35939)
- fix: migrates remaining identicons from legacy circle-form to new square-form (#35892)
- fix: renames maskicons to polycons (#35955)
- fix: prevents network manager icon from being updated when switching networks from dapp permissions modal (#35946)
- fix: fixes marketing opt-out toggle in settings (#35938)
- fix: increases our security posture by locking down cross_origin_opener_policy to same-origin openers only (#35922)
- fix: fixes issue with ens name resolutions, where resolution is only visible momentarily (#35847)
- fix: migrates remaining identicons in the activity tab (#36000)
- fix: fixes oauth login in experimental builds (#36140)
- fix: fixes crash when closing a full nft image (#36162)
- fix: ensures settings network manager correctly adds network (#36156)
- fix: adds a 15-minute cache expiration for address security alert (#36169)
- fix: migrates remaining identicons on notifications (#36210)
- fix: ensure metametrics page isn't shown when not expected (#36086)
- fix: prevent automatic creation of missing evm and Solana accounts when basic functionality toggle is off (#36135)
- fix: disables marketing toggle if user does not participate in metametrics (#36063)
- fix: fixes issue where simulations results are shown with wrong decimals on some networks (#36346)

## [13.3.2]

### Fixed

- fix: fixes ci pipeline issue preventing production build creation (#36291)

## [13.3.1]

### Fixed

- fix: fixes issues with balances not updating on Solana (#36129)
- fix: improves Solana account synchronization and WebSocket subscriptions (#36129)
- fix: adds multichain asset prices polling to ensure Solana chart always displays up-to-date price data (#36175)
- fix: adds support for signing transactions where the fee payer differs from the user's account (#36251)

## [13.3.0]

### Added

- feat: improve new send flow, by merging amount and recipient pages, and by adding the possibility to navigate back to the page when needed (#35416)
- feat: improve new send flow, by adding Solana compatibility (#35361)
- feat: improve new send flow, by adding amount fiat conversion and validation functions (#35346)
- feat: improve new send flow, by adding header component on send page (#35326)
- feat: improve new send flow, by displaying balance on amount page (#35246)
- feat: improve new send flow, by making it possible to submit a transaction (#35188)
- feat: improve new send flow, by making it possible to pass asset over to send page in url parameters (#35115)
- feat: improve new send flow, by creating basic pages and navigation (#35106)
- feat: improve new send flow, by setting up name resolution, including on non-evm networks (#35113)
- feat: initialize the new send flow behind a feature flag (#35104)
- feat: add a new page to display multichain account details (#35298)
- feat: improve dapp connection UX when the wallet is locked (#35122)
- feat: introduce address scanning for simple send transactions (#34978)
- feat: add new multichain account popup menu (#35064)
- feat: add checkbox for emitting error report to Sentry when restarting MetaMask from error page (#35619)

### Changed

- update: display the number of account group instead of addresses for a connected dapp (#35427)
- update: improve multichain address list by filtering out test networks and refining layout (#35380)
- update: batch RPC requests for native and ERC20 tokens into a single request to reduce the total number of RPC calls and improve performance (#35283)
- update: replace portfolio.metamask.io links with app.metamask.io (#35221)
- update: upgraded @metamask/design-system-react to v0.3.1 for improved security and React 17 compatibility (#35271)
- update: deprecate carousel slides (#35109)

### Fixed

- fix: solve some security vulnerabilities caused by out of date dependencies (#34364)
- fix: resolve visual bug when very long URLs get displayed on the MetaMask warning page (#35179)
- fix: avoid race condition where the password is being changed while the wallet is locked (#35022)
- fix: resolve issue where error is shown in the console although user successfully authenticated with Apple login (#35414)
- fix: fix long account name rendering (#35343)
- fix: properly clear all text boxes when user presses `clear` on the `import SRP` page (#33364)
- fix: handle situation where transactions on some networks don't show up when more than one network is selected within the activity tab (#35231)
- fix: fix issue when `too many metrics requests` error is shown in the console when a permit request is submitted (#35203)
- fix: handle cases where incorrect nonce value is displayed in the transaction details from last confirmation page when a tx comes from a dapp and have a miss-matched network context (#35204)
- fix: properly emit transaction lifecycle events even when smart transaction toggle is on (#35196)
- fix: fix the flickering issue with the batch transaction alert that occurs when there are no simulations but the unused approval alert is triggered (#35019)
- fix: automatically switch the chain, even when an approval is being displayed on page, and don't cancel pending confirmations while doing so (#35107)
- fix: fall back to selected internalAccount if selected account group has no account matching specified scope (#35630)
- fix: fixes issue in the send flow where sender's identicon is not a circle shape (#35711)
- fix: fixes an issue with first-time interaction alerts displaying on verified contract addresses (#35331)

## [13.2.3]

### Fixed

- fix: fixes bridging on https://portfolio.metamask.io (#35755)

## [13.2.2]

### Fixed

- fix: fixes issue related to `Routes` component that was leading the app to occasionally crash and force reinstall for some users (#35587)

## [13.2.1]

### Fixed

- fix: update the Solana snap to latest version (#35642)

## [13.2.0]

### Added

- feat: enable Linea for Smart Transactions (#35117)
- feat: add discover button for Solana network in the network list (#34498)
- feat: add account switching functionality for the multichain accounts (#34989)
- feat: allow offline unlock for social login users (#34996)
- feat: add price impact information and alert when above a certain threshold (#34951)
- feat: add new page for displaying multichain accounts (#34836)
- feat: add message to loading screen when loading is taking an abnormally long time (#34530)
- feat: add 'Scan QR code and download the Mobile app' page on onboarding flow (#34825)
- feat: hide 'Remove imported account' button for social login, as it's not yet supported (#34895)
- feat: add Frax network and token logos (#34986)
- feat: add support for non-evm deep links (#35228)
- feat: automatically switch to the last used solana account when opening swap/buy deep link with SOL token set as query parameter (#35390)
- feat: update network selector to manage selecting a single network or all popular networks (#35264)
- feat: unblock gas station for Base network and more accurate `alternateGasFee` capability (#34733)

### Changed

- update: remove the Solana modal from the initial flow (#34988)
- update: disable transaction resubmission (#35028)
- update: update `SEI` network's name from `Sei Network` to `Sei Mainnet` (#34930)
- update: reduce bundle size to improve performance (#34690)
- update: removed the `socialLoginEmail` from the state-logs export (settings -> advanced -> download state-logs), instead of masking the value (#35170)

### Fixed

- fix: ensure text doesn't go beyond component boundaries when user is prompted to add a network (#34824)
- fix: skip metametrics screen if user already chose an option (#35036)
- fix: disable the hover state when SnapUISelector is disabled (#34964)
- fix: hide 'Estimated changes have changed' alert from wallet initiated transactions (#34782)
- fix: remove console error displayed when wallet is locked before transaction is confirmed (#34406)
- fix: remove misleading console warning (#34816)
- fix: remove console error displayed when connecting wallet to a dapp (#34783)
- fix: use a static list of words for blurred SRP to prevent any potential possibility of a 'blur reversal attack' (#34288)
- fix: revert 'set default theme to dark' (#34274)
- fix: fixes incorrect email value in onboarding and setting page UI (#35170)
- fix: fixes incorrect balances displayed on swap page, due to race condition when balances are set before URL params are applied (#35008)
- fix: fixes ui not loading in old browsers due to use `Promise.withResolvers` (#35175)
- fix: ensure that changing the global network should doesn't affect the dapp connected active network (#35432)
- fix: show error when background is unresponsive after update due to Chromium bug (#35332)
- fix: remove automatic gas updates during swap and bridge transaction submission to preserve quoted gas parameters (#35455)
- fix: add the ability to temporarily hide carrousel to ensure a smoother experience (#35447)
- fix: fixes issue where the petnames system attempts to resolve EIP-155 names for Solana accounts (#35477)
- fix: ensure the dapp-connected network switches to a permitted network when the current dapp-connected network permission is revoked via the dapp popover modal (#35487)
- fix: ensure the dapp-connected network remains unchanged when the global network RPC endpoint is switched (#35487)

## [13.1.2]

### Fixed

- fix: fixes a performance issue by closing all Solana WebSocket connections whenever the client becomes inactive (#35359)
- fix: fixes a performance issue by only opening Solana WebSocket connections if client is active (#35392)

## [13.1.1]

### Fixed

- fix: remove the Solana new feature modal from the onboarding flow (#34988)
- fix: hide swap fee info line if quote does not include a MetaMask fee (#35278)

## [13.1.0]

### Added

- feat: inform users using social login when their password got updated in another instance of the wallet (#34757)
- feat: use websockets instead of polling to automatically update Solana transactions and token balances (#34620)
- feat: enable notifications by default for users (#34693)
- feat: show general startup error messages to users instead of the loading screen indefinitely (#34305)
- feat: configure slippage applied to delegation caveats when enforced simulations is enabled (#33924)
- feat: Add buttons to test error capture (#34386)

### Changed

- update: more seamless and user-friendly experience for users interacting with Trezor devices (#33834)
- update: adopt fixed spacing between the account avatar and its details rows (#34689)
- update: polish welcome page copywriting and styles (#34621)
- update: update srp lock image and remove 'follow us on X' button in onboarding flow (#34619)
- update: use swaps label for the unified swaps/bridge page (#34467)
- update: change default label of bridge originated txs to 'swap' or 'bridge' based on source and destination chain (#34476)
- update: change background color of loading screen to match rest of application's background color (#34346)
- update: change background color of initial popup screen to match latest designs (#34347)
- update: remove loading spinner shown when creating an ethereum account (#34374)
- update: reduce bundle size to improve application performance (#34694)
- update: change the way accounts are grouped on the account list page (#34631)
- update: update logo of sei network (#34634)
- update: reduce contentscript size to improve application performance (#34688)
- update: translate 'Select account' label on account selector (#34657)
- update: adopt fixed toggle spacing on advanced settings page (#34536)
- update: change discover link to redirect to token explorer page instead of dapp explorer page on the Portfolio (#34580)
- update: improve performance of address formatting/validation (#34152)
- update: update colors to stay current with the latest MetaMask design system standards (#34384)
- update: update `form-data` to address advisory (#34480)

### Fixed

- fix: hide bridge button on testnet for unified ui (#34700)
- fix: display multichain accounts in the right order on account list (#34756)
- fix: stop showing all enabled networks when an additional network permission request is prompted by a dapp (#34651)
- fix: handle potential state corruption issue during Solana accountChanged flow (#34643)
- fix: stop redirecting back to the login screen upon page refresh for users with social login already completed (#34716)
- fix: redirect user to the change password form when change password fails (#34722)
- fix: show correct subtitle and redirect on view explorer (#34723)
- fix: display right copy + translations for NetworkIndicator text (#34648)
- fix: use only USD values in simulation metrics, rather than selected currency (#34645)
- fix: hold insufficient balance alert until simulation is completed (#33932)
- fix: prevent 'Request cannot be constructed from a URL that includes credentials' error when using RPC endpoints with embedded credentials (#34278)
- fix: fix token auto-detection feature (#34647)
- fix: remove all gas validation from legacy send flow, to support gas station and defer to transaction confirmation (#34646)
- fix: ensure Solana source token is properly displayed for solana -> evm bridges (#34521)
- fix: fix an issue where signature requests with object-type data could fail by normalizing the data before parsing (#34054)
- fix: set max limit of block gas used for gas estimation to 10M, which is required to fix ERC20 send issue on MegaETH Testnet (#34398)
- fix: minimize frequent writes while the wallet UI is closed, to avoid abnormal disk writing (#34473)
- fix: ensures we are scanning the same value origin that is actually displayed to users in the confirmation screen (#34459)
- fix: inform user when tx simulation results in ResultWithNegativeLamports errors, as for some providers, like Debridge, it's the only way to detect whether quotes will succeed (#34477)
- fix: prevent frequent writes while the wallet UI is closed (#34506)
- fix: ensure 'view on explorer' button displayed below address qr code on the receive page redirects to the right explorer (#34377)
- fix: update address qr code navigation to prevent infinite loop of navigation (#34381)
- fix: show solana connected state in the dapp view (#34375)
- fix: reduce occurrences of Ledger timeout errors (#34574)
- fix: fix issue where network is always Mainnet when switching to a Bitcoin testnet account (#34286)
- fix: eliminate 'MetaMask extension not found' error logged in the console when connecting to some dapps on Chrome (#34783)
- fix: improve default slippage values for swaps and bridges to reduce transaction failures, now using 0.5% for Solana swaps, stablecoin pairs, and bridges, while using 2% for other EVM token swaps (#34821)
- fix: move password change operations to the background script, to ensure they can continue even when the wallet/browser window closes (#34852)
- fix: make the slippage editable and visible in the quote card to reduce the risk of submitting transactions with unintended slippage (#34916)
- fix: trigger Solana UI refreshes only when the client is active and the UI is open, to enhance performance and fix Solana asset removal logic (#34887)
- fix: handle the case where the refresh token changes during onboarding (e.g. cubist) (#35053)
- fix: handle issue with Firefox's private browsing mode that was causing the extension to fail during initialization (#35040)
- fix: show effective gas fees instead of max gas fees when displaying swap quotes (#35038)
- fix: prevent undesired dapp selected network change when enabled network check boxes are clicked (#35126)
- fix: ensures that sensitive items are removed from the state logs, which are downloadable from advanced settings page (#35003)
- fix: ensures that user's email is removed from the state logs, which are downloadable from advanced settings page (#35119)

## [13.0.1]

### Fixed

- fix: invalid refresh token error thrown when wallet was locked before some background requests completed (#34961)
- fix: bridging to Solana without a Solana account failing on legacy extensions (#34943)
- fix: polling rate being set to 1 minute instead of 10 minutes (#34883)

## [13.0.0]

### Added

- feat: prefill token in unified swaps experience (#34038)
- feat: 2.13 seedlessonboardingcontroller 2.2.0 update (#34240)
- feat(INFRA-2772): add failure notifications for nightly build failures (#34345)
- feat: 2.7 segment onboarding (#33553)
- feat: bump smart-transactions-controller to ^17.0.0 (#34321)
- feat: 2.6 sentry onboarding (#33441)
- feat: set default theme to dark (#34274)
- feat: add multichainaddressrow component with stories and tests (#34328)
- feat: add metametrics to backup and sync modal (#34332)
- feat: 2.10 handle private key sync restore and sync srp (#34311)
- feat: add metamask mobile slide and modal (#33673)
- feat(INFRA-2772): update release workflow to include version bump to main (#34304)
- feat: separate `development` and `qa (dist)` enviroments for social login (#34313)
- feat: update copywriting on import private key for social login user (#34315)
- feat: add trust signals to confirminforowurl w/ alerts (#33974)
- feat: enable dapp scanning (#33775)
- feat: dapp scanning enabled on transactions and signatures (#33829)
- feat: pass discovered accounts data to the metrics event (#33927)
- feat: release networkmanager & remove network picker (#33459)
- feat: add 7702 to new accounts details (#34008)
- feat: implement tailwind css and design system libraries in the extension (#30170)
- feat: 2.9 update seedlessonboardingcontroller to v2 (incl. keyring key backup instead of password) (#34027)
- feat: add support to access the private key from account details (#34030)
- feat: enable apple login (#34072)
- feat: add support for show srp from accounts details (#34026)
- feat: pre-fills Swap amount, src token and dest tokens based on deep-link query parameters (#34259)
- feat: enable SeedlessOnboarding (#34429)
- feat: update fee label when gas is include in swap rate (#34146)
- feat: integrate phishing controller actions into NFT messengers (#34216)
- feat: add loader for onboarding unlock (#34518)

### Changed

- update: change homepage button colors and header styling (#34209)
- update: remove unified swaps legacy and portfolio fallbacks (#34290)
- update: change ui's background communications to use a single notification listener instead of two (#33211)
- update: change the Password Sync checks and optimize the Wallet Unlock operation for the Social Login flow (#34436)
- update: replaced Reset Wallet button with Use a different method to Login in the Onboarding unlock page (#34505)
- update: change unlock pages error message for too many attempts and time format (#34577)
- update: remove the Use a different login method button from Unlock page if user is not on social-login flow (#34618)
- update: rename Profile sync request from /api/v2/profile/metametrics to /api/v2/profile/lineage (#34735)
- update: update or add support links on password form, password change modal, import account modal, abd srp quiz modal (#34718)
- update: add Cubist to the list of supported institutional wallet (#34761)

### Fixed

- fix: align asset page buttons and fix homepage scrolling (#34342)
- fix: password form terms social and srp (#34350)
- fix: show contacts for all chains (#34307)
- fix: add toast and remove focus state (#34356)
- fix: set fixed height on pin-extension carousel slides (#34351)
- fix: fix token details percentage (#34354)
- fix: multi srp sync loading remove (#34226)
- fix: hide import nft button on trx history list (#34340)
- fix: display testnets for development mode (#34308)
- fix: remove switch network toast (#34252)
- fix: ellipses on long label names in destination acct picker (#34309)
- fix: migrate bsc network rpc from bsc-dataseed.binance.org to bsc infura (#33997)
- fix: ensure network deselect update the underlying network controller to an enable network (#34248)
- fix: no positions wording update (#34229)
- fix: update the multichain wallet header in the account list (#34325)
- fix: change navigation to history.goback (#34245)
- fix: move onclick handlers for base account details to the row level (#34243)
- fix: ensure networkordercontroller isn't reset when extension is reload (#34320)
- fix: ledger error import new accounts (#34242)
- fix: overwrite eth token logo (#34224)
- fix: hide nested transaction tag when only 1 transaction is present (#34000)
- fix: skip first-time interaction alert for first-party contracts (#34001)
- fix: remove max button for native assets for now (#34293)
- fix: use aggregate balance for srp list item balance (#34215)
- fix: localize message for networkmanager (#34263)
- fix: render add account button only for hd wallets (#34247)
- fix: remove live network requests from seedless onboarding e2e tests (#34265)
- fix: prevent swap between native assets (#34257)
- fix: add changes to multichain accounts ui (#34190)
- fix: show avatar account on all screens except header (#34273)
- fix: fix select a contact during the Send flow does not clear when switching networks and send flow shows Select network (#34234)
- fix: add performance tracing to UserStorage syncing features to improve monitoring and debugging capabilities (#34032)
- fix: set confirm srp quiz word to readonly (#34225)
- fix: resume metametrics if not set yet when close/open app during onboarding (#34177)
- fix: use primary and secondary variants (#34230)
- fix: fix crash on older browser versions (#34255)
- fix: change from use `value` param to `amount` for swaps/bridge (#34035)
- fix: address namedisplay component to show full address display name (#34188)
- fix: handle if srp length paste is not equal to define srp lengths (#34183)
- fix: prevent fetch invalid bridge quotes when dest address is not define cp-12.23.0 (#34115)
- fix: solana onboarding from connect page (#34187)
- fix: ui fixes in upgrade account page (#34084)
- fix: show network manager if network not reach (#34197)
- fix: account list agg balance (#34179)
- fix: add warning message for ledger connection issues on firefox cp-12.23.0 (#33915)
- fix: network form (#34070)
- fix: use transaction request network chainid for ppom validation (#34175)
- fix: fix aggregate balances (#34134)
- fix: deselect network should not call setactive network (#34116)
- fix: ignore ld flag when hide snap confirmation page cp-12.23.0 (#34151)
- fix: make flask experimental area full page (#34167)
- fix: do not show backup reminder/notification when use social account (#34142)
- fix: remove back button on wallet already exist and wallet not found pages (#34130)
- fix: defi positions polling fix (#34023)
- fix: use activequote amounts when display approval banners cp-12.22.1 (#34156)
- fix: read issingleswapbridgebuttonenabled flag to show unified swaps cp-12.23.0 (#34153)
- fix: feature flag enable networks on transaction history filter (#34149)
- fix: ensure extension version has change when browser's onupdate event is fire (#34144)
- fix: open `visitsupportdataconsentmodal` when `globalmenu` "support" button is click (#33658)
- fix: adjust spacing between account divider account (#34129)
- fix: add scenario for send flow fields validation for btc (#34113)
- fix: replace reveal srp modal with reveal srp page cp-12.23.0 (#34013)
- fix: bitcoin account synchronization when no history (#34053)
- fix: change the copy in the unified swaps flow asset picker to be more intuitive (#34365)
- fix: reset parsed search params after setting quote request inputs (#34389)
- fix: allow users to login with apple accounts (#34391)
- fix: use button for quiz words instead of text-field (#34280)
- fix: handle recovery ratelimit error (#34397)
- fix: show solana connection status in dapp view (#34375)
- fix: check password outdated before import private key for social log in user (#34400)
- fix: handle keyring remove when import srp seedless error (#34403)
- fix: validate if metametrics is done before redirecting to page on social (#34438)
- fix: update reset wallet content for seedless accounts (#34466)
- fix: ensure networks are enabled when performing swap/bridge (#34376)
- fix: set swap src chain based on selected asset cp-13.0.0 (#34385)
- fix: copywriting and minor ui styles on Unlock page and creation page (#34511)
- fix: capitalize social login type (Apple, Google) and remove double scroll on settings - srp list (#34514)
- fix: properly revert keyring password and encryption key on password change rollback (#34520)
- fix: add vault expiry info modal for old password recovery scenarios (#34118)
- fix: prevent password field error text from dimming when field is disabled (#34545)
- fix: add vault expiry modal for old password recovery scenarios (#34118)
- fix: prevent incorrect onboarding navigation on browser back/refresh actions in social login flow (#34541)
- fix: prevent background password sync checks from affecting UI state (#34534)
- fix: prevent password field error text from dimming when field is disabled (#34564)
- fix: handle RecoveryError at unlock when password is outdated (#34571)
- fix: defer network manager selection logic to prevent blocking toggles (#34450)
- fix: correctly displayed price for native tokens on token details page after enabling a network(#34565)
- fix: allow editing non-evm accounts name (#34552)
- fix: ensure NetworkOrderController fallbacks to ethereum if all enabled networks removed (#34460)
- fix: fix incorrect redirection when clicking back multiple times from metametrics page (#34576)
- fix: reset app warning upon SeedlessOnboarding actions success (#34595)
- fix: add button with hover effect on creation page and fix copywriting for Login with Social (#34598)
- fix: reset prefilled dest token when reopening Swap page (#34485)
- fix: set the correct error thrown when the user unlocks wallet with the old password (#34599)
- fix: enable multiple networks when added via dapp (#34507)
- fix: update address QR code navigation to prevent infinite loop of navigation (#34679)
- fix: ensure user to login when seedless password is changed while user waiting for password submit rate limit (#34632)
- fix: fix issue with PUMP token not appearing on asset picker (#34358)
- fix: prevent asset reset to native on Send/Swap when navigating from token details (#34625)
- fix: prevent where some old wallet data being wrongly kept (on the account list) after resetting the wallet (#34697)
- fix: update smart contract account toggle components to remove flickering and inconsistent state (#34664)
- fix: add logic to revert state for smart contract account toggle if there is a blockchain state mismatch (#34745)

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
- feat: add logos for Abstract network (#33838)
- feat: validate same origin domain for signIn for Solana (#33982)

### Changed

- Update: the button component to be monochromatic (#33847)
- Update: design tokens v8: font family change CentraNo1 to Geist and new background colors (#33764)
- Update: update message when there is no DeFi positions wording (#34229)
- Update welcome screen buttons to use Button DS component (#34230)
- Set confirm srp quiz word to readonly (#34225)

### Fixed

- fix: solve when private key import field to always be in error state (#34050)
- fix: regression of lanchdarkly flag key (#34045)
- fix: solve `Error: Ledger: Unknown error while signing transaction` (#33581)
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
- fix: srp backup navigation and quiz cp-12.22.0 (#33922)
- fix: Prevent cronjob state from getting out of sync (#33923)
- fix: bump @metamask/multichain-api-client to 0.6.4 to handle multichain api not responding on page load (#33904)
- fix: grammar on activity tab (#31287)
- fix: Prevent `DeFiPositionsController` from polling while UI is closed (#33921)
- fix: Created new migration to remove disabledUpgradeAccountByChain from preferences controller state as old migration had error (#33830)
- fix: hides fromtoken from the totokenpicker (#33857)
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
- fix: replace "Remind" with "remind" in deep link locale messages (#33780)
- fix: prevent swapping between native assets (#34257)
- fix: disconnect of EVM scopes when removing Solana permissions while being connected with Wallet Standard (#34281)
- fix: resume metametrics if not set yet when closing/opening app during onboarding (#34177)
- fix: handle if srp length pasted is not equal to defined srp lengths (#34183)
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

[Unreleased]: https://github.com/MetaMask/metamask-extension/compare/v13.7.0...HEAD
[13.7.0]: https://github.com/MetaMask/metamask-extension/compare/v13.6.0...v13.7.0
[13.6.0]: https://github.com/MetaMask/metamask-extension/compare/v13.5.0...v13.6.0
[13.5.0]: https://github.com/MetaMask/metamask-extension/compare/v13.4.3...v13.5.0
[13.4.3]: https://github.com/MetaMask/metamask-extension/compare/v13.4.2...v13.4.3
[13.4.2]: https://github.com/MetaMask/metamask-extension/compare/v13.4.1...v13.4.2
[13.4.1]: https://github.com/MetaMask/metamask-extension/compare/v13.4.0...v13.4.1
[13.4.0]: https://github.com/MetaMask/metamask-extension/compare/v13.3.2...v13.4.0
[13.3.2]: https://github.com/MetaMask/metamask-extension/compare/v13.3.1...v13.3.2
[13.3.1]: https://github.com/MetaMask/metamask-extension/compare/v13.3.0...v13.3.1
[13.3.0]: https://github.com/MetaMask/metamask-extension/compare/v13.2.3...v13.3.0
[13.2.3]: https://github.com/MetaMask/metamask-extension/compare/v13.2.2...v13.2.3
[13.2.2]: https://github.com/MetaMask/metamask-extension/compare/v13.2.1...v13.2.2
[13.2.1]: https://github.com/MetaMask/metamask-extension/compare/v13.2.0...v13.2.1
[13.2.0]: https://github.com/MetaMask/metamask-extension/compare/v13.1.2...v13.2.0
[13.1.2]: https://github.com/MetaMask/metamask-extension/compare/v13.1.1...v13.1.2
[13.1.1]: https://github.com/MetaMask/metamask-extension/compare/v13.1.0...v13.1.1
[13.1.0]: https://github.com/MetaMask/metamask-extension/compare/v13.0.1...v13.1.0
[13.0.1]: https://github.com/MetaMask/metamask-extension/compare/v13.0.0...v13.0.1
[13.0.0]: https://github.com/MetaMask/metamask-extension/compare/v12.23.1...v13.0.0
[12.23.1]: https://github.com/MetaMask/metamask-extension/compare/v12.23.0...v12.23.1
[12.23.0]: https://github.com/MetaMask/metamask-extension/compare/v12.22.3...v12.23.0
[12.22.3]: https://github.com/MetaMask/metamask-extension/compare/v12.22.2...v12.22.3
[12.22.2]: https://github.com/MetaMask/metamask-extension/compare/v12.22.1...v12.22.2
[12.22.1]: https://github.com/MetaMask/metamask-extension/compare/v12.22.0...v12.22.1
[12.22.0]: https://github.com/MetaMask/metamask-extension/compare/v12.20.1...v12.22.0
[12.20.1]: https://github.com/MetaMask/metamask-extension/releases/tag/v12.20.1

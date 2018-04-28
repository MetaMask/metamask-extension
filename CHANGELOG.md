# Changelog

## Current Master

- Update the eth_sign signature method to use a signature prefix the way personal_sign has. [breaking]

## 4.6.0 Thu Apr 26 2018

- Correctly format currency conversion for locally selected preferred currency.
- Improved performance of 3D fox logo.
- Fetch token prices based on contract address, not symbol
- Fix bug that prevents setting language locale in settings.
- Show checksum addresses throughout the UI
- Allow transactions with a 0 gwei gas price

## 4.5.5 Fri Apr 06 2018

- Graceful handling of unknown keys in txParams
- Fixes buggy handling of historical transactions with unknown keys in txParams
- Fix link for 'Learn More' in the Add Token Screen to open to a new tab.
- Fix Download State Logs button [#3791](https://github.com/MetaMask/metamask-extension/issues/3791)
- Enhanced migration error handling + reporting

## 4.5.4 (aborted) Thu Apr 05 2018

- Graceful handling of unknown keys in txParams
- Fix link for 'Learn More' in the Add Token Screen to open to a new tab.
- Fix Download State Logs button [#3791](https://github.com/MetaMask/metamask-extension/issues/3791)
- Fix migration error reporting

## 4.5.3 Wed Apr 04 2018

- Fix bug where checksum address are messing with balance issue [#3843](https://github.com/MetaMask/metamask-extension/issues/3843)
- new ui: fix the confirm transaction screen

## 4.5.2 Wed Apr 04 2018

- Fix overly strict validation where transactions were rejected with hex encoded "chainId"

## 4.5.1 Tue Apr 03 2018

- Fix default network (should be mainnet not Rinkeby)
- Fix Sentry automated error reporting endpoint

## 4.5.0 Mon Apr 02 2018

- (beta ui) Internationalization: Select your preferred language in the settings screen
- Internationalization: various locale improvements
- Fix bug where the "Reset account" feature would not clear the network cache.
- Increase maximum gas limit, to allow very gas heavy transactions, since block gas limits have been stable.

## 4.4.0 Mon Mar 26 2018

- Internationalization: Taiwanese, Thai, Slovenian
- Fixes bug where MetaMask would not open once its storage grew too large.
- Updates design of new-ui Add Token screen
- New-ui can send to ens addresses
- Update new-ui button styles
- Signed-type-data notification handles long messages
- Popup extension in new-ui uses new on-boarding designs
- Buy ether step of new-ui on-boarding uses new buy ether modal designs

## 4.3.0 Wed Mar 21 2018

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

## 4.2.0 Tue Mar 06 2018

- Replace "Loose" wording to "Imported".
- Replace "Unlock" wording with "Log In".
- Add Imported Account disclaimer.
- Allow adding custom tokens to classic ui when balance is 0
- Allow editing of symbol and decimal info when adding custom token in new-ui
- NewUI shapeshift form can select all coins (not just BTC)
- Add most of Microsoft Edge support.

## 4.1.3 2018-2-28

- Ensure MetaMask's inpage provider is named MetamaskInpageProvider to keep some sites from breaking.
- Add retry transaction button back into classic ui.
- Add network dropdown styles to support long custom RPC urls

## 4.1.2 2018-2-28

- Actually includes all the fixes mentioned in 4.1.1 (sorry)

## 4.1.1 2018-2-28

- Fix "Add Token" screen referencing missing token logo urls
- Prevent user from switching network during signature request
- Fix misleading language "Contract Published" -> "Contract Deployment"
- Fix cancel button on "Buy Eth" screen
- Improve new-ui onboarding flow style

## 4.1.0 2018-2-27

- Report failed txs to Sentry with more specific message
- Fix internal feature flags being sometimes undefined
- Standardized license to MIT

## 4.0.0 2018-2-22

- Introduce new MetaMask user interface.

## 3.14.2 2018-2-15

- Fix bug where log subscriptions would break when switching network.
- Fix bug where storage values were cached across blocks.
- Add MetaMask light client [testing container](https://github.com/MetaMask/mesh-testing)

## 3.14.1 2018-2-1

- Further fix scrolling for Firefox.

## 3.14.0 2018-2-1

- Removed unneeded data from storage
- Add a "reset account" feature to Settings
- Add warning for importing some kinds of files.
- Scrollable Setting view for Firefox.

## 3.13.8 2018-1-29

- Fix provider for Kovan network.
- Bump limit for EventEmitter listeners before warning.
- Display Error when empty string is entered as a token address.

## 3.13.7 2018-1-22

- Add ability to bypass gas estimation loading indicator.
- Forward failed transactions to Sentry error reporting service
- Re-add changes from 3.13.5

## 3.13.6 2017-1-18

- Roll back changes to 3.13.4 to fix some issues with the new Infura REST provider.

## 3.13.5 2018-1-16

- Estimating gas limit for simple ether sends now faster & cheaper, by avoiding VM usage on recipients with no code.
- Add an extra px to address for Firefox clipping.
- Fix Firefox scrollbar.
- Open metamask popup for transaction confirmation before gas estimation finishes and add a loading screen over transaction confirmation.
- Fix bug that prevented eth_signTypedData from signing bytes.
- Further improve gas price estimation.

## 3.13.4 2018-1-9

- Remove recipient field if application initializes a tx with an empty string, or 0x, and tx data. Throw an error with the same condition, but without tx data.
- Improve gas price suggestion to be closer to the lowest that will be accepted.
- Throw an error if a application tries to submit a tx whose value is a decimal, and inform that it should be in wei.
- Fix bug that prevented updating custom token details.
- No longer mark long-pending transactions as failed, since we now have button to retry with higher gas.
- Fix rounding error when specifying an ether amount that has too much precision.
- Fix bug where incorrectly inputting seed phrase would prevent any future attempts from succeeding.

## 3.13.3 2017-12-14

- Show tokens that are held that have no balance.
- Reduce load on Infura by using a new block polling endpoint.

## 3.13.2 2017-12-9

- Reduce new block polling interval to 8000 ms, to ease server load.

## 3.13.1 2017-12-7

- Allow Dapps to specify a transaction nonce, allowing dapps to propose resubmit and force-cancel transactions.

## 3.13.0 2017-12-7

- Allow resubmitting transactions that are taking long to complete.

## 3.12.1 2017-11-29

- Fix bug where a user could be shown two different seed phrases.
- Detect when multiple web3 extensions are active, and provide useful error.
- Adds notice about seed phrase backup.

## 3.12.0 2017-10-25

- Add support for alternative ENS TLDs (Ethereum Name Service Top-Level Domains).
- Lower minimum gas price to 0.1 GWEI.
- Remove web3 injection message from production (thanks to @ChainsawBaby)
- Add additional debugging info to our state logs, specifically OS version and browser version.

## 3.11.2 2017-10-21

- Fix bug where reject button would sometimes not work.
- Fixed bug where sometimes MetaMask's connection to a page would be unreliable.

## 3.11.1 2017-10-20

- Fix bug where log filters were not populated correctly
- Fix bug where web3 API was sometimes injected after the page loaded.
- Fix bug where first account was sometimes not selected correctly after creating or restoring a vault.
- Fix bug where imported accounts could not use new eth_signTypedData method.

## 3.11.0 2017-10-11

- Add support for new eth_signTypedData method per EIP 712.
- Fix bug where some transactions would be shown as pending forever, even after successfully mined.
- Fix bug where a transaction might be shown as pending forever if another tx with the same nonce was mined.
- Fix link to support article on token addresses.

## 3.10.9 2017-10-5

- Only rebrodcast transactions for a day not a days worth of blocks
- Remove Slack link from info page, since it is a big phishing target.
- Stop computing balance based on pending transactions, to avoid edge case where users are unable to send transactions.

## 3.10.8 2017-9-28

- Fixed usage of new currency fetching API.

## 3.10.7 2017-9-28

- Fixed bug where sometimes the current account was not correctly set and exposed to web apps.
- Added AUD, HKD, SGD, IDR, PHP to currency conversion list

## 3.10.6 2017-9-27

- Fix bug where newly created accounts were not selected.
- Fix bug where selected account was not persisted between lockings.

## 3.10.5 2017-9-27

- Fix block gas limit estimation.

## 3.10.4 2017-9-27

- Fix bug that could mis-render token balances when very small. (Not actually included in 3.9.9)
- Fix memory leak warning.
- Fix bug where new event filters would not include historical events.

## 3.10.3 2017-9-21

- Fix bug where metamask-dapp connections are lost on rpc error
- Fix bug that would sometimes display transactions as failed that could be successfully mined.

## 3.10.2 2017-9-18

rollback to 3.10.0 due to bug

## 3.10.1 2017-9-18

- Add ability to export private keys as a file.
- Add ability to export seed words as a file.
- Changed state logs to a file download than a clipboard copy.
- Add specific error for failed recipient address checksum.
- Fixed a long standing memory leak associated with filters installed by dapps
- Fix link to support center.
- Fixed tooltip icon locations to avoid overflow.
- Warn users when a dapp proposes a high gas limit (90% of blockGasLimit or higher
- Sort currencies by currency name (thanks to strelok1: https://github.com/strelok1).

## 3.10.0 2017-9-11

- Readded loose keyring label back into the account list.
- Remove cryptonator from chrome permissions.
- Add info on token contract addresses.
- Add validation preventing users from inputting their own addresses as token tracking addresses.
- Added button to reject all transactions (thanks to davidp94! https://github.com/davidp94)


## 3.9.13 2017-9-8

- Changed the way we initialize the inpage provider to fix a bug affecting some developers.

## 3.9.12 2017-9-6

- Fix bug that prevented Web3 1.0 compatibility
- Make eth_sign deprecation warning less noisy
- Add useful link to eth_sign deprecation warning.
- Fix bug with network version serialization over synchronous RPC
- Add MetaMask version to state logs.
- Add the total amount of tokens when multiple tokens are added under the token list
- Use HTTPS links for Etherscan.
- Update Support center link to new one with HTTPS.
- Make web3 deprecation notice more useful by linking to a descriptive article.

## 3.9.11 2017-8-24

- Fix nonce calculation bug that would sometimes generate very wrong nonces.
- Give up resubmitting a transaction after 3500 blocks.

## 3.9.10 2017-8-23

- Improve nonce calculation, to prevent bug where people are unable to send transactions reliably.
- Remove link to eth-tx-viz from identicons in tx history.

## 3.9.9 2017-8-18

- Fix bug where some transaction submission errors would show an empty screen.
- Fix bug that could mis-render token balances when very small.
- Fix formatting of eth_sign "Sign Message" view.
- Add deprecation warning to eth_sign "Sign Message" view.

## 3.9.8 2017-8-16

- Reenable token list.
- Remove default tokens.

## 3.9.7 2017-8-15

- hotfix - disable token list
- Added a deprecation warning for web3 https://github.com/ethereum/mist/releases/tag/v0.9.0

## 3.9.6 2017-8-09

- Replace account screen with an account drop-down menu.
- Replace account buttons with a new account-specific drop-down menu.

## 3.9.5 2017-8-04

- Improved phishing detection configuration update rate

## 3.9.4 2017-8-03

- Fixed bug that prevented transactions from being rejected.

## 3.9.3 2017-8-03

- Add support for EGO ujo token
- Continuously update blacklist for known phishing sites in background.
- Automatically detect suspicious URLs too similar to common phishing targets, and blacklist them.

## 3.9.2 2017-7-26

- Fix bugs that could sometimes result in failed transactions after switching networks.
- Include stack traces in txMeta's to better understand the life cycle of transactions
- Enhance blacklister functionality to include levenshtein logic. (credit to @sogoiii and @409H for their help!)

## 3.9.1 2017-7-19

- No longer automatically request 1 ropsten ether for the first account in a new vault.
- Now redirects from known malicious sites faster.
- Added a link to our new support page to the help screen.
- Fixed bug where a new transaction would be shown over the current transaction, creating a possible timing attack against user confirmation.
- Fixed bug in nonce tracker where an incorrect nonce would be calculated.
- Lowered minimum gas price to 1 Gwei.

## 3.9.0 2017-7-12

- Now detects and blocks known phishing sites.

## 3.8.6 2017-7-11

- Make transaction resubmission more resilient.
- No longer validate nonce client-side in retry loop.
- Fix bug where insufficient balance error was sometimes shown on successful transactions.

## 3.8.5 2017-7-7

- Fix transaction resubmit logic to fail slightly less eagerly.

## 3.8.4 2017-7-7

- Improve transaction resubmit logic to fail more eagerly when a user would expect it to.

## 3.8.3 2017-7-6

- Re-enable default token list.
- Add origin header to dapp-bound requests to allow providers to throttle sites.
- Fix bug that could sometimes resubmit a transaction that had been stalled due to low balance after balance was restored.

## 3.8.2 2017-7-3

- No longer show network loading indication on config screen, to allow selecting custom RPCs.
- Visually indicate that network spinner is a menu.
- Indicate what network is being searched for when disconnected.

## 3.8.1 2017-6-30

- Temporarily disabled loading popular tokens by default to improve performance.
- Remove SEND token button until a better token sending form can be built, due to some precision issues.
- Fix precision bug in token balances.
- Cache token symbol and precisions to reduce network load.
- Transpile some newer JavaScript, restores compatibility with some older browsers.

## 3.8.0 2017-6-28

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

## 3.7.8 2017-6-12

- Add an `ethereum:` prefix to the QR code address
- The default network on installation is now MainNet
- Fix currency API URL from cryptonator.
- Update gasLimit params with every new block seen.
- Fix ENS resolver symbol UI.

## 3.7.7 2017-6-8

- Fix bug where metamask would show old data after computer being asleep or disconnected from the internet.

## 3.7.6 2017-6-5

- Fix bug that prevented publishing contracts.

## 3.7.5 2017-6-5

- Prevent users from sending to the `0x0` address.
- Provide useful errors when entering bad characters in ENS name.
- Add ability to copy addresses from transaction confirmation view.

## 3.7.4 2017-6-2

- Fix bug with inflight cache that caused some block lookups to return bad values (affected OasisDex).
- Fixed bug with gas limit calculation that would sometimes create unsubmittable gas limits.

## 3.7.3 2017-6-1

- Rebuilt to fix cache clearing bug.

## 3.7.2 2017-5-31

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

## 3.7.0 2017-5-23

- Add Transaction Number (nonce) to transaction list.
- Label the pending tx icon with a tooltip.
- Fix bug where website filters would pile up and not deallocate when leaving a site.
- Continually resubmit pending txs for a period of time to ensure successful broadcast.
- ENS names will no longer resolve to their owner if no resolver is set. Resolvers must be explicitly set and configured.

## 3.6.5 2017-5-17

- Fix bug where edited gas parameters would not take effect.
- Trim currency list.
- Enable decimals in our gas prices.
- Fix reset button.
- Fix event filter bug introduced by newer versions of Geth.
- Fix bug where decimals in gas inputs could result in strange values.

## 3.6.4 2017-5-8

- Fix main-net ENS resolution.

## 3.6.3 2017-5-8

- Fix bug that could stop newer versions of Geth from working with MetaMask.

## 3.6.2 2017-5-8

- Input gas price in Gwei.
- Enforce Safe Gas Minimum recommended by EthGasStation.
- Fix bug where block-tracker could stop polling for new blocks.
- Reduce UI size by removing internal web3.
- Fix bug where gas parameters would not properly update on adjustment.

## 3.6.1 2017-4-30

- Made fox less nosy.
- Fix bug where error was reported in debugger console when Chrome opened a new window.

## 3.6.0 2017-4-26

- Add Rinkeby Test Network to our network list.

## 3.5.4 2017-4-25

- Fix occasional nonce tracking issue.
- Fix bug where some events would not be emitted by web3.
- Fix bug where an error would be thrown when composing signatures for networks with large ID values.

## 3.5.3 2017-4-24

- Popup new transactions in Firefox.
- Fix transition issue from account detail screen.
- Revise buy screen for more modularity.
- Fixed some other small bugs.

## 3.5.2 2017-3-28

- Fix bug where gas estimate totals were sometimes wrong.
- Add link to Kovan Test Faucet instructions on buy view.
- Inject web3 into loaded iFrames.

## 3.5.1 2017-3-27

- Fix edge case where users were unable to enable the notice button if notices were short enough to not require a scrollbar.

## 3.5.0 2017-3-27

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

## 3.4.0 2017-3-8

- Add two most recently used custom RPCs to network dropdown menu.
- Add personal_sign method support.
- Add personal_ecRecover method support.
- Add ability to customize gas and gasPrice on the transaction approval screen.
- Increase default gas buffer to 1.5x estimated gas value.

## 3.3.0 2017-2-20

- net_version has been made synchronous.
- Test suite for migrations expanded.
- Network now changeable from lock screen.
- Improve test coverage of eth.sign behavior, including a code example of verifying a signature.

## 3.2.2 2017-2-8

- Revert eth.sign behavior to the previous one with a big warning.  We will be gradually implementing the new behavior over the coming time. https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign

- Improve test coverage of eth.sign behavior, including a code example of verifying a signature.

## 3.2.2 2017-2-8

- Revert eth.sign behavior to the previous one with a big warning.  We will be gradually implementing the new behavior over the coming time. https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign

## 3.2.1 2017-2-8

- Revert back to old style message signing.
- Fixed some build errors that were causing a variety of bugs.

## 3.2.0 2017-2-8

- Add ability to import accounts in JSON file format (used by Mist, Geth, MyEtherWallet, and more!)
- Fix unapproved messages not being included in extension badge.
- Fix rendering bug where the Confirm transaction view would let you approve transactions when the account has insufficient balance.

## 3.1.2 2017-1-24

- Fix "New Account" default keychain

## 3.1.1 2017-1-20

- Fix HD wallet seed export

## 3.1.0 2017-1-18

- Add ability to import accounts by private key.
- Fixed bug that returned the wrong transaction hashes on private networks that had not implemented EIP 155 replay protection (like TestRPC).

## 3.0.1 2017-1-17

- Fixed bug that prevented eth.sign from working.
- Fix the displaying of transactions that have been submitted to the network in Transaction History

## 3.0.0 2017-1-16

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

## 2.14.1 2016-12-20

- Update Coinbase info. and increase the buy amount to $15
- Fixed ropsten transaction links
- Temporarily disable extension reload detection causing infinite reload bug.
- Implemented basic checking for valid RPC URIs.

## 2.14.0 2016-12-16

- Removed Morden testnet provider from provider menu.
- Add support for notices.
- Fix broken reload detection.
- Fix transaction forever cached-as-pending bug.

## 2.13.11 2016-11-23

- Add support for synchronous RPC method "eth_uninstallFilter".
- Forgotten password prompts now send users directly to seed word restoration.

## 2.13.10 2016-11-22

- Improve gas calculation logic.
- Default to Dapp-specified gas limits for transactions.
- Ropsten networks now properly point to the faucet when attempting to buy ether.
- Ropsten transactions now link to etherscan correctly.

## 2.13.9 2016-11-21

- Add support for the new, default Ropsten Test Network.
- Fix bug that would cause MetaMask to occasionally lose its StreamProvider connection and drop requests.
- Fix bug that would cause the Custom RPC menu item to not appear when Localhost 8545 was selected.
- Point ropsten faucet button to actual faucet.
- Phase out ethereumjs-util from our encryptor module.

## 2.13.8 2016-11-16

- Show a warning when a transaction fails during simulation.
- Fix bug where 20% of gas estimate was not being added properly.
- Render error messages in confirmation screen more gracefully.

## 2.13.7 2016-11-8

- Fix bug where gas estimate would sometimes be very high.
- Increased our gas estimate from 100k gas to 20% of estimate.
- Fix GitHub link on info page to point at current repository.

## 2.13.6 2016-10-26

- Add a check for improper Transaction data.
- Inject up to date version of web3.js
- Now nicknaming new accounts "Account #" instead of "Wallet #" for clarity.
- Fix bug where custom provider selection could show duplicate items.
- Fix bug where connecting to a local morden node would make two providers appear selected.
- Fix bug that was sometimes preventing transactions from being sent.

## 2.13.5 2016-10-18

- Increase default max gas to `100000` over the RPC's `estimateGas` response.
- Fix bug where slow-loading dapps would sometimes trigger infinite reload loops.

## 2.13.4 2016-10-17

- Add custom transaction fee field to send form.
- Fix bug where web3 was being injected into XML files.
- Fix bug where changing network would not reload current Dapps.

## 2.13.3 2016-10-4

- Fix bug where log queries were filtered out.
- Decreased vault confirmation button font size to help some Linux users who could not see it.
- Made popup a little taller because it would sometimes cut off buttons.
- Fix bug where long account lists would get scrunched instead of scrolling.
- Add legal information to relevant pages.
- Rename UI elements to be more consistent with one another.
- Updated Terms of Service and Usage.
- Prompt users to re-agree to the Terms of Service when they are updated.

## 2.13.2 2016-10-4

- Fix bug where chosen FIAT exchange rate does no persist when switching networks
- Fix additional parameters that made MetaMask sometimes receive errors from Parity.
- Fix bug where invalid transactions would still open the MetaMask popup.
- Removed hex prefix from private key export, to increase compatibility with Geth, MyEtherWallet, and Jaxx.

## 2.13.1 2016-09-23

- Fix a bug with estimating gas on Parity
- Show loading indication when selecting ShapeShift as purchasing method.

## 2.13.0 2016-09-18

- Add Parity compatibility, fixing Geth dependency issues.
- Add a link to the transaction in history that goes to https://metamask.github.io/eth-tx-viz
too help visualize transactions and to where they are going.
- Show "Buy Ether" button and warning on tx confirmation when sender balance is insufficient

## 2.12.1 2016-09-14

- Fixed bug where if you send a transaction from within MetaMask extension the
popup notification opens up.
- Fixed bug where some tx errors would block subsequent txs until the plugin was refreshed.

## 2.12.0 2016-09-14

- Add a QR button to the Account detail screen
- Fixed bug where opening MetaMask could close a non-metamask popup.
- Fixed memory leak that caused occasional crashes.

## 2.11.1 2016-09-12

- Fix bug that prevented caches from being cleared in Opera.

## 2.11.0 2016-09-12

- Fix bug where pending transactions from Test net (or other networks) show up In Main net.
- Add fiat conversion values to more views.
- On fresh install, open a new tab with the MetaMask Introduction video. Does not open on update.
- Block negative values from transactions.
- Fixed a memory leak.
- MetaMask logo now renders as super lightweight SVG, improving compatibility and performance.
- Now showing loading indication during vault unlocking, to clarify behavior for users who are experiencing slow unlocks.
- Now only initially creates one wallet when restoring a vault, to reduce some users' confusion.

## 2.10.2 2016-09-02

- Fix bug where notification popup would not display.

## 2.10.1 2016-09-02

- Fix bug where provider menu did not allow switching to custom network from a custom network.
- Sending a transaction from within MetaMask no longer triggers a popup.
- The ability to build without livereload features (such as for production) can be enabled with the gulp --disableLiveReload flag.
- Fix Ethereum JSON RPC Filters bug.

## 2.10.0 2016-08-29

- Changed transaction approval from notifications system to popup system.
- Add a back button to locked screen to allow restoring vault from seed words when password is forgotten.
- Forms now retain their values even when closing the popup and reopening it.
- Fixed a spelling error in provider menu.

## 2.9.2 2016-08-24

- Fixed shortcut bug from preventing installation.

## 2.9.1 2016-08-24

- Added static image as fallback for when WebGL isn't supported.
- Transaction history now has a hard limit.
- Added info link on account screen that visits Etherscan.
- Fixed bug where a message signing request would be lost if the vault was locked.
- Added shortcut to open MetaMask (Ctrl+Alt+M or Cmd+Opt/Alt+M)
- Prevent API calls in tests.
- Fixed bug where sign message confirmation would sometimes render blank.

## 2.9.0 2016-08-22

- Added ShapeShift to the transaction history
- Added affiliate key to Shapeshift requests
- Added feature to reflect current conversion rates of current vault balance.
- Modify balance display logic.

## 2.8.0 2016-08-15

- Integrate ShapeShift
- Add a form for Coinbase to specify amount to buy
- Fix various typos.
- Make dapp-metamask connection more reliable
- Remove Ethereum Classic from provider menu.

## 2.7.3 2016-07-29

- Fix bug where changing an account would not update in a live Dapp.

## 2.7.2 2016-07-29

- Add Ethereum Classic to provider menu
- Fix bug where host store would fail to receive updates.

## 2.7.1 2016-07-27

- Fix bug where web3 would sometimes not be injected in time for the application.
- Fixed bug where sometimes when opening the plugin, it would not fully open until closing and re-opening.
- Got most functionality working within Firefox (still working on review process before it can be available).
- Fixed menu dropdown bug introduced in Chrome 52.

## 2.7.0 2016-07-21

- Added a Warning screen about storing ETH
- Add buy Button!
- MetaMask now throws descriptive errors when apps try to use synchronous web3 methods.
- Removed firefox-specific line in manifest.

## 2.6.2 2016-07-20

- Fixed bug that would prevent the plugin from reopening on the first try after receiving a new transaction while locked.
- Fixed bug that would render 0 ETH as a non-exact amount.

## 2.6.1 2016-07-13

- Fix tool tips on Eth balance to show the 6 decimals
- Fix rendering of recipient SVG in tx approval notification.
- New vaults now generate only one wallet instead of three.
- Bumped version of web3 provider engine.
- Fixed bug where some lowercase or uppercase addresses were not being recognized as valid.
- Fixed bug where gas cost was misestimated on the tx confirmation view.

## 2.6.0 2016-07-11

- Fix formatting of ETH balance
- Fix formatting of account details.
- Use web3 minified dist for faster inject times
- Fix issue where dropdowns were not in front of icons.
- Update transaction approval styles.
- Align failed and successful transaction history text.
- Fix issue where large domain names and large transaction values would misalign the transaction history.
- Abbreviate ether balances on transaction details to maintain formatting.
- General code cleanup.

## 2.5.0 2016-06-29

- Implement new account design.
- Added a network indicator mark in dropdown menu
- Added network name next to network indicator
- Add copy transaction hash button to completed transaction list items.
- Unify wording for transaction approve/reject options on notifications and the extension.
- Fix bug where confirmation view would be shown twice.

## 2.4.5 2016-06-29

- Fixed bug where MetaMask interfered with PDF loading.
- Moved switch account icon into menu bar.
- Changed status shapes to be a yellow warning sign for failure and ellipsis for pending transactions.
- Now enforce 20 character limit on wallet names.
- Wallet titles are now properly truncated in transaction confirmation.
- Fix formatting on terms & conditions page.
- Now enforce 30 character limit on wallet names.
- Fix out-of-place positioning of pending transaction badges on wallet list.
- Change network status icons to reflect current design.

## 2.4.4 2016-06-23

- Update web3-stream-provider for batch payload bug fix

## 2.4.3 2016-06-23

- Remove redundant network option buttons from settings page
- Switch out font family Transat for Montserrat

## 2.4.2 2016-06-22

- Change out export icon for key.
- Unify copy to clipboard icon
- Fixed eth.sign behavior.
- Fix behavior of batched outbound transactions.

## 2.4.0 2016-06-20

- Clean up UI.
- Remove nonfunctional QR code button.
- Make network loading indicator clickable to select accessible network.
- Show more characters of addresses when space permits.
- Fixed bug when signing messages under 64 hex characters long.
- Add disclaimer view with placeholder text for first time users.

## 2.3.1 2016-06-09

- Style up the info page
- Cache identicon images to optimize for long lists of transactions.
- Fix out of gas errors

## 2.3.0 2016-06-06

- Show network status in title bar
- Added seed word recovery to config screen.
- Clicking network status indicator now reveals a provider menu.

## 2.2.0 2016-06-02

- Redesigned init, vault create, vault restore and seed confirmation screens.
- Added pending transactions to transaction list on account screen.
- Clicking a pending transaction takes you back to the transaction approval screen.
- Update provider-engine to fix intermittent out of gas errors.

## 2.1.0 2016-05-26

- Added copy address button to account list.
- Fixed back button on confirm transaction screen.
- Add indication of pending transactions to account list screen.
- Fixed bug where error warning was sometimes not cleared on view transition.
- Updated eth-lightwallet to fix a critical security issue.

## 2.0.0 2016-05-23

- UI Overhaul per Vlad Todirut's designs.
- Replaced identicons with jazzicons.
- Fixed glitchy transitions.
- Added support for capitalization-based address checksums.
- Send value is no longer limited by javascript number precision, and is always in ETH.
- Added ability to generate new accounts.
- Added ability to locally nickname accounts.

## 1.8.4 2016-05-13

- Point rpc servers to https endpoints.

## 1.8.3 2016-05-12

- Bumped web3 to 0.6.0
- Really fixed `eth_syncing` method response.

## 1.8.2 2016-05-11

- Fixed bug where send view would not load correctly the first time it was visited per account.
- Migrated all users to new scalable backend.
- Fixed `eth_syncing` method response.

## 1.8.1 2016-05-10

- Initial usage of scalable blockchain backend.
- Made official providers more easily configurable for us internally.

## 1.8.0 2016-05-10

- Add support for calls to `eth.sign`.
- Moved account exporting within subview of the account detail view.
- Added buttons to the account export process.
- Improved visual appearance of account detail transition where button heights would change.
- Restored back button to account detail view.
- Show transaction list always, never collapsed.
- Changing provider now reloads current Dapps
- Improved appearance of transaction list in account detail view.

## 1.7.0 2016-04-29

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

## 1.6.0 2016-04-22

- Pending transactions are now persisted to localStorage and resume even after browser is closed.
- Completed transactions are now persisted and can be displayed via UI.
- Added transaction list to account detail view.
- Fix bug on config screen where current RPC address was always displayed wrong.
- Fixed bug where entering a decimal value when sending a transaction would result in sending the wrong amount.
- Add save button to custom RPC input field.
- Add quick-select button for RPC on `localhost:8545`.
- Improve config view styling.
- Users have been migrated from old test-net RPC to a newer test-net RPC.

## 1.5.1 2016-04-15

- Corrected text above account list. Selected account is visible to all sites, not just the current domain.
- Merged the UI codebase into the main plugin codebase for simpler maintenance.
- Fix Ether display rounding error. Now rendering to four decimal points.
- Fix some inpage synchronous methods
- Change account rendering to show four decimals and a leading zero.

## 1.5.0 2016-04-13

- Added ability to send ether.
- Fixed bugs related to using Javascript numbers, which lacked appropriate precision.
- Replaced Etherscan main-net provider with our own production RPC.

## 1.4.0 2016-04-08

- Removed extra entropy text field for simplified vault creation.
- Now supports exporting an account's private key.
- Unified button and input styles across the app.
- Removed some non-working placeholder UI until it works.
- Fix popup's web3 stream provider
- Temporarily deactivated fauceting indication because it would activate when restoring an empty account.

## 1.3.2 2016-04-04

 - When unlocking, first account is auto-selected.
 - When creating a first vault on the test-net, the first account is auto-funded.
 - Fixed some styling issues.

## 1.0.1-1.3.1

Many changes not logged. Hopefully beginning to log consistently now!

## 1.0.0

Made seed word restoring BIP44 compatible.

## 0.14.0

Added the ability to restore accounts from seed words.

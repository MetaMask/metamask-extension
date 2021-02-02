# Changelog

## Current Develop Branch

## 0.5.11 Tue Feb 02 2021

- fix: token balance not showing automatically (#301)

## 0.5.10 Tue Feb 02 2021

- chore: format
- feat: set default idle lock timer to 5min, #5xpw3d PORTAL-256
- feat: ui level new base32 address, WIP
- ci: run unit-test on gh
- feat: new @cfx/fullnode version
- test: fix unit/e2e test
- feat: add multiple addr to account detail modal
- feat: use base32 addr for account link to scan
- feat: support base32 in add token and approve
- feat: support base32 address in address book
- fix: \$0.00 currency display bug
- feat: hex addr warning in address book
- feat: alter docs about address
- fix: add-recipient unit tests
- fix: use new cip37 charset
- fix: remove current network
- feat: new address slicer
- fix: remove qrcode
- test: address slicer unit test
- feat: support hex address when add token
- test: remove qrcode e2e test
- feat: scan address converter url
- feat: base32 addr in choose account
- fix: base32 addr notice wording
- fix: missing i18n PORTAL-428
- feat: support scan's new token list api
- fix: network name tag PORTAL-369
- fix: base32 address out of ui PORTAL-426
- fix: i18n PORTAL-442
- fix: PORTAL-444 edit contact, remove the right address from addr book
- fix: wallet seed, < back i18n
- fix: use https for scantest.confluxscan.io
- fix: base32 address in permission confirm page

## 0.5.9 Thu Dec 31 2020

- fix: cfx_requestAccounts CU-ggztjn CU-59v4cv
- feat: use popup instead of tab for login
- fix: gasPrice to 1 in e2e test
- feat: remove ConfluxWeb, upgrade js-conflux-sdk to 1.1.4
- fix: add tx value replace into activity log
- fix: remove block gas limit logic when estimate gas
- feat: update schema, fullnode, keyring controller
- fix(account-tracker): balance error
- fix: willUserPayTxFee error when opening gas modal
- fix: more strict check before tx resign
- fix: add status for tx missing `rawTx`
- fix: pending middleware method names
- fix(inpage): used precompiled js-conflux-sdk
- feat: upgrade sdk to v1.1.6
- feat: remove zh_TW
- feat: add/restore account wording

## 0.5.8 Thu Nov 19 2020

- fix: multiply 1drip with 1.1
- fix(nonce-tracker): failed to filter tx with address

## 0.5.7 Wed Nov 18 2020

- fix(tx): finished tx status

## 0.5.6 Wed Nov 18 2020

- fix(rpc): undefined block tag

## 0.5.5 Wed Nov 18 2020

- fix(account-tracker): support conflux block tag
- fix: chainId type error expected type string got type number when add custom rpc
- feat: raise tx history limit to 100
- refactor: cleanup tx logic
- fix(gas): disable next when gas price too low
- chore(upgrade): sentry package
- fix(network): getStatus network error PORTAL-H6
- refactor: cleanup
- fix: send-util gasPrice is hex
- fix(tx): resubmit less often, don't resubmit executed tx

## 0.5.4 Sun Nov 15 2020

- fix: set useNativeCurrencyAsPrimaryCurrency to false (#271)
- Merge branch 'master' into develop
- feat: remove hardcode timestamp CU-4xx8qt
- ci: remove the --cache-from latest image
- refactor: Merge branch 'master' into develop
- fix: error message
- refactor: make confirmTransaction function more readable
- fix: tx error message
- refactor: format
- feat: show gas in drip, error when lower than 1 drip
- refactor: format\$
- feat: upgrade sentry sdk, add tethys migration
- feat: use new scan token api
- feat: use new scan api to get nonce
- fix: sinagure request page showing the wrong account
- feat: test with fullnode v1.0.2
- fix: e2e tests
- fix: show balance .xxx with 0.xxx
- fix: makes network reconnect more responsive
- fix(send-component): hexdata validation
- fix: sentEther i18n CU-4vukp4
- fix(send-component): re estimate even in simple send
- fix(gas-input): recheck gas info even insufficient balance
- fix: incorrect password i18n
- fix: style in dapp auth page CU-4vqxec
- feat(gas): use 1drip as default gas for now
- fix(send): don't block user with gas error when adv inline gas is off
- fix(customNonce): can't set custom nonce to 0

## 0.5.3 Wed Oct 28 2020

- fix: wrong CFX balance

## 0.5.2 Wed Oct 28 2020

- fix: set useNativeCurrencyAsPrimaryCurrency to false (#271)

## 0.5.1 Wed Oct 28 2020

- fix: testnet chainid

## 0.5.0 Tue Oct 27 2020

- docs: update changelog
- fix: tx stay executed even already confirmed on scan
- feat: new chainId
- fix: pending tx tracker rick calc
- fix: privacy link CU-4vum5q
- fix: zh i18n CU-4vuk86
- fix: testnet scan url CU-4vum7x
- fix: template literal typo
- fix: 12539 -> 12537 CU-4vum7x

## 0.4.3 Sun Oct 25 2020

- bug-fixes origin/pr/262 262 fix: qrcode info CU-4vuk4d
- fix: turn off gas fee too low warning
- feat: new rpc domain CU-4tuffb
- fix: can't adjust gas limit with up/down arrow button
- test: with latest fullnode
- fix: validate user input hex data
- fix(add-recipient): show recipient error even there's contacts and recents
- fix: update missing zh-cn checksum error trans

## 0.4.2 Fri Oct 23 2020

- ci: fix release message for semantic pr check (#254)
- fix: add more knowntx error message (#255)
- feat: support cfx_clientVersion rpc method (#256)
- feat: add params to req url in dev (#257)
- fix: signature error CU-4ntggp (#253)

## 0.4.0 Fri Oct 09 2020

- feat: add simple gas feature back
- fix: balance check when send cfx, data error when in approve pageca
- fix: sponsor info in advanced gas modal
- test: turn on advanced gas be default in e2e test
- fix: typo
- feat: new sponsor ui, more loading indication
- feat: new CFX logo
- feat: sponsor info in gas modal
- fix: e2e test on gas ui change
- feat: strike through sponsored gas fee
- fix: default gas to 1e-9 instaed of 0 CU-cwphd3
- fix: gas/collateral input to 0 when user delete all value
- fix: advanced gas input, don't allow negative number
- test: more robust e2e test
- fix: unit test for advanced gas input negative number change
- feat: check address tx count in send component
- test: more robust e2e test
- fix: total tx fee ui
- fix: bug that can't adjust number input with button
- fix: en i18n change CU-4hnyr9
- feat: add executed tx status

## 0.3.11 Fri Sep 25 2020

- ci: run key e2e test after other tests
- ci: fix semantic error in release pr and master pr
- feat: add address warning, replace send input placeholder
- feat(send): check address in send component
- feat: add send to smart contract warning
- feat: add address warning

## 0.3.10 Tue Sep 22 2020

- fix(send): update gas info when sponsorship info loaded
- fix: sponsor ui into approve page, advacned gas row

## 0.3.9 Sat Sep 19 2020

- fix: check sponsor info for all tokens (#233)

## 0.3.8 Thu Sep 17 2020

- fix: default network is not testnet anymore (#230)

## 0.3.7 Wed Sep 16 2020

- fix: remove unused show incoming txs option (#224)
- fix: more cn trans, remove hardware wallet tab, remove some doc (#226)
- feat: new logo and primary color (#227)

## 0.3.6 Wed Sep 16 2020

- fix: network loading indicator (#216)
- fix: remove index of other languages (#218)
- fix: render boolean value in signature request message (#220)
- fix: cors error sending request to scan on firefox (#217)

## 0.3.5 Mon Aug 31 2020

- fix(tx-list): toLowerCase error when display contract creation tx (#210)
- refactor: append method name to end of rpc url
- fix(getTransactionByHash): response getTransactionByHash as defined in spec
- fix: upgrade package to fix yarn audit error
- fix: noisy warnning in console

## 0.3.4 Thu Jul 30 2020

- fix: wrong chainId failing balance check (#204)

## 0.3.3 Mon Jul 27 2020

- fix(add-recipient): remove ens error (#199)
- fix(i18n): use only zh_CN zh_TW en (#200)

## 0.3.2 Thu Jul 23 2020

- fix(permission): remove unused permissions (#195)

## 0.3.1 Sat Jul 18 2020

- chore(deps): use new conflux local network lite @cfxjs/fullnode (#189)
- docs(trans): Pontus -> Oceanus don't depends on time (#190)
- chore: test with fullnode 0.6.0-rc3 (#191)
- fix(contract-manager-api): add pagination query params (#192)

## 0.3.0 Wed Jul 15 2020

- fix: sentry sourcemap upload (#181)
- feat: update for new version of fullnode (#182)

## 0.2.4 Fri Jul 03 2020

- feat(sign): support cfx_signTypedData_v4, change cfx_sign logic back (#176)
- feat(jssdk): use js-conflux-sdk@0.11.0 (#177)

## 0.2.3 Tue Jun 30 2020

- Fix: dockerfile, less build level (#147)
- Add: format comments in dockerfile (#148)
- Fix: reorder task (#149)
- Fix: buildkite can't get the right exit code from e2e bash script (#150)
- Docs: update documents (#151)
- Add: new chainId logic (#156)
- Fix: hide conversion rate text (#157)
- chore: semantic.yml for semantic pr ci check (#161)
- chore: use new js-conflux-sdk (#162)
- chore: update cfx packages (#165)
- fix: update packages, use new personal_sign (#168)
- fix: fork metamask's phishing detection functionality (#170)
- fix: Ethereum -> Conflux in i18n files (#169)
- fix: remove ens error (#171)

## 0.2.2 Thu May 28 2020

- Add: buildkite to speed up ci (#136)
- Fix: buildkite invalid branch name
- remove reent block tracker, use 'cfx_gasPrice' method to get gas price (#141)
- Fix: sentry project name (#143)

## 0.2.1 Fri May 22 2020

- modify decimal of balance (#129)
- bugfix: check whether keyring is null (#131)
- Fix: insufficientFunds error while sending token at send page with 0 CFX (#133)

## 0.2.0 Thu May 14 2020

- Add: sponsor feature (#124)
- Add: chinese trans in send and confirm page (#126)
- Add: add cfx_checkBalanceAgainstTransaction method support
- Add: seperate fee and collateral ui

## 0.1.9 Thu May 07 2020

- Fix: firefox e2e back into all-test-pass
- Add: cfx pontus warning
- Add: ci cache yarn cache and node_modules
- Add: zh_CN trans
- Fix: hide delete contact button when it's 'myAccounts'
- Fix: cache .har file
- Add: auto lock timer placeholder to 0 #100
- Add: more trans
- Add: update sentry org and project name #106
- Fix: ci cache .har file
- Fix: verify local error
- Fix: ci cache har error
- Fix: e2e test change network to testnet
- Fix: i18n MetaMask -> ConfluxPortal, add confluxscan.io into manifest.json
- Add: set appName to ConfluxPortal directly in manifest.json
- Fix: react error after reimport different seed phrase
- Clean: readme
- Add: disabled token rates controller
- Add: get trusted token from confluxscan

## 0.1.9 Thu May 07 2020

## 0.1.8 Mon Apr 27 2020

- Version v0.1.7
- Fix: firefox e2e test
- Remove unused sinon sandboxes (#8063)
- Implementation encrypt/decrypt feature (#7831)
- Remove unused container prop (#8076)
- Fix: faucet url
- Fix: can't get token balance error link
- Clean: only show fc if balance is not zero
- Close notification UI if no unapproved confirmations (#8358)
- Fix: focus popup no matter already opened
- Revert "Fix: benchmark"
- Fix: test-net token -> test token

## 0.1.7 Sun Apr 26 2020

- Version v0.1.5
- Add: update changelog
- Fix: Main Conflux Network -> Conflux Main Network
- Fix: scan link, testnet scan link
- Add: more i18n
- Version v0.1.6
- Add: more trans
- Fix: react network proptype
- Fix: changelog
- Add: favicon for e2e dapp demo
- Add: mainnet faucet #89
- Add: conflux logo to e2e test app
- Fix: faucet url for two rpc
- Add: use new fc address
- Fix: convert gas price
- Add: new ver fullnode
- Version v0.1.6
- Add: more trans
- Fix: react network proptype

## 0.1.6 Thu Apr 23 2020

- Add: update changelog
- Fix: Main Conflux Network -> Conflux Main Network
- Fix: scan link, testnet scan link
- Add: more i18n

## 0.1.5 Wed Apr 22 2020

- Fix: don't count stroageLimit into total tx fee (#73)
- Merge remote-tracking branch 'origin/master' into master->dev
- Merge remote-tracking branch 'origin/master' into master->dev
- Fix: confluxscan url (#77)
- Fix: hardware wallet image
- Add: balance track contract
- Add: mainnet wording
- Add: default to conflux pontus
- Add: update network lite version
- Add: export all sdk interface
- Add: skipped -> failed
- Add: fix lint
- Add: hide hardware wallet
- Add: auth page trans
- Version v0.1.5

## 0.1.4 Fri Apr 17 2020

- Fix: don't count stroageLimit into total tx fee (#73)
- Add: new fc address

## 0.1.3 Thu Apr 16 2020

- Version v0.1.0 RC (#64)
- Add: upgrade multihashes (#67)
- Add: changelog
- Version v0.1.0
- Version v0.0.9 RC (#58)
- Add: new address rule, conflux hdpath
- Add: update local-network-lite to 2.0.3
- Add: getTransactionCount -> getNextNonce
- Add: new storage, epoch height, nonce logic
- Add: update keyring controller to 5.6.5
- Add: change chainId
- Add: new sign logic, v to 27 28, won't depend on chainId
- Fix: e2e test initial state
- Add: new gas/storage logic
- Add: update local-network-lite and chromedriver
- Fix: lint
- Fix: remove duplicate mocha settings
- Fix: remove killPortProcess option, no lsof on circle ci test container
- Fix: e2e tests, update js-conflux-sdk to 0.9.1
- Fix: try fix ci chromedriver version issue
- Add: testnet cfx warning, use new fc contract address
- Add: fc by default
- Fix: logo image
- Add: install latest chrome
- Fix: default show fc e2e test
- Fix: use info-circle.svg instead of fa-info-circle
- Fix: testnet cfx warning
- Clean: chrome-install script
- Fix: benchmark
- Clean: remove mm-secure logo
- Add: change send cfx placeholder
- Fix: zh_CN documents
- Fix: Conflux Portal -> ConfluxPortal
- Add: test on latest version of fullnode
- Add: addresses -> address
- Fix: Confluxscan -> ConfluxScan 种子密语 -> 助记词
- Add: update local network lite
- Fix: upgrade conflux-local-network-lite
- Add: test on latest fullnode
- Add: i18n
- Version v0.1.3

## 0.1.0 Fri Mar 27 2020

- Sync Version v0.0.9 RC (#58) from master (#60)
- new sign logic (#62)
- Change logo, mail, faq, tos links (#63)

## 0.1.0 Fri Mar 27 2020

- Sync Version v0.0.9 RC (#58) from master (#60)
- new sign logic (#62)
- Change logo, mail, faq, tos links (#63)

## 0.0.9 Thu Mar 12 2020

- Version v0.0.7 (#43)
- Version v0.0.5 (#33)
- Version v0.0.6 (#38)
- update/cleanup packages (#46)
- update readme.md (#45)
- Fix: average estimate gas price unit (#47)
- Version v0.0.8 (#49)
- Fix: changelog.md (#50)
- Fix e2e tests (#56)
- Add rlp to support new version of testnet (#57)

## 0.0.9 Thu Mar 12 2020

## 0.0.8 Tue Feb 20 2020

- update/cleanup packages (#46)
- update readme.md (#45)
- Fix: average estimate gas price unit (#47)

## 0.0.7 Tue Feb 17 2020

- Fix: release file blob
- Fix: circle ci artifact url
- Docs: issue templates, codeowners, docs, support emails
- Docs: move docs to conflux-portal-docs
- Fix: MetaMask -> ConfluxPortal in announcement script
- Fix: disable misleading changelog prefix
- Fix: shelllint
- Add page navigation to e2e web driver (#7867)
- Revert the revert of "Use common test build during CI (#7196)" (#7404) (#7870)
- Add `withFixtures` helper and simple-send test (#7862)
- Add 1 second pause at the beginning of each e2e test run (#7872)
- Remove unnecessary `shouldComponentUpdate` (#7875)
- Fix intermittent e2e test failure (#7873)
- Add benchmark script (#7869)
- Update inpage provider (#7878)
- Remove unused browser-passworder dependency from package.json (#7879)
- Add margin of error metric (#7877)
- Change "Log In/Out" terminology to "Unlock/Lock" (#7853)
- Add mechanism to randomize seed phrase filename (#7863)
- Use shared MetaMask ESLint config (#7882)
- Remove unnecessary WebRTC shim (#7886)
- Replace DetectRTC package with standard web APIs (#7887)
- Add benchmark to CI (#7871)
- Use ref in Mascot component rather than reaching into DOM directly (#7893)
- Remove unnecessary `withRouter` and `compose` calls (#7890)
- Remove unnecessary get environment type parameter (#7891)
- Add top-level error page (#7889)
- Update GABA dependency version (#7894)
- Replace `request-promise` with `node-fetch` (#7899)
- Update Sentry to v5.x (#7880)
- Minimum changes to get storybook working (#7884)
- Fixing broken JSON import help link (#7910)
- Remove xtend from the dependencies list (#7902)
- Update `classnames` to `v2.2.6` (#7906)
- Replace bluebird with Node.js API for unhandled rejections (#7904)
- Comment out `storybook-deploy` step (#7913)
- Switch to full lodash package, and update lodash (#7907)
- Update `c3` and `d3` (#7905)
- Replace `deep-extend` with `merge` from `lodash` (#7908)
- Improve LoginPerSite UX/devX and permissions logging (#7649)
- disable import button on Import Account screen for empty string/file (#7912)
- Update data on Approve screen after updating custom spend limit (#7918)
- Remove usage of unlisted extend dependency (#7903)
- Remove JSDoc tools (#7897)
- Update jazzicon component (#7898)
- Allow editing max spend limit (#7919)
- Report errors in tests to `test-metamask` Sentry project (#7924)
- Bump Node version to 10.18 (#7925)
- Remove top-level symlinks (#7927)
- Replace `clone` dependency with `cloneDeep` from lodash (#7926)
- Remove redux-logger from mock-store (#7930)
- Delete unused .dockerignore file (#7929)
- Replace `debounce` package with `debounce` function from `lodash` (#7931)
- Remove unused promise-filter dependency (#7932)
- Validate custom spend limit (#7920)
- Delete outdated team page (#7928)
- Replace mkdirp with built-in functionality (#7934)
- Sorting seed phrase confirmation buttons alphabetically (#7933)
- Replace fast-deep-equal with isEqual from lodash (#7935)
- Move devDeps into devDeps (#7936)
- Remove unused number-to-bn package (#7937)
- Add Sentry environment (#7923)
- Move polyfill-crypto.getrandomvalues to devDeps (#7938)
- Fix: syntax error
- Remove unused fs-extra and fs-promise devDependencies (#7939)
- Remove unused rimraf devDependency (#7940)
- Remove unnecessary 'path' dependency (#7942)
- Only resolve ENS on mainnet (#7944)
- Remove unused mocha-eslint dependency (#7943)
- Inline isomorphic-fetch test helper (#7945)
- Remove dead link to team page in README (#7946)
- Remove mocha-jsdom and mocha-sinon (#7947)
- Explicitly set Sass compiler for gulp-sass (#7948)
- ci: Update shellcheck version used in CI (#7951)
- Move issue template and contributing doc to .github (#7952)
- Remove gulp-eslint and gulp-util dependency (#7949)
- Update ENS registry addresses (#7954)
- Bump tree-kill version to fix high-severity vulnerability (#7956)
- Bump node-sass to fix low-severity vulnerability (#7955)
- Remove cross-env (#7950)
- Various component tests and some conditional statements (#7765)
- Update ethereum-ens-network-map in lockfile (#7959)
- Use ethereum-ens-network-map for network support (#7960)
- Fix: lint
- Fix: unit tests
- Fix: settings network tab react dup key error
- Fix: no need to pass benchmark test to release for now
- Fix: speedup tx
- Updating deprecated Etherscam link (#7464)
- Use envify@4.1.0 (#7983)
- Use eth-json-rpc-infura@4.0.2 (#7981)
- Use eth-keyring-controller@5.5.0 (#7980)
- Use gulp@4.0.2 (#7982)
- Remove redundant eth-\*-keyring versions from yarn.lock (#7984)
- Fixes #5706 - Adds Dai/Sai to currency display (#7986)
- Add: testnet to http://testnet-jsonrpc.conflux-chain.org:12537/
- Fix: sign typed data
- Fix: conflicts with metamask, add testnet chainid
- Fix: test:lint
- Master => develop (#34)
- Fix: use fc's balanceOf instead of stateOf, treat fc as a normal… (#37)
- Add: example of sending signed typed data
- Fix SendAmountRow tests (#7968)
- Revert CircleCI Node image (#7996)
- Remove last remaining usages of `npm run` (#7994)
- update inpage-provider; minor fixes (#7997)
- Delete multi_vault_planning.md (#7988)
- Delete video_script.txt (#7989)
- Delete send-screen-QA-checklist.md (#7998)
- Use combineReducers for rootReducer (#7964)
- Delete adding-new-networks.md (#7999)
- Use readOnly (#7995)
- Delete developing-on-deps.md (#8004)
- Delete limited_site_access.md (#8007)
- Update README.md (#8005)
- Add support for 24 word seed phrases (#7987)
- Remove version bump scripts (#8006)
- Browser tests (#8010)
- Enable Storybook deploy on CI (#8009)
- Ensure we pass history to UnlockPage component (#8017)
- Use image hash for ShellCheck Docker image (#8022)
- Use contact name instead of address during send flow (#7971)
- Add: use metamask's new mocha eslint rule
- Update ESLint rules for test suite (#8023)
- Update sinon and proxyquire (#8027)
- Update mocha version (#8028)
- Add: yarn.lock
- fix faulty null checks
- update packages
- Refactor QR scanner to move all error handling within component (#7885)
- Add: html title metamask -> portal
- add title to transaction action component (#8050)
- Inline the source text not the binary encoding for inpage script (#8053)
- Add warning to watchAsset API when editing a known token (#8049)
- Update Wyre ETH purchase url (#8051)
- Fix: global detect
- Fix: lint
- Add: storybook deploy
- Add: update inpage provider to 4.0.7
- misc updates

## 0.0.6 Tue Feb 11 2020

- Fix: release file blob
- Fix: circle ci artifact url
- Docs: issue templates, codeowners, docs, support emails
- Docs: move docs to conflux-portal-docs
- Fix: MetaMask -> ConfluxPortal in announcement script
- Fix: disable misleading changelog prefix
- Fix: shelllint
- Add page navigation to e2e web driver (#7867)
- Revert the revert of "Use common test build during CI (#7196)" (#7404) (#7870)
- Add `withFixtures` helper and simple-send test (#7862)
- Add 1 second pause at the beginning of each e2e test run (#7872)
- Remove unnecessary `shouldComponentUpdate` (#7875)
- Fix intermittent e2e test failure (#7873)
- Add benchmark script (#7869)
- Update inpage provider (#7878)
- Remove unused browser-passworder dependency from package.json (#7879)
- Add margin of error metric (#7877)
- Change "Log In/Out" terminology to "Unlock/Lock" (#7853)
- Add mechanism to randomize seed phrase filename (#7863)
- Use shared MetaMask ESLint config (#7882)
- Remove unnecessary WebRTC shim (#7886)
- Replace DetectRTC package with standard web APIs (#7887)
- Add benchmark to CI (#7871)
- Use ref in Mascot component rather than reaching into DOM directly (#7893)
- Remove unnecessary `withRouter` and `compose` calls (#7890)
- Remove unnecessary get environment type parameter (#7891)
- Add top-level error page (#7889)
- Update GABA dependency version (#7894)
- Replace `request-promise` with `node-fetch` (#7899)
- Update Sentry to v5.x (#7880)
- Minimum changes to get storybook working (#7884)
- Fixing broken JSON import help link (#7910)
- Remove xtend from the dependencies list (#7902)
- Update `classnames` to `v2.2.6` (#7906)
- Replace bluebird with Node.js API for unhandled rejections (#7904)
- Comment out `storybook-deploy` step (#7913)
- Switch to full lodash package, and update lodash (#7907)
- Update `c3` and `d3` (#7905)
- Replace `deep-extend` with `merge` from `lodash` (#7908)
- Improve LoginPerSite UX/devX and permissions logging (#7649)
- disable import button on Import Account screen for empty string/file (#7912)
- Update data on Approve screen after updating custom spend limit (#7918)
- Remove usage of unlisted extend dependency (#7903)
- Remove JSDoc tools (#7897)
- Update jazzicon component (#7898)
- Allow editing max spend limit (#7919)
- Report errors in tests to `test-metamask` Sentry project (#7924)
- Bump Node version to 10.18 (#7925)
- Remove top-level symlinks (#7927)
- Replace `clone` dependency with `cloneDeep` from lodash (#7926)
- Remove redux-logger from mock-store (#7930)
- Delete unused .dockerignore file (#7929)
- Replace `debounce` package with `debounce` function from `lodash` (#7931)
- Remove unused promise-filter dependency (#7932)
- Validate custom spend limit (#7920)
- Delete outdated team page (#7928)
- Replace mkdirp with built-in functionality (#7934)
- Sorting seed phrase confirmation buttons alphabetically (#7933)
- Replace fast-deep-equal with isEqual from lodash (#7935)
- Move devDeps into devDeps (#7936)
- Remove unused number-to-bn package (#7937)
- Add Sentry environment (#7923)
- Move polyfill-crypto.getrandomvalues to devDeps (#7938)
- Fix: syntax error
- Remove unused fs-extra and fs-promise devDependencies (#7939)
- Remove unused rimraf devDependency (#7940)
- Remove unnecessary 'path' dependency (#7942)
- Only resolve ENS on mainnet (#7944)
- Remove unused mocha-eslint dependency (#7943)
- Inline isomorphic-fetch test helper (#7945)
- Remove dead link to team page in README (#7946)
- Remove mocha-jsdom and mocha-sinon (#7947)
- Explicitly set Sass compiler for gulp-sass (#7948)
- ci: Update shellcheck version used in CI (#7951)
- Move issue template and contributing doc to .github (#7952)
- Remove gulp-eslint and gulp-util dependency (#7949)
- Update ENS registry addresses (#7954)
- Bump tree-kill version to fix high-severity vulnerability (#7956)
- Bump node-sass to fix low-severity vulnerability (#7955)
- Remove cross-env (#7950)
- Various component tests and some conditional statements (#7765)
- Update ethereum-ens-network-map in lockfile (#7959)
- Use ethereum-ens-network-map for network support (#7960)
- Fix: lint
- Fix: unit tests
- Fix: settings network tab react dup key error
- Fix: no need to pass benchmark test to release for now
- Fix: speedup tx
- Updating deprecated Etherscam link (#7464)
- Use envify@4.1.0 (#7983)
- Use eth-json-rpc-infura@4.0.2 (#7981)
- Use eth-keyring-controller@5.5.0 (#7980)
- Use gulp@4.0.2 (#7982)
- Remove redundant eth-\*-keyring versions from yarn.lock (#7984)
- Fixes #5706 - Adds Dai/Sai to currency display (#7986)
- Add: testnet to http://testnet-jsonrpc.conflux-chain.org:12537/
- Fix: sign typed data
- Fix: conflicts with metamask, add testnet chainid
- Fix: test:lint
- Master => develop (#34)
- Fix: use fc's balanceOf instead of stateOf, treat fc as a normal… (#37)
- Master => develop (#34)
- Fix: use fc's balanceOf instead of stateOf, treat fc as a normal… (#37)

## 0.0.5 Mon Feb 10 2020

- [#7912](https://github.com/MetaMask/metamask-extension/pull/7912): Disable import button for empty string/file
- Fix: release file blob
- Fix: circle ci artifact url
- Docs: issue templates, codeowners, docs, support emails
- Docs: move docs to conflux-portal-docs
- Fix: MetaMask -> ConfluxPortal in announcement script
- Fix: disable misleading changelog prefix
- Fix: shelllint
- Add page navigation to e2e web driver (#7867)
- Revert the revert of "Use common test build during CI (#7196)" (#7404) (#7870)
- Add `withFixtures` helper and simple-send test (#7862)
- Add 1 second pause at the beginning of each e2e test run (#7872)
- Remove unnecessary `shouldComponentUpdate` (#7875)
- Fix intermittent e2e test failure (#7873)
- Add benchmark script (#7869)
- Update inpage provider (#7878)
- Remove unused browser-passworder dependency from package.json (#7879)
- Add margin of error metric (#7877)
- Change "Log In/Out" terminology to "Unlock/Lock" (#7853)
- Add mechanism to randomize seed phrase filename (#7863)
- Use shared MetaMask ESLint config (#7882)
- Remove unnecessary WebRTC shim (#7886)
- Replace DetectRTC package with standard web APIs (#7887)
- Add benchmark to CI (#7871)
- Use ref in Mascot component rather than reaching into DOM directly (#7893)
- Remove unnecessary `withRouter` and `compose` calls (#7890)
- Remove unnecessary get environment type parameter (#7891)
- Add top-level error page (#7889)
- Update GABA dependency version (#7894)
- Replace `request-promise` with `node-fetch` (#7899)
- Update Sentry to v5.x (#7880)
- Minimum changes to get storybook working (#7884)
- Fixing broken JSON import help link (#7910)
- Remove xtend from the dependencies list (#7902)
- Update `classnames` to `v2.2.6` (#7906)
- Replace bluebird with Node.js API for unhandled rejections (#7904)
- Comment out `storybook-deploy` step (#7913)
- Switch to full lodash package, and update lodash (#7907)
- Update `c3` and `d3` (#7905)
- Replace `deep-extend` with `merge` from `lodash` (#7908)
- Improve LoginPerSite UX/devX and permissions logging (#7649)
- disable import button on Import Account screen for empty string/file (#7912)
- Update data on Approve screen after updating custom spend limit (#7918)
- Remove usage of unlisted extend dependency (#7903)
- Remove JSDoc tools (#7897)
- Update jazzicon component (#7898)
- Allow editing max spend limit (#7919)
- Report errors in tests to `test-metamask` Sentry project (#7924)
- Bump Node version to 10.18 (#7925)
- Remove top-level symlinks (#7927)
- Replace `clone` dependency with `cloneDeep` from lodash (#7926)
- Remove redux-logger from mock-store (#7930)
- Delete unused .dockerignore file (#7929)
- Replace `debounce` package with `debounce` function from `lodash` (#7931)
- Remove unused promise-filter dependency (#7932)
- Validate custom spend limit (#7920)
- Delete outdated team page (#7928)
- Replace mkdirp with built-in functionality (#7934)
- Sorting seed phrase confirmation buttons alphabetically (#7933)
- Replace fast-deep-equal with isEqual from lodash (#7935)
- Move devDeps into devDeps (#7936)
- Remove unused number-to-bn package (#7937)
- Add Sentry environment (#7923)
- Move polyfill-crypto.getrandomvalues to devDeps (#7938)
- Fix: syntax error
- Remove unused fs-extra and fs-promise devDependencies (#7939)
- Remove unused rimraf devDependency (#7940)
- Remove unnecessary 'path' dependency (#7942)
- Only resolve ENS on mainnet (#7944)
- Remove unused mocha-eslint dependency (#7943)
- Inline isomorphic-fetch test helper (#7945)
- Remove dead link to team page in README (#7946)
- Remove mocha-jsdom and mocha-sinon (#7947)
- Explicitly set Sass compiler for gulp-sass (#7948)
- ci: Update shellcheck version used in CI (#7951)
- Move issue template and contributing doc to .github (#7952)
- Remove gulp-eslint and gulp-util dependency (#7949)
- Update ENS registry addresses (#7954)
- Bump tree-kill version to fix high-severity vulnerability (#7956)
- Bump node-sass to fix low-severity vulnerability (#7955)
- Remove cross-env (#7950)
- Various component tests and some conditional statements (#7765)
- Update ethereum-ens-network-map in lockfile (#7959)
- Use ethereum-ens-network-map for network support (#7960)
- Fix: lint
- Fix: unit tests
- Fix: settings network tab react dup key error
- Fix: no need to pass benchmark test to release for now
- Fix: speedup tx
- Updating deprecated Etherscam link (#7464)
- Use envify@4.1.0 (#7983)
- Use eth-json-rpc-infura@4.0.2 (#7981)
- Use eth-keyring-controller@5.5.0 (#7980)
- Use gulp@4.0.2 (#7982)
- Remove redundant eth-\*-keyring versions from yarn.lock (#7984)
- Fixes #5706 - Adds Dai/Sai to currency display (#7986)
- Add: testnet to http://testnet-jsonrpc.conflux-chain.org:12537/
- Fix: sign typed data
- Fix: conflicts with metamask, add testnet chainid
- Fix: test:lint
- Master => develop (#34)

## 0.0.4 Mon Jan 20 2020

- [#7823](https://github.com/MetaMask/metamask-extension/pull/7823): Wait until element is clickable before clicking in e2e tests (#7823)
- [#7833](https://github.com/MetaMask/metamask-extension/pull/7833): Fix prop types for SendGasRow component tests (#7833)
- [#7835](https://github.com/MetaMask/metamask-extension/pull/7835): Clean up Migrator test cases (#7835)
- Add: release 0.0.3, add docs comparing with metamask
- Clean: logs
- Add: github pages, renaming
- Add: test:unit:global timeout
- Add: upgrade conflux-local-network-lite, less log
- Add: disable e2e test to test release
- Fix: token list
- Add: update announce script
- Add: build-announce depends or different repo
- [#7837](https://github.com/MetaMask/metamask-extension/pull/7837): Fix prop types for NetworkDropdown tests (#7837)
- [#7836](https://github.com/MetaMask/metamask-extension/pull/7836): Fix prop types for GasPriceChart tests (#7836)
- [#7834](https://github.com/MetaMask/metamask-extension/pull/7834): Add required props for TransactionListItemDetails tests (#7834)
- [#7838](https://github.com/MetaMask/metamask-extension/pull/7838): Remove extraneous console output from TransactionStateManager tests (#7838)
- [#7843](https://github.com/MetaMask/metamask-extension/pull/7843): Remove unused current view related things (#7843)
- [#7840](https://github.com/MetaMask/metamask-extension/pull/7840): Force background state update after removing an account (#7840)
- [#7817](https://github.com/MetaMask/metamask-extension/pull/7817): Refactor Network dropdown component (#7817)
- [#7841](https://github.com/MetaMask/metamask-extension/pull/7841): Refactor building of e2e web driver (#7841)
- [#7849](https://github.com/MetaMask/metamask-extension/pull/7849): Fix propTypes and test props for SignatureRequest component (#7849)
- [#7851](https://github.com/MetaMask/metamask-extension/pull/7851): Fix propTypes and test props for Dropdown components (#7851)
- [#7850](https://github.com/MetaMask/metamask-extension/pull/7850): Fix props for BasicTabContent component tests (#7850)
- [#7848](https://github.com/MetaMask/metamask-extension/pull/7848): Fix propTypes for TransactionBreakdown component (#7848)
- [#7856](https://github.com/MetaMask/metamask-extension/pull/7856): deps - update nonce-tracker (#7856)
- [#7854](https://github.com/MetaMask/metamask-extension/pull/7854): Inline networkStore to avoid having too many event listeners (#7854)
- [#7859](https://github.com/MetaMask/metamask-extension/pull/7859): Switch signature-request e2e tests to using ganache (#7859)
- [#7860](https://github.com/MetaMask/metamask-extension/pull/7860): Allow exporting state during e2e tests (#7860)
- [#7855](https://github.com/MetaMask/metamask-extension/pull/7855): Clean up "JSON File" import strategy test output (#7855)

## 0.0.3 Thu Feb 16 2020

- remove preset default gas and default gas price in injected web3
- injected conflux version of web3 is now ~window.confluxJS~
- injected ~window.ethereum~ changed to ~window.conflux~
- ~window.ethereum.isMetaMask~ changed to ~window.conflux.isConfluxPortal~
- support skipped transaction

## 0.0.2 Fri Feb 10 2020

- Some "Etherscan" to "ConfluxScan"
- Get default gas price from json rpc

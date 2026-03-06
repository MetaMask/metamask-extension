---
description: Known flakiness patterns and anti-patterns in MetaMask Extension CI. Use when analyzing, debugging, or fixing flaky tests.
globs: 'test/e2e/**/*.spec.ts,test/e2e/**/*.spec.js'
alwaysApply: false
---

# Extension CI Flakiness

> **Source:** [Extension CI Flakiness - Google Doc](https://docs.google.com/document/d/1oXd5d1X7j14lHLjaRCWjEh3uhndrXQ_46lBuZ9SAu6M/edit?tab=t.0)

---

## Table of Contents

- [E2E Flakiness Categories](#e2e-flakiness-categories)
  - [Race Conditions on Driver/Helpers Functions](#race-conditions-on-driverhelpers-functions)
  - [Taking Unnecessary Steps](#taking-unnecessary-steps)
  - [Missing or Incorrect Use of Mocks](#missing-or-incorrect-use-of-mocks)
  - [Removing URL/host entries to the live server allowlist](#removing-urlhost-entries-to-the-live-server-allowlist)
  - [Race Conditions on Gas / Balance / Navigation values on Screen](#race-conditions-on-gas--balance--navigation-values-on-screen)
  - [Confirmation Popups / Modals](#confirmation-popups--modals)
  - [Incorrect Testing Conditions](#incorrect-testing-conditions)
  - [Race Conditions with Assertions within the Test Body Steps](#race-conditions-with-assertions-within-the-test-body-steps)
  - [Race Conditions with Windows](#race-conditions-with-windows)
  - [Race Conditions with React Re-renders](#race-conditions-with-react-re-renders)
  - [Actions that Take Time](#actions-that-take-time)
  - [Errors in the testing dapp](#errors-in-the-testing-dapp)
  - [Not using driver methods](#not-using-driver-methods)
- [Bugs Discovered on the Wallet Level while Investigating Flaky Tests](#bugs-discovered-on-the-wallet-level-while-investigating-flaky-tests)
- [E2E Anti-Patterns](#e2e-anti-patterns)
- [Unit Test Flakiness Categories](#unit-test-flakiness-categories)
- [Flakiness on Other CI Jobs](#flakiness-on-other-ci-jobs)

---

## E2E Flaky Tests Walkthrough

- **First session** — [Recording](https://consensys.zoom.us/) (Passcode: `h2&gExZE`)
- **Second session** — [Recording](https://consensys.zoom.us/) (Passcode: `M+^1Tr9Y`)

---

## E2E Flakiness Categories

### Race Conditions on Driver/Helpers Functions

- **Click Element with stale element**
  [MetaMask/metamask-extension#24813](https://github.com/MetaMask/metamask-extension/pull/24813)

  ❌ Incorrect:
  ```javascript
  async clickElement(rawLocator) {
    const element = await this.findClickableElement(rawLocator);
    await element.click();
  }
  ```

  ✅ Correct:
  ```javascript
  async clickElement(rawLocator, retries = 3) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const element = await this.findClickableElement(rawLocator);
        await element.click();
        return;
      } catch (error) {
        if (error.name === 'StaleElementReferenceError' && attempt < retries - 1) {
          await this.driver.delay(1000);
        } else {
          throw error;
        }
      }
    }
  }
  ```

- **Waiting to the correct window handle number**
  [MetaMask/metamask-extension#24741](https://github.com/MetaMask/metamask-extension/pull/24741)

  ❌ Incorrect:
  ```javascript
  await driver.switchToWindowWithUrl(dappUrl);
  const currentWindowHandles = await driver.getAllWindowHandles();
  await driver.clickElement('#sendButton');
  ```

  ✅ Correct:
  ```javascript
  await driver.switchToWindowWithUrl(dappUrl);
  const expectedWindowHandles = 3;
  await driver.waitUntilXWindowHandles(expectedWindowHandles);
  const currentWindowHandles = await driver.getAllWindowHandles();
  await driver.clickElement('#sendButton');
  ```

- **Get window title undefined**
  [MetaMask/metamask-extension#24642](https://github.com/MetaMask/metamask-extension/issues/24642)

- **Click parent Element with inner elements that refresh instead of the most possible specific element**
  [MetaMask/metamask-extension#24652](https://github.com/MetaMask/metamask-extension/issues/24652)

- **Holding SRP button for less time than required**
  [MetaMask/metamask-extension#25328](https://github.com/MetaMask/metamask-extension/pull/25328)

  ❌ Incorrect:
  ```javascript
  await driver.holdMouseDownOnElement(
    { text: tEn('holdToRevealSRP'), tag: 'span' },
    2000,
  );
  ```

  ✅ Correct:
  ```javascript
  await driver.holdMouseDownOnElement(
    { text: tEn('holdToRevealSRP'), tag: 'span' },
    3000,
  );
  ```

- **Trezor e2e: race condition getting multiple elements with the same selector and then expecting to have the exact number**
  [Slack thread](https://consensys.slack.com/archives/C1L7H42BT/p1721043228543209?thread_ts=1720108424.349269&cid=C1L7H42BT)
  Fix: [commit 130794d](https://github.com/MetaMask/metamask-extension/pull/25824/commits/130794d18e5ae39887d70e161636b3ec6f4f8164)

---

### Taking Unnecessary Steps

- **Create token, approve token, missing permission controller connected to the test dapp**
  [MetaMask/metamask-extension#24937](https://github.com/MetaMask/metamask-extension/pull/24937)

  ❌ Incorrect:
  ```javascript
  await withFixtures({
    dapp: true,
    fixtures: new FixtureBuilder()
      .withPermissionControllerConnectedToTestDapp()
      .build(),
  }, async ({ driver, contractAddress }) => {
    await unlockWallet(driver);
    await openDapp(driver, contractAddress);
    const windowHandles = await driver.getAllWindowHandles();
    const extension = windowHandles[0];
    await driver.switchToWindow(extension);
    await driver.clickElement(`[data-testid="home__asset-tab"]`);
  ```

  ✅ Correct:
  ```javascript
  await withFixtures({
    fixtures: new FixtureBuilder().build(),
  }, async ({ driver, contractAddress }) => {
    await unlockWallet(driver);
    await driver.clickElement(`[data-testid="home__asset-tab"]`);
  ```

- **Migrate Opensea missing permission controller connected to the test dapp, smart contract deployed on the background**
  [MetaMask/metamask-extension#24739](https://github.com/MetaMask/metamask-extension/pull/24739)

- **Request Queue SwitchChain missing smart contract deployed on the background**
  [MetaMask/metamask-extension#24674](https://github.com/MetaMask/metamask-extension/pull/24674)

- **Unnecessary browser refresh, causing to land into the Confirmation screen if it was appearing in the activity as unapproved**
  [MetaMask/metamask-extension#24809](https://github.com/MetaMask/metamask-extension/pull/24809)

  ❌ Incorrect:
  ```javascript
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  // TODO: Reload fix to have the confirmations show
  await driver.executeScript(`window.location.reload()`);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  ```

  ✅ Correct:
  ```javascript
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  await driver.clickElement('[data-testid="home__activity-tab"]');
  ```

- **Unnecessary scrolls, and delays which added up more than 15 seconds of delay**
  [MetaMask/metamask-extension#25288](https://github.com/MetaMask/metamask-extension/issues/25288)

- **Unnecessary step on enabling the nonce going to Settings, instead of using preferenceController fixtures**
  [commit 9a72e16](https://github.com/MetaMask/metamask-extension/pull/25687/commits/9a72e166e668fb8a0eba642365b4d62924545ec0)

- **Unnecessary step of deploying a contract when it's already deployed and loaded in the test dapp param**
  [commit 9a72e16](https://github.com/MetaMask/metamask-extension/pull/25687/commits/9a72e166e668fb8a0eba642365b4d62924545ec0)

- **Unnecessary steps importing a token instead of using fixtures (had to modify the chainId as the token was imported to chainId 1 using ganache)**
  [MetaMask/metamask-extension#26654](https://github.com/MetaMask/metamask-extension/pull/26654)

  ❌ Incorrect:
  ```javascript
  navigateToAssetPage = async (contractRegistry, symbol, shouldImportToken = true) => {
    if (shouldImportToken) {
      const contractAddress = await contractRegistry.getContractAddress(SMART_CONTRACTS.HST);
      await clickNestedButton(this.driver, 'Import tokens');
      await clickNestedButton(this.driver, 'Custom token');
      await this.driver.fill(LOCATOR.MM_IMPORT_TOKENS_MODAL('custom-address'), contractAddress);
      await this.driver.fill(LOCATOR.MM_IMPORT_TOKENS_MODAL('custom-symbol'), symbol);
      await this.driver.waitForSelector(LOCATOR.MM_IMPORT_TOKENS_MODAL('custom-decimals'));
      await clickNestedButton(this.driver, 'Next');
      await this.driver.clickElement(LOCATOR.MM_IMPORT_TOKENS_MODAL('import-button'));
      await this.driver.clickElement({ text: symbol });
    }
  };
  ```

  ✅ Correct:
  ```javascript
  // Use fixtures instead: fixtureBuilder.withTokensControllerERC20({ chainId: 1 });
  navigateToAssetPage = async (symbol: string) => {
    await this.driver.clickElement({
      css: '[data-testid="multichain-token-list-button"]',
      text: symbol,
    });
    await this.driver.delay(2000);
    assert.ok((await this.driver.getCurrentUrl()).includes('asset'));
  };
  ```

- **Switching to Mainnet before starting a test for Import tokens — can use fixtures to start the wallet in Mainnet network**
  [MetaMask/metamask-extension#27567](https://github.com/MetaMask/metamask-extension/pull/27567)

  ❌ Incorrect:
  ```javascript
  fixtures: new FixtureBuilder().build(),
  async ({ driver }) => {
    await unlockWallet(driver);
    await driver.clickElement('[data-testid="network-display"]');
    const networkSelectionModal = await driver.findVisibleElement('.mm-modal');
    await driver.clickElement({ text: 'Ethereum Mainnet', tag: 'p' });
    await networkSelectionModal.waitForElementState('hidden');
    await driver.clickElement('[data-testid="import-token-button"]');
  ```

  ✅ Correct:
  ```javascript
  fixtures: new FixtureBuilder().withNetworkControllerOnMainnet().build(),
  async ({ driver }) => {
    await unlockWallet(driver);
    await driver.assertElementNotPresent('.loading-overlay');
    await driver.clickElement('[data-testid="import-token-button"]');
  ```

- **Unnecessary steps by deploying manually 3 token contracts instead of just pre deploying using the anvil seeder**
  [MetaMask/metamask-extension#35664](https://github.com/MetaMask/metamask-extension/pull/35664)

  ❌ Incorrect:
  ```javascript
  // Manually create tokens via dapp UI in a loop (slow, flaky)
  for (let i = 0; i < 3; i++) {
    await testDapp.findAndClickCreateToken();
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    const createContractModal = new CreateContractModal(driver);
    await createContractModal.checkPageIsLoaded();
    await createContractModal.clickConfirm();
    await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
    await testDapp.checkPageIsLoaded();
    await testDapp.checkTokenAddressesCount(i + 1);
  }
  ```

  ✅ Correct:
  ```javascript
  // Pre-deploy contracts via fixture: smartContract: [tokenContract, tokenContract, tokenContract]
  const contracts = contractRegistry.getAllDeployedContractAddresses();
  for (let i = 0; i < 3; i++) {
    await driver.executeScript(`
      window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: { address: '${contracts[i]}', symbol: 'TST', decimals: 4 }
        }
      })
    `);
  }
  ```

- **Unnecessary steps for switching network when already in the network I want**
  [MetaMask/metamask-extension#37374](https://github.com/MetaMask/metamask-extension/pull/37374)

  ❌ Incorrect:
  ```javascript
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await switchToNetworkFromSendFlow(driver, networkName);
  await homePage.checkAddNetworkMessageIsDisplayed(networkName);
  await homePage.checkExpectedBalanceIsDisplayed('17,000.00', '$');
  ```

  ✅ Correct:
  ```javascript
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  // Already on the correct network — just check balance directly
  await homePage.checkExpectedBalanceIsDisplayed('17,000.00', '$');
  await homePage.checkAddNetworkMessageIsDisplayed(networkName);
  ```

---

### Missing or Incorrect Use of Mocks

- **Missing IPFS metadata mock for Import ERC1155**
  [MetaMask/metamask-extension#24709](https://github.com/MetaMask/metamask-extension/pull/24709)

  ❌ Incorrect:
  ```javascript
  // No mock for IPFS metadata — requests to ipfs.dweb.link
  // hit the real network (or get blocked), causing flaky failures
  ```

  ✅ Correct:
  ```javascript
  await server
    .forGet(
      'https://bafybeidxfmwycgzcp4v2togflpqh2gnibuexjy4m4qqwxp7nh3jx5zlh4y.ipfs.dweb.link/1.json',
    )
    .thenCallback(() => {
      return { statusCode: 200 };
    });
  ```

- **Missing mocks for ENS resolution**
  [MetaMask/metamask-extension#24898](https://github.com/MetaMask/metamask-extension/pull/24898)

- **Missing aggregatorMetadata, block list and include blocked tokens mocks**
  [MetaMask-planning#2637](https://github.com/MetaMask/MetaMask-planning/issues/2637)

- **Missing mock for quotes Swap test**
  [MetaMask/metamask-extension#27160](https://github.com/MetaMask/metamask-extension/pull/27160)

- **Inconsistency between the mocked value and the default value: test execution success depends on the polling rate**
  [MetaMask/metamask-extension#23520](https://github.com/MetaMask/metamask-extension/pull/23520)

- **Mocking eth_balance with a value >0ETH causes request polling for subsequent accounts, creating new ones and preventing other requests. Mock balance 0 to avoid this when using Mainnet**
  [MetaMask/metamask-extension#25525](https://github.com/MetaMask/metamask-extension/pull/25525)

  ❌ Incorrect:
  ```javascript
  json: {
    jsonrpc: '2.0',
    id: '1111111111111111',
    result: '0x1',   // Non-zero balance triggers unexpected polling
  },
  ```

  ✅ Correct:
  ```javascript
  json: {
    jsonrpc: '2.0',
    id: '1111111111111111',
    result: '0x0',   // Zero balance — correct for fresh onboarding wallet
  },
  ```

- **Incorrect mock request by passing an id, makes the body never match, so the mock response is not implemented**
  [MetaMask/metamask-extension#27156](https://github.com/MetaMask/metamask-extension/pull/27156)

  ❌ Incorrect:
  ```javascript
  export const MALFORMED_TRANSACTION_REQUEST_MOCK = {
    request: {
      id: '21',   // Including 'id' causes exact-match to fail since id is dynamic
      jsonrpc: '2.0',
      method: 'infura_simulateTransactions',
      params: [/* ... */],
    },
  };

  await server
    .forPost(TX_SENTINEL_URL)
    .withJsonBody(request)
    .thenJson(200, response);
  ```

  ✅ Correct:
  ```javascript
  export const MALFORMED_TRANSACTION_REQUEST_MOCK = {
    request: {
      // 'id' removed — it's dynamic and should not be part of the match
      jsonrpc: '2.0',
      method: 'infura_simulateTransactions',
      params: [/* ... */],
    },
  };

  await server
    .forPost(TX_SENTINEL_URL)
    .withJsonBodyIncluding(request)
    .thenJson(200, response);
  ```

- **Solana missing mock to api.simplehash.com broke CI when that request changed its response, causing a subsequent call to another external API not in the privacy snapshot**
  [MetaMask/metamask-extension#29986](https://github.com/MetaMask/metamask-extension/pull/29986)

- **Add transaction simulation supported networks global mock**
  [MetaMask/metamask-extension#30507](https://github.com/MetaMask/metamask-extension/pull/30507)

- **Blockaid API was not correctly mocked (chainId used was int instead of hex), causing Blockaid validation to fail and metrics event assertion values to fail**
  [MetaMask/metamask-extension#30769](https://github.com/MetaMask/metamask-extension/pull/30769)

  ❌ Incorrect:
  ```javascript
  // chainId passed as integer — URL becomes /validate/1
  await server
    .forPost(`${SECURITY_ALERTS_PROD_API_BASE_URL}/validate/${chainId}`)
    .thenCallback(() => ({ statusCode: 200 }));
  ```

  ✅ Correct:
  ```javascript
  // chainId must be hex string — URL becomes /validate/0x1
  await server
    .forPost(`${SECURITY_ALERTS_PROD_API_BASE_URL}/validate/0x${chainId.toString(16)}`)
    .thenCallback(() => ({ statusCode: 200 }));
  ```

- **The default mock for Solana was over-riding the custom mock, causing the balance to be different if the test was slow enough**
  [MetaMask/metamask-extension#30808](https://github.com/MetaMask/metamask-extension/pull/30808)

- **Missing mock caused Smart Transactions + Swap specs to fail**
  [MetaMask/metamask-extension#30932](https://github.com/MetaMask/metamask-extension/pull/30932)

- **Missing mock for Swaps notifications slippage tests**
  [MetaMask/metamask-extension#31383](https://github.com/MetaMask/metamask-extension/pull/31383)

- **Missing mock for Solana devnet**
  [MetaMask/metamask-extension#31331](https://github.com/MetaMask/metamask-extension/pull/31331)

- **Missing mock on onboarding privacy**
  [MetaMask/metamask-extension#31272](https://github.com/MetaMask/metamask-extension/pull/31272)

- **Missing user storage mocks**
  [MetaMask/metamask-extension#31947](https://github.com/MetaMask/metamask-extension/pull/31947)

- **Missing mock for custom network during onboarding**
  [MetaMask/metamask-extension#32932](https://github.com/MetaMask/metamask-extension/pull/32932)

- **Missing the token list mock**
  [MetaMask/metamask-extension#34834](https://github.com/MetaMask/metamask-extension/pull/34834)

---

### Removing URL/host entries to the live server allowlist

- **Part 1:** [MetaMask/metamask-extension#33267](https://github.com/MetaMask/metamask-extension/pull/33267)
- **Part 2:** [MetaMask/metamask-extension#33302](https://github.com/MetaMask/metamask-extension/pull/33302)

---

### Race Conditions on Gas / Balance / Navigation values on Screen

- **Balance not loaded when starting the Send, causing gas to be 0 and blocking the Confirmation screen**
  [MetaMask/metamask-extension#24639](https://github.com/MetaMask/metamask-extension/pull/24639)
  Same issue: [#34128](https://github.com/MetaMask/metamask-extension/pull/34128), [#34854](https://github.com/MetaMask/metamask-extension/pull/34854)

  ❌ Incorrect:
  ```javascript
  async ({ driver, contractRegistry }) => {
    const contractAddress = await contractRegistry.getContractAddress(smartContract);
    await unlockWallet(driver);
    await driver.clickElement('[data-testid="eth-overview-send"]');
  ```

  ✅ Correct:
  ```javascript
  async ({ driver, contractRegistry, ganacheServer }) => {
    const contractAddress = await contractRegistry.getContractAddress(smartContract);
    await logInWithBalanceValidation(driver, ganacheServer);
    await driver.clickElement('[data-testid="eth-overview-send"]');
  ```

- **Mismatch in gas calculation values, when changing the increase token allowance amount**
  [MetaMask/metamask-extension#24734](https://github.com/MetaMask/metamask-extension/pull/24734)

  ❌ Incorrect:
  ```javascript
  driver.waitForSelector({
    css: '.box--display-flex > h6',
    text: `10 TST`,
  });
  ```

  ✅ Correct:
  ```javascript
  await driver.waitForSelector({
    css: '.box--display-flex > h6',
    text: `10 TST`,
  });
  await driver.waitForSelector({
    tag: 'h6',
    text: '0.000062 ETH',
  });
  ```

- **Active network data (isActive, EIP1559..) was not loaded in state when running the assertion**
  [MetaMask/metamask-extension#25137](https://github.com/MetaMask/metamask-extension/pull/25137)

  ❌ Incorrect:
  ```javascript
  async ({ driver, mockedEndpoint }) => {
    await driver.navigate();
    await driver.findElement('#password');
    await driver.executeScript(
  ```

  ✅ Correct:
  ```javascript
  async ({ driver, ganacheServer, mockedEndpoint }) => {
    await logInWithBalanceValidation(driver, ganacheServer);
    await driver.executeScript(
  ```

- **Gas is not recalculated before clicking Continue, when switching assets in the Send flow**
  [MetaMask/metamask-extension#25181](https://github.com/MetaMask/metamask-extension/issues/25181)

- **Transaction didn't have the total value loaded before we click reject**
  [MetaMask/metamask-extension#25312](https://github.com/MetaMask/metamask-extension/pull/25312)

  ❌ Incorrect:
  ```javascript
  async ({ driver }) => {
    await unlockWallet(driver);
    await driver.clickElement('[data-testid="next-page"]');
  ```

  ✅ Correct:
  ```javascript
  async ({ driver }) => {
    await unlockWallet(driver);
    // Wait until total amount is loaded before rejecting
    await driver.findElement({ tag: 'span', text: '3.0000315' });
    await driver.clickElement('[data-testid="next-page"]');
  ```

- **Spec was not waiting for queued signatures to display navigation, making some signatures not queue properly. Need to wait for the navigation numbers to appear before queueing a new signature**
  [MetaMask/metamask-extension#27481](https://github.com/MetaMask/metamask-extension/pull/27481)

  ❌ Incorrect:
  ```javascript
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.findElement({ text: 'Reject all' });

  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#signTypedDataV4');
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  ```

  ✅ Correct:
  ```javascript
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.findElement({ text: 'Reject all' });
  await driver.waitForSelector(By.xpath("//div[normalize-space(.)='1 of 2']"));

  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#signTypedDataV4');
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.waitForSelector(By.xpath("//div[normalize-space(.)='1 of 3']"));
  ```

---

### Confirmation Popups / Modals

- **Snaps confirmation popup appears in confirmation screen**
  [MetaMask/metamask-extension#24939](https://github.com/MetaMask/metamask-extension/pull/24939)

- **Vault decryption confirmation popup appears in settings**
  [MetaMask/metamask-extension#24830](https://github.com/MetaMask/metamask-extension/pull/24830)

- **"Got it" element taking time to disappear obfuscates other elements**
  [MetaMask/metamask-extension#24580](https://github.com/MetaMask/metamask-extension/pull/24580)

  ❌ Incorrect:
  ```javascript
  await driver.clickElement({ text: 'Got it', tag: 'button' });
  await driver.clickElement({ text: '127.0.0.1:8080', tag: 'p' });
  ```

  ✅ Correct:
  ```javascript
  await driver.clickElementAndWaitToDisappear({ text: 'Got it', tag: 'button' });
  await driver.clickElement({ text: '127.0.0.1:8080', tag: 'p' });
  ```

- **Add account popup obfuscates clicking on the next element from the Home page**
  [MetaMask/metamask-extension#25861](https://github.com/MetaMask/metamask-extension/pull/25861)

  ❌ Incorrect:
  ```javascript
  await driver.clickElement({ text: 'Create', tag: 'button' });
  ```

  ✅ Correct:
  ```javascript
  await driver.clickElementAndWaitToDisappear({ text: 'Create', tag: 'button' });
  ```

- **Import NFT modal obfuscates clicking on the Account menu**
  [MetaMask/metamask-extension#27006](https://github.com/MetaMask/metamask-extension/pull/27006)

- **On the onboarding carousel, not waiting for the element to disappear when switching between screens causes race conditions**
  [MetaMask/metamask-extension#27858](https://github.com/MetaMask/metamask-extension/pull/27858)

  ❌ Incorrect:
  ```javascript
  await driver.clickElement({ text: 'Manage default settings' });
  await driver.delay(regularDelayMs);
  await driver.clickElement({ text: 'General' });

  await driver.clickElement({ text: 'Save', tag: 'button' });
  await driver.delay(regularDelayMs);
  await driver.clickElement('[data-testid="category-back-button"]');

  await driver.clickElement({ text: 'Done', tag: 'button' });
  await driver.delay(regularDelayMs);
  ```

  ✅ Correct:
  ```javascript
  await driver.clickElementAndWaitToDisappear({ text: 'Manage default settings' });
  await driver.clickElement({ text: 'General' });

  await driver.clickElementAndWaitToDisappear({ text: 'Save', tag: 'button' });
  await driver.clickElement('[data-testid="category-back-button"]');

  await driver.clickElementAndWaitToDisappear({ text: 'Done', tag: 'button' });
  await driver.assertElementNotPresent('.popover-bg');
  ```

- **On the Add token flow, should wait until the dialog has been closed before proceeding — otherwise re-render with React failures**
  [MetaMask/metamask-extension#27853](https://github.com/MetaMask/metamask-extension/pull/27853)

  ❌ Incorrect:
  ```javascript
  await driver.clickElement('[data-testid="import-tokens-modal-import-button"]');
  ```

  ✅ Correct:
  ```javascript
  await driver.clickElementAndWaitToDisappear('[data-testid="import-tokens-modal-import-button"]');
  ```

- **On Queued Confirmations tests, connected manually to the test dapp and didn't wait for the MM dialog to close after connect. Caused chainId to be incorrectly outdated**
  [MetaMask/metamask-extension#30028](https://github.com/MetaMask/metamask-extension/pull/30028)

  ❌ Incorrect:
  ```javascript
  await driver.clickElement({ text: 'Connect', tag: 'button' });

  await driver.waitUntilXWindowHandles(4);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  ```

  ✅ Correct:
  ```javascript
  await driver.clickElementAndWaitForWindowToClose({ text: 'Connect', tag: 'button' });

  await driver.waitForSelector({ css: '[id="chainId"]', text: '0x539' });
  ```

- **The notification (red dot) appears on top of the menu, blocking clicks on the menu button**
  [MetaMask/metamask-extension#33492](https://github.com/MetaMask/metamask-extension/pull/33492)

  ❌ Incorrect:
  ```javascript
  await driver.waitForSelector('[data-testid="account-options-menu-button"]');
  await driver.clickElement('[data-testid="account-options-menu-button"]');
  ```

  ✅ Correct:
  ```javascript
  // Click the notification dot overlay instead of the obscured button
  await driver.clickElement('.notification-list-item__unread-dot__wrapper');
  ```

- **When changing language, sometimes the dropdown menu remains open, causing the next click to have no effect**
  [MetaMask/metamask-extension#34169](https://github.com/MetaMask/metamask-extension/pull/34169)

  ❌ Incorrect:
  ```javascript
  async selectLanguage(languageToSelect: string) {
    await this.driver.clickElement(this.selectLanguageField);
    await this.driver.clickElement({ text: languageToSelect, tag: 'option' });
    await this.check_noLoadingOverlaySpinner();
  }
  ```

  ✅ Correct:
  ```javascript
  async selectLanguage(languageToSelect: string) {
    // Use sendKeys to avoid dropdown staying open after selection
    const dropdown = await this.driver.findElement(this.selectLanguageField);
    await dropdown.sendKeys(languageToSelect);
    await this.check_noLoadingOverlaySpinner();
  }
  ```

---

### Incorrect Testing Conditions

- **Testing background in MV3 builds, where there is no background but service worker instead**
  [MetaMask/metamask-extension#25164](https://github.com/MetaMask/metamask-extension/pull/25164)

  ❌ Incorrect:
  ```javascript
  it('the UI and background environments are locked down', async function () {
    await driver.navigate(PAGES.BACKGROUND);
    await driver.delay(1000);
    assert.equal(
      await driver.executeScript(lockdownTestScript),
      true,
      'The background environment should be locked down.',
    );
  });
  ```

  ✅ Correct:
  ```javascript
  it('the background environment is locked down', async function () {
    if (process.env.ENABLE_MV3 === 'false') {
      await driver.navigate(PAGES.BACKGROUND);
    } else {
      // MV3 uses a Service Worker — no background page
      await driver.navigate(PAGES.OFFSCREEN);
    }
    await driver.delay(1000);
    assert.equal(
      await driver.executeScript(lockdownTestScript),
      true,
      'The background environment should be locked down.',
    );
  });
  ```

---

### Race Conditions with Assertions within the Test Body Steps

- **Assert element value as soon as we find the element — the real value has not been rendered**
  [MetaMask/metamask-extension#23450](https://github.com/MetaMask/metamask-extension/pull/23450)

  ❌ Incorrect:
  ```javascript
  const tokenListAmount = await driver.findElement(
    '[data-testid="multichain-token-list-item-value"]',
  );
  assert.equal(await tokenListAmount.getText(), tokenValue);
  ```

  ✅ Correct:
  ```javascript
  const tokenListAmount = await driver.findElement(
    '[data-testid="multichain-token-list-item-value"]',
  );
  await driver.waitForNonEmptyElement(tokenListAmount);
  assert.equal(await tokenListAmount.getText(), tokenValue);
  ```

- **Rapid input of the entire Chain ID resulted in the error message appearing and persisting**
  [MetaMask/metamask-extension#24790](https://github.com/MetaMask/metamask-extension/pull/24790)

- **Trying to find a pending transaction and then a confirmed one — bad pattern as we shouldn't look for transient elements. Looking for the confirmed tx gives us the assertion we want**
  [MetaMask/metamask-extension#25545](https://github.com/MetaMask/metamask-extension/pull/25545)

  ❌ Incorrect:
  ```javascript
  await swapSendPage.submitSwap();
  await swapSendPage.verifyHistoryEntry('Send ETH as TST', 'Pending', '-1 ETH', '');
  await swapSendPage.verifyHistoryEntry('Send ETH as TST', 'Confirmed', ...);
  ```

  ✅ Correct:
  ```javascript
  await swapSendPage.submitSwap();
  // Skip 'Pending' — it's transient. Wait directly for 'Confirmed'.
  await swapSendPage.verifyHistoryEntry('Send ETH as TST', 'Confirmed', ...);
  ```

- **Assert the currentUrl is the desired one can create a race condition. The correct approach is to wait for the URL we want**
  [MetaMask/metamask-extension#26651](https://github.com/MetaMask/metamask-extension/pull/26651)

  ❌ Incorrect:
  ```javascript
  await driver.clickElement({ text: 'report a detection problem.' });
  await driver.findElement({ text: `Empty page by ${BlockProvider.PhishFort}` });
  assert.equal(
    await driver.getCurrentUrl(),
    `https://github.com/phishfort/phishfort-lists/issues/new?title=...`,
  );
  ```

  ✅ Correct:
  ```javascript
  await driver.clickElement({ text: 'report a detection problem.' });
  await driver.waitForUrl({
    url: `https://github.com/phishfort/phishfort-lists/issues/new?title=...`,
  });
  ```

- **Find an element and then assert it has the correct status (enabled) creates a race condition. Need to wait for the desired state instead of asserting directly**
  [MetaMask/metamask-extension#27017](https://github.com/MetaMask/metamask-extension/pull/27017)

  ❌ Incorrect:
  ```javascript
  const buySellButton = await driver.waitForSelector('[data-testid="coin-overview-buy"]');
  assert.equal(await buySellButton.isEnabled(), true);
  ```

  ✅ Correct:
  ```javascript
  await driver.findClickableElement('[data-testid="coin-overview-buy"]');
  ```

- **Find an element and then assert it has the correct value creates a race condition. Need to wait for the desired value**
  [MetaMask/metamask-extension#27095](https://github.com/MetaMask/metamask-extension/pull/27095)

  ❌ Incorrect:
  ```javascript
  let navigationElement = await driver.findElement('.confirm-page-container-navigation');
  let navigationText = await navigationElement.getText();
  assert.equal(navigationText.includes('1 of 2'), true);
  ```

  ✅ Correct:
  ```javascript
  await driver.findElement(By.xpath("//div[normalize-space(.)='1 of 2']"));
  ```

- **Find an element and assert it has the correct text for dapp permissions**
  [MetaMask/metamask-extension#27894](https://github.com/MetaMask/metamask-extension/pull/27894)

- **Looking for the Deposit transaction by its text in the activity tab — this element updates its state from pending to confirmed, meaning it can become stale**
  [MetaMask/metamask-extension#27889](https://github.com/MetaMask/metamask-extension/pull/27889)

- **Asserting an element is displayed after looking for its selector can cause race conditions where the element is updated in between (e.g., tx from pending to confirmed)**
  [MetaMask/metamask-extension#27928](https://github.com/MetaMask/metamask-extension/pull/27928/files)

  ❌ Incorrect:
  ```javascript
  const transactionItem = await driver.waitForSelector({
    css: '[data-testid="activity-list-item-action"]',
    text: 'Deposit',
  });
  assert.equal(await transactionItem.isDisplayed(), true);
  ```

  ✅ Correct:
  ```javascript
  await driver.waitForSelector({
    css: '[data-testid="activity-list-item-action"]',
    text: 'Deposit',
  });
  ```

- **Find element and assert correct text in the Swaps STX spec**
  [MetaMask/metamask-extension#32032](https://github.com/MetaMask/metamask-extension/pull/32032)

  ❌ Incorrect:
  ```javascript
  const transactionList = await driver.findElements(
    '[data-testid="activity-list-item-action"]',
  );
  const transactionText = await transactionList[options.index].getText();
  assert.equal(transactionText, `Swap ${options.swapFrom} to ${options.swapTo}`);
  ```

  ✅ Correct:
  ```javascript
  await driver.waitForSelector({
    tag: 'p',
    text: `Swap ${options.swapFrom} to ${options.swapTo}`,
  });
  ```

- **Find element and assert correct text in wallet_invokeMethod multichain test**
  [MetaMask/metamask-extension#32962](https://github.com/MetaMask/metamask-extension/pull/32962)

  ❌ Incorrect:
  ```javascript
  const resultElement = await driver.findElement(
    `#invoke-method-${escapeColon(scope)}-${invokeMethod}-result-0`,
  );
  const result = await resultElement.getText();
  assert.strictEqual(result, `"${EXPECTED_RESULTS[scope]}"`);
  ```

  ✅ Correct:
  ```javascript
  await driver.waitForSelector({
    css: `[id="invoke-method-${scope}-${invokeMethod}-result-0"]`,
    text: `"${EXPECTED_RESULTS[scope]}"`,
  });
  ```

---

### Race Conditions with Windows

- **Vault decrypt uses a production build which automatically opens a MetaMask window. Using driver.navigate too caused 2 MetaMask windows, leading to flakiness as the active browser window was not where driver actions were happening**
  [MetaMask/metamask-extension#25443](https://github.com/MetaMask/metamask-extension/pull/25443)

  ❌ Incorrect:
  ```javascript
  await driver.navigate();
  await driver.switchToWindowWithTitle('MetaMask');
  ```

  ✅ Correct:
  ```javascript
  // MM auto-opens a window in prod build — don't call navigate()
  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle('MetaMask');
  ```

- **Getting all windows and after several steps referencing an old window**
  [MetaMask/metamask-extension#2585](https://github.com/MetaMask/metamask-extension/pull/2585)

- **Tests that click a button in the popup window that eventually closes it, but don't wait for the popup to close before continuing. Added a method that clicks and waits for the window to close**
  [MetaMask/metamask-extension#26449](https://github.com/MetaMask/metamask-extension/pull/26449),
  [MetaMask/metamask-extension#26725](https://github.com/MetaMask/metamask-extension/pull/26725)

  ❌ Incorrect:
  ```javascript
  await driver.clickElement({ text: 'Confirm', tag: 'button' });
  // immediately try to switch windows
  ```

  ✅ Correct:
  ```javascript
  await driver.clickElementAndWaitForWindowToClose({ text: 'Confirm', tag: 'button' });
  // window is confirmed closed, safe to switch
  ```

- **Triggering a Send from Dapp 1 and quickly switching to Dapp 0 — the network for the first Send is taken from Dapp 0 instead of Dapp 1**
  [MetaMask/metamask-extension#26794](https://github.com/MetaMask/metamask-extension/pull/26794)

- **chainId proxy sync should preserve per dapp network selections**
  [MetaMask/metamask-extension#31599](https://github.com/MetaMask/metamask-extension/pull/31599)

- **Multichain API Call wallet_createSession**
  [MetaMask/metamask-extension#31603](https://github.com/MetaMask/metamask-extension/pull/31603)

- **Snaps race condition with windows**
  [MetaMask/metamask-extension#32320](https://github.com/MetaMask/metamask-extension/pull/32320)

- **Snap cronjobs dialog appears and disappears after some seconds — needed specific assert handling for the case where the window was closed automatically**
  [MetaMask/metamask-extension#33004](https://github.com/MetaMask/metamask-extension/pull/33004)

- **Need to wait until the dialog is closed before performing the next action in Request Queuing tests**
  [MetaMask/metamask-extension#34141](https://github.com/MetaMask/metamask-extension/pull/34141)

  ❌ Incorrect:
  ```javascript
  await driver.clickElement({ text: 'Connect', tag: 'button' });
  await driver.delay(regularDelayMs);
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  ```

  ✅ Correct:
  ```javascript
  await driver.clickElementAndWaitForWindowToClose({ text: 'Connect', tag: 'button' });
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  ```

---

### Race Conditions with React Re-renders

- **After changing the language, clicking on the account menu while MetaMask is in a loading state — click takes no effect as the component re-renders**
  [MetaMask/metamask-extension#25648](https://github.com/MetaMask/metamask-extension/pull/25648)

  ❌ Incorrect:
  ```javascript
  await driver.waitForSelector('[data-testid="account-options-menu-button"]');
  await driver.clickElement('[data-testid="account-options-menu-button"]');
  ```

  ✅ Correct:
  ```javascript
  // Wait for re-renders to settle before clicking
  await driver.assertElementNotPresent('.loading-overlay');
  await driver.clickElement('[data-testid="account-options-menu-button"]');
  ```

- **Checkbox component for Snap Insights Signatures is re-rendered when the host value is loaded, making the checkbox unchecked if the click happens before the re-render**
  [MetaMask/metamask-extension#27007](https://github.com/MetaMask/metamask-extension/pull/27007)

  ❌ Incorrect:
  ```javascript
  await driver.clickElement('.mm-checkbox__input-wrapper');
  ```

  ✅ Correct:
  ```javascript
  // Wait for host to render before clicking — re-render resets checkbox state
  await driver.waitForSelector({ text: '127.0.0.1:8080', tag: 'span' });
  await driver.clickElement('.mm-checkbox__input-wrapper');
  ```

- **The Add account modal needs to finish rendering the account list before proceeding with a click action — otherwise the re-render causes the click to be performed outside the popup, closing the modal**
  [MetaMask/metamask-extension#27420](https://github.com/MetaMask/metamask-extension/pull/27420)

  ❌ Incorrect:
  ```javascript
  await driver.clickElement('[data-testid="account-menu-icon"]');
  await driver.clickElement('[data-testid="multichain-account-menu-popover-action-button"]');
  ```

  ✅ Correct:
  ```javascript
  await driver.clickElement('[data-testid="account-menu-icon"]');
  // Wait until account list is loaded to avoid re-render race condition
  await driver.waitForSelector({ text: 'Account 1', tag: 'span' });
  await driver.clickElement('[data-testid="multichain-account-menu-popover-action-button"]');
  ```

- **In the onboarding flow, clicking an element when it's moving causes the click to take no effect. Added a new driver method to wait until the element is not moving**
  [MetaMask/metamask-extension#27921](https://github.com/MetaMask/metamask-extension/pull/27921)

  ❌ Incorrect:
  ```javascript
  await driver.clickElement('[data-testid="category-back-button"]');
  await driver.delay(regularDelayMs);
  await driver.clickElement('[data-testid="privacy-settings-back-button"]');
  ```

  ✅ Correct:
  ```javascript
  await driver.clickElement('[data-testid="category-back-button"]');
  // Wait until carousel stops animating — clicking while moving has no effect
  await driver.waitForElementToStopMoving('[data-testid="privacy-settings-back-button"]');
  await driver.clickElement('[data-testid="privacy-settings-back-button"]');
  ```

- **In the carousel spec, looking for an element and then using `.click` — a re-render in between made the element stale. Should use the custom `clickElement` driver method**
  [MetaMask/metamask-extension#33362](https://github.com/MetaMask/metamask-extension/pull/33362)

  ❌ Incorrect:
  ```javascript
  const dots = await driver.findElements('.dot');
  await dots[i].click();
  ```

  ✅ Correct:
  ```javascript
  await driver.clickElement(`[aria-label="slide item ${i}"]`);
  ```

---

### Actions that Take Time

- **Requests to Sentry take time — if the wait time is not enough, tests will be flaky**
  [MetaMask/metamask-extension#26648](https://github.com/MetaMask/metamask-extension/pull/26648)

  ❌ Incorrect:
  ```javascript
  await driver.wait(async () => {
    const isPending = await mockedEndpoint.isPending();
    return isPending === false;
  }, 3000);
  ```

  ✅ Correct:
  ```javascript
  await driver.wait(async () => {
    const isPending = await mockedEndpoint.isPending();
    return isPending === false;
  }, 8000);
  ```

- **Chrome takes time to write to .log files (storage) — vault decrypt test was flaky when trying to import the log file before it was finished writing**
  [MetaMask/metamask-extension#26612](https://github.com/MetaMask/metamask-extension/pull/26612)

- **The Connect action takes several seconds — the default timeout for the next action was not enough**
  [MetaMask/metamask-extension#26792](https://github.com/MetaMask/metamask-extension/pull/26792)

  ❌ Incorrect:
  ```javascript
  await driver.clickElementSafe('[data-testid="snap-install-scroll"]');
  ```

  ✅ Correct:
  ```javascript
  await driver.clickElementSafe('[data-testid="snap-install-scroll"]', 3000);
  ```

- **After going to metamask.io with Marketing feature enabled, the cookie id takes time to be added into MetaMask state**
  [MetaMask/metamask-extension#26697](https://github.com/MetaMask/metamask-extension/pull/26697/files#diff-b1c4086e548781d946ed142c838710286d74e7043c5b7b0edce4e5f617091a52R73)

- **Some `it` blocks are really long leading to timeout issues — not because the test fails, but because the 80000ms threshold is reached**
  [MetaMask/metamask-extension#30044](https://github.com/MetaMask/metamask-extension/pull/30044)

  ❌ Incorrect:
  ```javascript
  describe('Account syncing - User already has balances on multiple accounts', function () {
    if (!IS_ACCOUNT_SYNCING_ENABLED) {
      return;
    }
    // ... long-running tests with default timeout
  ```

  ✅ Correct:
  ```javascript
  describe('Account syncing - User already has balances on multiple accounts', function () {
    this.timeout(160000);
    if (!IS_ACCOUNT_SYNCING_ENABLED) {
      return;
    }
    // ...
  ```

- **Metrics events can get unordered if 2 actions are done subsequently very fast, leading to the 2nd event being the first one triggered**
  [MetaMask/metamask-extension#30031](https://github.com/MetaMask/metamask-extension/pull/30031)

- **Importing a function from another spec file causes the tests from that spec file to also be run, causing long test runs and possible timeouts**
  [MetaMask/metamask-extension#30481](https://github.com/MetaMask/metamask-extension/pull/30481)

  ❌ Incorrect:
  ```javascript
  import { mockedSourcifyTokenSend } from '../confirmations/transactions/erc20-token-send-redesign.spec';
  ```

  ✅ Correct:
  ```javascript
  // Moved shared function to a non-spec helpers file
  import { mockedSourcifyTokenSend } from '../confirmations/helpers';
  ```

- **Chain id is not immediately set when we land on the home page. For actions that rely on chain id, should wait until the balance is loaded**
  [MetaMask/metamask-extension#31348](https://github.com/MetaMask/metamask-extension/pull/31348)

  ❌ Incorrect:
  ```javascript
  const homePage = new HomePage(driver);
  await homePage.startBridgeFlow();
  ```

  ✅ Correct:
  ```javascript
  const homePage = new HomePage(driver);
  await homePage.check_expectedBalanceIsDisplayed();
  await homePage.startBridgeFlow();
  ```

- **Creating an account takes a few seconds to be loaded. Performing a subsequent action right away without checking can create race conditions (e.g., switching to Solana shows a dialog warning about missing Solana account)**
  [MetaMask/metamask-extension#31382](https://github.com/MetaMask/metamask-extension/pull/31382)

  ❌ Incorrect:
  ```javascript
  await accountListPage.addAccount({ accountType: 'Solana', accountName: 'Solana 1' });
  await test(driver, mockServer);
  ```

  ✅ Correct:
  ```javascript
  await accountListPage.addAccount({ accountType: 'Solana', accountName: 'Solana 1' });
  await headerComponent.check_accountLabel('Solana 1');
  await test(driver, mockServer);
  ```

- **On the Swap page with a default token, adding an amount triggers quotes. Changing to a custom token before quotes finalize can load quotes for the previous token swap**
  [MetaMask/metamask-extension#32233](https://github.com/MetaMask/metamask-extension/pull/32233)

- **Re-starting the wallet after the vault was corrupt**
  [MetaMask/metamask-extension#33591](https://github.com/MetaMask/metamask-extension/pull/33591)

- **Scroll to bottom using the arrow button takes several seconds for the button to disappear (wallet-side bug)**
  [MetaMask/metamask-extension#33493](https://github.com/MetaMask/metamask-extension/pull/33493)

- **Writing to the local storage file takes time — Vault Decryptor test flaky because sometimes the backup file was empty on upload**
  [MetaMask/metamask-extension#33646](https://github.com/MetaMask/metamask-extension/pull/33646)

  ❌ Incorrect:
  ```javascript
  async function waitUntilFileIsWritten({ driver, filePath, maxRetries = 3, minFileSize = 1000000 }) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const fileSize = await getFileSize(filePath);
      if (fileSize > minFileSize) {
        break;
      } else if (attempt < maxRetries - 1) {
        await driver.delay(2000);
      }
    }
  }
  ```

  ✅ Correct:
  ```javascript
  async function waitUntilFileIsWritten({ driver, filePath, maxRetries = 5, minFileSize = 1000000 }) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const fileSize = await getFileSize(filePath);
      if (fileSize > minFileSize) {
        return;
      }
      if (attempt < maxRetries - 1) {
        await driver.delay(5000);
      }
    }
    throw new Error(
      `File did not reach the minimum size of ${minFileSize} bytes after ${maxRetries} retries.`,
    );
  }
  ```

- **Request to Profile Sync after onboarding takes seconds — locking the wallet before this request causes "unable to proceed, wallet is locked" error**
  [MetaMask/metamask-extension#33763](https://github.com/MetaMask/metamask-extension/pull/33763)

  ❌ Incorrect:
  ```javascript
  await loginWithBalanceValidation(driver, localNodes[0]);
  const homePage = new HomePage(driver);
  await homePage.headerNavbar.check_pageIsLoaded();
  await driver.delay(5000);
  await homePage.headerNavbar.lockMetaMask();
  ```

  ✅ Correct:
  ```javascript
  await loginWithBalanceValidation(driver, localNodes[0]);
  // Wait for auth request to complete instead of arbitrary delay
  await driver.waitUntil(
    async () => {
      const requests = await mockedEndpoint.getSeenRequests();
      return requests.length > 0;
    },
    { interval: 200, timeout: 10000 },
  );
  const homePage = new HomePage(driver);
  await homePage.headerNavbar.check_pageIsLoaded();
  await homePage.headerNavbar.lockMetaMask();
  ```

- **After login, Authentication API requests take time to be triggered. Locking the wallet before they happen causes "wallet is locked" error**
  [MetaMask/metamask-extension#34888](https://github.com/MetaMask/metamask-extension/pull/34888)

  ❌ Incorrect (complex mock + waitUntil pattern):
  ```javascript
  testSpecificMock: seeAuthenticationRequest,
  // ...
  await driver.waitUntil(
    async () => {
      const requests = await mockedEndpoint.getSeenRequests();
      return requests.length > 0;
    },
    { interval: 200, timeout: 10000 },
  );
  ```

  ✅ Correct (simplified — just ignore the benign error):
  ```javascript
  // Ignore the harmless console error that occurs when wallet is locked during in-flight auth
  ignoredConsoleErrors: ['unable to proceed, wallet is locked'],
  ```

- **Triggering several transactions from different dapps without waiting individually can cause transactions to appear in a different order**
  [MetaMask/metamask-extension#35944](https://github.com/MetaMask/metamask-extension/pull/35944)

---

### Errors in the testing dapp

- **A span element is nested inside the buttons for all Snap test e2e buttons — causes flakiness when interacting with the button. Fixed on the snap test dapp side**
  [MetaMask/snaps#2782](https://github.com/MetaMask/snaps/pull/2782)
  Related: [#27597](https://github.com/MetaMask/metamask-extension/issues/27597), [#27576](https://github.com/MetaMask/metamask-extension/issues/27576), [#26804](https://github.com/MetaMask/metamask-extension/issues/26804)

- **Phishing detection page adds event listener later on, making the click to the malicious link do nothing**
  [MetaMask/phishing-warning#173](https://github.com/MetaMask/phishing-warning/pull/173)

---

### Not using driver methods

- **Using `element.click()` instead of `clickElement()` can cause race conditions when the element is present but not clickable. The driver function has appropriate guards in place**
  [MetaMask/metamask-extension#27599](https://github.com/MetaMask/metamask-extension/pull/27599)

  ❌ Incorrect:
  ```javascript
  const [, tst] = await driver.findElements(
    '[data-testid="multichain-token-list-button"]',
  );
  await tst.click();

  // ...
  const body = await driver.findElement('[data-testid="empty-page-body"]');
  assert.equal(await body.getText(), 'Empty page by MetaMask');
  assert.equal(
    await driver.getCurrentUrl(),
    'https://etherscan.io/address/0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
  );
  ```

  ✅ Correct:
  ```javascript
  await driver.clickElement({ text: 'TST', tag: 'span' });

  // ...
  await driver.waitForUrl({
    url: 'https://etherscan.io/address/0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
  });
  await driver.waitForSelector({ text: 'Empty page by MetaMask', tag: 'body' });
  ```

---

## Bugs Discovered on the Wallet Level while Investigating Flaky Tests

- **Send - ENS resolution displays different address length previews**
  [MetaMask/metamask-extension#25286](https://github.com/MetaMask/metamask-extension/issues/25286)

- **Tokens - MM breaks with "Can't convert undefined to object"**
  [MetaMask/metamask-extension#25266](https://github.com/MetaMask/metamask-extension/issues/25266)

- **Gas - Race condition where gas is not updated after switching assets and going to the last Confirmation screen**
  [MetaMask/metamask-extension#25243](https://github.com/MetaMask/metamask-extension/issues/25243)

- **Assets - Importing an ERC1155 token throws "Contract does not support ERC721 metadata interface"**
  [MetaMask/metamask-extension#24988](https://github.com/MetaMask/metamask-extension/issues/24988)

- **Tokens - Cannot import a token ERC1155 if the IPFS call for the metadata takes long**
  [MetaMask/metamask-extension#24710](https://github.com/MetaMask/metamask-extension/issues/24710)

- **Onboarding rerouting when createNewAccount flow**
  [MetaMask/metamask-extension#24874](https://github.com/MetaMask/metamask-extension/pull/24874)

- **Announcements - NFT autodetection modal overlays Token autodetection modal**
  [MetaMask/metamask-extension#25465](https://github.com/MetaMask/metamask-extension/issues/25465)

- **Settings - Changing the app locale re-renders the state two times and displays the loading spinner 2 times**
  [MetaMask/metamask-extension#25651](https://github.com/MetaMask/metamask-extension/issues/25651)

- **Hardware Wallet - Going to the hardware wallet add account page in Firefox re-renders the state two times**
  [MetaMask/metamask-extension#25851](https://github.com/MetaMask/metamask-extension/issues/25851)

- **Race condition changes order in which transactions are displayed**
  [MetaMask/metamask-extension#25251](https://github.com/MetaMask/metamask-extension/issues/25251)

- **Assets - Add token doesn't close the MM dialog after Adding it (MMI-only)**
  [MetaMask/metamask-extension#27854](https://github.com/MetaMask/metamask-extension/issues/27854)

- **Wallet API - When connecting to the test dapp for the first time, switched to Mainnet automatically despite not having this network selected (Release Blocker)**
  [MetaMask/metamask-extension#27891](https://github.com/MetaMask/metamask-extension/issues/27891)

- **Network Switch - After switching networks for the first time, "Network switched" dialog sometimes appears and sometimes doesn't**
  [MetaMask/metamask-extension#27870](https://github.com/MetaMask/metamask-extension/issues/27870)

- **BTC Accounts - Portfolio link is not displayed when we have a BTC Account selected**
  [MetaMask/metamask-extension#28185](https://github.com/MetaMask/metamask-extension/issues/28185)

- **Blockaid security validation can be bypassed with race condition**
  [Slack thread](https://consensys.slack.com/archives/C029JG63136/p1731690020573439?thread_ts=1729246801.516029&cid=C029JG63136)

- **Wallet API queuing bug not fully fixed**
  [Slack thread](https://consensys.slack.com/archives/CTQAGKY5V/p1731693702380099?thread_ts=1731579667.780579&cid=CTQAGKY5V)

- **Balance polling starting with a locked wallet makes balance load forever when unlocked (until MM is refreshed)**
  [commit 9aff235](https://github.com/MetaMask/metamask-extension/pull/28277/commits/9aff235d168598ac0c4da763a6eef0b7c7002212)

- **Gas controls to edit Max base fee and Priority Fee do not support decimal point on Mac (test passed on Linux but not Mac)**
  [MetaMask/metamask-extension#28843](https://github.com/MetaMask/metamask-extension/issues/28843)

- **Send - When pasting an address without 0x prefix, the input is normalized but the Continue button remains disabled**
  [MetaMask/metamask-extension#30349](https://github.com/MetaMask/metamask-extension/issues/30349)

- **Gas API - Starting a transaction/swap makes a request to /networks/1/gasPrices even if not on Ethereum Mainnet**
  [MetaMask/metamask-extension#33377](https://github.com/MetaMask/metamask-extension/issues/33377)

- **Survey - 2 identical requests are made to the surveys endpoint whenever we start the wallet for the 1st time**
  [MetaMask/metamask-extension#33604](https://github.com/MetaMask/metamask-extension/issues/33604)

- **Error is re-thrown causing duplicated Error key (e.g., "Error: Error: Unable to find value of key...")**
  [MetaMask/metamask-extension#34867](https://github.com/MetaMask/metamask-extension/issues/34867)

- **Accounts - Repeated API GET request to profile/lineage after login**
  [MetaMask/metamask-extension#34938](https://github.com/MetaMask/metamask-extension/issues/34938)

- **ENS resolution - IPFS resolves domains before I've onboarded to the wallet**
  [MetaMask/metamask-extension#35675](https://github.com/MetaMask/metamask-extension/issues/35675)

- **Onboarding - Metametrics page sometimes appears on Chrome browser for Social login**
  [MetaMask/metamask-extension#36070](https://github.com/MetaMask/metamask-extension/issues/36070)

- **Accounts state not updated immediately after create-password**
  [MetaMask/metamask-extension#36395](https://github.com/MetaMask/metamask-extension/pull/36395)

---

## E2E Anti-Patterns

- **Directly asserting element values by text without waiting for those text to be present** using `assert(element.getText(), expected text)`
  [MetaMask/metamask-extension#19870](https://github.com/MetaMask/metamask-extension/issues/19870)

  ❌ Incorrect:
  ```javascript
  const element = await driver.findElement('[data-testid="token-value"]');
  assert.equal(await element.getText(), '100 TST');
  ```

  ✅ Correct:
  ```javascript
  await driver.waitForSelector({
    css: '[data-testid="token-value"]',
    text: '100 TST',
  });
  ```

- **Looking for an element and then asserting it's displayed** with `assert.equal(await elem.isDisplayed(), true)` — causes race conditions if the element updates between the lookup and assertion (e.g., transaction changes from pending to confirmed, throwing "stale element" error)
  [MetaMask/metamask-extension#27928](https://github.com/MetaMask/metamask-extension/pull/27928/files#r1805186006)

  ❌ Incorrect:
  ```javascript
  const transactionItem = await driver.waitForSelector({
    css: '[data-testid="activity-list-item-action"]',
    text: 'Deposit',
  });
  assert.equal(await transactionItem.isDisplayed(), true);
  ```

  ✅ Correct:
  ```javascript
  await driver.waitForSelector({
    css: '[data-testid="activity-list-item-action"]',
    text: 'Deposit',
  });
  ```

- **Using `element.click()` instead of `clickElement()`** — looking for the element and then using `.click` can cause race conditions if the element re-renders and becomes stale. The `clickElement` driver method has a guard for this
  [MetaMask/metamask-extension#27599](https://github.com/MetaMask/metamask-extension/pull/27599)

  ❌ Incorrect:
  ```javascript
  const [, tst] = await driver.findElements('[data-testid="multichain-token-list-button"]');
  await tst.click();
  ```

  ✅ Correct:
  ```javascript
  await driver.clickElement({ text: 'TST', tag: 'span' });
  ```

- **Going to live sites** (portfolio dapp, snap dapp, vault decrypt page) instead of using mocks
  > Note: [a catch-all mock PR](https://github.com/MetaMask/metamask-extension/) exists, but currently 130+ specs fail because they rely on live requests. Once fixed and merged, it won't be possible to introduce changes without adding corresponding mocks.

- **Adding delays instead of waiting for conditions**, whenever possible

  ❌ Incorrect:
  ```javascript
  await driver.clickElement({ text: 'Save', tag: 'button' });
  await driver.delay(2000);
  await driver.clickElement('[data-testid="next-step"]');
  ```

  ✅ Correct:
  ```javascript
  await driver.clickElementAndWaitToDisappear({ text: 'Save', tag: 'button' });
  await driver.clickElement('[data-testid="next-step"]');
  ```

- **Importing a function from another spec file** — this causes the tests from that spec file import to also be run, causing long test runs and possible timeouts (>80000ms)
  [MetaMask/metamask-extension#30481](https://github.com/MetaMask/metamask-extension/pull/30481/files#r1965313492)

  ❌ Incorrect:
  ```javascript
  import { mockedSourcifyTokenSend } from '../confirmations/transactions/erc20-token-send-redesign.spec';
  ```

  ✅ Correct:
  ```javascript
  import { mockedSourcifyTokenSend } from '../confirmations/helpers';
  ```

---

## Unit Test Flakiness Categories

- **A property of the store is sometimes undefined**
  [MetaMask/metamask-extension#27941](https://github.com/MetaMask/metamask-extension/pull/27941)

  ❌ Incorrect:
  ```javascript
  const store = configureMockStore(middleware)(state);
  ```

  ✅ Correct:
  ```javascript
  const testStore = {
    DNS: domainInitialState,
    metamask: state.metamask,
    snaps: {},
  };
  const store = configureMockStore(middleware)(testStore);
  ```

---

## Flakiness on Other CI Jobs

- **The lint-lockfile job is flaky as it's under-resourced** — fixed by changing resources from medium to medium-plus
  [MetaMask/metamask-extension#27950](https://github.com/MetaMask/metamask-extension/pull/27950)

- **Rate limited by yarnpkg returning 429 Too Many Requests** — makes any job dependent on yarn fail
  [Slack thread](https://consensys.slack.com/archives/CTQAGKY5V/p1747406828996759)

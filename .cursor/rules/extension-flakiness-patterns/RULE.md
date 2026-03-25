---
description: Known flakiness patterns and anti-patterns in MetaMask Extension CI. Use when analyzing, debugging, or fixing flaky tests.
globs: 'test/e2e/**/*.spec.ts,test/e2e/**/*.spec.js,test/e2e/page-objects/**/*.ts'
alwaysApply: false
---

Reference: [Extension CI Flakiness - Google Doc](https://docs.google.com/document/d/1oXd5d1X7j14lHLjaRCWjEh3uhndrXQ_46lBuZ9SAu6M/edit?tab=t.0)

**See also:**

- [E2E Testing Guidelines](../e2e-testing-guidelines/RULE.md) - General E2E test patterns and page object conventions
- [Unit Testing Guidelines](../unit-testing-guidelines/RULE.md) - Unit test patterns and Jest best practices

# Extension CI Flakiness Patterns

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
- [E2E Anti-Patterns](#e2e-anti-patterns)
- [Unit Test Flakiness Categories](#unit-test-flakiness-categories)
- [Flakiness on Other CI Jobs](#flakiness-on-other-ci-jobs)

---

## E2E Flakiness Categories

### Race Conditions on Driver/Helpers Functions

- **Click Element with stale element**
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
  ❌ Incorrect:

  ```javascript
  const title = await driver.getTitle();
  assert.equal(title, 'MetaMask');
  ```

  ✅ Correct:

  ```javascript
  await driver.switchToWindowWithTitle('MetaMask');
  ```

- **Click parent Element with inner elements that refresh instead of the most possible specific element**
  ❌ Incorrect:

  ```javascript
  await driver.clickElement('[data-testid="token-list-item"]');
  ```

  ✅ Correct:

  ```javascript
  await driver.clickElement({ text: 'TST', tag: 'span' });
  ```

- **Holding SRP button for less time than required**
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

- **Getting multiple elements with the same selector and then expecting to have the exact number**
  ❌ Incorrect:
  ```javascript
  const accounts = await driver.findElements('.account-list-item');
  assert.equal(accounts.length, 5);
  ```
  ✅ Correct:
  ```javascript
  await driver.waitForSelector('.account-list-item:nth-child(5)');
  ```

---

### Taking Unnecessary Steps

- **Create token, approve token, missing permission controller connected to the test dapp**
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

- **Unnecessary browser refresh, causing to land into the Confirmation screen if it was appearing in the activity as unapproved**
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

- **Unnecessary scrolls and delays which added up more than 15 seconds of delay**
  ❌ Incorrect:

  ```javascript
  await driver.delay(5000);
  await driver.scrollToElement(selector);
  await driver.delay(5000);
  await driver.scrollToElement(anotherSelector);
  await driver.delay(5000);
  ```

  ✅ Correct:

  ```javascript
  await driver.waitForSelector(selector);
  await driver.clickElement(selector);
  ```

- **Unnecessary step: performing UI actions that can be set via fixtures**
  ❌ Incorrect:

  ```javascript
  await unlockWallet(driver);
  await driver.clickElement('[data-testid="global-menu-settings"]');
  await driver.clickElement('[data-testid="advanced-setting-show-nonce"]');
  await driver.clickElement('[data-testid="settings-back-button"]');
  ```

  ✅ Correct:

  ```javascript
  fixtures: new FixtureBuilder()
    .withPreferencesController({ useNonceField: true })
    .build(),
  async ({ driver }) => {
    await unlockWallet(driver);
  ```

- **Unnecessary steps importing a token instead of using fixtures**
  ❌ Incorrect:

  ```javascript
  navigateToAssetPage = async (
    contractRegistry,
    symbol,
    shouldImportToken = true,
  ) => {
    if (shouldImportToken) {
      const contractAddress = await contractRegistry.getContractAddress(
        SMART_CONTRACTS.HST,
      );
      await clickNestedButton(this.driver, 'Import tokens');
      await clickNestedButton(this.driver, 'Custom token');
      await this.driver.fill(
        LOCATOR.MM_IMPORT_TOKENS_MODAL('custom-address'),
        contractAddress,
      );
      await this.driver.fill(
        LOCATOR.MM_IMPORT_TOKENS_MODAL('custom-symbol'),
        symbol,
      );
      await this.driver.waitForSelector(
        LOCATOR.MM_IMPORT_TOKENS_MODAL('custom-decimals'),
      );
      await clickNestedButton(this.driver, 'Next');
      await this.driver.clickElement(
        LOCATOR.MM_IMPORT_TOKENS_MODAL('import-button'),
      );
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

**Key principle:** Every external API call must be mocked. Missing mocks cause tests to hit real services (or get blocked), leading to flaky failures that depend on network conditions and third-party uptime.

- **Missing IPFS metadata mock for Import ERC1155**
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

- **Mocking eth_balance with a value >0ETH causes request polling for subsequent accounts, creating new ones and preventing other requests. Mock balance 0 to avoid this when using Mainnet**
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

- **Inconsistency between the mocked value and the default value: test execution success depends on the polling rate**
  ❌ Incorrect:

  ```javascript
  // Mock returns stale/wrong value that conflicts with default state
  .forGet('/v2/chains')
  .thenJson(200, { chains: [{ chainId: '0x1', isActive: false }] });
  ```

  ✅ Correct:

  ```javascript
  // Mock must match what the app expects — mismatches cause race conditions
  .forGet('/v2/chains')
  .thenJson(200, { chains: [{ chainId: '0x1', isActive: true }] });
  ```

- **Incorrect mock request by passing an id, makes the body never match, so the mock response is not implemented**
  ❌ Incorrect:

  ```javascript
  export const MALFORMED_TRANSACTION_REQUEST_MOCK = {
    request: {
      id: '21', // Including 'id' causes exact-match to fail since id is dynamic
      jsonrpc: '2.0',
      method: 'infura_simulateTransactions',
      params: [
        /* ... */
      ],
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
      params: [
        /* ... */
      ],
    },
  };

  await server
    .forPost(TX_SENTINEL_URL)
    .withJsonBodyIncluding(request)
    .thenJson(200, response);
  ```

- **Blockaid API was not correctly mocked (chainId used was int instead of hex), causing Blockaid validation to fail and metrics event assertion values to fail**
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
    .forPost(
      `${SECURITY_ALERTS_PROD_API_BASE_URL}/validate/0x${chainId.toString(16)}`,
    )
    .thenCallback(() => ({ statusCode: 200 }));
  ```

- **The default mock for Solana was overriding the custom mock, causing the balance to be different if the test was slow enough**
  ❌ Incorrect:
  ```javascript
  // Custom mock registered BEFORE the default mock — default overwrites it
  await server
    .forPost(SOLANA_URL)
    .thenJson(200, { result: { value: 500000000 } });
  await setupDefaultMocks(server); // includes its own Solana mock
  ```
  ✅ Correct:
  ```javascript
  // Register default mocks FIRST, then override with custom mock
  await setupDefaultMocks(server);
  await server
    .forPost(SOLANA_URL)
    .thenJson(200, { result: { value: 500000000 } });
  ```

**Additional common missing-mock scenarios** (all follow the same pattern — add the missing mock to avoid hitting real services):

| Missing mock                                   | Fix PR                                                                              |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| ENS resolution                                 | [#24898](https://github.com/MetaMask/metamask-extension/pull/24898)                 |
| aggregatorMetadata, block list, blocked tokens | [MetaMask-planning#2637](https://github.com/MetaMask/MetaMask-planning/issues/2637) |
| Swap quotes                                    | [#27160](https://github.com/MetaMask/metamask-extension/pull/27160)                 |
| Solana `api.simplehash.com`                    | [#29986](https://github.com/MetaMask/metamask-extension/pull/29986)                 |
| Transaction simulation supported networks      | [#30507](https://github.com/MetaMask/metamask-extension/pull/30507)                 |
| Smart Transactions + Swap specs                | [#30932](https://github.com/MetaMask/metamask-extension/pull/30932)                 |
| Swaps notifications slippage                   | [#31383](https://github.com/MetaMask/metamask-extension/pull/31383)                 |
| Solana devnet                                  | [#31331](https://github.com/MetaMask/metamask-extension/pull/31331)                 |
| Onboarding privacy                             | [#31272](https://github.com/MetaMask/metamask-extension/pull/31272)                 |
| User storage                                   | [#31947](https://github.com/MetaMask/metamask-extension/pull/31947)                 |
| Custom network during onboarding               | [#32932](https://github.com/MetaMask/metamask-extension/pull/32932)                 |
| Token list                                     | [#34834](https://github.com/MetaMask/metamask-extension/pull/34834)                 |

---

### Removing URL/host entries to the live server allowlist

Tests should never depend on live servers. Remove live server URLs from the allowlist and add corresponding mocks instead.

❌ Incorrect:

```javascript
// Allowlisting a live URL so the test can reach it
const LIVE_SERVER_ALLOWLIST = [
  'https://token.api.cx.metamask.io',
  'https://gas.api.cx.metamask.io',
];
```

✅ Correct:

```javascript
// Remove from allowlist and add a mock instead
await server
  .forGet('https://token.api.cx.metamask.io/tokens/1')
  .thenJson(200, MOCK_TOKEN_LIST);
```

---

### Race Conditions on Gas / Balance / Navigation values on Screen

- **Balance not loaded when starting the Send, causing gas to be 0 and blocking the Confirmation screen**
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
  ❌ Incorrect:

  ```javascript
  await sendPage.selectAsset('TST');
  await sendPage.fillAmount('10');
  await sendPage.clickContinue(); // gas may still be for the previous asset
  ```

  ✅ Correct:

  ```javascript
  await sendPage.selectAsset('TST');
  await sendPage.fillAmount('10');
  await driver.waitForSelector({
    text: '0.000',
    css: '[data-testid="gas-fee"]',
  });
  await sendPage.clickContinue();
  ```

- **Transaction didn't have the total value loaded before we click reject**
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

- **Confirmation popup appears and obfuscates subsequent elements (snaps, vault decryption, etc.)**
  ❌ Incorrect:

  ```javascript
  // Clicking the next element immediately — the confirmation popup may be on top
  await driver.clickElement('[data-testid="account-options-menu-button"]');
  ```

  ✅ Correct:

  ```javascript
  // Dismiss the popup first, wait for it to disappear, then proceed
  await driver.clickElementAndWaitToDisappear({
    text: 'Got it',
    tag: 'button',
  });
  await driver.clickElement('[data-testid="account-options-menu-button"]');
  ```

- **"Got it" element taking time to disappear obfuscates other elements**
  ❌ Incorrect:

  ```javascript
  await driver.clickElement({ text: 'Got it', tag: 'button' });
  await driver.clickElement({ text: '127.0.0.1:8080', tag: 'p' });
  ```

  ✅ Correct:

  ```javascript
  await driver.clickElementAndWaitToDisappear({
    text: 'Got it',
    tag: 'button',
  });
  await driver.clickElement({ text: '127.0.0.1:8080', tag: 'p' });
  ```

- **Add account popup obfuscates clicking on the next element from the Home page**
  ❌ Incorrect:

  ```javascript
  await driver.clickElement({ text: 'Create', tag: 'button' });
  ```

  ✅ Correct:

  ```javascript
  await driver.clickElementAndWaitToDisappear({
    text: 'Create',
    tag: 'button',
  });
  ```

- **Import NFT modal obfuscates clicking on the Account menu**
  ❌ Incorrect:

  ```javascript
  await driver.clickElement('[data-testid="import-nft-button"]');
  // Modal still visible when trying to click account menu
  await driver.clickElement('[data-testid="account-menu-icon"]');
  ```

  ✅ Correct:

  ```javascript
  await driver.clickElementAndWaitToDisappear(
    '[data-testid="import-nft-button"]',
  );
  await driver.clickElement('[data-testid="account-menu-icon"]');
  ```

- **On the onboarding carousel, not waiting for the element to disappear when switching between screens causes race conditions**
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
  await driver.clickElementAndWaitToDisappear({
    text: 'Manage default settings',
  });
  await driver.clickElement({ text: 'General' });

  await driver.clickElementAndWaitToDisappear({ text: 'Save', tag: 'button' });
  await driver.clickElement('[data-testid="category-back-button"]');

  await driver.clickElementAndWaitToDisappear({ text: 'Done', tag: 'button' });
  await driver.assertElementNotPresent('.popover-bg');
  ```

- **On the Add token flow, should wait until the dialog has been closed before proceeding — otherwise re-render with React failures**
  ❌ Incorrect:

  ```javascript
  await driver.clickElement(
    '[data-testid="import-tokens-modal-import-button"]',
  );
  ```

  ✅ Correct:

  ```javascript
  await driver.clickElementAndWaitToDisappear(
    '[data-testid="import-tokens-modal-import-button"]',
  );
  ```

- **On Queued Confirmations tests, connected manually to the test dapp and didn't wait for the MM dialog to close after connect. Caused chainId to be incorrectly outdated**
  ❌ Incorrect:

  ```javascript
  await driver.clickElement({ text: 'Connect', tag: 'button' });

  await driver.waitUntilXWindowHandles(4);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  ```

  ✅ Correct:

  ```javascript
  await driver.clickElementAndWaitForWindowToClose({
    text: 'Connect',
    tag: 'button',
  });

  await driver.waitForSelector({ css: '[id="chainId"]', text: '0x539' });
  ```

- **The notification (red dot) appears on top of the menu, blocking clicks on the menu button**
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
  ❌ Incorrect:

  ```javascript
  await driver.fill('[data-testid="network-form-chain-id"]', '10');
  // Error message from partial input ('1') persists even after full value is entered
  ```

  ✅ Correct:

  ```javascript
  await driver.fill('[data-testid="network-form-chain-id"]', '10');
  // Wait for validation to complete before asserting
  await driver.waitForSelector({
    css: '[data-testid="network-form-chain-id"]',
    text: '10',
  });
  await driver.assertElementNotPresent('.form-error-message');
  ```

- **Trying to find a pending transaction and then a confirmed one — bad pattern as we shouldn't look for transient elements. Looking for the confirmed tx gives us the assertion we want**
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
  ❌ Incorrect:

  ```javascript
  await driver.clickElement({ text: 'report a detection problem.' });
  await driver.findElement({
    text: `Empty page by ${BlockProvider.PhishFort}`,
  });
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
  ❌ Incorrect:

  ```javascript
  const buySellButton = await driver.waitForSelector(
    '[data-testid="coin-overview-buy"]',
  );
  assert.equal(await buySellButton.isEnabled(), true);
  ```

  ✅ Correct:

  ```javascript
  await driver.findClickableElement('[data-testid="coin-overview-buy"]');
  ```

- **Find an element and then assert it has the correct value creates a race condition. Need to wait for the desired value**
  ❌ Incorrect:

  ```javascript
  let navigationElement = await driver.findElement(
    '.confirm-page-container-navigation',
  );
  let navigationText = await navigationElement.getText();
  assert.equal(navigationText.includes('1 of 2'), true);
  ```

  ✅ Correct:

  ```javascript
  await driver.findElement(By.xpath("//div[normalize-space(.)='1 of 2']"));
  ```

- **Find an element and assert it has the correct text — race condition when element re-renders between find and getText**
  ❌ Incorrect:

  ```javascript
  const permissionElement = await driver.findElement(
    '[data-testid="permission-label"]',
  );
  assert.equal(await permissionElement.getText(), 'View your accounts');
  ```

  ✅ Correct:

  ```javascript
  await driver.waitForSelector({
    css: '[data-testid="permission-label"]',
    text: 'View your accounts',
  });
  ```

- **Asserting an element is displayed after looking for its selector can cause race conditions where the element updates in between (e.g., tx from pending to confirmed)**
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
  ❌ Incorrect:

  ```javascript
  const transactionList = await driver.findElements(
    '[data-testid="activity-list-item-action"]',
  );
  const transactionText = await transactionList[options.index].getText();
  assert.equal(
    transactionText,
    `Swap ${options.swapFrom} to ${options.swapTo}`,
  );
  ```

  ✅ Correct:

  ```javascript
  await driver.waitForSelector({
    tag: 'p',
    text: `Swap ${options.swapFrom} to ${options.swapTo}`,
  });
  ```

- **Find element and assert correct text in wallet_invokeMethod multichain test**
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

- **Getting all windows and after several steps referencing an old window handle that is now stale**
  ❌ Incorrect:

  ```javascript
  const windowHandles = await driver.getAllWindowHandles();
  // ... many steps later ...
  await driver.switchToWindow(windowHandles[1]); // handle may be stale
  ```

  ✅ Correct:

  ```javascript
  // Re-fetch window handles right before switching
  const windowHandles = await driver.getAllWindowHandles();
  await driver.switchToWindow(windowHandles[1]);
  ```

- **Tests that click a button in the popup window that eventually closes it, but don't wait for the popup to close before continuing**
  ❌ Incorrect:

  ```javascript
  await driver.clickElement({ text: 'Confirm', tag: 'button' });
  // immediately try to switch windows
  ```

  ✅ Correct:

  ```javascript
  await driver.clickElementAndWaitForWindowToClose({
    text: 'Confirm',
    tag: 'button',
  });
  // window is confirmed closed, safe to switch
  ```

- **Triggering a Send from Dapp 1 and quickly switching to Dapp 0 — the network for the first Send is taken from Dapp 0 instead of Dapp 1**
  ❌ Incorrect:

  ```javascript
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#sendButton');
  await driver.switchToWindowWithUrl(secondDappUrl); // switches too fast
  ```

  ✅ Correct:

  ```javascript
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#sendButton');
  await driver.waitUntilXWindowHandles(4); // wait for dialog to appear first
  await driver.switchToWindowWithUrl(secondDappUrl);
  ```

- **Snap cronjobs dialog appears and disappears after some seconds — needed specific handling for the case where the window was closed automatically**
  ❌ Incorrect:

  ```javascript
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.clickElement({ text: 'Approve', tag: 'button' });
  ```

  ✅ Correct:

  ```javascript
  try {
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await driver.clickElement({ text: 'Approve', tag: 'button' });
  } catch {
    // Dialog may have auto-closed — verify from the extension window instead
    await driver.switchToWindowWithTitle(
      WINDOW_TITLES.ExtensionInFullScreenView,
    );
  }
  ```

- **Need to wait until the dialog is closed before performing the next action in Request Queuing tests**
  ❌ Incorrect:
  ```javascript
  await driver.clickElement({ text: 'Connect', tag: 'button' });
  await driver.delay(regularDelayMs);
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  ```
  ✅ Correct:
  ```javascript
  await driver.clickElementAndWaitForWindowToClose({
    text: 'Connect',
    tag: 'button',
  });
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  ```

---

### Race Conditions with React Re-renders

- **After changing the language, clicking on the account menu while MetaMask is in a loading state — click takes no effect as the component re-renders**
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
  ❌ Incorrect:

  ```javascript
  await driver.clickElement('[data-testid="account-menu-icon"]');
  await driver.clickElement(
    '[data-testid="multichain-account-menu-popover-action-button"]',
  );
  ```

  ✅ Correct:

  ```javascript
  await driver.clickElement('[data-testid="account-menu-icon"]');
  // Wait until account list is loaded to avoid re-render race condition
  await driver.waitForSelector({ text: 'Account 1', tag: 'span' });
  await driver.clickElement(
    '[data-testid="multichain-account-menu-popover-action-button"]',
  );
  ```

- **In the onboarding flow, clicking an element when it's moving causes the click to take no effect. Added a new driver method to wait until the element is not moving**
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
  await driver.waitForElementToStopMoving(
    '[data-testid="privacy-settings-back-button"]',
  );
  await driver.clickElement('[data-testid="privacy-settings-back-button"]');
  ```

- **In the carousel spec, looking for an element and then using `.click` — a re-render in between made the element stale. Should use the custom `clickElement` driver method**
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
  ❌ Incorrect:

  ```javascript
  const fileContents = fs.readFileSync(logFilePath, 'utf-8');
  // File may be partially written or empty
  ```

  ✅ Correct:

  ```javascript
  await driver.wait(async () => {
    const fileSize = fs.statSync(logFilePath).size;
    return fileSize > MIN_FILE_SIZE;
  }, 10000);
  const fileContents = fs.readFileSync(logFilePath, 'utf-8');
  ```

- **The Connect action takes several seconds — the default timeout for the next action was not enough**
  ❌ Incorrect:

  ```javascript
  await driver.clickElementSafe('[data-testid="snap-install-scroll"]');
  ```

  ✅ Correct:

  ```javascript
  await driver.clickElementSafe('[data-testid="snap-install-scroll"]', 3000);
  ```

- **After going to metamask.io with Marketing feature enabled, the cookie id takes time to be added into MetaMask state**
  ❌ Incorrect:

  ```javascript
  await driver.openNewPage('https://metamask.io');
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  const state = await driver.executeScript('return window.__METAMASK_STATE__');
  assert.ok(state.marketingCookieId); // may not be set yet
  ```

  ✅ Correct:

  ```javascript
  await driver.openNewPage('https://metamask.io');
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  await driver.wait(async () => {
    const state = await driver.executeScript(
      'return window.__METAMASK_STATE__',
    );
    return state.marketingCookieId !== undefined;
  }, 5000);
  ```

- **Some `it` blocks are really long leading to timeout issues — not because the test fails, but because the 80000ms threshold is reached**
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
  ❌ Incorrect:

  ```javascript
  await driver.clickElement('#action-one');
  await driver.clickElement('#action-two');
  // event for action-two may arrive before action-one
  const events = await mockedEndpoint.getSeenRequests();
  assert.equal(events[0].body.event, 'Action One');
  ```

  ✅ Correct:

  ```javascript
  await driver.clickElement('#action-one');
  await driver.wait(async () => {
    const events = await mockedEndpoint.getSeenRequests();
    return events.length >= 1;
  }, 5000);
  await driver.clickElement('#action-two');
  ```

- **Importing a function from another spec file causes the tests from that spec file to also be run, causing long test runs and possible timeouts**
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
  ❌ Incorrect:

  ```javascript
  await accountListPage.addAccount({
    accountType: 'Solana',
    accountName: 'Solana 1',
  });
  await test(driver, mockServer);
  ```

  ✅ Correct:

  ```javascript
  await accountListPage.addAccount({
    accountType: 'Solana',
    accountName: 'Solana 1',
  });
  await headerComponent.check_accountLabel('Solana 1');
  await test(driver, mockServer);
  ```

- **On the Swap page with a default token, adding an amount triggers quotes. Changing to a custom token before quotes finalize can load quotes for the previous token swap**
  ❌ Incorrect:

  ```javascript
  await swapPage.enterAmount('1');
  await swapPage.selectDestinationToken('TST'); // quotes for default token may still be loading
  ```

  ✅ Correct:

  ```javascript
  await swapPage.selectDestinationToken('TST'); // select token BEFORE entering amount
  await swapPage.enterAmount('1');
  await swapPage.waitForQuotesLoaded();
  ```

- **Re-starting the wallet after the vault was corrupt — need to wait for the extension to fully restart**
  ❌ Incorrect:

  ```javascript
  await driver.executeScript('chrome.runtime.reload()');
  await driver.navigate(); // extension may not be ready
  ```

  ✅ Correct:

  ```javascript
  await driver.executeScript('chrome.runtime.reload()');
  await driver.delay(2000);
  await driver.waitUntilXWindowHandles(1);
  await driver.navigate();
  await driver.waitForSelector('#password');
  ```

- **Scroll to bottom using the arrow button takes several seconds for the button to disappear (wallet-side bug)**
  ❌ Incorrect:

  ```javascript
  await driver.clickElement('[data-testid="scroll-to-bottom"]');
  await driver.clickElement({ text: 'Confirm', tag: 'button' });
  ```

  ✅ Correct:

  ```javascript
  await driver.clickElementAndWaitToDisappear(
    '[data-testid="scroll-to-bottom"]',
  );
  await driver.clickElement({ text: 'Confirm', tag: 'button' });
  ```

- **Writing to the local storage file takes time — Vault Decryptor test flaky because sometimes the backup file was empty on upload**
  ❌ Incorrect:

  ```javascript
  async function waitUntilFileIsWritten({
    driver,
    filePath,
    maxRetries = 3,
    minFileSize = 1000000,
  }) {
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
  async function waitUntilFileIsWritten({
    driver,
    filePath,
    maxRetries = 5,
    minFileSize = 1000000,
  }) {
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
  ❌ Incorrect (complex mock + waitUntil pattern):

  ```javascript
  testSpecificMock: (seeAuthenticationRequest,
    // ...
    await driver.waitUntil(
      async () => {
        const requests = await mockedEndpoint.getSeenRequests();
        return requests.length > 0;
      },
      { interval: 200, timeout: 10000 },
    ));
  ```

  ✅ Correct (simplified — just ignore the benign error):

  ```javascript
  // Ignore the harmless console error that occurs when wallet is locked during in-flight auth
  ignoredConsoleErrors: ['unable to proceed, wallet is locked'],
  ```

- **Triggering several transactions from different dapps without waiting individually can cause transactions to appear in a different order**
  ❌ Incorrect:
  ```javascript
  await dapp1.clickElement('#sendButton');
  await dapp2.clickElement('#sendButton');
  await dapp3.clickElement('#sendButton');
  // Transaction order in activity list may not match submission order
  ```
  ✅ Correct:
  ```javascript
  await dapp1.clickElement('#sendButton');
  await driver.waitUntilXWindowHandles(4);
  await dapp2.clickElement('#sendButton');
  await driver.waitUntilXWindowHandles(4);
  await dapp3.clickElement('#sendButton');
  ```

---

### Errors in the testing dapp

- **A span element is nested inside the buttons for all Snap test e2e buttons — causes flakiness when interacting with the button. Fixed on the snap test dapp side**
  ❌ Incorrect:

  ```javascript
  // Clicking the button hits the inner span, which may not trigger the handler
  await driver.clickElement('#connectSnap');
  ```

  ✅ Correct:

  ```javascript
  // Click the specific inner element, or use the updated dapp with fixed button structure
  await driver.clickElement({ text: 'Connect Snap', tag: 'button' });
  ```

- **Phishing detection page adds event listener later on, making the click to the malicious link do nothing**
  ❌ Incorrect:
  ```javascript
  await driver.navigate(PHISHING_PAGE_URL);
  await driver.clickElement('#proceed-link'); // event listener not yet attached
  ```
  ✅ Correct:
  ```javascript
  await driver.navigate(PHISHING_PAGE_URL);
  await driver.waitForSelector('#proceed-link');
  await driver.delay(500); // allow event listener to attach
  await driver.clickElement('#proceed-link');
  ```

---

### Not using driver methods

- **Using `element.click()` instead of `clickElement()` can cause race conditions when the element is present but not clickable. The driver function has appropriate guards in place**
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

## E2E Anti-Patterns

These are the most critical anti-patterns to avoid. Each is described in detail in the categories above.

1. **Asserting element values without waiting for them** — use `waitForSelector` with `text` instead of `findElement` + `getText` + `assert`. See [Race Conditions with Assertions](#race-conditions-with-assertions-within-the-test-body-steps).

2. **Asserting `isDisplayed()` after finding an element** — the element can update between find and assert (e.g., tx status changes), throwing a stale element error. `waitForSelector` already guarantees the element is displayed.

3. **Using `element.click()` instead of `driver.clickElement()`** — native `.click()` has no stale-element retry. Always use the driver wrapper. See [Not using driver methods](#not-using-driver-methods).

4. **Going to live sites** instead of using mocks — tests should never depend on external services. See [Missing or Incorrect Use of Mocks](#missing-or-incorrect-use-of-mocks).

5. **Adding `driver.delay()` instead of waiting for conditions** — use `waitForSelector`, `clickElementAndWaitToDisappear`, or `waitUntil` instead of arbitrary delays. See [Confirmation Popups / Modals](#confirmation-popups--modals).

6. **Importing from another `.spec` file** — this causes that spec's tests to run too, leading to timeouts. Move shared functions to helper files. See [Actions that Take Time](#actions-that-take-time).

7. **Looking for transient elements** (e.g., "Pending" status) — skip transient states and wait for the final state. See [Race Conditions with Assertions](#race-conditions-with-assertions-within-the-test-body-steps).

---

## Unit Test Flakiness Categories

- **A property of the store is sometimes undefined**
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

- **Rate limited by yarnpkg returning 429 Too Many Requests** — makes any job dependent on yarn fail. Solution: add retry logic or cache yarn packages more aggressively.

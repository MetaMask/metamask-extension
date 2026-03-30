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

> **How this document relates to E2E Testing Guidelines:**
> The [E2E Testing Guidelines](../e2e-testing-guidelines/RULE.md) is a _prescriptive_ guide covering how to write good E2E tests (page objects, structure, waiting strategies, mocking conventions). This document is a _diagnostic_ reference — a catalog of specific real-world flakiness bugs encountered in CI, each with root cause analysis and concrete before/after fixes. Use the guidelines when **writing new tests**; use this document when **debugging or fixing flaky tests**.

---

## Table of Contents

- [E2E Anti-Patterns Quick Reference](#e2e-anti-patterns-quick-reference)
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
- [Unit Test Flakiness Categories](#unit-test-flakiness-categories)
- [Flakiness on Other CI Jobs](#flakiness-on-other-ci-jobs)

---

## E2E Anti-Patterns Quick Reference

These are the most critical anti-patterns to avoid. Each links to a detailed section with concrete examples below.

1. **Asserting element values without waiting for them** — use `waitForSelector` with `text` instead of `findElement` + `getText` + `assert`. See [Race Conditions with Assertions](#race-conditions-with-assertions-within-the-test-body-steps).

2. **Asserting `isDisplayed()` after finding an element** — the element can update between find and assert (e.g., tx status changes), throwing a stale element error. `waitForSelector` already guarantees the element is displayed.

3. **Using `element.click()` instead of `driver.clickElement()`** — native `.click()` has no stale-element retry. Always use the driver wrapper. See [Not using driver methods](#not-using-driver-methods).

4. **Going to live sites** instead of using mocks — tests should never depend on external services. See [Missing or Incorrect Use of Mocks](#missing-or-incorrect-use-of-mocks).

5. **Adding `driver.delay()` instead of waiting for conditions** — use `waitForSelector`, `clickElementAndWaitToDisappear`, or `waitUntil` instead of arbitrary delays. See [Confirmation Popups / Modals](#confirmation-popups--modals).

6. **Importing from another `.spec` file** — this causes that spec's tests to run too, leading to timeouts. Move shared functions to helper files. See [Actions that Take Time](#actions-that-take-time).

7. **Looking for transient elements** (e.g., "Pending" status) — skip transient states and wait for the final state. See [Race Conditions with Assertions](#race-conditions-with-assertions-within-the-test-body-steps).

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
          await new Promise((resolve) => setTimeout(resolve, 1000));
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
  await testDapp.clickSendButton();
  ```

  ✅ Correct:

  ```javascript
  await driver.switchToWindowWithUrl(dappUrl);
  const expectedWindowHandles = 3;
  await driver.waitUntilXWindowHandles(expectedWindowHandles);
  const currentWindowHandles = await driver.getAllWindowHandles();
  await testDapp.clickSendButton();
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
  await driver.clickElement(this.tokenListItem);
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
  const accounts = await driver.findElements(this.accountListItem);
  assert.equal(accounts.length, 5);
  ```
  ✅ Correct:
  ```javascript
  await driver.waitForSelector(`${this.accountListItem}:nth-child(5)`);
  ```

---

### Taking Unnecessary Steps

> **General rule:** Use fixtures (`FixtureBuilder`) to set up test state (network, tokens, settings, accounts) instead of performing UI actions. This is faster, more reliable, and avoids race conditions during setup. Also avoid unnecessary browser refreshes, scrolls, and delays.

- **Performing UI actions that can be set via fixtures (settings, network, tokens, contracts, etc.)**
  ❌ Incorrect:

  ```javascript
  await unlockWallet(driver);
  await headerNavbar.openSettingsMenu();
  await settingsPage.toggleShowNonce();
  await settingsPage.goBack();
  ```

  ✅ Correct:

  ```javascript
  fixtures: new FixtureBuilder()
    .withPreferencesController({ useNonceField: true })
    .build(),
  async ({ driver }) => {
    await unlockWallet(driver);
  ```

  This pattern applies broadly — use `withNetworkControllerOnMainnet()` instead of switching network via UI, `withTokensControllerERC20()` instead of importing tokens through modals, and pre-deploy contracts via fixture (`smartContract: [...]`) instead of deploying through the dapp UI.

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
  await homePage.goToActivityList();
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
    await homePage.startSendFlow();
  ```

  ✅ Correct:

  ```javascript
  async ({ driver, contractRegistry, ganacheServer }) => {
    const contractAddress = await contractRegistry.getContractAddress(smartContract);
    await logInWithBalanceValidation(driver, ganacheServer);
    await homePage.startSendFlow();
  ```

- **Mismatch in gas calculation values, when changing the increase token allowance amount**
  ❌ Incorrect:

  ```javascript
  driver.waitForSelector({
    css: this.tokenAllowanceAmount,
    text: `10 TST`,
  });
  ```

  ✅ Correct:

  ```javascript
  await driver.waitForSelector({
    css: this.tokenAllowanceAmount,
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
    await driver.findElement(this.passwordInput);
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
    css: this.gasFee,
  });
  await sendPage.clickContinue();
  ```

- **Transaction didn't have the total value loaded before we click reject**
  ❌ Incorrect:

  ```javascript
  async ({ driver }) => {
    await unlockWallet(driver);
    await confirmationPage.clickNextPage();
  ```

  ✅ Correct:

  ```javascript
  async ({ driver }) => {
    await unlockWallet(driver);
    // Wait until total amount is loaded before rejecting
    await driver.findElement({ tag: 'span', text: '3.0000315' });
    await confirmationPage.clickNextPage();
  ```

- **Spec was not waiting for queued signatures to display navigation, making some signatures not queue properly. Need to wait for the navigation numbers to appear before queueing a new signature**
  ❌ Incorrect:

  ```javascript
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.findElement({ text: 'Reject all' });

  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await testDapp.clickSignTypedDataV4();
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  ```

  ✅ Correct:

  ```javascript
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.findElement({ text: 'Reject all' });
  await driver.waitForSelector(By.xpath("//div[normalize-space(.)='1 of 2']"));

  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await testDapp.clickSignTypedDataV4();
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.waitForSelector(By.xpath("//div[normalize-space(.)='1 of 3']"));
  ```

---

### Confirmation Popups / Modals

> **General rule:** When clicking a button/modal that should disappear afterward, always use `clickElementAndWaitToDisappear` instead of `clickElement`. The disappearing element can block subsequent clicks if it's still in the DOM. This applies to confirmation popups, "Got it" buttons, import modals, onboarding screens, and any overlay that closes after interaction.

- **Popup/modal obfuscates subsequent elements (common pattern — applies to "Got it" buttons, import modals, add account popups, onboarding screens, etc.)**
  ❌ Incorrect:

  ```javascript
  await driver.clickElement({ text: 'Got it', tag: 'button' });
  await headerNavbar.openThreeDotMenu(); // popup may still be on top
  ```

  ✅ Correct:

  ```javascript
  await driver.clickElementAndWaitToDisappear({
    text: 'Got it',
    tag: 'button',
  });
  await headerNavbar.openThreeDotMenu();
  ```

- **Multi-step flows with disappearing screens (e.g., onboarding carousel)**
  ❌ Incorrect:

  ```javascript
  await driver.clickElement({ text: 'Manage default settings' });
  await driver.delay(regularDelayMs);
  await driver.clickElement({ text: 'General' });
  ```

  ✅ Correct:

  ```javascript
  await driver.clickElementAndWaitToDisappear({
    text: 'Manage default settings',
  });
  await driver.clickElement({ text: 'General' });
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

  await testDapp.check_chainId('0x539');
  ```

- **The notification (red dot) appears on top of the menu, blocking clicks on the menu button**
  ❌ Incorrect:

  ```javascript
  await driver.waitForSelector(this.threeDotMenuButton);
  await driver.clickElement(this.threeDotMenuButton);
  ```

  ✅ Correct:

  ```javascript
  // Click the notification dot overlay instead of the obscured button
  await driver.clickElement(this.notificationDotWrapper);
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
    await driver.waitUntil(
      async () =>
        await driver.executeScript('return document.readyState === "complete"'),
      { timeout: 5000 },
    );
    assert.equal(
      await driver.executeScript(lockdownTestScript),
      true,
      'The background environment should be locked down.',
    );
  });
  ```

---

### Race Conditions with Assertions within the Test Body Steps

> **General rule:** Never use `findElement` + `getText`/`isDisplayed`/`isEnabled` + `assert`. The element can update or re-render between the find and the assertion, causing a stale element error or a false negative. Instead, use `waitForSelector` with `text` to atomically wait for the desired state. This single principle covers most assertion-related flakiness.

- **Don't assert text after findElement — wait for the text with waitForSelector**
  ❌ Incorrect:

  ```javascript
  const permissionElement = await driver.findElement(this.permissionLabel);
  assert.equal(await permissionElement.getText(), 'View your accounts');
  ```

  ✅ Correct:

  ```javascript
  await driver.waitForSelector({
    css: this.permissionLabel,
    text: 'View your accounts',
  });
  ```

- **Don't assert isDisplayed/isEnabled after waitForSelector — the wait already guarantees it**
  ❌ Incorrect:

  ```javascript
  const buySellButton = await driver.waitForSelector(this.buySellButton);
  assert.equal(await buySellButton.isEnabled(), true);
  ```

  ✅ Correct:

  ```javascript
  await driver.findClickableElement(this.buySellButton);
  ```

- **Rapid input of the entire Chain ID resulted in the error message appearing and persisting**
  ❌ Incorrect:

  ```javascript
  await driver.fill(this.chainIdInput, '10');
  // Error message from partial input ('1') persists even after full value is entered
  ```

  ✅ Correct:

  ```javascript
  await driver.fill(this.chainIdInput, '10');
  // Wait for validation to complete before asserting
  await driver.waitForSelector({
    css: this.chainIdInput,
    text: '10',
  });
  await driver.assertElementNotPresent(this.formErrorMessage);
  ```

- **Don't assert transient states — skip to the final state**
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

- **Don't assert getCurrentUrl — use waitForUrl instead**
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
  await testDapp.clickSendButton();
  await driver.switchToWindowWithUrl(secondDappUrl); // switches too fast
  ```

  ✅ Correct:

  ```javascript
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await testDapp.clickSendButton();
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
  await driver.waitForSelector(this.threeDotMenuButton);
  await driver.clickElement(this.threeDotMenuButton);
  ```

  ✅ Correct:

  ```javascript
  // Wait for re-renders to settle before clicking
  await driver.assertElementNotPresent(this.loadingOverlay);
  await driver.clickElement(this.threeDotMenuButton);
  ```

- **Checkbox component for Snap Insights Signatures is re-rendered when the host value is loaded, making the checkbox unchecked if the click happens before the re-render**
  ❌ Incorrect:

  ```javascript
  await driver.clickElement(this.checkboxWrapper);
  ```

  ✅ Correct:

  ```javascript
  // Wait for host to render before clicking — re-render resets checkbox state
  await driver.waitForSelector({ text: '127.0.0.1:8080', tag: 'span' });
  await driver.clickElement(this.checkboxWrapper);
  ```

- **The Add account modal needs to finish rendering the account list before proceeding with a click action — otherwise the re-render causes the click to be performed outside the popup, closing the modal**
  ❌ Incorrect:

  ```javascript
  await headerNavbar.openAccountMenu();
  await driver.clickElement(this.addAccountButton);
  ```

  ✅ Correct:

  ```javascript
  await headerNavbar.openAccountMenu();
  // Wait until account list is loaded to avoid re-render race condition
  await driver.waitForSelector({ text: 'Account 1', tag: 'span' });
  await driver.clickElement(this.addAccountButton);
  ```

- **In the onboarding flow, clicking an element when it's moving causes the click to take no effect. Added a new driver method to wait until the element is not moving**
  ❌ Incorrect:

  ```javascript
  await driver.clickElement(this.categoryBackButton);
  await driver.delay(regularDelayMs);
  await driver.clickElement(this.privacySettingsBackButton);
  ```

  ✅ Correct:

  ```javascript
  await driver.clickElement(this.categoryBackButton);
  // Wait until carousel stops animating — clicking while moving has no effect
  await driver.waitForElementToStopMoving(this.privacySettingsBackButton);
  await driver.clickElement(this.privacySettingsBackButton);
  ```

- **In the carousel spec, looking for an element and then using `.click` — a re-render in between made the element stale. Should use the custom `clickElement` driver method**
  ❌ Incorrect:
  ```javascript
  const dots = await driver.findElements(this.carouselDot);
  await dots[i].click();
  ```
  ✅ Correct:
  ```javascript
  await driver.clickElement(`[aria-label="slide item ${i}"]`);
  ```

---

### Actions that Take Time

> **General rule:** When an action takes time (API calls, file I/O, state updates, extension restarts), wait for the expected outcome using `driver.wait`, `waitUntil`, or `waitForSelector` instead of assuming it's complete. Use generous timeouts — 3 seconds is often not enough.

- **Insufficient timeout on async operations (Sentry requests, Snap connections, file writes, etc.)**
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

- **State not ready before acting (chain id, balance, account creation, cookie id, etc.) — wait for the expected state instead of acting immediately**
  ❌ Incorrect:

  ```javascript
  const homePage = new HomePage(driver);
  await homePage.startBridgeFlow(); // chain id / balance may not be loaded yet
  ```

  ✅ Correct:

  ```javascript
  const homePage = new HomePage(driver);
  await homePage.check_expectedBalanceIsDisplayed();
  await homePage.startBridgeFlow();
  ```

- **Metrics events can get unordered if 2 actions are done subsequently very fast, leading to the 2nd event being the first one triggered**
  ❌ Incorrect:

  ```javascript
  await testDapp.clickActionOne();
  await testDapp.clickActionTwo();
  // event for action-two may arrive before action-one
  const events = await mockedEndpoint.getSeenRequests();
  assert.equal(events[0].body.event, 'Action One');
  ```

  ✅ Correct:

  ```javascript
  await testDapp.clickActionOne();
  await driver.wait(async () => {
    const events = await mockedEndpoint.getSeenRequests();
    return events.length >= 1;
  }, 5000);
  await testDapp.clickActionTwo();
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
  await driver.waitUntilXWindowHandles(1);
  await driver.navigate();
  await driver.waitForSelector(this.passwordInput);
  ```

- **Background API requests (auth, profile sync) may not complete before the next action — wait for the request or ignore the benign error**
  ❌ Incorrect:

  ```javascript
  await loginWithBalanceValidation(driver, localNodes[0]);
  const homePage = new HomePage(driver);
  await homePage.headerNavbar.check_pageIsLoaded();
  await driver.delay(5000);
  await homePage.headerNavbar.lockMetaMask();
  ```

  ✅ Correct (wait for the request):

  ```javascript
  await loginWithBalanceValidation(driver, localNodes[0]);
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

  ✅ Or simpler — just ignore the harmless error:

  ```javascript
  ignoredConsoleErrors: ['unable to proceed, wallet is locked'],
  ```

- **Triggering several transactions from different dapps without waiting individually can cause transactions to appear in a different order**
  ❌ Incorrect:
  ```javascript
  await dapp1.clickSendButton();
  await dapp2.clickSendButton();
  await dapp3.clickSendButton();
  // Transaction order in activity list may not match submission order
  ```
  ✅ Correct:
  ```javascript
  await dapp1.clickSendButton();
  await driver.waitUntilXWindowHandles(4);
  await dapp2.clickSendButton();
  await driver.waitUntilXWindowHandles(4);
  await dapp3.clickSendButton();
  ```

---

### Errors in the testing dapp

- **A span element is nested inside the buttons for all Snap test e2e buttons — causes flakiness when interacting with the button. Fixed on the snap test dapp side**
  ❌ Incorrect:

  ```javascript
  // Clicking the button hits the inner span, which may not trigger the handler
  await driver.clickElement(this.connectSnapButton);
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
  await driver.clickElement(this.proceedLink); // event listener not yet attached
  ```
  ✅ Correct:
  ```javascript
  await driver.navigate(PHISHING_PAGE_URL);
  await driver.waitForSelector(this.proceedLink);
  // Retry clicking until the event listener is attached and the navigation succeeds
  await driver.waitUntil(
    async () => {
      await driver.clickElement(this.proceedLink);
      const currentUrl = await driver.getCurrentUrl();
      return !currentUrl.includes('phishing');
    },
    { timeout: 5000 },
  );
  ```

---

### Not using driver methods

- **Using `element.click()` instead of `clickElement()` can cause race conditions when the element is present but not clickable. The driver function has appropriate guards in place**
  ❌ Incorrect:

  ```javascript
  const [, tst] = await driver.findElements(this.tokenListButton);
  await tst.click();

  // ...
  const body = await driver.findElement(this.emptyPageBody);
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

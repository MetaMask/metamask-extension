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

- **Page object methods should use driver.clickElement() instead of raw element.click()**
  ❌ Incorrect:

  ```javascript
  async clickCloseButton(rawLocator) {
    const element = await this.findClickableElement(rawLocator);
    await element.click();
  }
  ```

  ✅ Correct:

  ```javascript
  async clickCloseButton(rawLocator) {
    await this.driver.clickElement(rawLocator);
  }
  ```

- **Always wait for the expected number of window handles before proceeding — asserting immediately can fail if windows haven't opened yet**
  ❌ Incorrect:

  ```javascript
  const currentWindowHandles = await driver.getAllWindowHandles();
  assert.equal(currentWindowHandles, 3);
  ```

  ✅ Correct:

  ```javascript
  const expectedWindowHandles = 3;
  await driver.waitUntilXWindowHandles(expectedWindowHandles);
  ```

- **Window title can be undefined if the page hasn't loaded — use `switchToWindowWithTitle` which waits for the title**
  ❌ Incorrect:

  ```javascript
  const title = await driver.getTitle();
  assert.equal(title, 'MetaMask');
  ```

  ✅ Correct:

  ```javascript
  await driver.switchToWindowWithTitle('MetaMask');
  ```

- **Click the most specific child element, not the parent — parent elements with refreshing children cause stale element errors**
  ❌ Incorrect:

  ```javascript
  // Clicking a broad parent container — inner elements may refresh and cause stale errors
  await this.driver.clickElement(this.tokenListItem);
  ```

  ✅ Correct:

  ```javascript
  // Target the most specific child element using its selector
  await this.driver.clickElement(this.tokenName);
  ```

- **Don't assert element count immediately — elements may still be rendering. Wait for the expected element instead**
  ❌ Incorrect:
  ```javascript
  const accounts = await driver.findElements(this.accountListItem);
  assert.equal(accounts.length, 5);
  ```
  ✅ Correct:
  ```javascript
  await accountListPage.checkNumberOfAvailableAccounts(5);
  ```

---

### Taking Unnecessary Steps

> **General rule:** Use fixtures (`FixtureBuilderV2`) to set up test state (network, tokens, settings, accounts) instead of performing UI actions. This is faster, more reliable, and avoids race conditions during setup. Also avoid unnecessary browser refreshes, scrolls, and delays.

- **Performing UI actions that can be set via fixtures (settings, network, tokens, contracts, etc.)**
  ❌ Incorrect:

  ```javascript
  await login(driver);
  await headerNavbar.openSettingsMenu();
  await settingsPage.toggleShowNonce();
  await settingsPage.goBack();
  ```

  ✅ Correct:

  ```javascript
  fixtures: new FixtureBuilderV2()
    .withPreferencesController({ useNonceField: true })
    .build(),
  async ({ driver }) => {
    await login(driver);
  ```

  This pattern applies broadly — use `.withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)` instead of switching network via UI, `withTokensControllerERC20()` instead of importing tokens through modals, and pre-deploy contracts via fixture (`smartContract: [...]`) instead of deploying through the dapp UI.

- **Avoid unnecessary browser refreshes — they can cause unexpected navigation (e.g., landing on a Confirmation screen for unapproved transactions)**
  ❌ Incorrect:

  ```javascript
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  await driver.executeScript(`window.location.reload()`);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  ```

  ✅ Correct:

  ```javascript
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  await homePage.goToActivityList();
  ```

- **No hardcoded delays — use wait-for-conditions instead**
  ❌ Incorrect:

  ```javascript
  await driver.delay(5000);
  await driver.clickElement(selector);
  ```

  ✅ Correct:

  ```javascript
  await driver.waitForSelector(selector);
  await driver.clickElement(selector);
  ```

- **No `scrollToElement` — use `clickElement`, as scrolling is already implicit**
  ❌ Incorrect:
  ```javascript
  await driver.scrollToElement(selector);
  await driver.clickElement(selector);
  ```
  ✅ Correct:
  ```javascript
  await driver.clickElement(selector);
  ```

---

### Missing or Incorrect Use of Mocks

- **Mock eth_balance with 0 on Mainnet — a non-zero balance triggers polling for subsequent accounts, blocking other requests**
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

- **Ensure mock values match expected defaults — mismatches cause race conditions where test outcome depends on polling timing**
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

- **Don't include dynamic fields (like `id`) in mock request matching — they change per request and prevent the mock from matching**
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

- **Use hex chainId format in mock URLs — passing integer chainId causes the mock to not match, failing validation and assertions**
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

- **Register default mocks before custom mocks to avoid default mocks overriding custom ones**
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

- **Wait for balance to load before starting the Send flow — if balance is not loaded, gas is calculated as 0 and the Confirmation screen is blocked**
  ❌ Incorrect:

  ```javascript
  async ({ driver, contractRegistry }) => {
    const contractAddress = await contractRegistry.getContractAddress(smartContract);
    await login(driver);
    await homePage.startSendFlow();
  ```

  ✅ Correct:

  ```javascript
  async ({ driver, contractRegistry, localNodes }) => {
    const contractAddress = await contractRegistry.getContractAddress(smartContract);
    await login(driver, { localNode: localNodes[0] });
    await homePage.checkPageIsLoaded();
    await homePage.startSendFlow();
  ```

- **Whenever the token allowance amount changes, gas is recalculated — wait for the new gas value before proceeding to avoid race conditions causing a failed transaction**
  ❌ Incorrect:

  ```javascript
  driver.waitForSelector({
    css: this.tokenAllowanceAmount,
    text: `10 TST`,
  });
  ```

  ✅ Correct:

  ```javascript
  await confirmationPage.checkTokenAllowanceAmount('10 TST');
  await confirmationPage.checkGasFeeIsDisplayed();
  ```

- **Wait for network data to fully load before running assertions — network properties (isActive, EIP1559 support, etc.) may not be available immediately after login**
  ❌ Incorrect:

  ```javascript
  async ({ driver, mockedEndpoint }) => {
    await driver.navigate();
    await driver.findElement(this.passwordInput);
    await driver.executeScript(
  ```

  ✅ Correct:

  ```javascript
  async ({ driver, localNodes, mockedEndpoint }) => {
    await login(driver, { localNode: localNodes[0] });
    await driver.executeScript(
  ```

- **Wait for gas to recalculate after switching assets in the Send flow — clicking Continue before gas updates causes transaction failures**
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
  await sendPage.checkGasFeeIsLoaded();
  await sendPage.clickContinue();
  ```

- **Wait for the transaction total value to load before clicking reject — otherwise the action may fail or apply to incomplete data**
  ❌ Incorrect:

  ```javascript
  async ({ driver }) => {
    await login(driver);
    await confirmationPage.clickNextPage();
  ```

  ✅ Correct:

  ```javascript
  async ({ driver }) => {
    await login(driver);
    await confirmationPage.checkTotalAmountIsLoaded();
    await confirmationPage.clickNextPage();
  ```

- **Wait for the signature navigation count to render before queueing the next signature — triggering a new signature before the UI updates causes a race condition**
  ❌ Incorrect:

  ```javascript
  await switchToDialogAndCheckRejectAll(driver);

  await switchToTestDapp(driver);
  await testDapp.clickSignTypedDataV4();
  await switchToDialog(driver);
  ```

  ✅ Correct:

  ```javascript
  await switchToDialogAndCheckRejectAll(driver);
  await confirmationPage.checkNavigationCount('1 of 2');

  await switchToTestDapp(driver);
  await testDapp.clickSignTypedDataV4();
  await switchToDialog(driver);
  await confirmationPage.checkNavigationCount('1 of 3');
  ```

---

### Confirmation Popups / Modals

> **General rule:** When clicking a button/modal that should disappear afterward, always use `clickElementAndWaitToDisappear` instead of `clickElement`. The disappearing element can block subsequent clicks if it's still in the DOM. This applies to confirmation popups, "Got it" buttons, import modals, onboarding screens, and any overlay that closes after interaction.

- **Popup/modal obfuscates subsequent elements (common pattern — applies to "Got it" buttons, import modals, add account popups, onboarding screens, etc.)**
  ❌ Incorrect:

  ```javascript
  await homePage.clickGotItButton();
  await headerNavbar.openThreeDotMenu(); // popup may still be on top
  ```

  ✅ Correct:

  ```javascript
  await homePage.clickGotItButtonAndWaitToDisappear();
  await headerNavbar.openThreeDotMenu();
  ```

- **Multi-step flows with disappearing screens (e.g., onboarding carousel)**
  ❌ Incorrect:

  ```javascript
  await onboardingPage.clickManageDefaultSettings();
  await driver.delay(regularDelayMs);
  await onboardingPage.clickGeneral();
  ```

  ✅ Correct:

  ```javascript
  await onboardingPage.clickManageDefaultSettingsAndWaitToDisappear();
  await onboardingPage.clickGeneral();
  ```

- **Wait for the connect dialog to close before proceeding — acting before the dialog closes can leave the chainId in an outdated state**
  ❌ Incorrect:

  ```javascript
  await connectPage.clickConnect();

  await driver.waitUntilXWindowHandles(4);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  ```

  ✅ Correct:

  ```javascript
  await connectPage.clickConnectAndWaitForWindowToClose();

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

- **MV3 builds use a Service Worker instead of a background page — navigate to the correct page based on the manifest version**
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

- **Rapid input can trigger validation errors from partial values — wait for validation to complete before asserting**
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
  await phishingPage.clickReportDetectionProblem();
  const emptyPage = await driver.findElement(this.emptyPageBody);
  assert.equal(
    await emptyPage.getText(),
    `Empty page by ${BlockProvider.PhishFort}`,
  );
  assert.equal(
    await driver.getCurrentUrl(),
    `https://github.com/phishfort/phishfort-lists/issues/new?title=...`,
  );
  ```
  ✅ Correct:
  ```javascript
  await phishingPage.clickReportDetectionProblem();
  await phishingPage.waitForReportUrl({
    url: `https://github.com/phishfort/phishfort-lists/issues/new?title=...`,
  });
  ```

---

### Race Conditions with Windows

- **Production builds auto-open a MetaMask window — calling `driver.navigate()` creates a duplicate, causing driver actions to target the wrong window**
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

- **Re-fetch window handles before switching — handles saved earlier may be stale if windows were opened or closed since**
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

- **Wait for the popup window to close after clicking a dismissing button — switching windows before the popup closes causes race conditions**
  ❌ Incorrect:

  ```javascript
  await confirmationPage.clickConfirm();
  // immediately try to switch windows
  ```

  ✅ Correct:

  ```javascript
  await confirmationPage.clickConfirmAndWaitForWindowToClose();
  // window is confirmed closed, safe to switch
  ```

- **Wait for the dialog to appear before switching dapps — switching too fast can cause the transaction to use the wrong dapp's network**
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

- **Snap cronjob dialogs can auto-close — handle the case where the window is no longer available when trying to interact with it**
  ❌ Incorrect:

  ```javascript
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await confirmationPage.clickApprove();
  ```

  ✅ Correct:

  ```javascript
  try {
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await confirmationPage.clickApprove();
  } catch {
    // Dialog may have auto-closed — verify from the extension window instead
    await driver.switchToWindowWithTitle(
      WINDOW_TITLES.ExtensionInFullScreenView,
    );
  }
  ```

- **Wait for the dialog to close before performing the next action — in request queuing, acting too fast causes race conditions**
  ❌ Incorrect:
  ```javascript
  await connectPage.clickConnect();
  await driver.delay(regularDelayMs);
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  ```
  ✅ Correct:
  ```javascript
  await connectPage.clickConnectAndWaitForWindowToClose();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  ```

---

### Race Conditions with React Re-renders

- **Wait for re-renders to settle before clicking — interacting with elements during a loading state (e.g., after changing language) has no effect**
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

- **Wait for dynamic content to load before interacting with nearby elements — re-renders can reset element state (e.g., unchecking a checkbox)**
  ❌ Incorrect:

  ```javascript
  await driver.clickElement(this.checkboxWrapper);
  ```

  ✅ Correct:

  ```javascript
  // Wait for host to render before clicking — re-render resets checkbox state
  await snapInsightsPage.checkHostIsDisplayed();
  await snapInsightsPage.clickCheckbox();
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
  await accountListPage.checkAccountIsDisplayed('Account 1');
  await accountListPage.clickAddAccountButton();
  ```

- **Wait for animated elements to stop moving before clicking — clicks on moving elements have no effect**
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

- **Use `driver.clickElement()` instead of `element.click()` for elements that may re-render — native `.click()` on a stale element throws an error**
  ❌ Incorrect:
  ```javascript
  const dots = await driver.findElements(this.carouselDot);
  await dots[i].click();
  ```
  ✅ Correct:
  ```javascript
  await carouselPage.clickSlideItem(i);
  ```

---

### Actions that Take Time

> **General rule:** When an action takes time (API calls, file I/O, state updates, extension restarts), wait for the expected outcome using `driver.wait`, `waitUntil`, or `waitForSelector` instead of assuming it's complete and custom timeouts.

- **State not ready before acting (chain id, balance, account creation, cookie id, etc.) — wait for the expected state instead of acting immediately**
  ❌ Incorrect:

  ```javascript
  const homePage = new HomePage(driver);
  await homePage.startBridgeFlow(); // chain id / balance may not be loaded yet
  ```

  ✅ Correct:

  ```javascript
  await login(driver);
  const homePage = new HomePage(driver);
  await homePage.startBridgeFlow();
  ```

- **Wait between sequential actions that trigger metrics events — firing too fast can cause events to arrive out of order**
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

- **Wait for the extension to fully restart after reloading — interacting before it's ready causes failures**
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
  await login(driver, { localNode: localNodes[0] });
  const homePage = new HomePage(driver);
  await homePage.headerNavbar.check_pageIsLoaded();
  await driver.delay(5000);
  await homePage.headerNavbar.lockMetaMask();
  ```

  ✅ Correct (wait for the request):

  ```javascript
  await login(driver, { localNode: localNodes[0] });
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

  ⚠️ As a temporary CI unblock, you can ignore the error — but always open a bug to fix the underlying issue:

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
  await driver.waitUntilXWindowHandles(5);
  await dapp3.clickSendButton();
  ```

---

### Errors in the testing dapp

- **Event listeners may not be attached immediately after page load — retry clicks until the expected navigation occurs**
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
  await tokenListPage.clickToken('TST');

  // ...
  await tokenDetailsPage.waitForBlockExplorerUrl(
    'https://etherscan.io/address/0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
  );
  await tokenDetailsPage.checkEmptyPageIsDisplayed('Empty page by MetaMask');
  ```

---

## Unit Test Flakiness Categories

- **Ensure all required store properties are explicitly defined in mock state — undefined properties cause intermittent test failures**
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

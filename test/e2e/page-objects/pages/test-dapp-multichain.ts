import { Browser } from 'selenium-webdriver';
import { NormalizedScopeObject } from '@metamask/chain-agnostic-permission';
import { Json } from '@metamask/utils';
import { largeDelayMs, veryLargeDelayMs, WINDOW_TITLES } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { replaceColon } from '../../flask/multichain-api/testHelpers';

const DAPP_HOST_ADDRESS = '127.0.0.1:8080';
const DAPP_URL = `http://${DAPP_HOST_ADDRESS}`;

class TestDappMultichain {
  private readonly driver: Driver;

  private readonly connectedAccount = (account: string) => {
    return {
      testId: 'connected-accounts-list',
      text: account,
    };
  };

  private readonly connectExternallyConnectableButton = {
    text: 'Connect',
    tag: 'button',
  };

  private readonly dappTitle = {
    text: 'MetaMask MultiChain API Test Dapp',
    tag: 'h1',
  };

  private readonly extensionIdInput = '[placeholder="Enter extension ID"]';

  private readonly firstSessionMethodResult = '#session-method-result-0';

  private readonly invokeAllMethodsButton = {
    testId: 'invoke-all-methods-button',
  };

  private readonly sessionResultListItem = (resultNumber: number) => {
    return `#session-method-details-${resultNumber}`;
  };

  private readonly walletCreateSessionButton = '#create-session-btn';

  private readonly walletGetSessionButton = '#get-session-btn';

  private readonly walletNotifyResult = '#wallet-notify-container';

  private readonly walletRevokeSessionButton = '#revoke-session-btn';

  private readonly resultSummary = '.result-summary';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  addCustomAccountAddressInput(i: number) {
    // Not a hex color value
    // eslint-disable-next-line @metamask/design-tokens/color-no-hex
    return `#add-custom-caip\\ address-button-${i}`;
  }

  addCustomScopeButton(i: number) {
    // Not a hex color value
    // eslint-disable-next-line @metamask/design-tokens/color-no-hex
    return `#add-custom-scope-button-${i}`;
  }

  customAccountAddressInput(i: number) {
    return `#custom-CAIP\\ Address-input-${i}`;
  }

  customScopeInput(i: number) {
    return `#custom-Scope-input-${i}`;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.dappTitle);
    } catch (e) {
      console.log(
        'Timeout while waiting for Multichain Test Dapp page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Multichain Test Dapp page is loaded');
  }

  async checkResultListTotalItems(totalItems: number): Promise<void> {
    await this.driver.waitForSelector(
      this.sessionResultListItem(totalItems - 1),
    );
  }

  async clickConnectExternallyConnectableButton() {
    await this.driver.clickElement(this.connectExternallyConnectableButton);
  }

  async clickFirstResultSummary() {
    await this.driver.waitForSelector(this.resultSummary);
    const resultSummaries = await this.driver.findElements(this.resultSummary);
    const firstResultSummary = resultSummaries[0];
    await firstResultSummary.click();
  }

  async clickInvokeAllMethodsButton() {
    await this.driver.clickElement(this.invokeAllMethodsButton);
  }

  async clickWalletCreateSessionButton() {
    await this.driver.clickElement(this.walletCreateSessionButton);
  }

  async clickWalletGetSessionButton() {
    await this.driver.clickElement(this.walletGetSessionButton);
  }

  async clickWalletRevokeSessionButton() {
    await this.driver.clickElement(this.walletRevokeSessionButton);
  }

  async fillExtensionIdInput(extensionId: string) {
    await this.driver.fill(this.extensionIdInput, extensionId, { retries: 3 });
  }

  /**
   * Open the multichain test dapp page.
   *
   * @param options - The options for opening the test dapp page.
   * @param options.url - The URL of the dapp. Defaults to DAPP_URL.
   * @returns A promise that resolves when the new page is opened.
   */
  async openTestDappPage({
    url = DAPP_URL,
  }: {
    url?: string;
  } = {}): Promise<void> {
    await this.driver.openNewPage(url);
  }

  /**
   * Connect to multichain test dapp to the Multichain API via externally_connectable.
   *
   * @param extensionId - Extension identifier for web dapp to interact with wallet extension.
   */
  async connectExternallyConnectable(extensionId: string) {
    console.log('Connect multichain test dapp to Multichain API');
    await this.fillExtensionIdInput(
      process.env.SELENIUM_BROWSER === Browser.FIREFOX
        ? 'window.postMessage'
        : extensionId,
    );
    await this.clickConnectExternallyConnectableButton();
    await this.driver.delay(veryLargeDelayMs);
  }

  /**
   * Initiates a request to wallet extension to create session for the passed scopes.
   *
   * @param scopes - scopes to create session for.
   * @param accounts - The account addresses to create session for.
   */
  async initCreateSessionScopes(
    scopes: string[],
    accounts: string[] = [],
  ): Promise<void> {
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.MultichainTestDApp);
    for (const [i, scope] of scopes.entries()) {
      await this.driver.fill(this.customScopeInput(i), scope);
      await this.driver.clickElement(this.addCustomScopeButton(i));
    }

    for (const [i, account] of accounts.entries()) {
      await this.driver.fill(this.customAccountAddressInput(i), account);
      await this.driver.clickElement(this.addCustomAccountAddressInput(i));
    }

    await this.clickWalletCreateSessionButton();
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.driver.delay(largeDelayMs);
  }

  /**
   * Retrieves the result of an invoked method for a specific scope.
   *
   * @param params - The parameters for retrieving the method result.
   * @param params.scope - The scope identifier for the method invocation.
   * @param params.method - The method name that was invoked.
   * @param params.methodCount - The 1-based index of the method result to return. Defaults to 1.
   * @returns The result as string.
   */
  async getInvokeMethodResult({
    scope,
    method,
    methodCount = 1,
  }: {
    scope: string;
    method: string;
    methodCount?: number;
  }): Promise<string> {
    console.log(
      `Getting invoke method result for scope ${scope} and method ${method} on multichain test dapp.`,
    );
    const index = Math.max(0, methodCount - 1);
    const result = await this.driver.findElement(
      `[id="invoke-method-${replaceColon(scope)}-${method}-result-${index}"]`,
    );
    await this.driver.waitForNonEmptyElement(result);
    return await result.getText();
  }

  /**
   * Retrieves permitted session object.
   *
   * @param params - The parameters for retrieving the session.
   * @param params.numberOfResultItems - The number of result items expected. Defaults to 2.
   * @returns the session object.
   */
  async getSession({
    numberOfResultItems = 2,
  }: { numberOfResultItems?: number } = {}): Promise<{
    sessionScopes: Record<string, NormalizedScopeObject>;
  }> {
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.MultichainTestDApp);
    await this.clickWalletGetSessionButton();
    // Wait for the complete result list to be displayed to avoid race conditions with the results
    await this.checkResultListTotalItems(numberOfResultItems);

    await this.clickFirstResultSummary();

    const getSessionRawResult = await this.driver.waitForSelector(
      this.firstSessionMethodResult,
    );

    // Wait for the element text to be valid JSON
    let parsedResult:
      | { sessionScopes: Record<string, NormalizedScopeObject> }
      | undefined;
    await this.driver.wait(async () => {
      try {
        const text = await getSessionRawResult.getText();
        if (!text || text.trim().length === 0) {
          return false;
        }
        parsedResult = JSON.parse(text);
        return true;
      } catch {
        return false;
      }
    });
    if (!parsedResult) {
      throw new Error(
        'Failed to parse session result: JSON parsing did not complete',
      );
    }
    return parsedResult;
  }

  /**
   * Retrieves the wallet session changed result.
   *
   * @param index - The index of the wallet session changed result. 0-based index.
   * @returns The wallet session changed result.
   */
  async getWalletSessionChangedResult(index: number): Promise<string> {
    console.log(
      `Getting wallet session changed result for index ${index} on multichain test dapp.`,
    );
    const resultSummaries = await this.driver.findElements(this.resultSummary);
    await resultSummaries[index + 1].click();
    const walletSessionChangedResult = await this.driver.findElement(
      `#wallet-session-changed-result-${index}`,
    );
    await this.driver.waitForNonEmptyElement(walletSessionChangedResult);
    return await walletSessionChangedResult.getText();
  }

  /**
   * Revokes permitted session.
   */
  async revokeSession(): Promise<void> {
    await this.clickWalletRevokeSessionButton();
  }

  /**
   * Invokes a JSON-RPC method for a given scope.
   *
   * @param params - The parameters for invoking the method.
   * @param params.scope - The CAIP-2 scope.
   * @param params.method - The JSON-RPC method to invoke.
   * @param params.params - The parameters for the JSON-RPC method.
   */
  async invokeMethod({
    scope,
    method,
    params = {},
  }: {
    scope: string;
    method: string;
    params?: Json;
  }): Promise<void> {
    console.log(
      `Invoke method ${method} for scope ${scope} on multichain test dapp.`,
    );
    await this.selectMethod({ scope, method });

    if (params && Object.keys(params).length > 0) {
      await this.driver.clickElement(
        `[data-testid="invoke-method-details-${replaceColon(scope)}"]`,
      );
      const request = {
        method: 'wallet_invokeMethod',
        params: {
          scope,
          request: {
            method,
            params,
          },
        },
      };
      await this.driver.pasteIntoField(
        `[data-testid="${replaceColon(scope)}-collapsible-content-textarea"]`,
        JSON.stringify(request),
      );
    }

    await this.driver.clickElement(
      `[data-testid="invoke-method-${replaceColon(scope)}-btn"]`,
    );
  }

  /**
   * Invokes a JSON-RPC method for a given scope and retrieves the result.
   *
   * @param params - The parameters for invoking the method.
   * @param params.scope - The CAIP-2 scope.
   * @param params.method - The JSON-RPC method to invoke.
   * @param params.params - The parameters for the JSON-RPC method.
   * @param params.methodCount - The 1-based index of the method result to return. Defaults to 1.
   * @returns The result as string.
   */
  async invokeMethodAndReturnResult({
    scope,
    method,
    params = {},
    methodCount = 1,
  }: {
    scope: string;
    method: string;
    params?: Json;
    methodCount?: number;
  }): Promise<string> {
    await this.invokeMethod({ scope, method, params });
    return this.getInvokeMethodResult({ scope, method, methodCount });
  }

  /**
   * Invokes a JSON-RPC method for a given scope and checks the result.
   *
   * @param params - The parameters for invoking the method.
   * @param params.scope - The CAIP-2 scope.
   * @param params.method - The JSON-RPC method to invoke.
   * @param params.expectedResult - The expected result for the method.
   * @returns The result as JSON.
   */
  async invokeMethodAndCheckResult({
    scope,
    method,
    expectedResult,
  }: {
    scope: string;
    method: string;
    expectedResult: string;
  }): Promise<void> {
    console.log(
      `Invoke method ${method} for scope ${scope} and check result on multichain test dapp.`,
    );
    await this.invokeMethod({ scope, method });
    await this.driver.waitForSelector({
      css: `[id="invoke-method-${replaceColon(scope)}-${method}-result-0"]`,
      text: expectedResult,
    });
  }

  /**
   * Selects an account for a given scope on multichain test dapp.
   *
   * @param params - The parameters for selecting the account.
   * @param params.scope - The CAIP-2 scope.
   * @param params.account - The account to select.
   */
  async selectAccount({
    scope,
    account,
  }: {
    scope: string;
    account: string;
  }): Promise<void> {
    console.log(
      `Selecting account ${account} for scope ${scope} on multichain test dapp.`,
    );
    await this.driver.clickElement(
      `[data-testid="${replaceColon(scope)}-${account}-option"]`,
    );
  }

  /**
   * Selects a method for a given scope on multichain test dapp.
   *
   * @param params - The parameters for selecting the method.
   * @param params.scope - The CAIP-2 scope.
   * @param params.method - The transaction method to select (e.g., 'eth_sendTransaction').
   */
  async selectMethod({
    scope,
    method,
  }: {
    scope: string;
    method: string;
  }): Promise<void> {
    console.log(
      `Selecting ${method} for scope ${scope} on multichain test dapp.`,
    );
    // With the waitUntil, we ensure the dropdown element is set to the correct method before clicking it
    await this.driver.waitUntil(
      async () => {
        await this.driver.clickElement(
          `[data-testid="${replaceColon(scope)}-select"]`,
        );
        await this.driver.clickElement(
          `[data-testid="${replaceColon(scope)}-${method}-option"]`,
        );
        const selectEl = await this.driver.findElement(
          `[data-testid="${replaceColon(scope)}-select"]`,
        );
        const selectedValue = await selectEl.getAttribute('value');
        return selectedValue === method;
      },
      { interval: 100, timeout: 5000 },
    );
  }

  /**
   * Checks if the wallet notify result is displayed on multichain test dapp.
   *
   * @param scope - The CAIP-2 scope.
   */
  async checkWalletNotifyResult(scope: string): Promise<void> {
    console.log(
      `Checking wallet notify result for scope ${scope} on multichain test dapp.`,
    );
    await this.driver.waitForSelector({
      css: this.walletNotifyResult,
      text: scope,
    });
  }

  async checkConnectedAccounts(expectedAccounts: string[]): Promise<void> {
    console.log('Checking connected accounts on multichain test dapp.');
    for (const account of expectedAccounts) {
      await this.driver.waitForSelector(this.connectedAccount(account));
    }
  }
}

export default TestDappMultichain;

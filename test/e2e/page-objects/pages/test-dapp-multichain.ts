import { Browser } from 'selenium-webdriver';
import { NormalizedScopeObject } from '@metamask/chain-agnostic-permission';
import { Json } from '@metamask/utils';
import { largeDelayMs, WINDOW_TITLES } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { replaceColon } from '../../flask/multichain-api/testHelpers';

const DAPP_HOST_ADDRESS = '127.0.0.1:8080';
const DAPP_URL = `http://${DAPP_HOST_ADDRESS}`;

class TestDappMultichain {
  private readonly driver: Driver;

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

  private readonly walletCreateSessionButton = '#create-session-btn';

  private readonly walletGetSessionButton = '#get-session-btn';

  private readonly walletNotifyResult = '#wallet-notify-container';

  private readonly walletRevokeSessionButton = '#revoke-session-btn';

  private readonly resultSummary = '.result-summary';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  addCustomAccountAddressInput(i: number) {
    return `#add-custom-caip\\ address-button-${i}`;
  }

  addCustomScopeButton(i: number) {
    return `#add-custom-scope-button-${i}`;
  }

  customAccountAddressInput(i: number) {
    return `#custom-CAIP\\ Address-input-${i}`;
  }

  customScopeInput(i: number) {
    return `#custom-Scope-input-${i}`;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
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

  async clickConnectExternallyConnectableButton() {
    await this.driver.clickElement(this.connectExternallyConnectableButton);
  }

  async clickFirstResultSummary() {
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
    await this.driver.fill(this.extensionIdInput, extensionId);
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
    await this.driver.delay(largeDelayMs);
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
      const scopeInput = await this.driver.waitForSelector(
        this.customScopeInput(i),
      );

      // @ts-expect-error Driver.findNestedElement injects `fill` method onto returned element, but typescript compiler will not let us access this method without a complaint, so we override it.
      scopeInput.fill(scope);
      await this.driver.clickElement(this.addCustomScopeButton(i));
    }

    for (const [i, account] of accounts.entries()) {
      const accountInput = await this.driver.waitForSelector(
        this.customAccountAddressInput(i),
      );

      // @ts-expect-error Driver.findNestedElement injects `fill` method onto returned element, but typescript compiler will not let us access this method without a complaint, so we override it.
      accountInput.fill(account);
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
   * @returns The result as string.
   */
  async getInvokeMethodResult({
    scope,
    method,
  }: {
    scope: string;
    method: string;
  }): Promise<string> {
    console.log(
      `Getting invoke method result for scope ${scope} and method ${method} on multichain test dapp.`,
    );
    const result = await this.driver.findElement(
      `[id="invoke-method-${replaceColon(scope)}-${method}-result-0"]`,
    );
    await this.driver.waitForNonEmptyElement(result);
    return await result.getText();
  }

  /**
   * Retrieves permitted session object.
   *
   * @returns the session object.
   */
  async getSession(): Promise<{
    sessionScopes: Record<string, NormalizedScopeObject>;
  }> {
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.MultichainTestDApp);
    await this.clickWalletGetSessionButton();
    await this.clickFirstResultSummary();

    const getSessionRawResult = await this.driver.findElement(
      this.firstSessionMethodResult,
    );
    return JSON.parse(await getSessionRawResult.getText());
  }

  /**
   * Retrieves the wallet session changed result.
   *
   * @param index - The index of the wallet session changed result. 0-based index.
   * @returns The wallet session changed result.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async get_walletSessionChangedResult(index: number): Promise<string> {
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
   * @returns The result as string.
   */
  async invokeMethodAndReturnResult({
    scope,
    method,
    params = {},
  }: {
    scope: string;
    method: string;
    params?: Json;
  }): Promise<string> {
    await this.invokeMethod({ scope, method, params });
    return this.getInvokeMethodResult({ scope, method });
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
    await this.driver.clickElement(
      `[data-testid="${replaceColon(scope)}-select"]`,
    );
    await this.driver.clickElement(
      `[data-testid="${replaceColon(scope)}-${method}-option"]`,
    );
  }

  /**
   * Checks if the wallet notify result is displayed on multichain test dapp.
   *
   * @param scope - The CAIP-2 scope.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_walletNotifyResult(scope: string): Promise<void> {
    console.log(
      `Checking wallet notify result for scope ${scope} on multichain test dapp.`,
    );
    await this.driver.waitForSelector({
      css: this.walletNotifyResult,
      text: scope,
    });
  }
}

export default TestDappMultichain;

import { NormalizedScopeObject } from '@metamask/chain-agnostic-permission';
import { largeDelayMs, WINDOW_TITLES } from '../../helpers';
import { Driver } from '../../webdriver/driver';

const DAPP_HOST_ADDRESS = '127.0.0.1:8080';
const DAPP_URL = `http://${DAPP_HOST_ADDRESS}`;

class TestDappMultichain {
  private readonly driver: Driver;

  private readonly connectExternallyConnectableButton = {
    text: 'Connect',
    tag: 'button',
  };

  private readonly extensionIdInput = '[placeholder="Enter extension ID"]';

  private readonly firstSessionMethodResult = '#session-method-result-0';

  private readonly walletCreateSessionButton = {
    text: 'wallet_createSession',
    tag: 'span',
  };

  private readonly walletGetSessionButton = {
    text: 'wallet_getSession',
    tag: 'span',
  };

  private readonly resultSummary = '.result-summary';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  addCustomAccountAddressInput(i: number) {
    return `#add-custom-address-button-${i}`;
  }

  addCustomScopeButton(i: number) {
    return `#add-custom-scope-button-${i}`;
  }

  customAccountAddressInput(i: number) {
    return `#custom-Address-input-${i}`;
  }

  customScopeInput(i: number) {
    return `#custom-Scope-input-${i}`;
  }

  async clickConnectExternallyConnectableButton() {
    await this.driver.clickElement(this.connectExternallyConnectableButton);
  }

  async clickFirstResultSummary() {
    const resultSummaries = await this.driver.findElements(this.resultSummary);
    const firstResultSummary = resultSummaries[0];
    await firstResultSummary.click();
  }

  async clickWalletCreateSessionButton() {
    await this.driver.clickElement(this.walletCreateSessionButton);
  }

  async clickWalletGetSessionButton() {
    await this.driver.clickElement(this.walletGetSessionButton);
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
    await this.fillExtensionIdInput(extensionId);
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
}

export default TestDappMultichain;

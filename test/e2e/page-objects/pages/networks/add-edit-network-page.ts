import { strict as assert } from 'assert';
import { Driver } from '../../../webdriver/driver';

/**
 * The network details form. Adding and editing render the same form, so one
 * page object covers both; only the prefilled values and the save button differ.
 *
 * Screen: `#/networks?view=add` and `#/networks?view=edit`, reached from
 * `NetworksPage.openAddCustomNetworkPage` / `openEditNetworkPage`.
 * Owns: the name, chain ID and currency symbol fields with their inline
 * errors and warnings, the RPC list, and saving or leaving the form.
 * Boundaries: the RPC URL and block explorer URL sub-forms are separate
 * screens. `openAddRpcUrlPage` and `openAddBlockExplorerPage` navigate to them
 * and hand off to their page objects.
 * Related: `NetworksPage` (how tests get here and where the back button
 * returns), `AddEditRpcUrlPage`, `AddEditBlockExplorerPage`.
 *
 * @see ui/components/multichain/networks-form/networks-form.tsx
 */
class AddEditNetworkPage {
  private readonly addExplorerUrlButton = {
    text: 'Add a block explorer URL',
    tag: 'button',
  };

  private readonly addRpcUrlButton = {
    text: 'Add RPC URL',
    tag: 'button',
  };

  private readonly backButton =
    '[data-testid="networks-page-form-back-button"]';

  private readonly chainIdInputError =
    '[data-testid="network-form-chain-id-error"]';

  private readonly chainIdInputField = {
    testId: 'network-form-chain-id',
  };

  private readonly currencySymbolInputField = '#nativeCurrency';

  private readonly currencySymbolWarning =
    '[data-testid="network-form-ticker-suggestion"]';

  private driver: Driver;

  private readonly explorerUrlInputDropDownButton = {
    testId: 'test-explorer-drop-down',
  };

  private readonly networkNameInputField = {
    testId: 'network-form-network-name',
  };

  private readonly rpcDropDownButton = '[data-testid="test-add-rpc-drop-down"]';

  private readonly saveButton = {
    testId: 'page-container-footer-next',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Check if the chain id input error message is displayed on the add/edit network page.
   *
   * @param errorMessage - The error message to check.
   */
  async checkChainIdInputErrorMessageIsDisplayed(
    errorMessage: string,
  ): Promise<void> {
    console.log(
      `Check that chain id input error message ${errorMessage} is displayed`,
    );
    await this.driver.waitForSelector({
      text: errorMessage,
      css: this.chainIdInputError,
    });
  }

  /**
   * Checks if the chain id input field is enabled on the edit network page.
   *
   * @param shouldBeEnabled - Whether the chain id input field should be enabled. Defaults to true.
   */
  async checkChainIdInputFieldIsEnabled(
    shouldBeEnabled: boolean = true,
  ): Promise<void> {
    console.log(
      `Check that chain id input field is ${
        shouldBeEnabled ? 'enabled' : 'disabled'
      }`,
    );
    const chainIdInput = await this.driver.findElement(this.chainIdInputField);
    assert.equal(await chainIdInput.isEnabled(), shouldBeEnabled);
  }

  async checkCurrencySymbolWarningIsDisplayed(
    warningMessage: string,
  ): Promise<void> {
    console.log(
      `Check that currency symbol warning ${warningMessage} is displayed`,
    );
    await this.driver.waitForSelector({
      text: warningMessage,
      css: this.currencySymbolWarning,
    });
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.networkNameInputField,
        this.rpcDropDownButton,
      ]);
      await this.driver.waitForSelector(this.saveButton);
    } catch (e) {
      console.log(
        'Timeout while waiting for the add/edit network page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Add/edit network page is loaded');
  }

  /**
   * Check if an RPC is displayed or not in the RPC list on the edit network page.
   *
   * @param rpcName - The name of the RPC to check.
   * @param shouldBeDisplayed - Whether the RPC should be displayed or not, default is true.
   */
  async checkRpcIsDisplayed(
    rpcName: string,
    shouldBeDisplayed: boolean = true,
  ): Promise<void> {
    console.log(
      `Check that RPC ${rpcName} is ${
        shouldBeDisplayed ? '' : 'not '
      } displayed on the edit network page`,
    );
    await this.driver.clickElement(this.rpcDropDownButton);
    if (shouldBeDisplayed) {
      await this.driver.waitForSelector({
        text: rpcName,
        tag: 'p',
      });
    } else {
      await this.driver.assertElementNotPresent({
        text: rpcName,
        tag: 'p',
      });
    }
  }

  async checkSaveButtonIsEnabled(): Promise<boolean> {
    console.log('Check if save button is enabled on the add/edit network page');
    try {
      await this.driver.findClickableElement(this.saveButton);
    } catch (e) {
      console.log('Save button not enabled', e);
      return false;
    }
    console.log('Save button is enabled');
    return true;
  }

  async clickBackButton(): Promise<void> {
    console.log('Click back button on the add/edit network page');
    await this.driver.clickElementAndWaitToDisappear(this.backButton);
  }

  /**
   * Fill the currency symbol input field on the add/edit network page.
   *
   * @param symbol - The symbol to fill in the input field.
   */
  async fillCurrencySymbolInputField(symbol: string): Promise<void> {
    console.log(`Fill currency symbol input field with ${symbol}`);
    await this.driver.fill(this.currencySymbolInputField, symbol);
  }

  /**
   * Fill the network chain id input field on the add/edit network page.
   *
   * @param chainId - The chain id to fill in the input field.
   */
  async fillNetworkChainIdInputField(chainId: string): Promise<void> {
    console.log(`Fill network chain id input field with ${chainId}`);
    await this.driver.fill(this.chainIdInputField, chainId);
  }

  /**
   * Fill the network name input field on the edit network page.
   *
   * @param networkName - The name of the network to fill in the input field.
   */
  async fillNetworkNameInputField(networkName: string): Promise<void> {
    console.log(`Fill network name input field with ${networkName}`);
    await this.driver.fill(this.networkNameInputField, networkName);
  }

  /**
   * Opens the block explorer URL page from the form's explorer dropdown. Await
   * `AddEditBlockExplorerPage.checkPageIsLoaded` to wait for that page.
   */
  async openAddBlockExplorerPage(): Promise<void> {
    console.log('Open the add block explorer URL page');
    await this.driver.findScrollToAndClickElement(
      this.explorerUrlInputDropDownButton,
    );
    await this.driver.clickElement(this.addExplorerUrlButton);
  }

  /**
   * Opens the RPC URL page from the form's RPC dropdown. Await
   * `AddEditRpcUrlPage.checkPageIsLoaded` to wait for that page.
   */
  async openAddRpcUrlPage(): Promise<void> {
    console.log('Open the add RPC URL page');
    await this.driver.clickElement(this.rpcDropDownButton);
    await this.driver.clickElementAndWaitToDisappear(this.addRpcUrlButton);
  }

  /**
   * Removes an RPC from the dropdown on the edit network page.
   *
   * @param rpcOrder - The order number of the RPC to remove (1-based index)
   */
  async removeRpcUrl(rpcOrder: number): Promise<void> {
    console.log(`Remove RPC at position ${rpcOrder} on the edit network page`);
    await this.driver.clickElement(this.rpcDropDownButton);
    await this.driver.clickElementAndWaitToDisappear(
      `[data-testid="delete-item-${rpcOrder - 1}"]`,
    );
  }

  async saveEditedNetwork(timeout?: number): Promise<void> {
    console.log('Save and close the edit network page');
    await this.driver.clickElementAndWaitToDisappear(this.saveButton, timeout);
  }

  /**
   * Selects an RPC from the dropdown on the edit network page, then saves.
   *
   * @param rpcName - The name of the RPC to select.
   */
  async selectRpcUrlAndSave(rpcName: string): Promise<void> {
    console.log(`Select RPC ${rpcName} on the edit network page`);
    await this.driver.clickElement(this.rpcDropDownButton);
    await this.driver.clickElement({
      text: rpcName,
      tag: 'button',
    });
    await this.saveEditedNetwork();
  }
}

export default AddEditNetworkPage;

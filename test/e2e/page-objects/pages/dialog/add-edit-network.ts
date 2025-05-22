import { strict as assert } from 'assert';
import { Driver } from '../../../webdriver/driver';

class AddEditNetworkModal {
  private driver: Driver;

  private readonly addRpcUrlButton = {
    text: 'Add RPC URL',
    tag: 'button',
  };

  private readonly chainIdInputField = {
    testId: 'network-form-chain-id',
  };

  private readonly chainIdInputError =
    '[data-testid="network-form-chain-id-error"]';

  private readonly currencySymbolInputField = '#nativeCurrency';

  private readonly editModalRpcDropDownButton =
    '[data-testid="test-add-rpc-drop-down"]';

  private readonly editModalSaveButton = {
    text: 'Save',
    tag: 'button',
  };

  private readonly networkNameInputField = {
    testId: 'network-form-network-name',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.networkNameInputField,
        this.editModalRpcDropDownButton,
        this.editModalSaveButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for add/edit network dialog to be loaded',
        e,
      );
      throw e;
    }
    console.log('Edit network dialog is loaded');
  }

  /**
   * Fill the currency symbol input field in the add/edit network modal.
   *
   * @param symbol - The symbol to fill in the input field.
   */
  async fillCurrencySymbolInputField(symbol: string): Promise<void> {
    console.log(`Fill currency symbol input field with ${symbol}`);
    await this.driver.fill(this.currencySymbolInputField, symbol);
  }

  /**
   * Fill the network chain id input field in the add/edit network modal.
   *
   * @param chainId - The chain id to fill in the input field.
   */
  async fillNetworkChainIdInputField(chainId: string): Promise<void> {
    console.log(`Fill network chain id input field with ${chainId}`);
    await this.driver.fill(this.chainIdInputField, chainId);
  }

  /**
   * Fill the network name input field in the edit network modal.
   *
   * @param networkName - The name of the network to fill in the input field.
   */
  async fillNetworkNameInputField(networkName: string): Promise<void> {
    console.log(`Fill network name input field with ${networkName}`);
    await this.driver.fill(this.networkNameInputField, networkName);
  }

  async openAddRpcUrlModal(): Promise<void> {
    console.log('Open add RPC URL modal');
    await this.driver.clickElement(this.editModalRpcDropDownButton);
    await this.driver.clickElementAndWaitToDisappear(this.addRpcUrlButton);
  }

  /**
   * Removes an RPC from the dropdown in the edit network modal.
   *
   * @param rpcOrder - The order number of the RPC to remove (1-based index)
   */
  async removeRPCInEditNetworkModal(rpcOrder: number): Promise<void> {
    console.log(`Remove RPC at position ${rpcOrder} in edit network modal`);
    await this.driver.clickElement(this.editModalRpcDropDownButton);
    await this.driver.clickElementAndWaitToDisappear(
      `[data-testid="delete-item-${rpcOrder - 1}"]`,
    );
  }

  async saveEditedNetwork(): Promise<void> {
    console.log('Save and close edit network modal');
    await this.driver.clickElementAndWaitToDisappear(this.editModalSaveButton);
  }

  /**
   * Selects an RPC from the dropdown in the edit network modal.
   *
   * @param rpcName - The name of the RPC to select.
   */
  async selectRPCInEditNetworkModal(rpcName: string): Promise<void> {
    console.log(`Select RPC ${rpcName} in edit network modal`);
    await this.driver.clickElement(this.editModalRpcDropDownButton);
    await this.driver.clickElement({
      text: rpcName,
      tag: 'button',
    });
    await this.saveEditedNetwork();
  }

  /**
   * Checks if the chain id input field is enabled on edit network modal.
   *
   * @param shouldBeEnabled - Whether the chain id input field should be enabled. Defaults to true.
   */
  async check_chainIdInputFieldIsEnabled(
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

  /**
   * Check if the chain id input error message is displayed in the add/edit network modal.
   *
   * @param errorMessage - The error message to check.
   */
  async check_chainIdInputErrorMessageIsDisplayed(
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
   * Check if an RPC is displayed or not in the RPC list in the edit network modal.
   *
   * @param rpcName - The name of the RPC to check.
   * @param shouldBeDisplayed - Whether the RPC should be displayed or not, default is true.
   */
  async check_rpcIsDisplayed(
    rpcName: string,
    shouldBeDisplayed: boolean = true,
  ): Promise<void> {
    console.log(
      `Check that RPC ${rpcName} is ${
        shouldBeDisplayed ? '' : 'not '
      } displayed on edit network modal`,
    );
    await this.driver.clickElement(this.editModalRpcDropDownButton);
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
}

export default AddEditNetworkModal;

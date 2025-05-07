import { strict as assert } from 'assert';
import { Driver } from '../../../webdriver/driver';

class EditNetworkModal {
  private driver: Driver;

  private readonly addRpcUrlButton = {
    text: 'Add RPC URL',
    tag: 'button',
  };

  private readonly chainIdInputField = {
    testId: 'network-form-chain-id',
  };

  private readonly editModalNetworkNameInput =
    '[data-testid="network-form-network-name"]';

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
        this.editModalNetworkNameInput,
        this.editModalRpcDropDownButton,
        this.editModalSaveButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for select network dialog to be loaded',
        e,
      );
      throw e;
    }
    console.log('Edit network dialog is loaded');
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
    await this.driver.clickElement(
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

export default EditNetworkModal;

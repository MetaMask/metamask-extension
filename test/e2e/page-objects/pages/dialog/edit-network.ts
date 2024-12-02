import { Driver } from '../../../webdriver/driver';

class EditNetworkModal {
  private driver: Driver;

  private readonly editModalNetworkNameInput =
    '[data-testid="network-form-network-name"]';

  private readonly editModalRpcDropDownButton =
    '[data-testid="test-add-rpc-drop-down"]';

  private readonly editModalSaveButton = {
    text: 'Save',
    tag: 'button',
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
    await this.driver.clickElementAndWaitToDisappear(this.editModalSaveButton);
  }
}

export default EditNetworkModal;

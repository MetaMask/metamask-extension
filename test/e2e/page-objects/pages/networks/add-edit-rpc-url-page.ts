import { strict as assert } from 'assert';
import { Driver } from '../../../webdriver/driver';

/**
 * The RPC URL sub-form of the network details form, where a single RPC
 * endpoint's URL and display name are entered.
 *
 * Screen: `#/networks?view=add-rpc` and `#/networks?view=edit-rpc`, reached
 * from `AddEditNetworkPage.openAddRpcUrlPage`.
 * Owns: the RPC URL and RPC name fields, the invalid-URL error, and saving or
 * cancelling the sub-form.
 * Boundaries: saving here only returns to the network form - the RPC is not
 * persisted until that form is saved. Asserting the resulting RPC list belongs
 * to `AddEditNetworkPage`.
 * Related: `AddEditNetworkPage` (opens this, and where both save and cancel
 * return to).
 *
 * @see ui/pages/networks/add-rpc-url-page-form.tsx
 */
class AddEditRpcUrlPage {
  private readonly addRpcNameInput = {
    testId: 'rpc-name-input-test',
  };

  private readonly addRpcUrlButton = {
    testId: 'page-container-footer-next',
  };

  private readonly addRpcUrlInput = {
    testId: 'rpc-url-input-test',
  };

  private readonly cancelButton = {
    testId: 'page-container-footer-cancel',
  };

  private readonly driver: Driver;

  private readonly errorMessageInvalidUrl = {
    text: 'URLs require the appropriate HTTP/HTTPS prefix.',
    tag: 'p',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Checks if the add RPC URL button is enabled on the RPC URL page.
   *
   * @param shouldBeEnabled - Whether the add RPC URL button should be enabled. Defaults to true.
   */
  async checkAddRpcUrlButtonIsEnabled(
    shouldBeEnabled: boolean = true,
  ): Promise<void> {
    console.log(
      `Check that add RPC URL button is ${
        shouldBeEnabled ? 'enabled' : 'disabled'
      }`,
    );
    const addRpcUrlButton = await this.driver.findElement(this.addRpcUrlButton);
    assert.equal(await addRpcUrlButton.isEnabled(), shouldBeEnabled);
  }

  async checkErrorMessageInvalidUrlIsDisplayed(): Promise<void> {
    console.log('Check that error message invalid URL is displayed');
    await this.driver.waitForSelector(this.errorMessageInvalidUrl);
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.addRpcUrlInput,
        this.addRpcUrlButton,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for the RPC URL page to be loaded', e);
      throw e;
    }
    console.log('RPC URL page was loaded');
  }

  async clickCancel(): Promise<void> {
    console.log('Cancel out of the RPC URL page');
    await this.driver.clickElementAndWaitToDisappear(this.cancelButton);
  }

  /**
   * Fill the add RPC name input field.
   *
   * @param rpcName - The RPC name to fill in the input field.
   */
  async fillAddRpcNameInput(rpcName: string): Promise<void> {
    console.log(`Fill RPC name input with ${rpcName} on the RPC URL page`);
    const rpcNameInput = await this.driver.findElement(this.addRpcNameInput);
    await rpcNameInput.sendKeys(rpcName);
  }

  /**
   * Fill the add RPC URL input field.
   *
   * @param rpcUrl - The RPC URL to fill in the input field.
   */
  async fillAddRpcUrlInput(rpcUrl: string): Promise<void> {
    console.log(`Fill RPC URL input with ${rpcUrl} on the RPC URL page`);
    const rpcUrlInput = await this.driver.findElement(this.addRpcUrlInput);
    await rpcUrlInput.sendKeys(rpcUrl);
  }

  async saveAddRpcUrl(): Promise<void> {
    console.log('Confirm added RPC URL');
    await this.driver.clickElement(this.addRpcUrlButton);
    await this.driver.assertElementNotPresent(this.addRpcUrlInput);
  }
}

export default AddEditRpcUrlPage;

import { strict as assert } from 'assert';
import { Driver } from '../../../webdriver/driver';

class AddNetworkRpcUrlModal {
  private readonly driver: Driver;

  private readonly addRpcUrlButton = {
    text: 'Add URL',
    tag: 'button',
  };

  private readonly addRpcNameInput = {
    testId: 'rpc-name-input-test',
  };

  private readonly addRpcUrlInput = {
    testId: 'rpc-url-input-test',
  };

  private readonly errorMessageInvalidUrl = {
    text: 'URLs require the appropriate HTTP/HTTPS prefix.',
    tag: 'p',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.addRpcUrlInput,
        this.addRpcUrlButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Add network RPC URL dialog to be loaded',
        e,
      );
      throw e;
    }
    console.log('Add network RPC URL dialog was loaded');
  }

  /**
   * Fill the add RPC name input field.
   *
   * @param rpcName - The RPC name to fill in the input field.
   */
  async fillAddRpcNameInput(rpcName: string): Promise<void> {
    console.log(
      `Fill RPC name input with ${rpcName} in add network RPC URL modal`,
    );
    const rpcNameInput = await this.driver.findElement(this.addRpcNameInput);
    await rpcNameInput.sendKeys(rpcName);
  }

  /**
   * Fill the add RPC URL input field.
   *
   * @param rpcUrl - The RPC URL to fill in the input field.
   */
  async fillAddRpcUrlInput(rpcUrl: string): Promise<void> {
    console.log(
      `Fill RPC URL input with ${rpcUrl} in add network RPC URL modal`,
    );
    const rpcUrlInput = await this.driver.findElement(this.addRpcUrlInput);
    await rpcUrlInput.sendKeys(rpcUrl);
  }

  async saveAddRpcUrl(): Promise<void> {
    console.log('Confirm added RPC URL');
    await this.driver.clickElementAndWaitToDisappear(this.addRpcUrlButton);
  }

  /**
   * Checks if the add RPC URL button is enabled on add network RPC URL modal.
   *
   * @param shouldBeEnabled - Whether the add RPC URL button should be enabled. Defaults to true.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_addRpcUrlButtonIsEnabled(
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

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_errorMessageInvalidUrlIsDisplayed(): Promise<void> {
    console.log('Check that error message invalid URL is displayed');
    await this.driver.waitForSelector(this.errorMessageInvalidUrl);
  }
}

export default AddNetworkRpcUrlModal;

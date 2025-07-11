import { Driver } from '../../../webdriver/driver';

class AddRpcProviderDialog {
  protected driver: Driver;

  private addRpcProviderButton = {
    tag: 'button',
    text: 'Approve',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * @param networkName - The name of the network for adding RPC provider
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(networkName: string): Promise<void> {
    try {
      await this.driver.waitForSelector(this.addRpcProviderButton);
      await this.driver.waitForSelector({
        text: `You are adding a new RPC provider for ${networkName}`,
        tag: 'h4',
      });
    } catch (e) {
      console.log(
        `Timeout while waiting for Add RPC provider dialog for ${networkName} to be loaded`,
        e,
      );
      throw e;
    }
    console.log(`Add RPC provider dialog for ${networkName} is loaded`);
  }

  async approveAddRpcProvider() {
    await this.driver.clickElementAndWaitToDisappear(this.addRpcProviderButton);
  }
}

export default AddRpcProviderDialog;

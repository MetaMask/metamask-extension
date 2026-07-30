import { Driver } from '../../../webdriver/driver';

class AddRpcProviderDialog {
  private addRpcProviderButton = {
    tag: 'button',
    text: 'Approve',
  };

  protected driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async approveAddRpcProvider() {
    await this.driver.clickElementAndWaitToDisappear(this.addRpcProviderButton);
  }

  /**
   * @param networkName - The name of the network for adding RPC provider
   */
  async checkPageIsLoaded(networkName: string): Promise<void> {
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
}

export default AddRpcProviderDialog;

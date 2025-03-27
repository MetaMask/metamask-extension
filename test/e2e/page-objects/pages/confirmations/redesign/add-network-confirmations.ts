import { Driver } from '../../../../webdriver/driver';

class AddNetworkConfirmation {
  driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * @param networkName - The name of the network to check for in the confirmation page
   */
  async check_pageIsLoaded(networkName: string): Promise<void> {
    try {
      await this.driver.waitForSelector({
        text: `Add ${networkName}`,
        tag: 'h3',
      });
    } catch (e) {
      console.log(
        `Timeout while waiting for Add network ${networkName} confirmation page to be loaded`,
        e,
      );
      throw e;
    }
    console.log(`Add network ${networkName} confirmation page is loaded`);
  }
}

export default AddNetworkConfirmation;

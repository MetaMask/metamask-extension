import { Driver } from '../../../../webdriver/driver';

class AddNetworkConfirmation {
  private readonly driver: Driver;

  private readonly approveButton = '[data-testid="confirmation-submit-button"]';

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

  async approveAddNetwork() {
    console.log('Approving add network on confirmation dialog');
    await this.driver.clickElementAndWaitForWindowToClose(this.approveButton);
  }
}

export default AddNetworkConfirmation;

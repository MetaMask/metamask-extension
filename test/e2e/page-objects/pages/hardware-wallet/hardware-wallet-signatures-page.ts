import { Driver } from '../../../webdriver/driver';

/**
 * Hardware wallet signatures page shown during unified Ledger/Trezor swap flows.
 */
class HardwareWalletSignaturesPage {
  private readonly driver: Driver;

  private readonly pageRoot = '[data-testid="hardware-wallet-signatures"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(timeout: number = 30000): Promise<void> {
    try {
      await this.driver.waitForSelector(this.pageRoot, { timeout });
    } catch (e) {
      console.log(
        'Timeout while waiting for hardware wallet signatures page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Hardware wallet signatures page is loaded');
  }

  async waitForPageToClose(timeout: number = 60000): Promise<void> {
    console.log('Waiting for hardware wallet signatures page to close');
    // Prefer assertElementNotPresent over isElementPresent polling: the driver
    // docs note isElementPresent is flaky for disappearances, and it only
    // accepts a locator (a second timeout arg would be ignored).
    await this.driver.assertElementNotPresent(this.pageRoot, { timeout });
    console.log('Hardware wallet signatures page closed');
  }
}

export default HardwareWalletSignaturesPage;

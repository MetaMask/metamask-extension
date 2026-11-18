import { Driver } from '../../../webdriver/driver';

/**
 * Hardware wallet signatures page shown during unified Ledger/Trezor swap flows.
 */
class HardwareWalletSignaturesPage {
  private readonly driver: Driver;

  private readonly pageRoot = {
    testId: 'parent-selector-hardware-wallet-signatures-page',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.pageRoot);
    } catch (e) {
      console.log(
        'Timeout while waiting for hardware wallet signatures page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Hardware wallet signatures page is loaded');
  }

  async waitForPageToClose(): Promise<void> {
    console.log('Waiting for hardware wallet signatures page to close');
    await this.driver.assertElementNotPresent(this.pageRoot);
    console.log('Hardware wallet signatures page closed');
  }
}

export default HardwareWalletSignaturesPage;

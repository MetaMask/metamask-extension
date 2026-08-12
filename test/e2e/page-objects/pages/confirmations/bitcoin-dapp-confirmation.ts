import { Driver } from '../../../webdriver/driver';

/**
 * Confirmation dialog displayed by the Bitcoin snap when a dapp requests an
 * action (sign message, sign PSBT, send transaction).
 */
class BitcoinDappConfirmation {
  private readonly approveButton = { text: 'Approve' };

  private readonly driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async clickApprove(): Promise<void> {
    await this.driver.clickElement(this.approveButton);
  }
}

export default BitcoinDappConfirmation;

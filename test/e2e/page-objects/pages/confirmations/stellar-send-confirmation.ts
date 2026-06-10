import { Driver } from '../../../webdriver/driver';

class StellarSendConfirmation {
  private cancelButton = {
    testId: 'confirm-send-transaction-cancel-snap-footer-button',
    text: 'Cancel',
  };

  private confirmButton = {
    testId: 'confirm-send-transaction-confirm-snap-footer-button',
    text: 'Confirm',
  };

  protected driver: Driver;

  private header = {
    text: 'Transaction request',
    tag: 'h2',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors(
        [this.header, this.cancelButton, this.confirmButton],
        { timeout: 30000 },
      );
    } catch (e) {
      console.log(
        'Timeout while waiting for Stellar send confirmation page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Stellar send confirmation page is loaded');
  }

  async clickFooterConfirmButton() {
    console.log('Clicking Stellar send confirmation footer confirm button');
    await this.driver.clickElementAndWaitToDisappear(this.confirmButton);
  }
}

export default StellarSendConfirmation;

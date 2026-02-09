import { Driver } from '../../../webdriver/driver';

class SnapSignTransactionConfirmation {
  protected driver: Driver;

  private cancelButton = {
    testId: 'confirm-sign-transaction-cancel-snap-footer-button',
    text: 'Cancel',
  };

  private confirmButton = {
    testId: 'confirm-sign-transaction-confirm-snap-footer-button',
    text: 'Confirm',
  };

  private header = {
    text: 'Sign transaction',
    tag: 'h2',
  };

  private addressTestId = 'snap-ui-address';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.header,
        this.cancelButton,
        this.confirmButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for snap transaction confirmation page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Snap transaction confirmation page is loaded');
  }

  async clickFooterConfirmButton() {
    await this.driver.clickElementAndWaitForWindowToClose(this.confirmButton);
  }
}
export default SnapSignTransactionConfirmation;

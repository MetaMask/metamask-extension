import { Driver } from '../../../../webdriver/driver';

class SnapTransactionConfirmation {
  protected driver: Driver;

  private cancelButton = {
    testId: 'confirm-sign-and-send-transaction-cancel-snap-footer-button',
    text: 'Cancel',
  };

  private confirmButton = {
    testId: 'confirm-sign-and-send-transaction-confirm-snap-footer-button',
    text: 'Confirm',
  };

  private header = {
    text: 'Transaction request',
    tag: 'h2',
  };

  private addressTestId = 'snap-ui-address';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkAccountIsDisplayed(expectedValue: string): Promise<void> {
    await this.driver.findElement({
      testId: this.addressTestId,
      text: expectedValue,
    });
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

  async clickFooterCancelButton() {
    await this.driver.clickElement(this.cancelButton);
  }

  async clickFooterConfirmButton() {
    await this.driver.clickElement(this.confirmButton);
  }
}
export default SnapTransactionConfirmation;

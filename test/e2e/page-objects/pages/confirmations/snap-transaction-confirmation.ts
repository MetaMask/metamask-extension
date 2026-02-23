import { Driver } from '../../../webdriver/driver';

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

  private securityAlertsError = {
    tag: 'p',
    text: `Because of an error, we couldn't check for security alerts.`,
  };

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

  async checkSecurityAlertsErrorIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.securityAlertsError);
  }

  async clickFooterCancelButton() {
    await this.driver.clickElementAndWaitToDisappear(this.cancelButton);
  }

  async clickFooterConfirmButton() {
    await this.driver.clickElementAndWaitToDisappear(this.confirmButton);
  }

  async clickFooterConfirmButtonAndWaitForWindowToClose() {
    await this.driver.clickElementAndWaitForWindowToClose(this.confirmButton);
  }
}
export default SnapTransactionConfirmation;

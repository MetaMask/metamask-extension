import { Driver } from '../../../../webdriver/driver';

class SnapSignInConfirmation {
  protected driver: Driver;

  private cancelButton = {
    testId: 'confirm-sign-in-cancel-snap-footer-button',
    text: 'Cancel',
  };

  private confirmButton = {
    testId: 'confirm-sign-in-confirm-snap-footer-button',
    text: 'Confirm',
  };

  private header = {
    text: 'Sign-in request',
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
        'Timeout while waiting for snap sign-in confirmation page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Snap sign-in confirmation page is loaded');
  }

  async clickFooterCancelButton() {
    await this.driver.clickElement(this.cancelButton);
  }

  async clickFooterConfirmButton() {
    await this.driver.clickElement(this.confirmButton);
  }
}
export default SnapSignInConfirmation;

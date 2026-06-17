import { Driver } from '../../../webdriver/driver';

class SnapSignAuthEntryConfirmation {
  protected driver: Driver;

  private cancelButton = {
    testId: 'confirm-sign-auth-entry-cancel-snap-footer-button',
    text: 'Cancel',
  };

  private confirmButton = {
    testId: 'confirm-sign-auth-entry-confirm-snap-footer-button',
    text: 'Confirm',
  };

  private header = {
    text: 'Authorize smart contract',
    tag: 'h2',
  };

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
        'Timeout while waiting for snap sign auth entry confirmation page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Snap sign auth entry confirmation page is loaded');
  }

  async clickFooterConfirmButton() {
    await this.driver.clickElementAndWaitForWindowToClose(this.confirmButton);
  }
}
export default SnapSignAuthEntryConfirmation;

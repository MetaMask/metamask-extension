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

  private insufficientFundsBanner = {
    text: 'Insufficient funds',
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

  async checkFeeAssetIsDisplayed(asset: string): Promise<void> {
    await this.driver.findElement({ text: asset });
  }

  async checkInsufficientFundsBannerIsDisplayed(): Promise<void> {
    await this.driver.findElement(this.insufficientFundsBanner);
  }

  async checkConfirmButtonIsDisabled(): Promise<void> {
    await this.driver.waitForSelector(this.confirmButton, {
      state: 'disabled',
    });
  }
}
export default SnapSignTransactionConfirmation;

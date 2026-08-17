import { Driver } from '../../../webdriver/driver';

/**
 * Snap-rendered sign-transaction confirmation (snap custom UI footer).
 *
 * Screen: snap confirmation dialog with "Sign transaction" header (not
 * redesigned MetaMask `#/confirmation`).
 * Owns: header/footer loaded checks, confirm disabled state, fee asset and
 * insufficient-funds banner, and confirm footer action.
 * Boundaries: snap sign-and-send ("Transaction request") is
 * `SnapTransactionConfirmation`. MetaMask transaction confirms are
 * `TransactionConfirmation` and subclasses.
 * Related: `SnapTransactionConfirmation`, `TransactionConfirmation`.
 *
 * @see ui/components/app/snaps/snap-ui-footer-button/snap-ui-footer-button.tsx
 * @see ui/components/app/snaps/snap-ui-renderer/components/footer.ts
 */
class SnapSignTransactionConfirmation {
  private addressTestId = 'snap-ui-address';

  private cancelButton = {
    testId: 'confirm-sign-transaction-cancel-snap-footer-button',
    text: 'Cancel',
  };

  private confirmButton = {
    testId: 'confirm-sign-transaction-confirm-snap-footer-button',
    text: 'Confirm',
  };

  protected driver: Driver;

  private header = {
    text: 'Sign transaction',
    tag: 'h2',
  };

  private insufficientFundsBanner = {
    text: 'Insufficient funds',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkConfirmButtonIsDisabled(): Promise<void> {
    await this.driver.waitForSelector(this.confirmButton, {
      state: 'disabled',
    });
  }

  async checkFeeAssetIsDisplayed(asset: string): Promise<void> {
    await this.driver.findElement({ text: asset });
  }

  async checkInsufficientFundsBannerIsDisplayed(): Promise<void> {
    await this.driver.findElement(this.insufficientFundsBanner);
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

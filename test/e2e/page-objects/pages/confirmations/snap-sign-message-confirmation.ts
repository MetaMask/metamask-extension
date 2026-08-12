import { Driver } from '../../../webdriver/driver';

/**
 * Snap-rendered sign-message confirmation (snap custom UI footer).
 *
 * Screen: snap confirmation dialog with "Sign message" header (not
 * redesigned MetaMask personal-sign `#/confirmation`).
 * Owns: header/footer loaded checks, displayed snap address, and
 * confirm/cancel snap footer buttons (window close on action).
 * Boundaries: MetaMask personal-sign is `PersonalSignConfirmation`. Snap
 * sign-in / sign-transaction / sign-and-send variants are separate classes.
 * Related: `SnapSignInConfirmation`, `SnapSignTransactionConfirmation`.
 *
 * @see ui/components/app/snaps/snap-ui-footer-button/snap-ui-footer-button.tsx
 * @see ui/components/app/snaps/snap-ui-renderer/components/footer.ts
 */
class SnapSignMessageConfirmation {
  private addressTestId = 'snap-ui-address';

  private cancelButton = {
    testId: 'confirm-sign-message-cancel-snap-footer-button',
    text: 'Cancel',
  };

  private confirmButton = {
    testId: 'confirm-sign-message-confirm-snap-footer-button',
    text: 'Confirm',
  };

  protected driver: Driver;

  private header = {
    text: 'Sign message',
    tag: 'h2',
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

  async clickFooterCancelButton() {
    await this.driver.clickElementAndWaitForWindowToClose(this.cancelButton);
  }

  async clickFooterConfirmButton() {
    await this.driver.clickElementAndWaitForWindowToClose(this.confirmButton);
  }
}
export default SnapSignMessageConfirmation;

import { Driver } from '../../../webdriver/driver';

/**
 * Snap-rendered sign-in confirmation (snap custom UI footer).
 *
 * Screen: snap confirmation dialog with "Sign-in request" header (not
 * redesigned MetaMask SIWE `#/confirmation`).
 * Owns: header/footer loaded checks, displayed snap address, and
 * confirm/cancel snap footer buttons.
 * Boundaries: MetaMask SIWE/personal-sign is `PersonalSignConfirmation`.
 * Other snap confirmation variants have their own page objects.
 * Related: `SnapSignMessageConfirmation`, `PersonalSignConfirmation`.
 *
 * @see ui/components/app/snaps/snap-ui-footer-button/snap-ui-footer-button.tsx
 * @see ui/components/app/snaps/snap-ui-renderer/components/footer.ts
 */
class SnapSignInConfirmation {
  private addressTestId = 'snap-ui-address';

  private cancelButton = {
    testId: 'confirm-sign-in-cancel-snap-footer-button',
    text: 'Cancel',
  };

  private confirmButton = {
    testId: 'confirm-sign-in-confirm-snap-footer-button',
    text: 'Confirm',
  };

  protected driver: Driver;

  private header = {
    text: 'Sign-in request',
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

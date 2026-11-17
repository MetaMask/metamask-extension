import { Driver } from '../../../webdriver/driver';
import { ClickWaitUntil, FooterButton } from '../../common';

/**
 * Snap-rendered confirmSend confirmation (Stellar / Multichain Send).
 *
 * Screen: snap confirmation dialog with "Transaction request" header and
 * `confirm-send-transaction-*` footer button names from the Stellar snap.
 * Boundaries: Solana-style sign-and-send uses `SnapTransactionConfirmation`.
 * Related: `SnapTransactionConfirmation`, `SnapSignTransactionConfirmation`.
 *
 * @see packages/stellar-wallet-snap ConfirmSendTransactionFormNames
 * @see ui/components/app/snaps/snap-ui-footer-button/snap-ui-footer-button.tsx
 */
class SnapConfirmSendConfirmation {
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

  private parentSelector = {
    testId: 'parent-selector-snap-confirmation-page',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded({
    timeout,
  }: { timeout?: number } = {}): Promise<void> {
    try {
      const waitOptions = timeout === undefined ? undefined : { timeout };
      await this.driver.waitForMultipleSelectors(
        [
          this.parentSelector,
          this.header,
          this.cancelButton,
          this.confirmButton,
        ],
        waitOptions,
      );
      // Security scan starts Fetching and disables Confirm until Error/Fetched.
      await this.driver.waitForSelector(this.confirmButton, {
        state: 'enabled',
        ...(timeout === undefined ? {} : { timeout }),
      });
    } catch (e) {
      console.log(
        'Timeout while waiting for snap confirm-send confirmation page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Snap confirm-send confirmation page is loaded');
  }

  /**
   * Click the snap confirm-send footer confirm or cancel button.
   *
   * @param options - Footer click options
   * @param options.button - Which footer button to click
   * @param options.waitUntil - Wait after click. Defaults to `'disappear'`.
   */
  async clickFooterButton({
    button,
    waitUntil = 'disappear',
  }: {
    button: FooterButton;
    waitUntil?: ClickWaitUntil;
  }): Promise<void> {
    const locator =
      button === 'confirm' ? this.confirmButton : this.cancelButton;
    switch (waitUntil) {
      case 'windowClose':
        await this.driver.clickElementAndWaitForWindowToClose(locator);
        return;
      case 'disappear':
        await this.driver.clickElementAndWaitToDisappear(locator);
        return;
      default:
        await this.driver.clickElement(locator);
    }
  }
}

export default SnapConfirmSendConfirmation;

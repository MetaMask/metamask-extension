import { Driver } from '../../../webdriver/driver';
import { ClickWaitUntil, FooterButton } from '../../common';

/**
 * Snap-rendered sign-and-send transaction confirmation (snap custom UI
 * footer).
 *
 * Screen: snap confirmation dialog with "Transaction request" header (not
 * redesigned MetaMask `#/confirmation`).
 * Owns: header/footer loaded checks, snap address and network display,
 * security-alerts error copy, and confirm/cancel snap footer actions.
 * Boundaries: snap sign-only transaction is `SnapSignTransactionConfirmation`.
 * MetaMask redesigned txs are `TransactionConfirmation` and subclasses.
 * Related: `SnapSignTransactionConfirmation`, `TransactionConfirmation`.
 *
 * @see ui/components/app/snaps/snap-ui-footer-button/snap-ui-footer-button.tsx
 * @see ui/components/app/snaps/snap-ui-renderer/components/footer.ts
 */
class SnapTransactionConfirmation {
  private addressTestId = 'snap-ui-address';

  private cancelButton = {
    testId: 'confirm-sign-and-send-transaction-cancel-snap-footer-button',
    text: 'Cancel',
  };

  private confirmButton = {
    testId: 'confirm-sign-and-send-transaction-confirm-snap-footer-button',
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

  // This message is rendered by the Solana wallet snap from its own bundled
  // locale, not from the extension's messages.json.
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

  async checkNetworkIsDisplayed(networkName: string): Promise<void> {
    console.log(
      `Checking network ${networkName} is displayed on snap transaction confirmation page.`,
    );
    await this.driver.waitForSelector(
      this.getNetworkDisplayLocator(networkName),
    );
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

  /**
   * Click the snap transaction footer confirm or cancel button.
   *
   * Defaults to waiting for the button to disappear, matching the previous
   * confirm/cancel helpers. Pass `waitUntil: 'windowClose'` to wait for the
   * window instead.
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
    await this.clickFooterButtonAndWait(locator, waitUntil);
  }

  private async clickFooterButtonAndWait(
    locator: { testId: string; text: string },
    waitUntil?: ClickWaitUntil,
  ): Promise<void> {
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

  private getNetworkDisplayLocator(networkName: string) {
    return {
      text: networkName,
      tag: 'p',
    };
  }
}
export default SnapTransactionConfirmation;

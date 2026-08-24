import { Driver } from '../../../webdriver/driver';

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
        [this.header, this.cancelButton, this.confirmButton],
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

  async clickFooterCancelButton() {
    await this.driver.clickElementAndWaitToDisappear(this.cancelButton);
  }

  async clickFooterCancelButtonAndWaitForWindowToClose() {
    console.log(
      'Clicking footer cancel button and waiting for window to close',
    );
    await this.driver.clickElementAndWaitForWindowToClose(this.cancelButton);
  }

  async clickFooterConfirmButton() {
    console.log('Clicking footer confirm button');
    await this.driver.clickElementAndWaitToDisappear(this.confirmButton);
  }

  async clickFooterConfirmButtonAndWaitForWindowToClose() {
    console.log(
      'Clicking footer confirm button and waiting for window to close',
    );
    await this.driver.clickElementAndWaitForWindowToClose(this.confirmButton);
  }

  private getNetworkDisplayLocator(networkName: string) {
    return {
      text: networkName,
      tag: 'p',
    };
  }
}
export default SnapTransactionConfirmation;

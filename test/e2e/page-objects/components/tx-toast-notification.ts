import { Driver } from '../../webdriver/driver';

/**
 * Page object for transaction toast notifications shown after a tx completes.
 *
 */
export class TxToastNotification {
  private readonly anyTransactionToast =
    '[data-testid="transaction-submitted-toast"], [data-testid="transaction-confirmed-toast"], [data-testid="transaction-failed-toast"]';

  private readonly closeButton = '[data-testid="toast-close-button"]';

  protected driver: Driver;

  private readonly transactionConfirmedText = {
    tag: 'p',
    text: 'Transaction confirmed',
  };

  private readonly transactionConfirmedToast =
    '[data-testid="transaction-confirmed-toast"]';

  private readonly transactionSubmittedToast =
    '[data-testid="transaction-submitted-toast"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkTxConfirmedToast(): Promise<void> {
    console.log('Check transaction confirmed toast is displayed');
    await this.driver.waitForSelector(this.transactionConfirmedText);
  }

  async checkTxSubmittedToast(): Promise<void> {
    console.log('Check transaction submitted toast is displayed');
    await this.driver.waitForSelector(this.transactionSubmittedToast);
  }

  async closeToastNotification(): Promise<void> {
    // The toast auto-dismisses after a few seconds, so use clickElementSafe to avoid race conditions.
    await this.driver.clickElementSafe(this.closeButton);
  }

  async dismissConfirmedToastIfPresent(): Promise<void> {
    console.log('Dismiss the transaction confirmed toast when it is open');
    const toastOpen = await this.driver.isElementPresentAndVisible(
      this.transactionConfirmedToast,
      1000,
    );
    if (!toastOpen) {
      return;
    }
    await this.driver.clickElement(this.closeButton);
    await this.driver.assertElementNotPresent(this.transactionConfirmedToast);
  }

  async waitForToastNotification(): Promise<void> {
    console.log('Waiting for transaction toast notification');
    await this.driver.waitForSelector(this.anyTransactionToast);
  }
}

import { Driver } from '../../webdriver/driver';

/**
 * Page object for transaction toast notifications shown after a tx completes.
 *
 */
export class TxToastNotification {
  private readonly closeButton = '[data-testid="toast-close-button"]';

  private readonly confirmedToastLink = 'a[aria-label="Transaction confirmed"]';

  protected driver: Driver;

  private readonly transactionConfirmedText = {
    tag: 'p',
    text: 'Transaction confirmed',
  };

  private readonly transactionFailedToast =
    '[data-testid="transaction-failed-toast"]';

  private readonly transactionSubmittedToast =
    '[data-testid="transaction-submitted-toast"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkTxConfirmedToast(): Promise<void> {
    console.log('Check transaction confirmed toast is displayed');
    await this.driver.waitForSelector(this.transactionConfirmedText);
  }

  async checkTxFailedToast(): Promise<void> {
    console.log('Check transaction failed toast is displayed');
    await this.driver.waitForSelector(this.transactionFailedToast);
  }

  async checkTxSubmittedToast(): Promise<void> {
    console.log('Check transaction submitted toast is displayed');
    await this.driver.waitForSelector(this.transactionSubmittedToast);
  }

  async closeToastNotification(): Promise<void> {
    // The toast auto-dismisses after a few seconds, so use clickElementSafe to avoid race conditions.
    await this.driver.clickElementSafe(this.closeButton);
  }

  async openConfirmedToast(): Promise<void> {
    console.log('Open transaction details from the confirmed toast');
    await this.driver.clickElement(this.confirmedToastLink);
  }
}

import { Driver } from '../../webdriver/driver';

/**
 * Page object for transaction toast notifications shown after a tx completes.
 *
 */
export class TxToastNotification {
  private readonly closeButton = '[aria-label="Close"]';

  protected driver: Driver;

  private readonly transactionConfirmedText = {
    tag: 'p',
    text: 'Transaction confirmed',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkTxConfirmedToast(): Promise<void> {
    console.log('Check transaction confirmed toast is displayed');
    await this.driver.waitForSelector(this.transactionConfirmedText);
  }

  async closeToastNotification(): Promise<void> {
    // The toast auto-dismisses after a few seconds, so use clickElementSafe to avoid race conditions.
    await this.driver.clickElementSafe(this.closeButton, 5_000);
  }
}

import { Driver } from '../../webdriver/driver';

export class TransactionDetailsPage {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async speedUpTransaction() {
    await this.driver.clickElement('[data-testid="speedup-button"]');
    await this.driver.clickElement({ text: 'Submit', tag: 'button' });
  }
}

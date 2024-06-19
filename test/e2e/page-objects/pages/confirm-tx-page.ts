import { Driver } from '../../webdriver/driver';

class ConfirmTxPage {
  private driver: Driver;

  private confirmButton: string;

  private editButton: string;

  private transactionFee: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.confirmButton = '[data-testid="page-container-footer-next"]';
    this.editButton = '[data-testid="confirm-page-back-edit-button"]';
    this.transactionFee = '[data-testid="confirm-gas-display"]';
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.editButton);
      await this.driver.waitForSelector(this.confirmButton);
      await this.driver.waitForSelector(this.transactionFee);
    } catch (e) {
      console.log(
        'Timeout while waiting for confirm transaction screen to be loaded',
        e,
      );
      throw e;
    }
    console.log('Confirm transaction page is loaded');
  }

  async confirmTx(): Promise<void> {
    console.log('Click confirm button to confirm transaction');
    await this.driver.clickElement(this.confirmButton);
  }
}

export default ConfirmTxPage;

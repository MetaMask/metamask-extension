import { Driver } from '../../../webdriver/driver';

class ConfirmTxPage {
  private driver: Driver;

  private confirmButton: string;

  private totalFee: string;

  private transactionFee: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.confirmButton = '[data-testid="page-container-footer-next"]';
    this.transactionFee = '[data-testid="confirm-gas-display"]';
    this.totalFee = '[data-testid="confirm-page-total-amount"]';
  }

  /**
   * Verifies that the confirm transaction page is fully loaded by checking for the presence of confirm button and the expected gas values.
   *
   * @param expectedGasFee - The expected gas fee value to be displayed on the page.
   * @param expectedTotalFee - The expected total fee value to be displayed on the page.
   * @returns A promise that resolves when all specified elements are verified to be present and contain the expected values, indicating the page has fully loaded.
   */
  async check_pageIsLoaded(
    expectedGasFee: string,
    expectedTotalFee: string,
  ): Promise<void> {
    try {
      await Promise.all([
        this.driver.waitForSelector(this.confirmButton),
        this.driver.waitForSelector({
          css: this.transactionFee,
          text: `${expectedGasFee} ETH`,
        }),
        this.driver.waitForSelector({
          css: this.totalFee,
          text: `${expectedTotalFee} ETH`,
        }),
      ]);
    } catch (e) {
      console.log(
        `Timeout while waiting for confirm transaction screen to be loaded, expected gas fee is: ${expectedGasFee} and expected total fee is: ${expectedTotalFee}`,
        e,
      );
      throw e;
    }
    console.log('Confirm transaction page is loaded with expected gas value');
  }

  async confirmTx(): Promise<void> {
    console.log('Click confirm button to confirm transaction');
    await this.driver.clickElement(this.confirmButton);
  }
}

export default ConfirmTxPage;

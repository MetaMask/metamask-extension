import { Driver } from '../../../webdriver/driver';

class ConfirmTxPage {
  private driver: Driver;

  private readonly confirmButton = '[data-testid="page-container-footer-next"]';

  private readonly totalFee = '[data-testid="confirm-page-total-amount"]';

  private readonly transactionFee = '[data-testid="confirm-gas-display"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Verifies that the confirm transaction page is fully loaded by checking for the presence of confirm button and the expected gas values.
   *
   * @param expectedGasFee - The expected gas fee value to be displayed on the page.
   * @returns A promise that resolves when all specified elements are verified to be present and contain the expected values, indicating the page has fully loaded.
   */
  async check_pageIsLoaded(expectedGasFee: string): Promise<void> {
    try {
      await Promise.all([
        this.driver.waitForSelector(this.confirmButton),
        this.driver.waitForSelector({
          css: this.transactionFee,
          text: `${expectedGasFee} ETH`,
        }),
      ]);
    } catch (e) {
      console.log(
        `Timeout while waiting for confirm transaction screen to be loaded, expected gas fee is ${expectedGasFee}`,
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

  /**
   * Verifies that the total fee is displayed on confirm transaction dialog.
   *
   * @param expectedTotalFee - The expected total fee value to be displayed.
   */
  async check_totalFeeIsDisplayed(expectedTotalFee: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.totalFee,
      text: `${expectedTotalFee} ETH`,
    });
  }
}

export default ConfirmTxPage;

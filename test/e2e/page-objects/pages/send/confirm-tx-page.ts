import { Driver } from '../../../webdriver/driver';

class ConfirmTxPage {
  private driver: Driver;

  private confirmButton: string;

  private totalFee: string;

  private transactionFee: string;

  private editFeeLegacyDesign: object;

  private editFeeRedesign: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.confirmButton = '[data-testid="page-container-footer-next"]';
    this.transactionFee = '[data-testid="confirm-gas-display"]';
    this.totalFee = '[data-testid="confirm-page-total-amount"]';
    this.editFeeLegacyDesign = {
           text: 'Edit',
           tag: 'button'
    };
    this.editFeeRedesign = '[data-testid="edit-gas-fee-icon"]';
  }

  /**
   * Verifies that the confirm transaction page is fully loaded by checking for the presence of confirm button and the expected gas values.
   *
   * @param expectedGasFee - The expected gas fee value to be displayed on the page.
   * @param expectedTotalAmount - The expected total fee value to be displayed on the page.
   * @returns A promise that resolves when all specified elements are verified to be present and contain the expected values, indicating the page has fully loaded.
   */
  async check_pageIsLoaded(
    expectedGasFee: string,
    expectedTotalAmount: string,
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
          text: `${expectedTotalAmount} ETH`,
        }),
      ]);
    } catch (e) {
      console.log(
        `Timeout while waiting for confirm transaction screen to be loaded, expected gas fee is: ${expectedGasFee} and expected total fee is: ${expectedTotalAmount}`,
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
  async openEditFeeModal(confirmationsRedesign: boolean = true): Promise<void> {
    console.log('Click edit fee button to open edit fee modal');
    if (confirmationsRedesign) {
      await this.driver.clickElement(this.editFeeRedesign);
    } else {
      await this.driver.clickElement(this.editFeeLegacyDesign);
    }
  }
}

export default ConfirmTxPage;

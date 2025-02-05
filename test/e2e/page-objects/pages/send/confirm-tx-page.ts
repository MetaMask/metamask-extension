import { Driver } from '../../../webdriver/driver';

class ConfirmTxPage {
  private driver: Driver;

  private readonly actionNameSummary =
    '.confirm-page-container-summary__action__name';

  private readonly confirmButton = '[data-testid="page-container-footer-next"]';

  private readonly totalFee = '[data-testid="confirm-page-total-amount"]';

  private readonly transactionFee = '[data-testid="confirm-gas-display"]';

  private readonly rejectButton =
    '[data-testid="page-container-footer-cancel"]';

  private readonly gasInputs = 'input[type="number"]';

  private readonly editButton = { text: 'Edit', tag: 'button' };

  private readonly saveButton = { text: 'Save', tag: 'button' };

  private readonly hexTabButton = {
    css: 'button',
    text: 'Hex',
  };

  private readonly detailsTabButton = {
    css: 'button',
    text: 'Details',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_functionTypeAndHexData(
    expectedFunctionsType: string,
    expectedHexData: string,
  ): Promise<void> {
    console.log('Switch to hex tab and check functions type and hex data');
    await this.driver.clickElement(this.hexTabButton);
    await this.driver.waitForSelector({
      tag: 'span',
      text: expectedFunctionsType,
    });
    await this.driver.waitForSelector({
      css: 'p',
      text: expectedHexData,
    });
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

  async clickConfirmButton(): Promise<void> {
    console.log('Click confirm button to confirm transaction');
    await this.driver.clickElement(this.confirmButton);
  }

  async rejectTx(): Promise<void> {
    console.log('Click reject button to confirm transaction');
    await this.driver.clickElement(this.rejectButton);
  }

  /**
   * Checks if the action name is displayed on the confirm transaction page.
   *
   * @param expectedActionName - The expected action name to be displayed.
   * @returns A boolean indicating whether the action name is displayed.
   */
    async check_actionNameIsDisplayed(
      expectedActionName: string,
    ): Promise<boolean> {
      try {
        await this.driver.waitForSelector({
          css: this.actionNameSummary,
          text: expectedActionName,
        });
      return true;
    } catch (e) {
      return false;
    }
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

  /**
   * Edits the gas fee by setting custom gas limit and price values
   *
   * @param gasLimit - The gas limit value to set
   * @param gasPrice - The gas price value to set
   */
  async editGasFee(gasLimit: string, gasPrice: string): Promise<void> {
    console.log('Editing gas fee values');

    await this.driver.clickElement(this.editButton);

    const inputs = await this.driver.findElements(this.gasInputs);
    const [gasLimitInput, gasPriceInput] = inputs;

    await gasLimitInput.clear();
    await gasLimitInput.sendKeys(gasLimit);
    await gasPriceInput.clear();
    await gasPriceInput.sendKeys(gasPrice);

    await this.driver.clickElement(this.saveButton);

    console.log('Gas fee values updated successfully');
  }

  async switchToDetailsTab(): Promise<void> {
    console.log('Switch to details tab');
    await this.driver.clickElement(this.detailsTabButton);
    await this.driver.waitForSelector(this.transactionFee);
  }
}

export default ConfirmTxPage;

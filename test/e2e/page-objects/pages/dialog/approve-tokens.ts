import { Driver } from '../../../webdriver/driver';

class ApproveTokensModal {
  protected driver: Driver;

  private readonly customSpendingCapInput = 'input[id="custom-spending-cap"]';

  private readonly dataBlock =
    '.approve-content-card-container__data__data-block';

  private readonly editGasFeeButton = '[data-testid="edit-gas-fee-btn"]';

  private readonly editSpendingCapButton =
    '[data-testid="edit-spending-cap-btn"]';

  private readonly gasInputs = 'input[type="number"]';

  private readonly maxSpendingCapButton =
    '[data-testid="custom-spending-cap-max-button"]';

  private readonly nextOrApproveButton =
    '[data-testid="page-container-footer-next"]';

  private readonly reveiwSpendingCapValue = '.review-spending-cap__value';

  private readonly verifyThirdPartyLink =
    '.token-allowance-container__verify-link';

  private approvalHeaderMessage = {
    text: 'Spending cap request for your',
    css: 'span',
  };

  private readonly pageOneOfTwo = {
    text: `1 of 2`,
    css: 'h6',
  };

  private readonly pageTwoOfTwo = {
    text: `2 of 2`,
    css: 'h6',
  };

  private saveButton = {
    text: 'Save',
    tag: 'button',
  };

  private thirdPartyGotItButton = {
    text: 'Got it',
    css: 'button',
  };

  private viewDetailsButton = {
    text: 'View details',
    css: '.token-allowance-container__view-details',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // Check methods

  async check_approvalDetails(expectedData: string): Promise<void> {
    console.log('Checking approval details...');
    try {
      await this.driver.clickElement(this.viewDetailsButton);
      await this.driver.waitForMultipleSelectors([
        {
          text: 'Function: Approve',
          tag: 'h6',
        },
        {
          text: expectedData,
          css: this.dataBlock,
        },
      ]);
      console.log('Approval details are displayed.');
    } catch (error) {
      console.log(
        'Timeout while waiting for approval details to be displayed',
        error,
      );
      throw error;
    }
  }

  /**
   * Checks if the first page in approve tokens dialog is loaded by verifying the presence of specific elements.
   *
   * @param tokenSymbol - The symbol of the token to be approved.
   * @returns
   */
  async check_page1IsLoaded(tokenSymbol: string): Promise<void> {
    console.log('Checking if first page of approve tokens dialog is loaded...');
    try {
      await this.driver.waitForMultipleSelectors([
        this.pageOneOfTwo,
        this.approvalHeaderMessage,
        this.customSpendingCapInput,
        {
          text: `${tokenSymbol}`,
          css: 'span',
        },
        this.nextOrApproveButton,
      ]);
      console.log('First page of approve tokens dialog is loaded.');
    } catch (error) {
      console.log(
        'Timeout while waiting for First page of approve tokens dialog to be loaded',
        error,
      );
      throw error;
    }
  }

  /**
   * Checks if the second page in approve tokens dialog is loaded by verifying the presence of specific elements.
   *
   * @param spendingCapExpectedValue - The symbol of the token to be approved. (i.e 1 ETH or 1 TST)
   * @returns
   */
  async check_page2IsLoaded(spendingCapExpectedValue: string): Promise<void> {
    console.log(
      'Checking if second page of approve tokens dialog is loaded...',
    );
    try {
      await this.driver.waitForMultipleSelectors([
        this.approvalHeaderMessage,
        this.pageTwoOfTwo,
        {
          text: spendingCapExpectedValue,
          css: this.reveiwSpendingCapValue,
        },
        this.nextOrApproveButton,
      ]);
      console.log('Second page of approve tokens dialog is loaded.');
    } catch (error) {
      console.log(
        'Timeout while waiting for Second page of approve tokens dialog to be loaded',
        error,
      );
      throw error;
    }
  }

  /**
   * Checks if the third-party modal is opened by verifying the presence of specific elements.
   *
   * @returns
   */
  async check_thirdPartyModalIsOpened(): Promise<void> {
    console.log('Checking if third-party modal is opened...');
    try {
      await this.driver.waitForMultipleSelectors([
        {
          text: 'Third-party details',
          css: 'h5',
        },
        {
          text: 'To protect yourself against scammers, take a moment to verify third-party details.',
          css: 'h6',
        },
        this.thirdPartyGotItButton,
      ]);
      console.log('Third-party modal is opened.');
    } catch (error) {
      console.log(
        'Timeout while waiting for third-party modal to be opened',
        error,
      );
      throw error;
    }
  }

  // Action methods

  async clickApprove() {
    await this.driver.clickElementAndWaitForWindowToClose(
      this.nextOrApproveButton,
    );
  }

  async clickMaxSpendingCapButton() {
    await this.driver.clickElement(this.maxSpendingCapButton);
  }

  async clickNext() {
    await this.driver.clickElement(this.nextOrApproveButton);
  }

  async clickThirdPartyGotItButton() {
    await this.driver.clickElement(this.thirdPartyGotItButton);
  }

  async clickVerifyThirdPartyLink() {
    await this.driver.clickElement(this.verifyThirdPartyLink);
  }

  /**
   * Edits the gas fee by setting custom gas limit and price values
   *
   * @param gasLimit - The gas limit value to set
   * @param gasPrice - The gas price value to set
   */
  async editGasFee(gasLimit: string, gasPrice: string): Promise<void> {
    console.log('Editing gas fee values');

    await this.driver.clickElement(this.editGasFeeButton);

    const inputs = await this.driver.findElements(this.gasInputs);
    const [gasLimitInput, gasPriceInput] = inputs;

    await gasLimitInput.clear();
    await gasLimitInput.sendKeys(gasLimit);
    await gasPriceInput.clear();
    await gasPriceInput.sendKeys(gasPrice);

    await this.driver.clickElement(this.saveButton);

    console.log('Gas fee values updated successfully');
  }

  /**
   * Edits the spending cap with a new value.
   *
   * @param newValue - The new spending cap value to be set.
   * @returns A promise that resolves when the spending cap has been edited.
   */
  async editSpendingCap(newValue: string): Promise<void> {
    await this.driver.clickElement(this.editSpendingCapButton);
    await this.driver.waitForSelector(this.customSpendingCapInput);
    await this.driver.fill(this.customSpendingCapInput, newValue);
  }

  async setCustomSpendingCapValue(value: string) {
    await this.driver.fill(this.customSpendingCapInput, value);
  }
}

export default ApproveTokensModal;

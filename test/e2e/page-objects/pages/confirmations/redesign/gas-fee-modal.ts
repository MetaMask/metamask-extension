import { Driver } from '../../../../webdriver/driver';
import { RawLocator } from '../../../common';

/**
 * Page object for the new redesigned gas fee modal.
 * This modal allows users to select gas fee options (low, medium, high, advanced)
 * and customize gas parameters.
 */
export default class GasFeeModal {
  private driver: Driver;

  private readonly advancedEIP1559Modal: RawLocator =
    '[data-testid="gas-fee-advanced-eip1559-modal"]';

  private readonly advancedGasPriceModal: RawLocator =
    '[data-testid="gas-fee-advanced-gas-price-modal"]';

  private readonly cancelButton: RawLocator =
    '[data-testid="gas-fee-modal-cancel-button"]';

  private readonly editGasFeeModalTitle = { text: 'Edit gas fee', tag: 'h4' };

  private readonly estimatesModal: RawLocator =
    '[data-testid="gas-fee-estimates-modal"]';

  private readonly gasLimitInput: RawLocator = '[id="gas-input"]';

  private readonly gasOptionAdvanced: RawLocator =
    '[data-testid="gas-option-advanced"]';

  private readonly gasOptionHigh: RawLocator =
    '[data-testid="gas-option-high"]';

  private readonly gasOptionLow: RawLocator = '[data-testid="gas-option-low"]';

  private readonly gasOptionMedium: RawLocator =
    '[data-testid="gas-option-medium"]';

  private readonly gasOptionSiteSuggested: RawLocator =
    '[data-testid="gas-option-site_suggested"]';

  private readonly gasPriceInput: RawLocator = '[id="gas-price-input"]';

  private readonly maxBaseFeeInput: RawLocator = '[id="max-base-fee-input"]';

  private readonly priorityFeeInput: RawLocator = '[id="priority-fee-input"]';

  private readonly saveButton: RawLocator =
    '[data-testid="gas-fee-modal-save-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Checks if the advanced EIP-1559 modal is displayed.
   */
  async checkAdvancedEIP1559ModalIsDisplayed(): Promise<void> {
    console.log('Checking if advanced EIP-1559 modal is displayed');
    await this.driver.waitForSelector(this.advancedEIP1559Modal);
  }

  /**
   * Checks if the advanced gas price modal (legacy) is displayed.
   */
  async checkAdvancedGasPriceModalIsDisplayed(): Promise<void> {
    console.log('Checking if advanced gas price modal is displayed');
    await this.driver.waitForSelector(this.advancedGasPriceModal);
  }

  /**
   * Checks if the gas fee estimates modal is displayed.
   */
  async checkEstimatesModalIsDisplayed(): Promise<void> {
    console.log('Checking if gas fee estimates modal is displayed');
    await this.driver.waitForSelector(this.estimatesModal);
  }

  /**
   * Checks if a specific gas option is displayed.
   *
   * @param option - The gas option to check ('low' | 'medium' | 'high' | 'advanced' | 'site_suggested')
   */
  async checkGasOptionIsDisplayed(
    option: 'low' | 'medium' | 'high' | 'advanced' | 'site_suggested',
  ): Promise<void> {
    console.log(`Checking if ${option} gas option is displayed`);
    const selector = `[data-testid="gas-option-${option}"]`;
    await this.driver.waitForSelector(selector);
  }

  /**
   * Checks if a gas option shows the expected value.
   *
   * @param option - The gas option to check
   * @param expectedValue - The expected value text
   */
  async checkGasOptionValue(
    option: 'low' | 'medium' | 'high' | 'advanced' | 'site_suggested',
    expectedValue: string,
  ): Promise<void> {
    console.log(
      `Checking if ${option} gas option shows value: ${expectedValue}`,
    );
    const selector = `[data-testid="gas-option-${option}"]`;
    await this.driver.waitForSelector({
      css: selector,
      text: expectedValue,
    });
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.editGasFeeModalTitle,
        this.gasOptionLow,
        this.gasOptionMedium,
        this.gasOptionHigh,
        this.gasOptionAdvanced,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for gas fee modal to be loaded', e);
      throw e;
    }
    console.log('Gas fee modal is loaded');
  }

  /**
   * Clicks the cancel button to go back to estimates modal.
   */
  async clickCancel(): Promise<void> {
    console.log('Clicking cancel button');
    await this.driver.clickElementAndWaitToDisappear(this.cancelButton);
  }

  /**
   * Clicks the save button to save gas fee changes.
   */
  async clickSave(): Promise<void> {
    console.log('Clicking save button');
    await this.driver.clickElementAndWaitToDisappear(this.saveButton);
  }

  /**
   * Enters the gas limit value.
   *
   * @param value - The gas limit value to enter
   */
  async enterGasLimit(value: string): Promise<void> {
    console.log(`Entering gas limit: ${value}`);
    await this.driver.fill(this.gasLimitInput, value);
  }

  /**
   * Enters the gas price value in the legacy advanced modal.
   *
   * @param value - The gas price value to enter (in Gwei)
   */
  async enterGasPrice(value: string): Promise<void> {
    console.log(`Entering gas price: ${value}`);
    await this.driver.fill(this.gasPriceInput, value);
  }

  /**
   * Enters the max base fee value in the advanced EIP-1559 modal.
   *
   * @param value - The max base fee value to enter (in Gwei)
   */
  async enterMaxBaseFee(value: string): Promise<void> {
    console.log(`Entering max base fee: ${value}`);
    await this.driver.fill(this.maxBaseFeeInput, value);
  }

  /**
   * Enters the priority fee value in the advanced EIP-1559 modal.
   *
   * @param value - The priority fee value to enter (in Gwei)
   */
  async enterPriorityFee(value: string): Promise<void> {
    console.log(`Entering priority fee: ${value}`);
    await this.driver.fill(this.priorityFeeInput, value);
  }

  /**
   * Opens the advanced gas fee modal by clicking the advanced option.
   */
  async openAdvancedGasFeeModal(): Promise<void> {
    console.log('Opening advanced gas fee modal');
    await this.driver.clickElementAndWaitToDisappear(this.gasOptionAdvanced);
  }

  /**
   * Selects the high gas fee option.
   */
  async selectHighGasFee(): Promise<void> {
    console.log('Selecting high gas fee option');
    await this.driver.clickElementAndWaitToDisappear(this.gasOptionHigh);
  }

  /**
   * Selects the low gas fee option.
   */
  async selectLowGasFee(): Promise<void> {
    console.log('Selecting low gas fee option');
    await this.driver.waitForElementToStopMoving(this.gasOptionLow);
    await this.driver.clickElementAndWaitToDisappear(this.gasOptionLow);
  }

  /**
   * Selects the medium gas fee option.
   */
  async selectMediumGasFee(): Promise<void> {
    console.log('Selecting medium gas fee option');
    await this.driver.clickElementAndWaitToDisappear(this.gasOptionMedium);
  }

  /**
   * Selects the dapp/site suggested gas fee option.
   */
  async selectSiteSuggestedGasFee(): Promise<void> {
    console.log('Selecting site suggested gas fee option');
    await this.driver.clickElementAndWaitToDisappear(
      this.gasOptionSiteSuggested,
    );
  }

  /**
   * Sets custom EIP-1559 gas values (for London hardfork and later).
   *
   * @param options - The gas options to set
   * @param options.maxBaseFee - The max base fee in Gwei
   * @param options.priorityFee - The priority fee in Gwei
   * @param options.gasLimit - The gas limit (optional)
   */
  async setCustomEIP1559GasFee(options: {
    maxBaseFee: string;
    priorityFee: string;
    gasLimit?: string;
  }): Promise<void> {
    console.log('Setting custom EIP-1559 gas fee');
    await this.checkEstimatesModalIsDisplayed();
    await this.openAdvancedGasFeeModal();
    await this.checkAdvancedEIP1559ModalIsDisplayed();

    await this.enterMaxBaseFee(options.maxBaseFee);
    await this.enterPriorityFee(options.priorityFee);

    if (options.gasLimit) {
      await this.enterGasLimit(options.gasLimit);
    }

    await this.clickSave();
  }

  /**
   * Sets custom legacy gas values (for pre-London networks).
   *
   * @param options - The gas options to set
   * @param options.gasPrice - The gas price in Gwei
   * @param options.gasLimit - The gas limit (optional)
   */
  async setCustomLegacyGasFee(options: {
    gasPrice: string;
    gasLimit?: string;
  }): Promise<void> {
    console.log('Setting custom legacy gas fee');
    await this.checkEstimatesModalIsDisplayed();
    await this.openAdvancedGasFeeModal();
    await this.checkAdvancedGasPriceModalIsDisplayed();

    await this.enterGasPrice(options.gasPrice);

    if (options.gasLimit) {
      await this.enterGasLimit(options.gasLimit);
    }

    await this.clickSave();
  }

  /**
   * Updates gas fee to a specific level (low, medium, or high).
   *
   * @param level - The gas fee level to select
   */
  async updateGasFeeLevel(level: 'low' | 'medium' | 'high'): Promise<void> {
    console.log(`Updating gas fee to ${level}`);
    await this.checkEstimatesModalIsDisplayed();

    switch (level) {
      case 'low':
        await this.selectLowGasFee();
        break;
      case 'medium':
        await this.selectMediumGasFee();
        break;
      case 'high':
        await this.selectHighGasFee();
        break;
      default:
        throw new Error('Unknown gas fee level');
    }
  }
}

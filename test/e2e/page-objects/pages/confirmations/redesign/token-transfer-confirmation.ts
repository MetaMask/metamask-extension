import { tEn } from '../../../../../lib/i18n-helpers';
import { Driver } from '../../../../webdriver/driver';
import TransactionConfirmation from './transaction-confirmation';

class TokenTransferTransactionConfirmation extends TransactionConfirmation {
  private readonly confirmButton = '[data-testid="confirm-footer-button"]';

  private readonly interactingWithParagraph = {
    css: 'p',
    text: tEn('interactingWith') as string,
  };

  private readonly networkFee = '[data-testid="first-gas-field"]';

  private readonly networkFeeParagraph = {
    css: 'p',
    text: tEn('networkFee') as string,
  };

  private readonly networkParagraph = {
    css: 'p',
    text: tEn('transactionFlowNetwork') as string,
  };

  private readonly networkTextElement = (networkText: string) => ({
    css: 'p',
    text: networkText,
  });

  constructor(driver: Driver) {
    super(driver);
    this.driver = driver;
  }

  // Action Methods

  async clickConfirmButton(): Promise<void> {
    console.log('Click confirm button to confirm transaction');
    await this.driver.clickElement(this.confirmButton);
  }

  // Check Methods
  async checkInteractingWithParagraph() {
    await this.driver.waitForSelector(this.interactingWithParagraph);
  }

  async checkNetworkFeeParagraph() {
    await this.driver.waitForSelector(this.networkFeeParagraph);
  }

  async checkNetworkParagraph() {
    await this.driver.waitForSelector(this.networkParagraph);
  }

  /**
   * Verifies that the confirm token transfer (redesigned) screen is fully loaded by checking for the presence of the expected symbol, token/gas values and buttons.
   *
   * @param transferAmount - The amount of tokens to be transferred.
   * @param symbol - The symbol of the token to be transferred.
   * @param expectedNetworkFee - The expected gas/network fee value to be displayed on the page.
   * @returns A promise that resolves when all specified elements are verified to be present and contain the expected values, indicating the page has fully loaded.
   * @example
   * await tokenTransferTransactionConfirmation.checkTokenTransferPageIsLoaded('10', 'ETH', '0.01');
   */
  async checkTokenTransferPageIsLoaded(
    transferAmount: string,
    symbol: string,
    expectedNetworkFee: string,
  ): Promise<void> {
    try {
      await Promise.all([
        this.driver.waitForSelector(this.confirmButton),
        this.driver.waitForSelector({
          text: `${transferAmount} ${symbol}`,
          tag: 'h2',
        }),
        this.driver.waitForSelector({
          css: this.networkFee,
          text: `${expectedNetworkFee}`,
        }),
      ]);
      console.log(
        'Confirm token transfer (Redesigned) screen is loaded with expected values',
      );
    } catch (e) {
      console.error(
        `Timeout while waiting for confirm token transfer (redesigned) screen to be loaded, expected network fee is: ${expectedNetworkFee}, transfer amount is: ${transferAmount} and symbol is: ${symbol}`,
        e,
      );
      throw e;
    }
  }

  /**
   * Check if network text is displayed
   *
   * @param networkText - The expected network text to verify
   */
  async checkNetwork(networkText: string): Promise<void> {
    console.log(`Checking for network text: ${networkText}`);
    await this.driver.waitForSelector(this.networkTextElement(networkText));
  }
}

export default TokenTransferTransactionConfirmation;

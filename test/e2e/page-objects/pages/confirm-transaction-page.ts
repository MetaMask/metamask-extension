import { strict as assert } from 'assert';
import { Driver } from '../../webdriver/driver';

/**
 * Represents the Confirm Transaction page in the MetaMask extension.
 * This class provides methods to interact with and validate the transaction confirmation process.
 */
export class ConfirmTransactionPage {
  private readonly driver: Driver;

  // Locators
  private readonly sendAmountSelector = '.currency-display-component__text';

  private readonly editButtonSelector =
    '[data-testid="confirm-page-back-edit-button"]';

  private readonly nftImageSelector =
    '.confirm-page-container-summary__title img';

  private readonly nftTitleSelector = 'h3';

  private readonly confirmButtonSelector =
    '[data-testid="page-container-footer-next"]';

  private readonly transactionStatusSelector = 'p';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Validates the send amount displayed on the confirmation page.
   *
   * @param expectedAmount - The expected amount to be displayed.
   * @throws Will throw an error if the expected amount is not found within the timeout period.
   */
  async validateSendAmount(expectedAmount: string): Promise<void> {
    console.log(`Validating send amount: ${expectedAmount}`);
    try {
      await this.driver.waitForSelector({
        css: this.sendAmountSelector,
        text: expectedAmount,
      });
      console.log(`Send amount validated: ${expectedAmount}`);
    } catch (error) {
      console.error(`Failed to validate send amount: ${expectedAmount}`, error);
      throw new Error(
        `Expected amount ${expectedAmount} not found on confirmation page`,
      );
    }
  }

  /**
   * Clicks the edit button on the confirmation page.
   *
   * @throws Will throw an error if the edit button is not clickable or not found.
   */
  async clickEdit(): Promise<void> {
    console.log('Clicking edit button');
    try {
      await this.driver.clickElement(this.editButtonSelector);
      console.log('Edit button clicked successfully');
    } catch (error) {
      console.error('Failed to click edit button', error);
      throw new Error('Unable to click edit button on confirmation page');
    }
  }

  /**
   * Validates that the specified NFT is showing on the confirmation page.
   *
   * @param nftTitle - The title of the NFT to validate.
   * @throws Will throw an error if the NFT image or title is not found within the timeout period.
   */
  async validateNFTIsShowing(nftTitle: string): Promise<void> {
    console.log(`Validating NFT is showing: ${nftTitle}`);
    try {
      await this.driver.waitForSelector(this.nftImageSelector);
      await this.driver.waitForSelector({
        css: this.nftTitleSelector,
        text: nftTitle,
      });
      console.log(`NFT validated: ${nftTitle}`);
    } catch (error) {
      console.error(`Failed to validate NFT: ${nftTitle}`, error);
      throw new Error(
        `NFT ${nftTitle} not found or not displayed correctly on confirmation page`,
      );
    }
  }

  /**
   * Confirms the transaction by clicking the confirm button.
   *
   * @throws Will throw an error if the confirm button is not clickable or not found.
   */
  async confirmTransaction(): Promise<void> {
    console.log('Confirming transaction');
    try {
      await this.driver.clickElement(this.confirmButtonSelector);
      console.log('Transaction confirmed successfully');
    } catch (error) {
      console.error('Failed to confirm transaction', error);
      throw new Error('Unable to confirm transaction on confirmation page');
    }
  }

  /**
   * Validates that the transaction has been sent with the expected status text.
   *
   * @param expectedText - The expected status text for the sent transaction.
   * @throws Will throw an error if the expected status text is not found within the timeout period.
   */
  async validateTransactionSent(expectedText: string): Promise<void> {
    console.log(`Validating transaction sent: ${expectedText}`);
    try {
      await this.driver.waitForSelector({
        css: this.transactionStatusSelector,
        text: expectedText,
      });
      console.log(`Transaction sent validation complete: ${expectedText}`);
    } catch (error) {
      console.error(
        `Failed to validate transaction sent: ${expectedText}`,
        error,
      );
      throw new Error(
        `Transaction status "${expectedText}" not found on confirmation page`,
      );
    }
  }

  /**
   * Validates that an ETH transaction has been sent with the expected amount.
   *
   * @param expectedAmount - The expected amount of ETH sent in the transaction.
   * @throws Will throw an error if the expected amount is not found within the timeout period.
   */
  async validateEthTransactionSent(expectedAmount: string): Promise<void> {
    console.log(`Validating ETH transaction sent: ${expectedAmount}`);
    try {
      await this.driver.waitForSelector({
        css: '[data-testid="transaction-list-item-primary-currency"]',
        text: expectedAmount,
      });
      console.log(
        `ETH transaction sent validation complete: ${expectedAmount}`,
      );
    } catch (error) {
      console.error(
        `Failed to validate ETH transaction sent: ${expectedAmount}`,
        error,
      );
      throw new Error(
        `ETH transaction amount "${expectedAmount}" not found on confirmation page`,
      );
    }
  }
}

export default ConfirmTransactionPage;

import { Driver } from '../../webdriver/driver';

export class ConfirmTransactionPage {
  private readonly driver: Driver;

  // Locators
  private readonly sendAmountSelector = '.currency-display-component__text';
  private readonly editButtonSelector = '[data-testid="confirm-page-back-edit-button"]';
  private readonly nftImageSelector = '.confirm-page-container-summary__title img';
  private readonly nftTitleSelector = 'h3';
  private readonly confirmButtonSelector = '[data-testid="page-container-footer-next"]';
  private readonly transactionStatusSelector = 'p';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async validateSendAmount(expectedAmount: string): Promise<void> {
    console.log(`Validating send amount: ${expectedAmount}`);
    await this.driver.waitForSelector({
      css: this.sendAmountSelector,
      text: expectedAmount,
    });
    console.log(`Send amount validated: ${expectedAmount}`);
  }

  async clickEdit(): Promise<void> {
    console.log('Clicking edit button');
    await this.driver.clickElement(this.editButtonSelector);
    console.log('Edit button clicked');
  }

  async validateNFTIsShowing(nftTitle: string): Promise<void> {
    console.log(`Validating NFT is showing: ${nftTitle}`);
    await this.driver.waitForSelector(this.nftImageSelector);
    await this.driver.waitForSelector({ css: this.nftTitleSelector, text: nftTitle });
    console.log(`NFT validated: ${nftTitle}`);
  }

  async confirmTransaction(): Promise<void> {
    console.log('Confirming transaction');
    await this.driver.clickElement(this.confirmButtonSelector);
    console.log('Transaction confirmed');
  }

  async validateTransactionSent(expectedText: string): Promise<void> {
    console.log(`Validating transaction sent: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.transactionStatusSelector,
      text: expectedText,
    });
    console.log(`Transaction sent validation complete: ${expectedText}`);
  }

  async validateEthTransactionSent(expectedAmount: string): Promise<void> {
    console.log(`Validating ETH transaction sent: ${expectedAmount}`);
    await this.driver.waitForSelector({
      css: '[data-testid="transaction-list-item-primary-currency"]',
      text: expectedAmount,
    });
    console.log(`ETH transaction sent validation complete: ${expectedAmount}`);
  }
}

export default ConfirmTransactionPage;

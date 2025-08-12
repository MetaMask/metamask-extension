import { strict as assert } from 'assert';
import { By } from 'selenium-webdriver';
import { Driver } from '../../../webdriver/driver';

class TransactionDetailsPage {
  private readonly driver: Driver;

  private readonly solanaExplorerUrl = 'https://solscan.io';

  private readonly transactionFromToLink = (accountAddress: string) => {
    return {
      tag: 'a',
      href: `${this.solanaExplorerUrl}/account/${accountAddress}`,
    };
  };

  private readonly transactionHashLink = (txHash: string) => {
    return {
      tag: 'a',
      href: `${this.solanaExplorerUrl}/tx/${txHash}`,
    };
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  private readonly transactionDetail = {
    text: `Status`,
    tag: 'span',
  };

  async checkTransactionStatus(status: string): Promise<void> {
    await this.driver.waitForSelector({
      text: status,
      tag: 'p',
    });
  }

  async checkTransactionAmount(amount: string): Promise<void> {
    const transactionAmount = await this.driver.findElement(
      By.css('[data-testid="transaction-list-item-primary-currency"]'),
    );
    const transactionAmountText = await transactionAmount.getText();
    assert.equal(transactionAmountText, amount);
  }

  async checkTransactionNetworkFee(networkFee: string): Promise<void> {
    const transactionAmount = await this.driver.findElement(
      By.css('[data-testid="transaction-base-fee"]'),
    );
    const transactionAmountText = await transactionAmount.getText();
    assert.equal(transactionAmountText, networkFee);
  }

  async checkTransactionFromToLink(fromToAddress: string): Promise<void> {
    await this.driver.waitForSelector(
      By.css(`a[href='${this.solanaExplorerUrl}/account/${fromToAddress}']`),
    );
  }

  async checkTransactionHashLink(txHash: string): Promise<void> {
    await this.driver.waitForSelector(
      By.css(`a[href='${this.solanaExplorerUrl}/tx/${txHash}']`),
    );
  }

  async checkAmountTransaction(amount: string): Promise<void> {
    await this.driver.waitForSelector({
      text: amount,
      tag: 'p',
    });
  }

  async checkNetworkFeeTransaction(amount: string): Promise<void> {
    await this.driver.waitForSelector({
      text: amount,
      tag: 'p',
    });
  }

  async checkTransactionViewDetailsLink(): Promise<void> {
    await this.driver.waitForSelector({
      text: 'View details',
      tag: 'button',
    });
  }
}

export default TransactionDetailsPage;

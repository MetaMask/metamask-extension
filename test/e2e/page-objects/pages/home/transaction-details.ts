import { strict as assert } from 'assert';
import { By } from 'selenium-webdriver';
import { Driver } from '../../../webdriver/driver';

class TransactionDetailsPage {
  private readonly driver: Driver;

  private readonly solanaExplorerUrl = 'https://solscan.io';

  private readonly transactionBaseFee = (baseFee: string) => {
    return {
      testId: 'transaction-breakdown__base-fee',
      text: baseFee,
    };
  }

  private readonly transactionGasPrice = (gasPrice: string) => {
    return {
      testId: 'transaction-breakdown__gas-price',
      text: gasPrice,
    };
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkTransactionGasPrice(gasPrice: string): Promise<void> {
    await this.driver.waitForSelector(this.transactionGasPrice(gasPrice));
  }

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

  async checkTransactionBaseFee(baseFee: string): Promise<void> {
    await this.driver.waitForSelector(this.transactionBaseFee(baseFee));
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

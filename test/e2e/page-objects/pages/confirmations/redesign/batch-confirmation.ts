import { Driver } from '../../../../webdriver/driver';
import TransactionConfirmation from './transaction-confirmation';

export default class Eip7702AndSendCalls extends TransactionConfirmation {
  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;
  }

  protected driver: Driver;

  private readonly batchTxList = '[data-testid="batch-txs=]';

  private readonly confirmUpgradeButton = {
    tag: 'button',
    text: 'Use smart account',
  };

  private readonly interactingWith =
    '[data-testid="transaction-details-section"]';

  private readonly rejectUpgradeButton = {
    tag: 'button',
    text: 'Don’t use smart account',
  };

  private readonly txType = '[data-testid="tx-type"]';

  async checkBatchTxListIsPresent(): Promise<void> {
    await this.driver.isElementPresent(this.batchTxList);
  }

  async checkExpectedInteractingWithIsDisplayed(
    account: string,
  ): Promise<void> {
    await this.driver.isElementPresent({
      css: this.interactingWith,
      text: account,
    });
  }

  async checkExpectedTxTypeIsDisplayed(txType: string): Promise<void> {
    await this.driver.isElementPresent({
      css: this.txType,
      text: txType,
    });
  }

  async clickUseSmartAccountButton(): Promise<void> {
    await this.driver.clickElement(this.confirmUpgradeButton);
  }

  async clickDontUseSmartAccountButton(): Promise<void> {
    await this.driver.clickElementAndWaitForWindowToClose(
      this.rejectUpgradeButton,
    );
  }
}

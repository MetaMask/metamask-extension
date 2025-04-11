import { Driver } from '../../../../webdriver/driver';
import TransactionConfirmation from './transaction-confirmation';

export default class Eip7702AndSendCalls extends TransactionConfirmation {
  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;
  }

  protected driver: Driver;

  private readonly batchTxList = '[data-testid="batch-txs=]';

  private readonly confirmUpgradeButton = 'Use smart account';

  private readonly rejectBatchButton = {
    tag: 'button',
    text: 'Cancel transaction',
  };

  private readonly rejectBatchRejectUpgradeButton = {
    tag: 'button',
    text: 'Cancel update & transaction',
  };

  private readonly interactingWith =
    '[data-testid="transaction-details-section"]';

  private readonly txType = '[data-testid="tx-type"]';

  async check_batchTxListIsPresent(): Promise<void> {
    await this.driver.isElementPresent(this.batchTxList);
  }

  async check_expectedInteractingWithIsDisplayed(
    account: string,
  ): Promise<void> {
    await this.driver.isElementPresent({
      css: this.interactingWith,
      text: account,
    });
  }

  async check_expectedTxTypeIsDisplayed(txType: string): Promise<void> {
    await this.driver.isElementPresent({
      css: this.txType,
      text: txType,
    });
  }

  async tickSplashUpgradeButton(): Promise<void> {
    await this.driver.clickElement({
      text: this.confirmUpgradeButton,
      tag: 'button',
    });
  }
}

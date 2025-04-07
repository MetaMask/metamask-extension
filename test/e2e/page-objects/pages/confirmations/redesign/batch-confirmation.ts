import { Driver } from '../../../../webdriver/driver';
import TransactionConfirmation from './transaction-confirmation';

export default class Eip7702AndSendCalls extends TransactionConfirmation {
  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;
  }

  protected driver: Driver;

  private readonly batchTxList = '[data-testid="batch-txs=]';

  private readonly confirmUpgradeAccountCheckbox: string =
    '[data-testid="confirm-upgrade-acknowledge"] span input';

  private readonly interactingWith =
    '[data-testid="transaction-details-section"]';

  private readonly txType = '[data-testid="tx-type"]';

  async check_batchTxListIsPresent(): Promise<void> {
    await this.driver.isElementPresent(this.batchTxList);
  }

  async check_expectedInteractingWithIsDisplayed(account: string): Promise<void> {
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

  async tickUpgradeCheckbox(): Promise<void> {
    await this.driver.clickElement(this.confirmUpgradeAccountCheckbox);
  }
}

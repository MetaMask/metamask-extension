import { Driver } from '../../../../webdriver/driver';

class Eip7702AndSendCalls {
  protected driver: Driver;

  private readonly batchTxList = '[data-testid="batch-txs=]';

  private readonly confirmButton = {
    css: '[data-testid="confirm-footer-button"]',
    text: 'Confirm',
  };

  private readonly confirmUpgradeAccountCheckbox: string =
    '[data-testid="confirm-upgrade-acknowledge"] span input';

  private readonly interactingWith =
    '[data-testid="transaction-details-section"]';

  private readonly settingsButton = '[data-testid="header-advanced-details-button"]';

  private readonly txType = '[data-testid="tx-type"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

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

  async confirmUpgradeAndBatchTx(): Promise<void>  {
    await this.driver.clickElementAndWaitForWindowToClose(this.confirmButton);
  }

  async openSettings(): Promise<void>  {
    await this.driver.clickElement(this.settingsButton);
  }

  async tickUpgradeCheckbox(): Promise<void> {
    await this.driver.clickElement(this.confirmUpgradeAccountCheckbox);
  }
}

export default Eip7702AndSendCalls;

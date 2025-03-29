import { Driver } from '../../../../webdriver/driver';

class Eip7702AndSendCalls {
  protected driver: Driver;

  private readonly confirmUpgradeAccountCheckbox: string =
    '[data-testid="confirm-upgrade-acknowledge"] span input';

  private readonly confirmButton = {
    css: '[data-testid="confirm-footer-button"]',
    text: 'Confirm',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async confirmUpgradeCheckbox(): Promise<void> {
    await this.driver.findElement(this.confirmButton);

    await this.driver.clickElement(this.confirmUpgradeAccountCheckbox);
  }

  async confirmUpgradeAndBatchTx() {
    await this.driver.clickElementAndWaitForWindowToClose(this.confirmButton);
  }
}

export default Eip7702AndSendCalls;

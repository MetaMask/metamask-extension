import { Key } from 'selenium-webdriver';
import { Driver } from '../../../../webdriver/driver';
import { RawLocator } from '../../../common';

class Eip7704AndSendCalls {
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

  async confirmUpgradeCheckbox(): Promise<void>  {
    await this.driver.findElement(this.confirmButton);

    await this.driver.clickElement(this.confirmUpgradeAccountCheckbox);
  }

  async confirmUpgradeAndBatchTx() {
    await this.driver.clickElementAndWaitForWindowToClose(this.confirmButton);
  }
}

export default Eip7704AndSendCalls;

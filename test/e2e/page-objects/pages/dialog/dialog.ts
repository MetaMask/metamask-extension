import { Driver } from '../../../webdriver/driver';
import { strict as assert } from 'assert';

class GenericConfirmCancelDialog {
  protected driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async clickConfirm() {
    await this.driver.clickElement({ text: 'Confirm', tag: 'button' })
  }

  async clickCancel() {
    await this.driver.clickElement({ text: 'Confirm', tag: 'button' })
  }
}

export default GenericConfirmCancelDialog;

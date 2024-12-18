import { Driver } from '../../../webdriver/driver';

class CreateContractDialog {
  protected driver: Driver;

  private readonly confirmButtton = { text: 'Confirm', tag: 'button' };

  private readonly cancelButton = { text: 'Cancel', tag: 'button' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async clickConfirm() {
    await this.driver.clickElement(this.confirmButtton);
  }

  async clickCancel() {
    await this.driver.clickElement(this.cancelButton);
  }
}

export default CreateContractDialog;

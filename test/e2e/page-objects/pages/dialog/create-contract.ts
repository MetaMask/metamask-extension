import { Driver } from '../../../webdriver/driver';

class CreateContractModal {
  protected driver: Driver;

  private readonly confirmButtton = { text: 'Confirm', tag: 'button' };

  private readonly cancelButton = { text: 'Cancel', tag: 'button' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.confirmButtton,
        this.cancelButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for create contract dialog to be loaded',
        e,
      );
      throw e;
    }
    console.log('Create contract dialog was loaded');
  }

  async clickConfirm() {
    await this.driver.clickElement(this.confirmButtton);
  }

  async clickCancel() {
    await this.driver.clickElement(this.cancelButton);
  }
}

export default CreateContractModal;

import { Driver } from '../../../webdriver/driver';

class CreateContractModal {
  private readonly cancelButton = { text: 'Cancel', tag: 'button' };

  private readonly confirmButtton = { text: 'Confirm', tag: 'button' };

  protected driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
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

  async clickCancel() {
    await this.driver.clickElementAndWaitForWindowToClose(this.cancelButton);
  }

  async clickConfirm() {
    await this.driver.clickElementAndWaitForWindowToClose(this.confirmButtton);
  }
}

export default CreateContractModal;

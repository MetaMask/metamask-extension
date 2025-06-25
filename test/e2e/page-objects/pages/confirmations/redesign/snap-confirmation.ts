import { Driver } from '../../../../webdriver/driver';
import Confirmation from './confirmation';

export default class SnapConfirmation extends Confirmation {
  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;
  }

  private readonly confirmButton = { text: 'Confirm', tag: 'span' };

  private readonly cancelButton = { text: 'Cancel', tag: 'span' };

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.confirmButton,
        this.cancelButton,
      ]);
    } catch (e) {
      console.log(
        `Timeout while waiting for snap confirmation page to be loaded`,
        e,
      );
      throw e;
    }
    console.log(`Snap confirmation page is loaded`);
  }

  async confirm(): Promise<void> {
    console.log('Confirm on snap confirmation screen');
    await this.driver.clickElementAndWaitForWindowToClose(this.confirmButton);
  }

  async cancel(): Promise<void> {
    console.log('Cancel on snap confirmation screen');
    await this.driver.clickElementAndWaitForWindowToClose(this.cancelButton);
  }
}

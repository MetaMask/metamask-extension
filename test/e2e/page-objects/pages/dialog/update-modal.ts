import { Driver } from '../../../webdriver/driver';
import { regularDelayMs } from '../../../helpers';

class UpdateModal {
  private driver: Driver;

  private readonly submitButton = {
    testId: 'update-modal-submit-button',
  };

  private readonly closeButton = {
    testId: 'update-modal-close-button',
  };

  private readonly updateModal = {
    testId: 'update-modal',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded() {
    try {
      await this.driver.waitForSelector(this.updateModal);
    } catch (e) {
      console.log('Timeout while waiting for update modal to be loaded', e);
      throw e;
    }
    console.log('Update modal is loaded');
  }

  async checkPageIsNotPresent() {
    console.log('Checking if update modal is not present');
    await this.driver.assertElementNotPresent(this.updateModal, {
      waitAtLeastGuard: regularDelayMs,
    });
  }

  async confirm() {
    console.log('Click to confirm the update modal');
    await this.driver.clickElement(this.submitButton);
    // Wait for the new "MetaMask Updating" tab to open (extension window + new tab = 2 handles).
    // Use a longer timeout so the background has time to run tabs.create() before reload.
    await this.driver.waitUntilXWindowHandles(2, 1000, 15000);
  }

  async close() {
    console.log('Click to close the update modal');
    await this.driver.clickElementAndWaitToDisappear(this.closeButton);
  }
}

export default UpdateModal;

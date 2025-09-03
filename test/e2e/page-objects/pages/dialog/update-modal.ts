import { Driver } from '../../../webdriver/driver';

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
    const isPresent = await this.driver.isElementPresent(this.updateModal);
    if (isPresent) {
      throw new Error('Update modal should not be present');
    }
  }

  async confirm() {
    console.log('Click to confirm the update modal');
    await this.driver.clickElementAndWaitForWindowToClose(this.submitButton);
  }

  async close() {
    console.log('Click to close the update modal');
    await this.driver.clickElementAndWaitToDisappear(this.closeButton);
  }
}

export default UpdateModal;

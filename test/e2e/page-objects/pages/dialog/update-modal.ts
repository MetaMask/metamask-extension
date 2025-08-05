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

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded() {
    try {
      await this.driver.waitForSelector(this.updateModal);
    } catch (e) {
      console.log('Timeout while waiting for update modal to be loaded', e);
      throw e;
    }
    console.log('Update modal is loaded');
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsNotPresent() {
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

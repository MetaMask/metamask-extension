import { Driver } from '../../../webdriver/driver';

class NetworkSwitchModalConfirmation {
  private driver: Driver;

  private readonly submitButton = '[data-testid="confirmation-submit-button"]';

  private readonly addNetworkMessage = {
    text: 'Want to add this network?',
    tag: 'h3',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.addNetworkMessage,
        this.submitButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for add network confirmation modal to be loaded',
        e,
      );
      throw e;
    }
    console.log('Add network confirmation modal is loaded');
  }

  async clickApproveButton(): Promise<void> {
    console.log('Click Approve Button');
    await this.driver.clickElementAndWaitToDisappear(this.submitButton);
  }
}

export default NetworkSwitchModalConfirmation;

import { Driver } from '../../../webdriver/driver';

class ExperimentalSettings {
  private readonly driver: Driver;

  // Locators
  private readonly addAccountSnapToggle =
    '[data-testid="add-account-snap-toggle-div"]';

  private readonly experimentalPageTitle = {
    text: 'Experimental',
    tag: 'h4',
  };

  private readonly redesignedSignatureToggle =
    '[data-testid="toggle-redesigned-confirmations-container"]';

  private readonly requestQueueToggle =
    '[data-testid="experimental-setting-toggle-request-queue"] label';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.experimentalPageTitle);
    } catch (e) {
      console.log(
        'Timeout while waiting for Experimental Settings page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Experimental Settings page is loaded');
  }

  async toggleAddAccountSnap(): Promise<void> {
    console.log('Toggle Add Account Snap on experimental setting page');
    await this.driver.clickElement(this.addAccountSnapToggle);
  }

  async toggleRedesignedSignature(): Promise<void> {
    console.log('Toggle Redesigned Signature on experimental setting page');
    await this.driver.clickElement(this.redesignedSignatureToggle);
  }

  async toggleRequestQueue(): Promise<void> {
    console.log('Toggle Request Queue on experimental setting page');
    await this.driver.clickElement(this.requestQueueToggle);
  }
}

export default ExperimentalSettings;

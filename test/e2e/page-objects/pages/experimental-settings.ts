import { Driver } from '../../webdriver/driver';

class ExperimentalSettings {
  private readonly driver: Driver;

  // Locators
  private readonly addAccountSnapToggle: string =
    '[data-testid="add-account-snap-toggle-div"]';

  private readonly experimentalPageTitle: object = {
    text: 'Experimental',
    css: '.h4',
  };

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
}

export default ExperimentalSettings;

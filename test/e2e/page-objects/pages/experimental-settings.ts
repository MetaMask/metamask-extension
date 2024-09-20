import { Driver } from '../../webdriver/driver';

class ExperimentalSettings {
  private readonly driver: Driver;

  // Locators
  private readonly addAccountSnapToggle: string = '[data-testid="add-account-snap-toggle-div"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    console.log('Checking if Experimental Settings page is loaded');
    try {
      await this.driver.waitForSelector(this.addAccountSnapToggle);
      console.log('Experimental Settings page is loaded successfully');
    } catch (error) {
      console.error('Failed to load Experimental Settings page', error);
      throw new Error(`Experimental Settings page failed to load: ${(error as Error).message}`);
    }
  }

  async toggleAddAccountSnap(): Promise<void> {
    console.log('Toggling Add Account Snap setting');
    try {
      await this.driver.clickElement(this.addAccountSnapToggle);
      console.log('Add Account Snap setting toggled successfully');
    } catch (error) {
      console.error('Failed to toggle Add Account Snap setting', error);
      throw new Error(`Unable to toggle Add Account Snap setting: ${(error as Error).message}`);
    }
  }
}

export default ExperimentalSettings;

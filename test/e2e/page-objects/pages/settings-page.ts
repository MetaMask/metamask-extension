import { Driver } from '../../webdriver/driver';

class SettingsPage {
  private readonly driver: Driver;

  // Locators
  private readonly experimentalSettingsButton: string = '[data-testid="experimental-settings-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    console.log('Checking if Settings page is loaded');
    try {
      await this.driver.waitForSelector(this.experimentalSettingsButton);
      console.log('Settings page is loaded successfully');
    } catch (error) {
      console.error('Failed to load Settings page', error);
      throw new Error(`Settings page failed to load: ${(error as Error).message}`);
    }
  }

  async goToExperimentalSettings(): Promise<void> {
    console.log('Navigating to Experimental Settings');
    try {
      await this.driver.clickElement(this.experimentalSettingsButton);
      console.log('Navigated to Experimental Settings successfully');
    } catch (error) {
      console.error('Failed to navigate to Experimental Settings', error);
      throw new Error(`Unable to navigate to Experimental Settings: ${(error as Error).message}`);
    }
  }
}

export default SettingsPage;

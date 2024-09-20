import { Driver } from '../../webdriver/driver';

class AccountSettingsPage {
  private readonly driver: Driver;

  // Locators
  private readonly accountOptionsMenuButton: string = '[data-testid="account-options-menu-button"]';
  private readonly settingsMenuItem: object = { text: 'Settings', tag: 'div' };
  private readonly experimentalSettingsMenuItem: object = { text: 'Experimental', tag: 'div' };
  private readonly addAccountSnapToggle: string = '[data-testid="add-account-snap-toggle-div"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    console.log('Checking if Account Settings page is loaded');
    try {
      await this.driver.waitForSelector(this.accountOptionsMenuButton);
      console.log('Account Settings page is loaded successfully');
    } catch (error) {
      console.error('Failed to load Account Settings page', error);
      throw new Error(`Account Settings page failed to load: ${(error as Error).message}`);
    }
  }

  async navigateToExperimentalSettings(): Promise<void> {
    console.log('Navigating to Experimental Settings');
    try {
      await this.driver.clickElement(this.accountOptionsMenuButton);
      await this.driver.clickElement(this.settingsMenuItem);
      await this.driver.clickElement(this.experimentalSettingsMenuItem);
      console.log('Navigated to Experimental Settings successfully');
    } catch (error) {
      console.error('Failed to navigate to Experimental Settings', error);
      throw new Error(`Unable to navigate to Experimental Settings: ${(error as Error).message}`);
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

export default AccountSettingsPage;

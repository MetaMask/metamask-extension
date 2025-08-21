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

  private readonly watchAccountToggleState =
    '[data-testid="watch-account-toggle"]';

  private readonly watchAccountToggle =
    '[data-testid="watch-account-toggle-div"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
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

  // Get the state of the Watch Account Toggle, returns true if the toggle is selected
  async getWatchAccountToggleState(): Promise<boolean> {
    console.log('Get Watch Account Toggle State');
    const toggleInput = await this.driver.findElement(
      this.watchAccountToggleState,
    );
    return toggleInput.isSelected();
  }

  async toggleAddAccountSnap(): Promise<void> {
    console.log('Toggle Add Account Snap on experimental setting page');
    await this.driver.clickElement(this.addAccountSnapToggle);
  }

  async toggleWatchAccount(): Promise<void> {
    console.log('Toggle Watch Account on experimental setting page');
    await this.driver.clickElement(this.watchAccountToggle);
  }
}

export default ExperimentalSettings;

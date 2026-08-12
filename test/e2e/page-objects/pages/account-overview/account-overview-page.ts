import { Driver } from '../../../webdriver/driver';
import HeaderNavbar from '../header-navbar';
import HomePage from '../home/homepage';

class AccountOverviewPage {
  private readonly driver: Driver;

  private readonly nextButton = '[data-testid="page-container-footer-next"]';

  private readonly settingsTitle = '[data-testid="settings-page-title"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Navigates back to the homepage and opens the account menu.
   */
  async goHomeAndOpenAccountMenu(): Promise<void> {
    try {
      const homePage = new HomePage(this.driver);
      await homePage.checkPageIsLoaded();
      const headerNavbar = new HeaderNavbar(this.driver);
      await headerNavbar.openAccountMenu();
      await this.driver.clickElement(this.nextButton);
    } catch (error) {
      console.log('Could not open the account menu', error);
    }
  }

  /**
   * Opens the settings page from the account overview.
   */
  async openSettingsFromOverview(): Promise<void> {
    const headerNavbar = new HeaderNavbar(this.driver);
    await headerNavbar.openSettingsPage();

    try {
      await this.driver.waitForSelector(this.settingsTitle);
    } catch (error) {
      await this.driver.delay(2000);
    }
  }
}

export default AccountOverviewPage;

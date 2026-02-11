import { Driver } from '../../webdriver/driver';

export default class BasicFunctionalityRequiredPage {
  protected readonly driver: Driver;

  private readonly descriptionBox =
    '[data-testid="basic-functionality-required-description"]';

  private readonly goHomeButton =
    '[data-testid="basic-functionality-required-go-home"]';

  private readonly openSettingsLink =
    '[data-testid="basic-functionality-required-settings-link"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.descriptionBox);
      await this.driver.waitForSelector(this.goHomeButton);
    } catch (e) {
      console.log(
        'Timeout while waiting for Basic Functionality Required page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Basic Functionality Required page is loaded');
  }

  async clickGoToHomePage(): Promise<void> {
    try {
      await this.driver.clickElement(this.goHomeButton);
    } catch (e) {
      console.log(
        'Error clicking Go to the home page button on Basic Functionality Required page',
        e,
      );
      throw e;
    }
  }

  async clickOpenSettings(): Promise<void> {
    try {
      await this.driver.clickElement(this.openSettingsLink);
    } catch (e) {
      console.log(
        'Error clicking Open Settings link on Basic Functionality Required page',
        e,
      );
      throw e;
    }
  }

  async getDescriptionText(): Promise<string> {
    try {
      const el = await this.driver.findElement(this.descriptionBox);
      return await el.getText();
    } catch (e) {
      console.log(
        'Error getting description text on Basic Functionality Required page',
        e,
      );
      throw e;
    }
  }
}

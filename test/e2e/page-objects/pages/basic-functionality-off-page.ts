import { Driver } from '../../webdriver/driver';

export default class BasicFunctionalityOffPage {
  protected readonly driver: Driver;

  private readonly descriptionBox =
    '[data-testid="basic-functionality-off-description"]';

  private readonly goHomeLink =
    '[data-testid="basic-functionality-off-go-home"]';

  private readonly openFeatureButton =
    '[data-testid="basic-functionality-off-open-feature"]';

  private readonly toggleRow =
    '[data-testid="basic-functionality-off-toggle-row"]';

  private readonly toggleButton =
    '[data-testid="basic-functionality-off-toggle-row"] .toggle-button';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.descriptionBox);
      await this.driver.waitForSelector(this.goHomeLink);
      await this.driver.waitForSelector(this.toggleRow);
    } catch (e) {
      console.log(
        'Timeout while waiting for Basic Functionality Off page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Basic Functionality Off page is loaded');
  }

  async getDescriptionText(): Promise<string> {
    try {
      const el = await this.driver.findElement(this.descriptionBox);
      return await el.getText();
    } catch (e) {
      console.log(
        'Error getting description text on Basic Functionality Off page',
        e,
      );
      throw e;
    }
  }

  async toggleBasicFunctionality(): Promise<void> {
    try {
      await this.driver.clickElement(this.toggleButton);
    } catch (e) {
      console.log(
        'Error clicking Basic functionality toggle on Basic Functionality Off page',
        e,
      );
      throw e;
    }
  }

  async clickGoToHomePage(): Promise<void> {
    try {
      await this.driver.clickElement(this.goHomeLink);
    } catch (e) {
      console.log(
        'Error clicking Go to the home page link on Basic Functionality Off page',
        e,
      );
      throw e;
    }
  }

  async clickOpenFeaturePage(): Promise<void> {
    try {
      await this.driver.clickElement(this.openFeatureButton);
    } catch (e) {
      console.log(
        'Error clicking Open the feature page button on Basic Functionality Off page',
        e,
      );
      throw e;
    }
  }

  async isOpenFeaturePageButtonDisabled(): Promise<boolean> {
    const el = await this.driver.findElement(this.openFeatureButton);
    const disabled = await el.getAttribute('disabled');
    return disabled !== null;
  }

  async waitForOpenFeaturePageButtonEnabled(): Promise<void> {
    await this.driver.waitForSelector(this.openFeatureButton, {
      state: 'visible',
    });
    await this.driver.waitUntil(
      async () => !(await this.isOpenFeaturePageButtonDisabled()),
      { interval: 200, timeout: 5000 },
    );
  }
}

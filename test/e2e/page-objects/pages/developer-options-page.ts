import { Driver } from '../../webdriver/driver';

class DevelopOptions {
  private readonly driver: Driver;

  // Locators
  private readonly generatePageCrashButton: string =
    '[data-testid="developer-options-generate-page-crash-button"]';

  private readonly developOptionsPageTitle: object = {
    text: 'Developer Options',
    css: 'h4',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.developOptionsPageTitle);
    } catch (e) {
      console.log(
        'Timeout while waiting for Developer options page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Developer option page is loaded');
  }

  async clickGenerateCrashButton(): Promise<void> {
    console.log('Generate a page crash in Developer option page');
    await this.driver.clickElement(this.generatePageCrashButton);
  }
}

export default DevelopOptions;

import { Driver } from '../../webdriver/driver';

class CriticalErrorPage {
  private readonly driver: Driver;

  // Locators
  private readonly errorPageTitle: object = {
    text: 'MetaMask had trouble starting.',
    css: 'h1',
  };

  private readonly errorMessage = '.critical-error__details';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Check that the page has loaded.
   */
  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.errorPageTitle);
    } catch (e) {
      console.log(
        'Timeout while waiting for critical error page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Critical error page is loaded');
  }

  /**
   * Validate that the description on the page is for the "trouble starting" scenario.
   */
  async validateTroubleStartingDescription(): Promise<void> {
    await this.driver.waitForSelector({
      text: 'This error could be intermittent, so try restarting the extension.',
    });
  }

  /**
   * Validate that the given error message is shown.
   *
   * @param errorMessage - The error message to check for.
   */
  async validateErrorMessage(errorMessage: string): Promise<void> {
    await this.driver.waitForSelector({
      text: errorMessage,
      css: this.errorMessage,
    });
  }
}

export default CriticalErrorPage;

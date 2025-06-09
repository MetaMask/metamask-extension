import { Driver } from '../../webdriver/driver';

export default class DeepLink {
  protected readonly driver: Driver;

  private readonly routeBox = '[data-testid="deep-link-route"]';

  private readonly errorBox = '[data-testid="deep-link-error"]';

  private readonly continueButton = '[data-testid="deep-link-continue-button"]';

  private readonly cancelButton = '[data-testid="deep-link-cancel-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_deepLinkPageIsLoaded(): Promise<void> {
    try {
      await Promise.race([
        this.driver.waitForSelector(this.routeBox),
        this.driver.waitForSelector(this.errorBox),
      ]);
    } catch (e) {
      console.log('Timeout while waiting for Deep Link page to be loaded', e);
      throw e;
    }
    console.log('Deep Link page is loaded');
  }

  async clickContinueButton() {
    try {
      await this.driver.clickElement(this.continueButton);
    } catch (e) {
      console.log('Error clicking continue button on Deep Link page', e);
      throw e;
    }
  }

  async clickCancelButton() {
    try {
      await this.driver.clickElement(this.cancelButton);
    } catch (e) {
      console.log('Error clicking cancel button on Deep Link page', e);
      throw e;
    }
  }

  async clickSkipDeepLinkInterstitialCheckBox() {
    try {
      await this.driver.clickElement(
        '[data-testid="deep-link-interstitial-checkbox"]',
      );
    } catch (e) {
      console.log(
        'Error clicking skip deep link interstitial checkbox on Deep Link page',
        e,
      );
      throw e;
    }
  }
}

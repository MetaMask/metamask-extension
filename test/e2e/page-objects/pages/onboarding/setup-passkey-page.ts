import { Driver } from '../../../webdriver/driver';

class SetupPasskeyPage {
  private driver: Driver;

  private readonly maybeLaterButton =
    '[data-testid="passkey-maybe-later-button"]';

  private readonly setUpPasskeyButton =
    '[data-testid="passkey-set-up-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(timeout?: number): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors(
        [this.maybeLaterButton, this.setUpPasskeyButton],
        { timeout },
      );
    } catch (e) {
      console.log(
        'Timeout while waiting for setup passkey page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Setup passkey page is loaded');
  }

  async skipPasskeySetup(): Promise<void> {
    console.log('Skip passkey setup during onboarding');
    await this.driver.clickElement(this.maybeLaterButton);
  }
}

export default SetupPasskeyPage;

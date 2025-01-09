import { Driver } from '../../../webdriver/driver';

class StartOnboardingPage {
  private driver: Driver;

  private readonly createWalletButton =
    '[data-testid="onboarding-create-wallet"]';

  private readonly importWalletButton =
    '[data-testid="onboarding-import-wallet"]';

  private readonly startMessage = {
    text: "Let's get started",
    tag: 'h2',
  };

  private readonly termsCheckbox = '[data-testid="onboarding-terms-checkbox"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.startMessage,
        this.termsCheckbox,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for start onboarding page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Start onboarding page is loaded');
  }

  async checkTermsCheckbox(): Promise<void> {
    await this.driver.clickElement(this.termsCheckbox);
  }

  async clickCreateWalletButton(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.createWalletButton);
  }

  async clickImportWalletButton(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.importWalletButton);
  }
}

export default StartOnboardingPage;

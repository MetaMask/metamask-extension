import { Driver } from '../../../webdriver/driver';

class OnboardingGetStartedPage {
  private driver: Driver;

  private readonly startMessage = {
    text: `Let's get started`,
    tag: 'h2',
  };

  private readonly createWalletButton =
    '[data-testid="onboarding-create-wallet"]';

  private readonly importWalletButton =
    '[data-testid="onboarding-import-wallet"]';

  private readonly onboardingCreateWithSrpButton =
    '[data-testid="onboarding-create-with-srp-button"]';

  private readonly onboardingImportWithSrpButton =
    '[data-testid="onboarding-import-with-srp-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.startMessage,
        this.createWalletButton,
        this.importWalletButton,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for get started page to be loaded', e);
      throw e;
    }
    console.log('Get started page is loaded');
  }

  async createWalletWithSrp(): Promise<void> {
    await this.driver.clickElement(this.createWalletButton);
    await this.driver.waitForSelector(this.onboardingCreateWithSrpButton);
    await this.driver.clickElement(this.onboardingCreateWithSrpButton);
  }

  async importWallet(): Promise<void> {
    await this.driver.clickElement(this.importWalletButton);
    await this.driver.waitForSelector(this.onboardingImportWithSrpButton);
    await this.driver.clickElement(this.onboardingImportWithSrpButton);
  }
}

export default OnboardingGetStartedPage;

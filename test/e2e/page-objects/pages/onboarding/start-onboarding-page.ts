import { Driver } from '../../../webdriver/driver';

class StartOnboardingPage {
  private driver: Driver;

  private readonly welcomeMessage = {
    text: 'Welcome to MetaMask',
    tag: 'h2',
  };

  private readonly getStartedButton =
    '[data-testid="onboarding-get-started-button"]';

  private readonly termsOfUseCheckbox = '[data-testid="terms-of-use-checkbox"]';

  private readonly termsOfUseScrollButton =
    '[data-testid="terms-of-use-scroll-button"]';

  private readonly termsOfUseAgreeButton =
    '[data-testid="terms-of-use-agree-button"]';

  private readonly logInMessage = {
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

  async check_bannerPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.welcomeMessage,
        this.getStartedButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for welcome page banner to be loaded',
        e,
      );
      throw e;
    }
    console.log('Welcome page banner is loaded');
  }

  async agreeToTermsOfUse(): Promise<void> {
    await this.driver.clickElement(this.getStartedButton);
    await this.driver.waitForSelector(this.termsOfUseScrollButton);
    await this.driver.clickElementAndWaitToDisappear(
      this.termsOfUseScrollButton,
      5000,
    );
    await this.driver.waitForSelector(this.termsOfUseCheckbox);
    await this.driver.clickElement(this.termsOfUseCheckbox);
    await this.driver.clickElementAndWaitToDisappear(
      this.termsOfUseAgreeButton,
    );
  }

  async check_loginPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.logInMessage,
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
  }

  async importWallet(): Promise<void> {
    await this.driver.clickElement(this.importWalletButton);
  }
}

export default StartOnboardingPage;

import { Driver } from '../../../webdriver/driver';

class StartOnboardingPage {
  private driver: Driver;

  private readonly startMessage = {
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

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.startMessage,
        this.getStartedButton,
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

  async agreeToTermsOfUse(): Promise<void> {
    await this.driver.clickElement(this.getStartedButton);
    await this.driver.waitForSelector(this.termsOfUseScrollButton);
    await this.driver.clickElementAndWaitToDisappear(
      this.termsOfUseScrollButton,
    );
    await this.driver.waitForSelector(this.termsOfUseCheckbox);
    await this.driver.clickElement(this.termsOfUseCheckbox);
    await this.driver.clickElementAndWaitToDisappear(
      this.termsOfUseAgreeButton,
    );
  }
}

export default StartOnboardingPage;

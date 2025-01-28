import { Driver } from '../../../webdriver/driver';

class OnboardingMetricsPage {
  private driver: Driver;

  private readonly iAgreeButton = '[data-testid="metametrics-i-agree"]';

  private readonly metametricsMessage = {
    text: 'Help us improve MetaMask',
    tag: 'h2',
  };

  private readonly noThanksButton = '[data-testid="metametrics-no-thanks"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.metametricsMessage,
        this.noThanksButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for onboarding metametrics page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Onboarding metametrics page is loaded');
  }

  async clickNoThanksButton(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.noThanksButton);
  }

  async clickIAgreeButton(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.iAgreeButton);
  }
}

export default OnboardingMetricsPage;
